import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import path from "path";
import fs from "fs/promises";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let prompts = await db.prompts.getAll(session.user.email);

    if (prompts.length === 0) {
      const defaultPromptsPath = path.join(process.cwd(), "data", "shared", "default-prompts.json");
      const defaultPromptsData = await fs.readFile(defaultPromptsPath, "utf-8");
      const defaultPrompts = JSON.parse(defaultPromptsData);

      for (const p of defaultPrompts) {
        await db.prompts.create(session.user.email, {
          type: p.type,
          content: p.content
        });
      }
      prompts = await db.prompts.getAll(session.user.email);
    }

    return NextResponse.json({ prompts });
  } catch (error) {
    console.error("Failed to fetch prompts", error);
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, content, type, description } = await req.json();
    
    let prompt;
    if (id) {
      // Update existing prompt
      // If type is provided, we update it (renaming the prompt)
      prompt = await db.prompts.update(session.user.email, id, { content, description, type });
    } else {
      if (!type) {
        return NextResponse.json({ error: "Type is required for new prompts" }, { status: 400 });
      }
      prompt = await db.prompts.create(session.user.email, { 
        type, 
        content: content || "",
        description: description || ""
      });
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Prompt ID is required" }, { status: 400 });
    }

    await db.prompts.delete(session.user.email, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete prompt", error);
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
  }
}
