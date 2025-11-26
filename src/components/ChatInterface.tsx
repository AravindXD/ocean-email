"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Minimize2, Maximize2, Sparkles, RefreshCw, Book } from "lucide-react";
import { useAppStore } from "@/lib/store";
import clsx from "clsx";

interface Message {
    role: "user" | "model";
    text: string;
}

export function ChatInterface() {
    const { emails, selectedEmailId, prompts } = useAppStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPrompts, setShowPrompts] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const selectedEmail = emails.find((e) => e.id === selectedEmailId);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = async (overrideInput?: string) => {
        const textToSend = overrideInput || input;
        if (!textToSend.trim()) return;

        let messageToSend = textToSend;

        // Heuristic: If the user is asking for a draft, reply, or email, enforce the format
        const lowerInput = textToSend.toLowerCase();
        const isContextDependent =
            lowerInput.includes("draft") ||
            lowerInput.includes("reply") ||
            lowerInput.includes("write an email") ||
            lowerInput.includes("compose") ||
            lowerInput.includes("summarize") ||
            lowerInput.includes("summary");

        if (isContextDependent && !selectedEmail) {
            setMessages((prev) => [
                ...prev,
                { role: "user", text: textToSend },
                { role: "model", text: "Please select an email from your inbox first so I can help you with that." }
            ]);
            setInput("");
            return;
        }

        if (
            lowerInput.includes("draft") ||
            lowerInput.includes("reply") ||
            lowerInput.includes("write an email") ||
            lowerInput.includes("compose")
        ) {
            messageToSend += `\n\nIMPORTANT: You must format your response exactly as follows:
Subject: [Use the actual subject from the email context, prefixed with Re: if replying]

[Body of the email]

[Sign off with the user's actual name]

CRITICAL INSTRUCTIONS:
1. Do NOT use placeholders like "[Sender's Name]", "[Your Name]", or "[Original Subject]".
2. Use the ACTUAL names and subject from the provided context.
3. If you don't know a name, use a generic greeting like "Hi there," but NEVER use a bracketed placeholder.
4. The Subject line must be real.`;
        }

        const userMessage: Message = { role: "user", text: textToSend };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);
        setShowPrompts(false);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: messageToSend,
                    history: messages,
                    emailContent: selectedEmail
                        ? `Current Email Context:\nFrom: ${selectedEmail.sender.name} <${selectedEmail.sender.email}>\nSubject: ${selectedEmail.subject}\nBody: ${selectedEmail.body}`
                        : "No specific email selected.",
                }),
            });

            if (!res.ok) throw new Error("Failed to send message");

            const data = await res.json();
            const aiMessage: Message = { role: "model", text: data.response };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "model", text: "Sorry, I encountered an error. Please try again." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const parseDraft = (text: string) => {
        const subjectMatch = text.match(/^Subject:\s*(.+)/im);
        if (subjectMatch) {
            const subject = subjectMatch[1].trim();
            const body = text.replace(/^Subject:.*(\r\n|\r|\n)/im, "").trim();
            return { subject, body };
        }
        return null;
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all z-50"
            >
                <MessageSquare className="h-6 w-6" />
            </button>
        );
    }

    return (
        <div
            className={clsx(
                "fixed bg-white shadow-2xl rounded-t-xl z-50 flex flex-col transition-all duration-300 border border-gray-200",
                isMinimized
                    ? "bottom-0 right-6 w-80 h-14 rounded-xl"
                    : "bottom-6 right-6 w-96 h-[600px] rounded-xl"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-t-xl shrink-0">
                <div className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span className="font-medium">Agent</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setMessages([])}
                        className="p-1 hover:bg-blue-500 rounded transition-colors"
                        title="Clear Chat"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        className="p-1 hover:bg-blue-500 rounded transition-colors"
                    >
                        {isMinimized ? (
                            <Maximize2 className="h-4 w-4" />
                        ) : (
                            <Minimize2 className="h-4 w-4" />
                        )}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-blue-500 rounded transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-8 text-sm">
                                <p>Hi! I can help you manage your inbox.</p>
                                <p className="mt-2">Try asking:</p>
                                <ul className="mt-2 space-y-1">
                                    <li className="cursor-pointer hover:text-blue-600" onClick={() => handleSend("Summarize this email")}>"Summarize this email"</li>
                                    <li className="cursor-pointer hover:text-blue-600" onClick={() => handleSend("Draft a reply saying yes")}>"Draft a reply saying yes"</li>
                                    <li className="cursor-pointer hover:text-blue-600" onClick={() => handleSend("What are the action items?")}>"What are the action items?"</li>
                                </ul>
                            </div>
                        )}
                        {messages.map((msg, idx) => {
                            const draft = msg.role === "model" ? parseDraft(msg.text) : null;
                            return (
                                <div
                                    key={idx}
                                    className={clsx(
                                        "flex flex-col max-w-[85%] rounded-lg p-3 text-sm",
                                        msg.role === "user"
                                            ? "ml-auto bg-blue-600 text-white"
                                            : "bg-white border border-gray-200 text-gray-800 shadow-sm"
                                    )}
                                >
                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                    {draft && (
                                        <DraftCard
                                            to={selectedEmail?.sender.email || ""}
                                            subject={draft.subject}
                                            body={draft.body}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        {isLoading && (
                            <div className="flex items-center space-x-2 text-gray-400 text-sm">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75" />
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-gray-200 shrink-0 relative">
                        {/* Prompt Selection Menu */}
                        {showPrompts && (
                            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 max-h-48 overflow-y-auto z-10">
                                <div className="p-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                                    Select a Prompt
                                </div>
                                <button
                                    onClick={() => {
                                        if (!selectedEmail) return;
                                        handleSend("Summarize this email concisely in bullet points.");
                                        setShowPrompts(false);
                                    }}
                                    disabled={!selectedEmail}
                                    className={clsx(
                                        "w-full text-left px-3 py-2 text-sm flex flex-col",
                                        !selectedEmail ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-blue-50 text-gray-700"
                                    )}
                                >
                                    <span className="font-medium">Summarize</span>
                                    <span className="text-xs text-gray-400 truncate">
                                        {!selectedEmail ? "Select an email first" : "Get a quick summary of the email content"}
                                    </span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (!selectedEmail) return;
                                        handleSend("Draft a reply saying yes");
                                        setShowPrompts(false);
                                    }}
                                    disabled={!selectedEmail}
                                    className={clsx(
                                        "w-full text-left px-3 py-2 text-sm flex flex-col",
                                        !selectedEmail ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-blue-50 text-gray-700"
                                    )}
                                >
                                    <span className="font-medium">Draft Reply</span>
                                    <span className="text-xs text-gray-400 truncate">
                                        {!selectedEmail ? "Select an email first" : "Draft a positive reply"}
                                    </span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (!selectedEmail) return;
                                        handleSend("What are the action items?");
                                        setShowPrompts(false);
                                    }}
                                    disabled={!selectedEmail}
                                    className={clsx(
                                        "w-full text-left px-3 py-2 text-sm flex flex-col",
                                        !selectedEmail ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-blue-50 text-gray-700"
                                    )}
                                >
                                    <span className="font-medium">Action Items</span>
                                    <span className="text-xs text-gray-400 truncate">
                                        {!selectedEmail ? "Select an email first" : "Extract action items from the email"}
                                    </span>
                                </button>
                                {prompts
                                    .filter(p => !['categorization', 'action_extraction'].includes(p.type))
                                    .map((p) => {
                                        const isSystemPrompt = ['auto_reply'].includes(p.type);
                                        const isAutoReply = p.type === 'auto_reply';
                                        const isDisabled = isAutoReply && !selectedEmail;

                                        // For title: use description or formatted type
                                        const displayLabel = isAutoReply
                                            ? 'Auto Reply'
                                            : p.description || p.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                                        // For subtitle: always show the prompt content preview
                                        const displayDescription = isDisabled
                                            ? "Select an email first"
                                            : p.content.substring(0, 60) + (p.content.length > 60 ? '...' : '');

                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => {
                                                    if (isDisabled) return;
                                                    let content = p.content;
                                                    if (isAutoReply) {
                                                        content = "Draft a professional reply to this email. Format it as:\nSubject: [Subject]\n\n[Body]";
                                                    }
                                                    handleSend(content);
                                                    setShowPrompts(false);
                                                }}
                                                disabled={isDisabled}
                                                className={clsx(
                                                    "w-full text-left px-3 py-2 text-sm flex flex-col",
                                                    isDisabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-blue-50 text-gray-700"
                                                )}
                                            >
                                                <span className="font-medium">{displayLabel}</span>
                                                <span className="text-xs text-gray-400 truncate">
                                                    {displayDescription}
                                                </span>
                                            </button>
                                        );
                                    })}
                            </div>
                        )}

                        <div className="relative flex items-center">
                            <button
                                onClick={() => setShowPrompts(!showPrompts)}
                                className="p-2 text-gray-400 hover:text-blue-600 transition-colors mr-1"
                                title="Use a Prompt"
                            >
                                <Book className="h-5 w-5" />
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                placeholder="Ask anything..."
                                className="flex-1 pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="h-3 w-3" />
                            </button>
                        </div>
                        {selectedEmail && (
                            <div className="mt-2 text-xs text-gray-400 truncate flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                                Context: {selectedEmail.subject}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function DraftCard({ to, subject, body }: { to: string; subject: string; body: string }) {
    const [editedTo, setEditedTo] = useState(to);
    const [editedSubject, setEditedSubject] = useState(subject);
    const [editedBody, setEditedBody] = useState(body);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/drafts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: editedTo,
                    subject: editedSubject,
                    body: editedBody,
                }),
            });
            if (res.ok) {
                setIsSaved(true);
            }
        } catch (error) {
            console.error("Failed to save draft", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase">Draft Preview</div>
            <input
                type="text"
                value={editedTo}
                onChange={(e) => setEditedTo(e.target.value)}
                className="w-full text-sm font-medium border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="To"
            />
            <input
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full text-sm font-medium border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Subject"
            />
            <textarea
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                rows={4}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                placeholder="Body"
            />
            <button
                onClick={handleSave}
                disabled={isSaved || isSaving}
                className={clsx(
                    "w-full py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center",
                    isSaved
                        ? "bg-green-100 text-green-800 cursor-default"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                )}
            >
                {isSaving ? "Saving..." : isSaved ? "Saved to Drafts" : "Save to Drafts"}
            </button>
        </div>
    );
}
