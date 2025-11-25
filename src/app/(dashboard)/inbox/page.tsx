import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InboxClient } from "@/components/InboxClient";
import { redirect } from "next/navigation";

export default async function InboxPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    const emails = await db.emails.getUserEmails(session.user.id);

    return <InboxClient initialEmails={emails} />;
}
