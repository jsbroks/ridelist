import { redirect } from "next/navigation";

import { eq } from "@app/db";
import { db } from "@app/db/client";
import { user } from "@app/db/schema";

import { getSession } from "~/auth/server";
import { ProfileForm } from "./_components/profile-form";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch user with bio from database
  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  return (
    <ProfileForm
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        username: session.user.username,
        bio: userData?.bio,
      }}
    />
  );
}
