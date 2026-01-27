import Link from "next/link";
import { Car, Plus, Search, Users } from "lucide-react";

import { cn } from "@app/ui";
import { Button } from "@app/ui/button";

import { MobileMenu } from "./mobile-menu";
import { UserMenu } from "./user-menu";

interface NavbarProps {
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ className }) => {
  return (
    <header className={cn("sticky top-0 z-50 backdrop-blur-md", className)}>
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo - Server Rendered */}
        <Link href="/" className="group flex items-center gap-2">
          <Car className="text-primary size-7 transition-transform group-hover:rotate-12" />
          <span className="text-xl font-bold tracking-tight">RideList</span>
        </Link>

        {/* Desktop Navigation - Server Rendered */}
        <div className="hidden items-center gap-1 md:flex">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <Search className="size-4" />
              Find a Ride
            </Button>
          </Link>
          <Link href="/passengers">
            <Button variant="ghost" className="gap-2">
              <Users className="size-4" />
              Find Passengers
            </Button>
          </Link>
          <Link href="/post/driver">
            <Button variant="ghost" className="gap-2">
              <Plus className="size-4" />
              Post a Trip
            </Button>
          </Link>
        </div>

        {/* Desktop Auth - Client Component */}
        <div className="hidden items-center gap-3 md:flex">
          <UserMenu />
        </div>

        {/* Mobile Menu - Client Component */}
        <MobileMenu />
      </nav>
    </header>
  );
};
