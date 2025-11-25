"use client";

import { useAppStore } from "@/lib/store";
import { format } from "date-fns";
import { AlertCircle, Calendar, Tag, User } from "lucide-react";

export function EmailDetail() {
    const { emails, selectedEmailId } = useAppStore();
    const email = emails.find((e) => e.id === selectedEmailId);

    if (!email) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50">
                <p>Select an email to view details</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">{email.subject}</h1>
                    <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                        {format(new Date(email.timestamp), "PPp")}
                    </span>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {email.sender.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">{email.sender.name}</p>
                            <p className="text-sm text-gray-500">{email.sender.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Tag className="w-3 h-3 mr-1" />
                            {email.category}
                        </span>
                    </div>
                </div>

                {email.actionItems && email.actionItems.length > 0 && (
                    <div className="mb-6 bg-orange-50 border border-orange-100 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-orange-800 mb-2 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Action Items
                        </h3>
                        <ul className="space-y-2">
                            {email.actionItems.map((action, idx) => (
                                <li key={idx} className="flex items-start text-sm text-orange-900">
                                    <span className="mr-2">•</span>
                                    <div className="flex-1">
                                        <span className="font-medium">{action.description}</span>
                                        {action.deadline && (
                                            <span className="ml-2 text-orange-700 flex items-center inline-flex text-xs">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {action.deadline}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded ${action.priority === 'High' ? 'bg-red-100 text-red-800' :
                                        action.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {action.priority}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="p-6 flex-1">
                <div className="prose max-w-none text-gray-800 whitespace-pre-wrap font-sans mb-8">
                    {email.body}
                </div>
            </div>
        </div>
    );
}
