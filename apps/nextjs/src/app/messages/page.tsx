import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { fetchQuery, trpc } from "~/trpc/server";
import { ConversationList } from "./_components/conversation-list";

export default async function MessagesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const conversations = await fetchQuery(
    trpc.conversation.list.queryOptions(),
  ).catch(() => []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground mt-1">
          Your conversations with drivers and passengers
        </p>
      </div>

      <ConversationList
        conversations={conversations}
        currentUserId={session.user.id}
      />
    </div>
  );
}
