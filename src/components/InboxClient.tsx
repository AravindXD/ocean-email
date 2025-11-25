"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { EmailList } from "@/components/EmailList";
import { EmailDetail } from "@/components/EmailDetail";
import { Email } from "@/types";
import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ConfirmationModal } from "@/components/ConfirmationModal";

interface InboxClientProps {
    initialEmails: Email[];
}

export function InboxClient({ initialEmails }: InboxClientProps) {
    const { setEmails, setPrompts, isLoading, setLoading, emails, filterCategory, setFilterCategory } = useAppStore();
    const router = useRouter();
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    useEffect(() => {
        // Only sync from server if server has data (prevents wiping local storage on Vercel)
        if (initialEmails && initialEmails.length > 0) {
            setEmails(initialEmails);
        }
    }, [initialEmails, setEmails]);

    const handleProcessInbox = async () => {
        setLoading(true);
        try {
            // Send current emails to server for processing
            const res = await fetch("/api/emails/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emails })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.results) {
                    // Update local state with processed results
                    const updatedEmails = emails.map(email => {
                        const result = data.results.find((r: any) => r.id === email.id);
                        if (result) {
                            return { ...email, category: result.category, actionItems: result.actions, isProcessed: true };
                        }
                        return email;
                    });
                    setEmails(updatedEmails);
                }
            }
        } catch (error) {
            console.error("Failed to process inbox", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMockData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/emails/load", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                if (data.emails) setEmails(data.emails);
                if (data.prompts) setPrompts(data.prompts);
                // Don't refresh router, rely on local state
            }
        } catch (error) {
            console.error("Failed to load mock data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearInbox = async () => {
        setLoading(true);
        try {
            // Clear local state immediately
            setEmails([]);
            // Optional: Try to clear server too
            await fetch("/api/emails/clear", { method: "POST" });
        } catch (error) {
            console.error("Failed to clear inbox", error);
        } finally {
            setLoading(false);
            setIsClearModalOpen(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <ConfirmationModal
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                onConfirm={handleClearInbox}
                title="Clear Inbox"
                message="Are you sure you want to delete all emails? This action cannot be undone."
                confirmText="Clear All"
                isDangerous={true}
            />
            <div className="w-1/3 flex flex-col border-r border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-700">Inbox</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setIsClearModalOpen(true)}
                            disabled={isLoading}
                            className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-red-700 disabled:opacity-50"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleLoadMockData}
                            disabled={isLoading}
                            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 disabled:opacity-50"
                        >
                            Load Mock
                        </button>
                        <button
                            onClick={handleProcessInbox}
                            disabled={isLoading}
                            className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                            Process
                        </button>
                    </div>
                </div>
                <div className="px-4 py-2 border-b border-gray-200 flex space-x-2 overflow-x-auto bg-white">
                    {["All", "Important", "Newsletter", "Spam", "To-Do"].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilterCategory(cat === "All" ? null : cat)}
                            className={clsx(
                                "text-xs px-2 py-1 rounded-full border transition-colors whitespace-nowrap",
                                (filterCategory === (cat === "All" ? null : cat))
                                    ? "bg-blue-100 text-blue-800 border-blue-200 font-medium"
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <EmailList />
            </div>
            <div className="w-2/3 h-full bg-gray-50">
                <EmailDetail />
            </div>
        </div>
    );
}
