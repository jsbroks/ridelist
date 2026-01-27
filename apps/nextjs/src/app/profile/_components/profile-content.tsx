"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { differenceInMonths, format } from "date-fns";
import {
  Award,
  BadgeCheck,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  Edit,
  Flame,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Rocket,
  Settings,
  Sparkles,
  Star,
  ThumbsUp,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";

import { cn } from "@app/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";
import { Badge } from "@app/ui/badge";
import { Button } from "@app/ui/button";
import { Textarea } from "@app/ui/textarea";

import { useTRPC } from "~/trpc/react";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username?: string | null;
  bio?: string | null;
  createdAt?: Date;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  driversLicenseVerified?: boolean;
}

interface ProfileStats {
  ridesPosted: number;
  ridesJoined: number;
  rating: number | null;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ListedRide {
  id: string;
  fromName: string;
  toName: string;
  departureTime: Date;
  pricePerSeat: number | null;
  availableSeats: number;
}

interface CompletedRide {
  id: string;
  fromName: string;
  toName: string;
  departureTime: Date;
  pricePerSeat: number | null;
  availableSeats: number;
  role: "driver" | "passenger";
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewer: {
    id: string;
    name: string;
    image: string | null;
  };
  ride: {
    id: string;
    fromName: string;
    toName: string;
  };
}

interface ProfileContentProps {
  user: User;
  isOwnProfile?: boolean;
  stats?: ProfileStats;
  listedRides?: ListedRide[];
  completedRides?: CompletedRide[];
  reviews?: Review[];
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type TabId = "listed" | "completed" | "reviews";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

const ProfileTabs: React.FC<{
  tabs: Tab[];
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}> = ({ tabs, activeTab, onTabChange }) => (
  <div className="flex border-b">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={cn(
          "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
          activeTab === tab.id
            ? "border-primary text-primary"
            : "text-muted-foreground hover:text-foreground border-transparent",
        )}
      >
        {tab.icon}
        {tab.label}
        {tab.count !== undefined && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs",
              activeTab === tab.id
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center py-12 text-center">
    <div className="text-muted-foreground mb-4 opacity-50">{icon}</div>
    <p className="font-medium">{title}</p>
    <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const RideCard: React.FC<{
  id: string;
  from: string;
  to: string;
  date: string;
  price: number;
  seats: number;
  status: "active" | "completed";
}> = ({ id, from, to, date, price, seats, status }) => (
  <Link href={`/ride/${id}`} className="block">
    <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            status === "active" ? "bg-primary/10" : "bg-green-500/10",
          )}
        >
          {status === "active" ? (
            <Clock className="text-primary size-5" />
          ) : (
            <CheckCircle className="size-5 text-green-600" />
          )}
        </div>
        <div>
          <p className="font-medium">
            {from} → {to}
          </p>
          <p className="text-muted-foreground text-sm">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">${price}</p>
        <p className="text-muted-foreground text-sm">
          {seats} seat{seats !== 1 ? "s" : ""} available
        </p>
      </div>
    </div>
  </Link>
);

const ReviewCard: React.FC<{
  reviewerName: string;
  reviewerImage?: string;
  rating: number;
  comment: string;
  date: string;
  rideRoute: string;
}> = ({ reviewerName, reviewerImage, rating, comment, date, rideRoute }) => (
  <div className="rounded-lg border p-4">
    <div className="mb-3 flex items-start justify-between">
      <div className="flex items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage
            src={reviewerImage}
            alt={reviewerName}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback>{getInitials(reviewerName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{reviewerName}</p>
          <p className="text-muted-foreground text-xs">{rideRoute}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "size-4",
              i < rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground",
            )}
          />
        ))}
      </div>
    </div>
    <p className="text-sm">{comment}</p>
    <p className="text-muted-foreground mt-2 text-xs">{date}</p>
  </div>
);

