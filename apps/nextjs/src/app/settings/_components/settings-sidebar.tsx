"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, KeyRound, Shield, User } from "lucide-react";

import { cn } from "@app/ui";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    title: "Profile",
    href: "/settings",
    icon: <User className="size-4" />,
  },
  {
    title: "Account",
    href: "/settings/account",
    icon: <KeyRound className="size-4" />,
  },
  {
    title: "Notifications",
    href: "/settings/notifications",
    icon: <Bell className="size-4" />,
  },
  {
    title: "Privacy",
    href: "/settings/privacy",
    icon: <Shield className="size-4" />,
  },
];

export const SettingsSidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {navItems.map((item) => {
        const isActive =
          item.href === "/settings"
            ? pathname === "/settings"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.icon}
            <span className="whitespace-nowrap">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
};
