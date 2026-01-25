"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Calendar,
  Car,
  CheckCircle,
  Clock,
  Edit,
  MapPin,
  MessageCircle,
  Settings,
  Star,
  Users,
} from "lucide-react";

import { cn } from "@app/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";
import { Badge } from "@app/ui/badge";
import { Button } from "@app/ui/button";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  username?: string | null;
  createdAt?: Date;
}

interface ProfileContentProps {
  user: User;
  isOwnProfile?: boolean;
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
  from: string;
  to: string;
  date: string;
  price: number;
  seats: number;
  status: "active" | "completed";
}> = ({ from, to, date, price, seats, status }) => (
  <div className="flex items-center justify-between rounded-lg border p-4">
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
      <p className="text-muted-foreground text-sm">{seats} seats</p>
    </div>
  </div>
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
          <AvatarImage src={reviewerImage} alt={reviewerName} />
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

export const ProfileContent: React.FC<ProfileContentProps> = ({
  user,
  isOwnProfile = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>("listed");

  // Mock data - replace with actual data from API
  const stats = {
    ridesPosted: 12,
    ridesJoined: 8,
    rating: 4.8,
    reviews: 15,
  };

  const verifications = {
    email: true,
    phone: false,
    id: false,
  };

  // Mock rides data
  const listedRides = [
    {
      id: "1",
      from: "Toronto",
      to: "Montreal",
      date: "Jan 25, 2026",
      price: 45,
      seats: 3,
      status: "active" as const,
    },
    {
      id: "2",
      from: "Ottawa",
      to: "Toronto",
      date: "Jan 28, 2026",
      price: 35,
      seats: 2,
      status: "active" as const,
    },
  ];

  const completedRides = [
    {
      id: "3",
      from: "Vancouver",
      to: "Calgary",
      date: "Jan 15, 2026",
      price: 80,
      seats: 4,
      status: "completed" as const,
    },
  ];

  // Mock reviews data
  const reviews = [
    {
      id: "1",
      reviewerName: "Sarah Johnson",
      reviewerImage: undefined,
      rating: 5,
      comment:
        "Great driver! Very punctual and the car was clean. Would definitely ride again.",
      date: "Jan 20, 2026",
      rideRoute: "Toronto → Montreal",
    },
    {
      id: "2",
      reviewerName: "Mike Chen",
      reviewerImage: undefined,
      rating: 4,
      comment: "Good conversation and safe driving. Arrived on time.",
      date: "Jan 18, 2026",
      rideRoute: "Ottawa → Toronto",
    },
  ];

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
                <div className="flex items-center gap-1">
                  <Star className="size-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{stats.rating}</span>
                </div>
                <span className="text-muted-foreground text-sm">
                  ({stats.reviews} reviews)
                </span>
              </div>

              <div className="text-muted-foreground mt-3 flex flex-col gap-1 text-sm">
                <span className="flex gap-1">
                  <Calendar className="size-4" />
                  Member since {memberSince}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" />
                  Canada
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
            <div className="px-4 py-3">
              <h2 className="font-semibold">About</h2>
            </div>
            <div className="p-4">
              <p className="text-muted-foreground text-sm">
                {isOwnProfile
                  ? "Add a bio to tell other riders about yourself."
                  : "This user hasn't added a bio yet."}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="rounded-xl">
            <div className="px-4 py-3">
              <h2 className="font-semibold">Badges</h2>
            </div>
            <div className="flex flex-wrap gap-2 p-4">
              <Badge variant="secondary">New Member</Badge>
              {stats.ridesPosted >= 5 && (
                <Badge variant="secondary">Active Driver</Badge>
              )}
              {stats.ridesJoined >= 5 && (
                <Badge variant="secondary">Frequent Rider</Badge>
              )}
              {verifications.email && (
                <Badge
                  variant="outline"
                  className="border-green-500/50 text-green-600 dark:text-green-400"
                >
                  Verified
                </Badge>
              )}
            </div>
          </div>

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
          <div className="rounded-xl border">
            <ProfileTabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <div className="p-6">
              {/* Listed Rides Tab */}
              {activeTab === "listed" && (
                <div className="space-y-4">
                  {listedRides.length > 0 ? (
                    <>
                      {listedRides.map((ride) => (
                        <RideCard key={ride.id} {...ride} />
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
                        <RideCard key={ride.id} {...ride} />
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
                          <p className="text-4xl font-bold">{stats.rating}</p>
                          <div className="mt-1 flex items-center justify-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "size-4",
                                  i < Math.round(stats.rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground",
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {stats.reviews} reviews
                          </p>
                        </div>
                        <div className="h-16 border-l" />
                        <div className="flex-1 space-y-1.5">
                          {[5, 4, 3, 2, 1].map((stars) => (
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
                                  style={{
                                    width: `${stars === 5 ? 60 : stars === 4 ? 30 : 10}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {reviews.map((review) => (
                        <ReviewCard key={review.id} {...review} />
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
