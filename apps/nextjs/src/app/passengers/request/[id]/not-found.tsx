import Link from "next/link";
import { MapPin } from "lucide-react";

import { Button } from "@app/ui/button";

export default function RideWantedNotFound() {
  return (
    <main className="container flex min-h-[60vh] flex-col items-center justify-center py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="bg-muted mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
          <MapPin className="text-muted-foreground size-8" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">Ride Request Not Found</h1>
        <p className="text-muted-foreground mb-6">
          This ride request may have been removed, fulfilled, or the link may be
          incorrect.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/passengers">Browse All Requests</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
