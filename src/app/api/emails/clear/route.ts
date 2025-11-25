import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.email;

  try {
    const emails = await db.emails.getUserEmails(userId);
    for (const email of emails) {
      await db.emails.deleteEmail(userId, email.id);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing inbox:", error);
    return NextResponse.json({ error: "Failed to clear inbox" }, { status: 500 });
  }
}
