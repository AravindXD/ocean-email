import { NextRequest, NextResponse } from "next/server";
import { chatWithAgent } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { emailContent, history, message } = await req.json();

    console.log("Chat API Request:", { 
      hasEmailContent: !!emailContent, 
      emailContentLength: emailContent?.length, 
      historyLength: history?.length, 
      message 
    });

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const userName = session.user.name || "User";
    const contextWithUser = emailContent 
      ? `${emailContent}\n\nNote: The user's name is "${userName}".`
      : `Note: The user's name is "${userName}".`;

    const response = await chatWithAgent(contextWithUser, history || [], message);
    return NextResponse.json({ response });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
