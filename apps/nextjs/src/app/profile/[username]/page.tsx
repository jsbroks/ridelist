import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { eq } from "@app/db";
import { db } from "@app/db/client";
import { user } from "@app/db/schema";

import { getSession } from "~/auth/server";
import { ProfileContent } from "../_components/profile-content";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;

  const profileUser = await db.query.user.findFirst({
    where: eq(user.username, username),
  });

  if (!profileUser) {
    return {
      title: "User Not Found",
    };
  }

  return {
    title: `${profileUser.name} (@${profileUser.username})`,
    description: `View ${profileUser.name}'s profile on RideList`,
  };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const session = await getSession();

  // If viewing own profile via username, redirect to /profile
  if (session?.user.username === username) {
    redirect("/profile");
  }

  const profileUser = await db.query.user.findFirst({
    where: eq(user.username, username),
  });

  if (!profileUser) notFound();

  return <ProfileContent user={profileUser} isOwnProfile={false} />;
}
