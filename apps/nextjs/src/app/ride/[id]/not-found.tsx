import Link from "next/link";
import { Car } from "lucide-react";

import { Button } from "@app/ui/button";

export default function RideNotFound() {
  return (
    <main className="container flex min-h-[60vh] flex-col items-center justify-center py-16">
      <Car className="text-muted-foreground mb-4 size-16 opacity-50" />
      <h1 className="text-2xl font-bold">Ride Not Found</h1>
      <p className="text-muted-foreground mt-2 text-center">
        The ride you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/search">
          <Button variant="outline">Find a Ride</Button>
        </Link>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </main>
  );
}
