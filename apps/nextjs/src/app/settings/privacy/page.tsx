import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { PrivacySettings } from "./_components/privacy-settings";

export default async function PrivacySettingsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <PrivacySettings />;
}
