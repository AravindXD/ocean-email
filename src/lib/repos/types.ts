import { Email, Prompt, Draft } from "@/types";

export interface IEmailRepository {
  getUserEmails(userId: string): Promise<Email[]>;
  getEmailById(userId: string, emailId: string): Promise<Email | null>;
  saveEmail(userId: string, email: Email): Promise<void>;
  updateEmail(userId: string, emailId: string, updates: Partial<Email>): Promise<void>;
  deleteEmail(userId: string, emailId: string): Promise<void>;
}

export interface IPromptRepository {
  get(userId: string, type: Prompt["type"]): Promise<Prompt | null>;
  getAll(userId: string): Promise<Prompt[]>;
  update(userId: string, promptId: string, data: Partial<Prompt>): Promise<Prompt>;
  create(userId: string, prompt: Omit<Prompt, "id" | "updatedAt">): Promise<Prompt>;
  savePrompt(userId: string, prompt: Prompt): Promise<void>;
  updatePrompt(userId: string, promptId: string, updates: Partial<Prompt>): Promise<void>;
  delete(userId: string, promptId: string): Promise<void>;
}

export interface IDraftRepository {
  getUserDrafts(userId: string): Promise<Draft[]>;
  saveDraft(userId: string, draft: Draft): Promise<void>;
  updateDraft(userId: string, draftId: string, updates: Partial<Draft>): Promise<void>;
  deleteDraft(userId: string, draftId: string): Promise<void>;
}
