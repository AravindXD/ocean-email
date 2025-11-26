"use client";

import { useAppStore } from "@/lib/store";
import { Email } from "@/types";
import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";
import { Star, AlertCircle, Mail, Trash2 } from "lucide-react";

export function EmailList() {
    const { emails, selectedEmailId, setSelectedEmailId, filterCategory } = useAppStore();

    const filteredEmails = filterCategory
        ? emails.filter(e => e.category === filterCategory)
        : emails;

    import { getCategoryColor } from "@/lib/utils";

    if (filteredEmails.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Mail className="h-12 w-12 mb-2" />
                <p>No emails found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto border-r border-gray-200 bg-white">
            {filteredEmails.map((email) => (
                <button
                    key={email.id}
                    onClick={() => setSelectedEmailId(email.id)}
                    className={clsx(
                        "flex flex-col items-start p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left focus:outline-none",
                        selectedEmailId === email.id && "bg-blue-50 hover:bg-blue-50 border-l-4 border-l-blue-500"
                    )}
                >
                    <div className="flex justify-between w-full mb-1">
                        <span className={clsx("font-semibold text-sm truncate", !email.isProcessed && "font-bold")}>
                            {email.sender.name}
                        </span>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDistanceToNow(new Date(email.timestamp), { addSuffix: true })}
                        </span>
                    </div>

                    <span className={clsx("text-sm mb-1 truncate w-full", !email.isProcessed ? "font-bold text-gray-900" : "text-gray-700")}>
                        {email.subject}
                    </span>

                    <p className="text-xs text-gray-500 line-clamp-2 mb-2 w-full">
                        {email.body}
                    </p>

                    <div className="flex items-center space-x-2">
                        <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", getCategoryColor(email.category))}>
                            {email.category}
                        </span>
                        {email.actionItems && email.actionItems.length > 0 && (
                            <span className="inline-flex items-center text-xs text-orange-600 font-medium">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {email.actionItems.length} Actions
                            </span>
                        )}
                    </div>
                </button>
            ))}
        </div>
    );
}
