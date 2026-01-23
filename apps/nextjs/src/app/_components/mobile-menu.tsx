"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Menu, Plus, Search, Settings, User, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@app/ui/avatar";

import { authClient } from "~/auth/client";

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface MobileMenuLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

const MobileMenuLink: React.FC<MobileMenuLinkProps> = ({
  href,
  icon,
  children,
  onClick,
  variant = "default",
}) => {
  const baseClasses =
    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors";
  const variantClasses =
    variant === "destructive"
      ? "hover:bg-destructive/10 text-destructive"
      : "hover:bg-muted";

  return (
    <Link
      href={href}
      className={`${baseClasses} ${variantClasses}`}
      onClick={onClick}
    >
      {icon}
      <span className="font-medium">{children}</span>
    </Link>
  );
};

interface MobileMenuButtonProps {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

const MobileMenuButton: React.FC<MobileMenuButtonProps> = ({
  icon,
  children,
  onClick,
  variant = "default",
}) => {
  const baseClasses =
    "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors w-full text-left";
  const variantClasses =
    variant === "destructive"
      ? "hover:bg-destructive/10 text-destructive"
      : "hover:bg-muted";

  return (
    <button className={`${baseClasses} ${variantClasses}`} onClick={onClick}>
      {icon}
      <span className="font-medium">{children}</span>
    </button>
  );
};

export const MobileMenu: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    setIsOpen(false);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="text-muted-foreground hover:text-foreground md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="bg-background animate-fade-in absolute top-16 right-0 left-0 border-b md:hidden">
          <div className="container flex flex-col gap-2 py-4">
            {/* User info on mobile */}
            {session?.user && (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="size-10">
                    <AvatarImage
                      src={session.user.image ?? undefined}
                      alt={session.user.name}
                    />
                    <AvatarFallback>
                      {getInitials(session.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{session.user.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {session.user.email}
                    </span>
                  </div>
                </div>
                <div className="my-2 border-t" />
              </>
            )}

            <MobileMenuLink
              href="/search"
              icon={<Search className="text-primary size-5" />}
              onClick={closeMenu}
            >
              Find a Ride
            </MobileMenuLink>
            <MobileMenuLink
              href="/post"
              icon={<Plus className="text-primary size-5" />}
              onClick={closeMenu}
            >
              Post a Ride
            </MobileMenuLink>

            <div className="my-2 border-t" />

            {session?.user ? (
              <>
                <MobileMenuLink
                  href="/profile"
                  icon={<User className="text-primary size-5" />}
                  onClick={closeMenu}
                >
                  Profile
                </MobileMenuLink>
                <MobileMenuLink
                  href="/settings"
                  icon={<Settings className="text-primary size-5" />}
                  onClick={closeMenu}
                >
                  Settings
                </MobileMenuLink>
                <MobileMenuButton
                  icon={<LogOut className="size-5" />}
                  onClick={handleSignOut}
                  variant="destructive"
                >
                  Log out
                </MobileMenuButton>
              </>
            ) : (
              <MobileMenuLink
                href="/login"
                icon={<LogIn className="text-primary size-5" />}
                onClick={closeMenu}
              >
                Login
              </MobileMenuLink>
            )}
          </div>
        </div>
      )}
    </>
  );
};
