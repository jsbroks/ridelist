import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { NotificationSettings } from "./_components/notification-settings";

export default async function NotificationSettingsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <NotificationSettings />;
}
