import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { eq } from "@app/db";
import { db } from "@app/db/client";
import { user } from "@app/db/schema";

import { getSession } from "~/auth/server";
import { fetchQuery, trpc } from "~/trpc/server";
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

  const userId = profileUser.id;

  const [profileStats, reviewStats, listedRides, completedRides, reviewsData] =
    await Promise.all([
      fetchQuery(trpc.user.profileStats.queryOptions({ userId })),
      fetchQuery(trpc.review.stats.queryOptions({ userId })),
      fetchQuery(trpc.user.listedRides.queryOptions({ userId, limit: 20 })),
      fetchQuery(trpc.user.completedRides.queryOptions({ userId, limit: 20 })),
      fetchQuery(trpc.review.forUser.queryOptions({ userId, limit: 20 })),
    ]);

  return (
    <ProfileContent
      user={profileUser}
      isOwnProfile={false}
      stats={{
        ridesPosted: profileStats.ridesPosted,
        ridesJoined: profileStats.ridesJoined,
        rating: reviewStats.averageRating,
        totalReviews: reviewStats.totalReviews,
        distribution: reviewStats.distribution,
      }}
      listedRides={listedRides}
      completedRides={completedRides}
      reviews={reviewsData.reviews}
    />
  );
}
