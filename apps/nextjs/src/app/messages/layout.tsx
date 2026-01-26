import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { getSession } from "~/auth/server";

export const metadata: Metadata = {
  title: "Messages",
  description: "Your conversations with drivers and passengers",
};

export default async function MessagesLayout({
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
