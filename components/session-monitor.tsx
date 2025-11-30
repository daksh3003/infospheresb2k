"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/client";

export function SessionMonitor() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const supabase = createClient();

    // Check initial session
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Public routes that don't require authentication
      const publicRoutes = ["/auth/login", "/auth/signup", "/auth/verify-email"];
      const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
      );

      // If no session and not on a public route, redirect to login
      if (!session && !isPublicRoute) {
        router.push("/auth/login?session_timeout=true");
      }
    };

    checkSession();

    // Listen for auth state changes (logout, token refresh, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Public routes that don't require authentication
      const publicRoutes = ["/auth/login", "/auth/signup", "/auth/verify-email"];
      const isPublicRoute = publicRoutes.some((route) =>
        pathname.startsWith(route)
      );

      // Handle session expiration or sign out
      if (event === "SIGNED_OUT") {
        if (!isPublicRoute) {
          // Session expired or user signed out
          router.push("/auth/login");
        }
      }

      // Handle token refresh - check if session is still valid
      if (event === "TOKEN_REFRESHED") {
        if (!session && !isPublicRoute) {
          // Session refresh failed, redirect to login
          router.push("/auth/login");
        }
      }

      // If user signed in and on auth page, redirect to dashboard
      if (event === "SIGNED_IN" && session && isPublicRoute) {
        router.push("/dashboard");
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname, mounted]);

  return null; // This component doesn't render anything
}
