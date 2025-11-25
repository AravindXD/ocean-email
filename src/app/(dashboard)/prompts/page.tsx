"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Prompt } from "@/types";
import { Save, Loader2, AlertCircle } from "lucide-react";

export default function PromptsPage() {
    const { prompts, setPrompts, setLoading, isLoading } = useAppStore();
    const [savingId, setSavingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newPromptType, setNewPromptType] = useState("");
    const [newPromptDesc, setNewPromptDesc] = useState("");

    // System prompts that cannot be deleted or renamed
    const SYSTEM_PROMPTS = ["categorization", "action_extraction", "auto_reply"];

    useEffect(() => {
        const fetchPrompts = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/prompts");
                if (res.ok) {
                    const data = await res.json();
                    setPrompts(data.prompts);
                }
            } catch (error) {
                console.error("Failed to fetch prompts", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrompts();
    }, [setPrompts, setLoading]);

    const handleSave = async (prompt: Prompt) => {
        setSavingId(prompt.id);
        setMessage(null);
        try {
            const res = await fetch("/api/prompts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: prompt.id,
                    content: prompt.content,
                    type: prompt.type,
                    description: prompt.description
                }),
            });

            if (res.ok) {
                setMessage({ type: "success", text: "Prompt updated successfully!" });
            } else {
                throw new Error("Failed to update");
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to save prompt." });
        } finally {
            setSavingId(null);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this prompt?")) return;

        setDeletingId(id);
        try {
            const res = await fetch(`/api/prompts?id=${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setPrompts(prompts.filter(p => p.id !== id));
                setMessage({ type: "success", text: "Prompt deleted successfully!" });
            } else {
                throw new Error("Failed to delete");
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to delete prompt." });
        } finally {
            setDeletingId(null);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleCreate = async () => {
        if (!newPromptType.trim()) return;

        try {
            const res = await fetch("/api/prompts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: newPromptType,
                    description: newPromptDesc,
                    content: "Enter your prompt instructions here..."
                }),
            });

            if (res.ok) {
                const { prompt } = await res.json();
                setPrompts([...prompts, prompt]);
                setIsCreating(false);
                setNewPromptType("");
                setNewPromptDesc("");
                setMessage({ type: "success", text: "Prompt created successfully!" });
            } else {
                throw new Error("Failed to create");
            }
        } catch (error) {
            setMessage({ type: "error", text: "Failed to create prompt." });
        }
    };

    const handleUpdateField = (id: string, field: keyof Prompt, value: string) => {
        const updatedPrompts = prompts.map((p) =>
            p.id === id ? { ...p, [field]: value } : p
        );
        setPrompts(updatedPrompts);
    };

    const isSystemPrompt = (type: string) => SYSTEM_PROMPTS.includes(type);

    const getPromptTitle = (type: string) => {
        switch (type) {
            case "categorization": return "Categorization Logic";
            case "action_extraction": return "Action Item Extraction";
            case "auto_reply": return "Auto-Reply Template";
            default: return type;
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prompt Configuration</h1>
                    <p className="text-sm text-gray-500 mt-1">Customize the AI's behavior by editing its instructions.</p>
                </div>
                <div className="flex items-center space-x-4">
                    {message && (
                        <div className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                            {message.type === "error" && <AlertCircle className="h-4 w-4 mr-2" />}
                            {message.text}
                        </div>
                    )}
                    <button
                        onClick={() => setIsCreating(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        New Prompt
                    </button>
                </div>
            </header>

            {isCreating && (
                <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex flex-col space-y-3">
                    <div className="flex items-center space-x-4">
                        <input
                            type="text"
                            value={newPromptType}
                            onChange={(e) => setNewPromptType(e.target.value)}
                            placeholder="Prompt Name (e.g., 'summarization_style')"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                        <input
                            type="text"
                            value={newPromptDesc}
                            onChange={(e) => setNewPromptDesc(e.target.value)}
                            placeholder="Description (e.g., 'Summarizes emails in bullet points')"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!newPromptType.trim()}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            Create
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    {isLoading && prompts.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        prompts.map((prompt) => {
                            const isSystem = isSystemPrompt(prompt.type);
                            return (
                                <div key={prompt.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-start">
                                        <div className="flex-1 mr-4">
                                            {isSystem ? (
                                                <>
                                                    <h3 className="text-lg font-medium text-gray-900">{getPromptTitle(prompt.type)}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">{prompt.description || "System Prompt"}</p>
                                                </>
                                            ) : (
                                                <div className="space-y-2">
                                                    <input
                                                        type="text"
                                                        value={prompt.type}
                                                        onChange={(e) => handleUpdateField(prompt.id, "type", e.target.value)}
                                                        className="block w-full text-lg font-medium text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Prompt Name"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={prompt.description || ""}
                                                        onChange={(e) => handleUpdateField(prompt.id, "description", e.target.value)}
                                                        className="block w-full text-sm text-gray-500 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Description"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {!isSystem && (
                                                <button
                                                    onClick={() => handleDelete(prompt.id)}
                                                    disabled={deletingId === prompt.id}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                                                >
                                                    {deletingId === prompt.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        "Delete"
                                                    )}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleSave(prompt)}
                                                disabled={savingId === prompt.id}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                            >
                                                {savingId === prompt.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                                ) : (
                                                    <Save className="h-4 w-4 mr-1.5" />
                                                )}
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-0">
                                        <textarea
                                            value={prompt.content}
                                            onChange={(e) => handleUpdateField(prompt.id, "content", e.target.value)}
                                            className="w-full h-64 p-6 border-none focus:ring-0 text-gray-800 font-mono text-sm resize-none bg-white"
                                            spellCheck={false}
                                            placeholder="Enter prompt instructions..."
                                        />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
