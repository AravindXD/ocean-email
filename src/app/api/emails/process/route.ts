import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { categorizeEmail, extractActions } from "@/lib/gemini";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  try {
    // Get emails from request body (Stateless mode) or DB
    const body = await req.json().catch(() => ({}));
    let emails = body.emails;

    if (!emails || emails.length === 0) {
        // Fallback to DB if not provided in body
        emails = await db.emails.getUserEmails(userId);
    }

    // Process if not processed OR if categorization failed previously
    // @ts-ignore
    const unprocessedEmails = emails.filter(email => !email.isProcessed || email.category === "Uncategorized");
    
    console.log(`Found ${emails.length} total emails, ${unprocessedEmails.length} to process.`);

    const prompts = await db.prompts.getAll(userId);
    const catPrompt = prompts.find(p => p.type === "categorization")?.content || "Categorize this email.";
    
    console.log("Using categorization prompt:", catPrompt);

    const results = [];

    for (const email of unprocessedEmails) {
      // @ts-ignore
      console.log(`Processing email ${email.id}...`);
      // @ts-ignore
      const emailContent = `Subject: ${email.subject}\nBody: ${email.body}`;
      
      // Run in parallel for speed
      const [category, actions] = await Promise.all([
        categorizeEmail(emailContent, catPrompt),
        extractActions(emailContent, prompts.find(p => p.type === "action_extraction")?.content || "Extract actions.")
      ]);

      // @ts-ignore
      console.log(`Email ${email.id} categorized as: ${category}`);

      // Try to save to DB (best effort), but don't fail if it fails
      try {
          // @ts-ignore
          await db.emails.updateEmail(userId, email.id, {
            category,
            actionItems: actions,
            isProcessed: true
          });
      } catch (e) {
          console.log("Could not update DB (expected in stateless mode)");
      }

      // @ts-ignore
      results.push({ id: email.id, category, actions });
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error("Error processing emails:", error);
    return NextResponse.json({ error: "Failed to process emails" }, { status: 500 });
  }
}
