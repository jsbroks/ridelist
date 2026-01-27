import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { fetchQuery, trpc } from "~/trpc/server";
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

  const userId = session.user.id;

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
      user={session.user}
      isOwnProfile
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
