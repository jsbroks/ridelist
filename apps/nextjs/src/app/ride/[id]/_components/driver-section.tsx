import Link from "next/link";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";

interface DriverSectionProps {
  driver: {
    id: string;
    name: string;
    image: string | null;
  };
  description: string | null;
  stats: {
    averageRating: number | null;
    totalReviews: number;
  } | null;
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

export const DriverSection: React.FC<DriverSectionProps> = ({
  driver,
  description,
  stats,
}) => {
  return (
    <section className="space-y-6">
      <Link
        href={`/profile/${driver.id}`}
        className="group flex items-center gap-4"
      >
        <Avatar className="size-16">
          <AvatarImage src={driver.image ?? undefined} alt={driver.name} />
          <AvatarFallback className="text-lg">
            {getInitials(driver.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-lg font-semibold group-hover:underline">
            {driver.name}
          </p>
          {stats?.averageRating != null ? (
            <div className="mt-1 flex items-center gap-1">
              <Star className="size-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {stats.averageRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground text-sm">
                ({stats.totalReviews} reviews)
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">
              No reviews yet
            </span>
          )}
        </div>
      </Link>

      <div>
        {description ? (
          <div style={{ whiteSpace: "pre-wrap" }}>{description}</div>
        ) : (
          <span className="text-muted-foreground text-sm">No description</span>
        )}
      </div>
    </section>
  );
};
