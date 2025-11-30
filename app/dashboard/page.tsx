"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/client";
import LoadingScreen from "@/components/ui/loading-screen";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const redirectToRoleDashboard = async () => {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/auth/login");
        return;
      }

      // Fetch user role from profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        router.push("/auth/login");
        return;
      }

      const userRole = profileData?.role;

      // Redirect based on role
      switch (userRole) {
        case "projectManager":
          router.push("/dashboard/pm");
          break;
        case "qcTeam":
          router.push("/dashboard/qc");
          break;
        case "qaTeam":
          router.push("/dashboard/qa");
          break;
        case "processor":
          router.push("/dashboard/processor");
          break;
        default:
          console.error("Unknown user role:", userRole);
          router.push("/auth/login");
      }
    };

    redirectToRoleDashboard();
  }, [router]);

  return <LoadingScreen message="Redirecting to dashboard..." />;
}
