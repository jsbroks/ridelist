"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, LogIn, Menu, Plus, Search, X } from "lucide-react";

import { Button } from "@app/ui/button";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2">
          <Car className="text-primary size-7 transition-transform group-hover:rotate-12" />
          <span className="text-xl font-bold tracking-tight">RideList</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          <Link href="/rides">
            <Button variant="ghost" className="gap-2">
              <Search className="size-4" />
              Find a Ride
            </Button>
          </Link>
          <Link href="/post">
            <Button variant="ghost" className="gap-2">
              <Plus className="size-4" />
              Post a Ride
            </Button>
          </Link>
        </div>

        {/* Desktop Auth */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="outline" className="gap-2">
              <LogIn className="size-4" />
              Login
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="text-muted-foreground hover:text-foreground md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="size-6" />
          ) : (
            <Menu className="size-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="bg-background animate-fade-in border-b md:hidden">
          <div className="container flex flex-col gap-2 py-4">
            <Link
              href="/rides"
              className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Search className="text-primary size-5" />
              <span className="font-medium">Find a Ride</span>
            </Link>
            <Link
              href="/post"
              className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Plus className="text-primary size-5" />
              <span className="font-medium">Post a Ride</span>
            </Link>
            <div className="my-2 border-t" />
            <Link
              href="/login"
              className="hover:bg-muted flex items-center gap-3 rounded-lg px-3 py-2 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LogIn className="text-primary size-5" />
              <span className="font-medium">Login</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
