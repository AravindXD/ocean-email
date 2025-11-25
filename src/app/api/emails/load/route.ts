import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Email, Prompt } from "@/types";
import mockEmailsData from "@/lib/data/mock-emails.json";
import defaultPromptsData from "@/lib/data/default-prompts.json";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  try {
    // Load Mock Emails
    const mockEmails: Email[] = mockEmailsData as Email[];
    console.log(`[DEBUG] Loading ${mockEmails.length} mock emails for user ${userId}`);

    for (const email of mockEmails) {
      // Create a unique ID for the user's copy to avoid conflicts if we reload
      const userEmail = { ...email, id: `${email.id}_${Date.now()}` };
      await db.emails.saveEmail(userId, userEmail);
    }
    console.log("[DEBUG] Mock emails saved successfully");


    // Load Default Prompts if user has none
    const existingPrompts = await db.prompts.getAll(userId);
    console.log(`[DEBUG] Found ${existingPrompts.length} existing prompts`);
    if (existingPrompts.length === 0) {
      const defaultPrompts: Prompt[] = defaultPromptsData as Prompt[];
      console.log(`[DEBUG] Loading ${defaultPrompts.length} default prompts`);

      for (const prompt of defaultPrompts) {
        await db.prompts.savePrompt(userId, prompt);
      }
      console.log("[DEBUG] Default prompts saved successfully");
    }

    return NextResponse.json({ success: true, count: mockEmails.length });
  } catch (error) {
    console.error("[ERROR] Error loading mock data:", error);
    return NextResponse.json({ error: "Failed to load mock data", details: String(error) }, { status: 500 });
  }
}
