import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { getSession } from "~/auth/server";

export const metadata: Metadata = {
  title: "My Requests",
  description: "View and manage your ride requests",
};

export default async function MyRequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="container py-8">{children}</main>
    </div>
  );
}
