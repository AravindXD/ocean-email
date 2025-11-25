import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InboxClient } from "@/components/InboxClient";
import { redirect } from "next/navigation";

export default async function InboxPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
        redirect("/api/auth/signin");
    }

    const emails = await db.emails.getUserEmails(session.user.email);

    return <InboxClient initialEmails={emails} />;
}
