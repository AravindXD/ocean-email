import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";
import { Email, Prompt } from "@/types";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Load Mock Emails
    const mockEmailsPath = path.join(process.cwd(), "public", "data", "mock-emails.json");
    const mockEmailsData = await fs.readFile(mockEmailsPath, "utf-8");
    const mockEmails: Email[] = JSON.parse(mockEmailsData);

    for (const email of mockEmails) {
      // Create a unique ID for the user's copy to avoid conflicts if we reload
      const userEmail = { ...email, id: `${email.id}_${Date.now()}` };
      await db.emails.saveEmail(userId, userEmail);
    }

    // Load Default Prompts if user has none
    const existingPrompts = await db.prompts.getAll(userId);
    if (existingPrompts.length === 0) {
      const defaultPromptsPath = path.join(process.cwd(), "public", "data", "default-prompts.json");
      const defaultPromptsData = await fs.readFile(defaultPromptsPath, "utf-8");
      const defaultPrompts: Prompt[] = JSON.parse(defaultPromptsData);

      for (const prompt of defaultPrompts) {
        await db.prompts.savePrompt(userId, prompt);
      }
    }

    return NextResponse.json({ success: true, count: mockEmails.length });
  } catch (error) {
    console.error("Error loading mock data:", error);
    return NextResponse.json({ error: "Failed to load mock data" }, { status: 500 });
  }
}
