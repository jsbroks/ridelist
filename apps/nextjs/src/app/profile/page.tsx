import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { ProfileContent } from "./_components/profile-content";

export const metadata = {
  title: "Profile",
  description: "View your RideList profile",
};

export default async function ProfilePage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return <ProfileContent user={session.user} isOwnProfile />;
}
