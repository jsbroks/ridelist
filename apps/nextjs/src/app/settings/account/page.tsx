import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { AccountSettings } from "./_components/account-settings";

export default async function AccountSettingsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <AccountSettings user={session.user} />;
}
