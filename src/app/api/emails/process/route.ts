import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorizeEmail, extractActions } from "@/lib/gemini";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  try {
    const emails = await db.emails.getUserEmails(userId);
    // Process if not processed OR if categorization failed previously
    const unprocessedEmails = emails.filter(email => !email.isProcessed || email.category === "Uncategorized");
    
    console.log(`Found ${emails.length} total emails, ${unprocessedEmails.length} to process.`);

    const prompts = await db.prompts.getAll(userId);
    const catPrompt = prompts.find(p => p.type === "categorization")?.content || "Categorize this email.";
    
    console.log("Using categorization prompt:", catPrompt);

    const results = [];

    for (const email of unprocessedEmails) {
      console.log(`Processing email ${email.id}...`);
      const emailContent = `Subject: ${email.subject}\nBody: ${email.body}`;
      
      // Run in parallel for speed
      const [category, actions] = await Promise.all([
        categorizeEmail(emailContent, catPrompt),
        extractActions(emailContent, prompts.find(p => p.type === "action_extraction")?.content || "Extract actions.")
      ]);

      console.log(`Email ${email.id} categorized as: ${category}`);

      await db.emails.updateEmail(userId, email.id, {
        category,
        actionItems: actions,
        isProcessed: true
      });

      results.push({ id: email.id, category, actions });
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error("Error processing emails:", error);
    return NextResponse.json({ error: "Failed to process emails" }, { status: 500 });
  }
}
