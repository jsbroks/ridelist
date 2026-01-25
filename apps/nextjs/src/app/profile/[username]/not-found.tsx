import Link from "next/link";
import { UserX } from "lucide-react";

import { Button } from "@app/ui/button";

export default function ProfileNotFound() {
  return (
    <main className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <UserX className="text-muted-foreground mb-6 size-16" />
      <h1 className="mb-2 text-2xl font-bold">User Not Found</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        The user you&apos;re looking for doesn&apos;t exist or may have been
        removed.
      </p>
      <div className="flex gap-3">
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
        <Link href="/search">
          <Button variant="outline">Find a Ride</Button>
        </Link>
      </div>
    </main>
  );
}
