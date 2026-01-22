"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Loader2, Mail } from "lucide-react";

import { Button } from "@app/ui/button";
import { Input } from "@app/ui/input";
import { Label } from "@app/ui/label";

import { authClient } from "~/auth/client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("Google sign in failed:", error);
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      // For now, just log the email - you can implement magic link or password auth later
      console.log("Sign in with email:", email);
      // await authClient.signIn.email({ email });
      router.push("/");
    } catch (error) {
      console.error("Email sign in failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Background */}
      <div className="from-primary/5 via-background to-background fixed inset-0 -z-10 bg-linear-to-br" />
      <div className="from-primary/10 fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] via-transparent to-transparent" />

      {/* Header */}
      <header className="container py-6">
        <Link href="/" className="group inline-flex items-center gap-2">
          <Car className="text-primary size-7 transition-transform group-hover:rotate-12" />
          <span className="text-xl font-bold tracking-tight">RideList</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to find or post rides across Canada
            </p>
          </div>

          <div className="bg-card rounded-xl border p-6 shadow-lg">
            {/* Google Sign In */}
            <Button
              variant="outline"
              className="h-12 w-full gap-3 text-base"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <GoogleIcon className="size-5" />
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="border-border w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card text-muted-foreground px-2">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email Sign In */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full gap-2 text-base"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Mail className="size-5" />
                )}
                Continue with Email
              </Button>
            </form>
          </div>

          {/* Footer text */}
          <p className="text-muted-foreground mt-6 text-center text-sm">
            By continuing, you agree to our{" "}
            <Link
              href="/terms"
              className="text-primary underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-primary underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
          </p>

          {/* Sign up link */}
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
