"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Draft } from "@/types";
import { FileText, Trash2, Edit3, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { ConfirmationModal } from "@/components/ConfirmationModal";

export default function DraftsPage() {
    const { drafts, setDrafts, setLoading, isLoading } = useAppStore();
    const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
    const [deleteDraftId, setDeleteDraftId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDrafts = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/drafts");
                if (res.ok) {
                    const data = await res.json();
                    setDrafts(data.drafts);
                }
            } catch (error) {
                console.error("Failed to fetch drafts", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDrafts();
    }, [setDrafts, setLoading]);

    const handleDelete = async () => {
        if (!deleteDraftId) return;
        try {
            await fetch(`/api/drafts?id=${deleteDraftId}`, { method: "DELETE" });
            setDrafts(drafts.filter((d) => d.id !== deleteDraftId));
        } catch (error) {
            console.error("Failed to delete draft", error);
        } finally {
            setDeleteDraftId(null);
        }
    };

    const handleSave = async (draft: Draft) => {
        try {
            const res = await fetch("/api/drafts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(draft),
            });
            if (res.ok) {
                const { draft: savedDraft } = await res.json();
                setDrafts(drafts.map((d) => (d.id === savedDraft.id ? savedDraft : d)));
                if (!drafts.find(d => d.id === savedDraft.id)) {
                    setDrafts([savedDraft, ...drafts]);
                }
                setEditingDraft(null);
            }
        } catch (error) {
            console.error("Failed to save draft", error);
        }
    };

    if (editingDraft) {
        return (
            <div className="h-full flex flex-col bg-white">
                <header className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Edit Draft</h2>
                    <div className="space-x-2">
                        <button
                            onClick={() => setEditingDraft(null)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleSave(editingDraft)}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                            Save Draft
                        </button>
                    </div>
                </header>
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                        <input
                            type="text"
                            value={editingDraft.subject}
                            onChange={(e) => setEditingDraft({ ...editingDraft, subject: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div className="flex-1 h-full">
                        <label className="block text-sm font-medium text-gray-700">Body</label>
                        <textarea
                            value={editingDraft.body}
                            onChange={(e) => setEditingDraft({ ...editingDraft, body: e.target.value })}
                            className="mt-1 block w-full h-[calc(100vh-300px)] rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border resize-none"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <ConfirmationModal
                isOpen={!!deleteDraftId}
                onClose={() => setDeleteDraftId(null)}
                onConfirm={handleDelete}
                title="Delete Draft"
                message="Are you sure you want to delete this draft? This action cannot be undone."
                confirmText="Delete"
                isDangerous={true}
            />
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Drafts</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your email drafts.</p>
                </div>
                <button
                    onClick={() => setEditingDraft({ id: crypto.randomUUID(), subject: "", body: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Draft
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                {isLoading && drafts.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : drafts.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No drafts</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating a new draft.</p>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {drafts.map((draft) => (
                                <li key={draft.id} className="hover:bg-gray-50">
                                    <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingDraft(draft)}>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-blue-600 truncate">{draft.subject || "(No Subject)"}</p>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Draft
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex justify-between">
                                                <div className="sm:flex">
                                                    <p className="flex items-center text-sm text-gray-500">
                                                        {draft.body.substring(0, 100)}...
                                                    </p>
                                                </div>
                                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                    <p>
                                                        Last updated {format(new Date(draft.updatedAt), "MMM d, yyyy")}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ml-4 flex-shrink-0 flex space-x-2">
                                            <button
                                                onClick={() => setEditingDraft(draft)}
                                                className="p-2 text-gray-400 hover:text-gray-500"
                                            >
                                                <Edit3 className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteDraftId(draft.id)}
                                                className="p-2 text-gray-400 hover:text-red-500"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
