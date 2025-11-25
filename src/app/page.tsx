import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowRight, Mail } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/inbox");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4 text-center">
      <div className="mb-8 flex items-center justify-center rounded-full bg-blue-100 p-4">
        <Mail className="h-12 w-12 text-blue-600" />
      </div>
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Email AI Agent
      </h1>
      <p className="mb-8 max-w-2xl text-lg text-gray-600">
        Your intelligent email assistant. Categorize, extract actions, and draft replies automatically with the power of Gemini.
      </p>
      <div className="flex gap-4">
        <Link
          href="/api/auth/signin"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
