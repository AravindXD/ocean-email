import fs from "fs/promises";
import path from "path";
import { Email, Prompt, Draft } from "@/types";
import { IEmailRepository, IPromptRepository, IDraftRepository } from "./types";

// Use /tmp on Vercel (serverless), otherwise use local data directory
const isVercel = process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_URL;
const DATA_DIR = isVercel ? "/tmp/data" : path.join(process.cwd(), "data");

console.log("[DEBUG] Repository initialized");
console.log("[DEBUG] isVercel:", !!isVercel);
console.log("[DEBUG] DATA_DIR:", DATA_DIR);

async function ensureDir(dir: string) {
  try {
    await fs.access(dir);
  } catch {
    console.log(`[DEBUG] Creating directory: ${dir}`);
    await fs.mkdir(dir, { recursive: true });
  }
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch (error) {
    // console.log(`[DEBUG] Failed to read file ${filePath}:`, error);
    return null;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  try {
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`[DEBUG] Wrote file: ${filePath}`);
  } catch (error) {
    console.error(`[ERROR] Failed to write file ${filePath}:`, error);
    throw error;
  }
}

export class JsonEmailRepository implements IEmailRepository {
  private getUserDir(userId: string) {
    return path.join(DATA_DIR, "users", userId, "emails");
  }

  async getUserEmails(userId: string): Promise<Email[]> {
    const dir = this.getUserDir(userId);
    await ensureDir(dir);
    const files = await fs.readdir(dir);
    const emails: Email[] = [];
    for (const file of files) {
      if (file.endsWith(".json")) {
        const email = await readJson<Email>(path.join(dir, file));
        if (email) emails.push(email);
      }
    }
    return emails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getEmailById(userId: string, emailId: string): Promise<Email | null> {
    const filePath = path.join(this.getUserDir(userId), `${emailId}.json`);
    return readJson<Email>(filePath);
  }

  async saveEmail(userId: string, email: Email): Promise<void> {
    const filePath = path.join(this.getUserDir(userId), `${email.id}.json`);
    await writeJson(filePath, email);
  }

  async updateEmail(userId: string, emailId: string, updates: Partial<Email>): Promise<void> {
    const email = await this.getEmailById(userId, emailId);
    if (!email) throw new Error("Email not found");
    const updatedEmail = { ...email, ...updates };
    await this.saveEmail(userId, updatedEmail);
  }

  async deleteEmail(userId: string, emailId: string): Promise<void> {
    const filePath = path.join(this.getUserDir(userId), `${emailId}.json`);
    await fs.unlink(filePath).catch(() => {});
  }
}

export class JsonPromptRepository implements IPromptRepository {
  private getUserDir(userId: string) {
    return path.join(DATA_DIR, "users", userId, "prompts");
  }

  // Helper to read all prompts
  private async readAllPrompts(userId: string): Promise<Prompt[]> {
    const dir = this.getUserDir(userId);
    await ensureDir(dir);
    const files = await fs.readdir(dir);
    const prompts: Prompt[] = [];
    for (const file of files) {
      if (file.endsWith(".json")) {
        const prompt = await readJson<Prompt>(path.join(dir, file));
        if (prompt) prompts.push(prompt);
      }
    }
    return prompts;
  }

  async get(userId: string, type: Prompt["type"]): Promise<Prompt | null> {
    const prompts = await this.readAllPrompts(userId);
    return prompts.find((p) => p.type === type) || null;
  }

  async getAll(userId: string): Promise<Prompt[]> {
    return this.readAllPrompts(userId);
  }

  async create(userId: string, promptData: Omit<Prompt, "id" | "updatedAt">): Promise<Prompt> {
    const id = crypto.randomUUID();
    const newPrompt: Prompt = {
      ...promptData,
      id,
      updatedAt: new Date().toISOString(),
    };
    await this.savePrompt(userId, newPrompt);
    return newPrompt;
  }

  async update(userId: string, promptId: string, updates: Partial<Prompt>): Promise<Prompt> {
    const prompt = await this.getPromptById(userId, promptId);
    if (!prompt) throw new Error("Prompt not found");
    
    const updatedPrompt = {
      ...prompt,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await this.savePrompt(userId, updatedPrompt);
    return updatedPrompt;
  }

  // Legacy/Interface methods
  async getUserPrompts(userId: string): Promise<Prompt[]> {
    return this.getAll(userId);
  }

  async getPromptById(userId: string, promptId: string): Promise<Prompt | null> {
    const filePath = path.join(this.getUserDir(userId), `${promptId}.json`);
    return readJson<Prompt>(filePath);
  }

  async savePrompt(userId: string, prompt: Prompt): Promise<void> {
    const filePath = path.join(this.getUserDir(userId), `${prompt.id}.json`);
    await writeJson(filePath, prompt);
  }

  async updatePrompt(userId: string, promptId: string, updates: Partial<Prompt>): Promise<void> {
    await this.update(userId, promptId, updates);
  }

  async delete(userId: string, promptId: string): Promise<void> {
    const filePath = path.join(this.getUserDir(userId), `${promptId}.json`);
    await fs.unlink(filePath).catch(() => {});
  }
}

export class JsonDraftRepository implements IDraftRepository {
  private getUserDir(userId: string) {
    return path.join(DATA_DIR, "users", userId, "drafts");
  }

  async getUserDrafts(userId: string): Promise<Draft[]> {
    const dir = this.getUserDir(userId);
    await ensureDir(dir);
    const files = await fs.readdir(dir);
    const drafts: Draft[] = [];
    for (const file of files) {
      if (file.endsWith(".json")) {
        const draft = await readJson<Draft>(path.join(dir, file));
        if (draft) drafts.push(draft);
      }
    }
    return drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async saveDraft(userId: string, draft: Draft): Promise<void> {
    const filePath = path.join(this.getUserDir(userId), `${draft.id}.json`);
    await writeJson(filePath, draft);
  }

  async updateDraft(userId: string, draftId: string, updates: Partial<Draft>): Promise<void> {
    const filePath = path.join(this.getUserDir(userId), `${draftId}.json`);
    const draft = await readJson<Draft>(filePath);
    if (!draft) throw new Error("Draft not found");
    const updatedDraft = { ...draft, ...updates, updatedAt: new Date().toISOString() };
    await this.saveDraft(userId, updatedDraft);
  }

  async deleteDraft(userId: string, draftId: string): Promise<void> {
    const filePath = path.join(this.getUserDir(userId), `${draftId}.json`);
    await fs.unlink(filePath).catch(() => {});
  }
}
