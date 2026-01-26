import { redirect } from "next/navigation";
import { Car } from "lucide-react";

import { getSession } from "~/auth/server";
import { HydrateClient, fetchQuery, trpc } from "~/trpc/server";
import { RequestCard } from "./_components/request-card";

export default async function MyRequestsPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const requests = await fetchQuery(
    trpc.rideRequest.myRequests.queryOptions(),
  ).catch(() => []);

  return (
    <HydrateClient>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your ride requests
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Car className="text-muted-foreground mb-4 size-12" />
            <h3 className="text-lg font-semibold">No requests yet</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              When you request to join a ride, your requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </div>
    </HydrateClient>
  );
}
