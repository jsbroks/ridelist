import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { ProfileForm } from "./_components/profile-form";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ProfileForm
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        username: session.user.username,
      }}
    />
  );
}
