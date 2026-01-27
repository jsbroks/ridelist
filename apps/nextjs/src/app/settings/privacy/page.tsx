import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { fetchQuery, trpc } from "~/trpc/server";
import { PrivacySettings } from "./_components/privacy-settings";

export default async function PrivacySettingsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const privacySettings = await fetchQuery(
    trpc.user.getPrivacySettings.queryOptions(),
  );

  return <PrivacySettings initialSettings={privacySettings} />;
}
