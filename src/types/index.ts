export interface Email {
  id: string;
  sender: {
    name: string;
    email: string;
  };
  subject: string;
  body: string;
  timestamp: string;
  category: "Important" | "Newsletter" | "Spam" | "To-Do" | "Uncategorized";
  actionItems: ActionItem[];
  isProcessed: boolean;
  error?: string;
}

export interface ActionItem {
  description: string;
  deadline?: string;
  priority: "High" | "Medium" | "Low";
}

export interface Prompt {
  id: string;
  type: "categorization" | "action_extraction" | "auto_reply" | string;
  content: string;
  description?: string;
  updatedAt: string;
}

export interface Draft {
  id: string;
  emailId?: string; // If reply
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  meta?: {
    originalSender?: string;
    originalSubject?: string;
    suggestedFollowUp?: string;
    generationContext?: "manual" | "chat" | "auto";
  };
}
