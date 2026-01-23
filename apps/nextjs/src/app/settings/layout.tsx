import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { getSession } from "~/auth/server";
import { SettingsSidebar } from "./_components/settings-sidebar";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences",
};

export default async function SettingsLayout({
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

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-64">
            <SettingsSidebar />
          </aside>

          {/* Content */}
          <div className="flex-1">{children}</div>
        </div>
      </main>
    </div>
  );
}
