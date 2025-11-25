"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Mail, MessageSquare, FileText, Settings, LogOut, User } from "lucide-react";
import clsx from "clsx";

export function Navbar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const navItems = [
        { name: "Inbox", href: "/inbox", icon: Mail },
        { name: "Drafts", href: "/drafts", icon: FileText },
        { name: "Prompts", href: "/prompts", icon: Settings },
    ];

    return (
        <nav className="border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <div className="flex flex-shrink-0 items-center">
                            <span className="text-xl font-bold text-blue-600">EmailAI</span>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={clsx(
                                            pathname === item.href
                                                ? "border-blue-500 text-gray-900"
                                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                            "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
                                        )}
                                    >
                                        <Icon className="mr-2 h-4 w-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {session?.user && (
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2 text-sm text-gray-700">
                                    {session.user.image ? (
                                        <img
                                            className="h-8 w-8 rounded-full"
                                            src={session.user.image}
                                            alt={session.user.name || "User"}
                                        />
                                    ) : (
                                        <User className="h-8 w-8 rounded-full bg-gray-100 p-1" />
                                    )}
                                    <span className="font-medium">{session.user.name}</span>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/" })}
                                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