const Achievements: React.FC<{
  user: User;
  stats: ProfileStats;
}> = ({ user, stats }) => {
  const achievements = [
    {
      id: "new-member",
      label: "New Member",
      icon: Sparkles,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      earned:
        user.createdAt &&
        differenceInMonths(new Date(), new Date(user.createdAt)) < 6,
    },
    {
      id: "first-ride",
      label: "First Ride",
      icon: Rocket,
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      earned: stats.ridesPosted >= 1,
    },
    {
      id: "road-warrior",
      label: "Road Warrior",
      icon: Car,
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      earned: stats.ridesPosted >= 5,
    },
    {
      id: "ride-captain",
      label: "Ride Captain",
      icon: Award,
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      earned: stats.ridesPosted >= 10,
    },
    {
      id: "legend",
      label: "Legend",
      icon: Trophy,
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      earned: stats.ridesPosted >= 25,
    },
    {
      id: "explorer",
      label: "Explorer",
      icon: Zap,
      color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
      earned: stats.ridesJoined >= 5,
    },
    {
      id: "globetrotter",
      label: "Globetrotter",
      icon: MapPin,
      color:
        "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      earned: stats.ridesJoined >= 15,
    },
    {
      id: "superstar",
      label: "Superstar",
      icon: Star,
      color:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      earned:
        stats.rating !== null && stats.rating >= 4.5 && stats.totalReviews >= 5,
    },
    {
      id: "crowd-favorite",
      label: "Crowd Favorite",
      icon: ThumbsUp,
      color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
      earned: stats.totalReviews >= 10,
    },
    {
      id: "on-fire",
      label: "On Fire",
      icon: Flame,
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      earned: stats.rating === 5 && stats.totalReviews >= 3,
    },
    {
      id: "verified-driver",
      label: "Verified Driver",
      icon: BadgeCheck,
      color:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      earned: user.driversLicenseVerified,
    },
  ];

  const earnedAchievements = achievements.filter((a) => a.earned);

  if (earnedAchievements.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl">
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 className="font-semibold">Achievements</h2>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {earnedAchievements.map((achievement) => {
          const Icon = achievement.icon;
          return (
            <Badge
              key={achievement.id}
              variant="secondary"
              className={cn("gap-1", achievement.color)}
            >
              <Icon className="size-3" />
              {achievement.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export const ProfileContent: React.FC<ProfileContentProps> = ({
  user,
  isOwnProfile = false,
  stats = {
    ridesPosted: 0,
    ridesJoined: 0,
    rating: null,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  },
  listedRides = [],
  completedRides = [],
  reviews = [],
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("listed");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(user.bio ?? "");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateBioMutation = useMutation(
    trpc.user.updateBio.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries();
        setIsEditingBio(false);
      },
    }),
  );

  const handleSaveBio = () => {
    updateBioMutation.mutate({ bio: bioValue.trim() || null });
  };

  const handleCancelBio = () => {
    setBioValue(user.bio ?? "");
    setIsEditingBio(false);
  };

  const tabs: Tab[] = [
    {
      id: "listed",
      label: "Listed Rides",
      icon: <Car className="size-4" />,
      count: listedRides.length,
    },
    {
      id: "completed",
      label: "Completed",
      icon: <CheckCircle className="size-4" />,
      count: completedRides.length,
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: <Star className="size-4" />,
      count: reviews.length,
    },
  ];

  const memberSince = user.createdAt
    ? format(new Date(user.createdAt), "MMMM yyyy")
    : "January 2024";

  return (
    <main className="container py-8">
      <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
        {/* Left Side - Profile Info */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="rounded-xl">
            <div className="flex flex-col">
              <Avatar className="size-24">
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback className="text-2xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              <h1 className="mt-4 text-xl font-bold">{user.name}</h1>
              {user.username && (
                <p className="text-muted-foreground">@{user.username}</p>
              )}

              {/* Rating */}
              <div className="mt-3 flex items-center gap-2">
                {stats.rating !== null ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="size-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{stats.rating}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      ({stats.totalReviews} review
                      {stats.totalReviews !== 1 ? "s" : ""})
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    No reviews yet
                  </span>
                )}
              </div>

              <div className="text-muted-foreground mt-3 flex flex-col gap-2 text-sm">
                <span className="flex gap-1">
                  <Calendar className="size-4" />
                  Member since {memberSince}
                </span>

                <span
                  className={cn(
                    "flex items-center gap-1",
                    user.emailVerified && "text-green-600 dark:text-green-400",
                  )}
                >
                  <Mail className="size-4" />
                  Email {user.emailVerified ? "verified" : "not verified"}
                  {user.emailVerified && <BadgeCheck className="size-3.5" />}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    user.phoneVerified && "text-green-600 dark:text-green-400",
                  )}
                >
                  <Phone className="size-4" />
                  Phone {user.phoneVerified ? "verified" : "not verified"}
                  {user.phoneVerified && <BadgeCheck className="size-3.5" />}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    user.driversLicenseVerified &&
                      "text-green-600 dark:text-green-400",
                  )}
                >
                  <IdCard className="size-4" />
                  Driver&apos;s license{" "}
                  {user.driversLicenseVerified ? "verified" : "not verified"}
                  {user.driversLicenseVerified && (
                    <BadgeCheck className="size-3.5" />
                  )}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex w-full flex-col gap-2">
                {isOwnProfile ? (
                  <Link href="/settings" className="w-full">
                    <Button variant="outline" className="w-full gap-2">
                      <Edit className="size-4" />
                      Edit Profile
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button className="w-full gap-2">
                      <MessageCircle className="size-4" />
                      Message
                    </Button>
                    <Button variant="outline" className="w-full">
                      Report
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-4 text-center">
              <Car className="text-primary mx-auto size-5" />
              <p className="mt-1 text-2xl font-bold">{stats.ridesPosted}</p>
              <p className="text-muted-foreground text-xs">Rides Posted</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <Users className="text-primary mx-auto size-5" />
              <p className="mt-1 text-2xl font-bold">{stats.ridesJoined}</p>
              <p className="text-muted-foreground text-xs">Rides Joined</p>
            </div>
          </div>

          {/* About */}
          <div className="rounded-xl">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="font-semibold">About</h2>
              {isOwnProfile && !isEditingBio && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingBio(true)}
                  className="h-8 gap-1.5"
                >
                  <Edit className="size-3.5" />
                  Edit
                </Button>
              )}
            </div>
            <div className="px-4 pb-4">
              {isEditingBio ? (
                <div className="space-y-3">
                  <Textarea
                    value={bioValue}
                    onChange={(e) => setBioValue(e.target.value)}
                    placeholder="Tell other riders about yourself..."
                    className="min-h-24 resize-none"
                    maxLength={500}
                    disabled={updateBioMutation.isPending}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      {bioValue.length}/500
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelBio}
                        disabled={updateBioMutation.isPending}
                      >
                        <X className="mr-1 size-3.5" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveBio}
                        disabled={updateBioMutation.isPending}
                      >
                        {updateBioMutation.isPending && (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : user.bio ? (
                <p className="text-sm whitespace-pre-wrap">{user.bio}</p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {isOwnProfile
                    ? "Add a bio to tell other riders about yourself."
                    : "This user hasn't added a bio yet."}
                </p>
              )}
            </div>
          </div>

          <Achievements user={user} stats={stats} />

          {/* Quick Actions */}
          {isOwnProfile && (
            <div className="rounded-xl">
              <div className="px-4 py-3">
                <h2 className="font-semibold">Quick Actions</h2>
              </div>
              <div className="space-y-1 p-2">
                <Link href="/post" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <Car className="size-4" />
                    Post a Ride
                  </Button>
                </Link>
                <Link href="/search" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <MapPin className="size-4" />
                    Find a Ride
                  </Button>
                </Link>
                <Link href="/settings" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <Settings className="size-4" />
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Rides & Reviews Tabs */}
        <div className="lg:col-span-3">
          <div>
            <ProfileTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <div className="pt-6">
              {/* Listed Rides Tab */}
              {activeTab === "listed" && (
                <div className="space-y-4">
                  {listedRides.length > 0 ? (
                    <>
                      {listedRides.map((ride) => (
                        <RideCard
                          key={ride.id}
                          id={ride.id}
                          from={ride.fromName}
                          to={ride.toName}
                          date={format(
                            new Date(ride.departureTime),
                            "MMM d, yyyy 'at' h:mm a",
                          )}
                          price={(ride.pricePerSeat ?? 0) / 100}
                          seats={ride.availableSeats}
                          status="active"
                        />
                      ))}
                    </>
                  ) : (
                    <EmptyState
                      icon={<Car className="size-12" />}
                      title="No listed rides"
                      description={
                        isOwnProfile
                          ? "You haven't posted any rides yet"
                          : "This user hasn't posted any rides yet"
                      }
                      action={
                        isOwnProfile ? (
                          <Link href="/post">
                            <Button>Post Your First Ride</Button>
                          </Link>
                        ) : undefined
                      }
                    />
                  )}
                </div>
              )}

              {/* Completed Rides Tab */}
              {activeTab === "completed" && (
                <div className="space-y-4">
                  {completedRides.length > 0 ? (
                    <>
                      {completedRides.map((ride) => (
                        <RideCard
                          key={ride.id}
                          id={ride.id}
                          from={ride.fromName}
                          to={ride.toName}
                          date={format(
                            new Date(ride.departureTime),
                            "MMM d, yyyy 'at' h:mm a",
                          )}
                          price={(ride.pricePerSeat ?? 0) / 100}
                          seats={ride.availableSeats}
                          status="completed"
                        />
                      ))}
                    </>
                  ) : (
                    <EmptyState
                      icon={<CheckCircle className="size-12" />}
                      title="No completed rides"
                      description={
                        isOwnProfile
                          ? "Your completed rides will appear here"
                          : "This user hasn't completed any rides yet"
                      }
                    />
                  )}
                </div>
              )}

              {/* Reviews Tab */}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    <>
                      {/* Rating Summary */}
                      <div className="bg-muted/50 mb-6 flex items-center gap-4 rounded-lg p-4">
                        <div className="text-center">
                          <p className="text-4xl font-bold">
                            {stats.rating ?? "-"}
                          </p>
                          <div className="mt-1 flex items-center justify-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "size-4",
                                  stats.rating && i < Math.round(stats.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground",
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {stats.totalReviews} review
                            {stats.totalReviews !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="h-16 border-l" />
                        <div className="flex-1 space-y-1.5">
                          {[5, 4, 3, 2, 1].map((stars) => {
                            const count =
                              stats.distribution[
                                stars as keyof typeof stats.distribution
                              ];
                            const percentage =
                              stats.totalReviews > 0
                                ? (count / stats.totalReviews) * 100
                                : 0;
                            return (
                              <div
                                key={stars}
                                className="flex items-center gap-2"
                              >
                                <span className="text-muted-foreground w-3 text-xs">
                                  {stars}
                                </span>
                                <Star className="size-3 fill-yellow-400 text-yellow-400" />
                                <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                                  <div
                                    className="h-full bg-yellow-400"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-muted-foreground w-6 text-right text-xs">
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {reviews.map((review) => (
                        <ReviewCard
                          key={review.id}
                          reviewerName={review.reviewer.name}
                          reviewerImage={review.reviewer.image ?? undefined}
                          rating={review.rating}
                          comment={review.comment ?? ""}
                          date={format(
                            new Date(review.createdAt),
                            "MMM d, yyyy",
                          )}
                          rideRoute={`${review.ride.fromName} → ${review.ride.toName}`}
                        />
                      ))}
                    </>
                  ) : (
                    <EmptyState
                      icon={<Star className="size-12" />}
                      title="No reviews yet"
                      description={
                        isOwnProfile
                          ? "Reviews from your rides will appear here"
                          : "This user hasn't received any reviews yet"
                      }
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
