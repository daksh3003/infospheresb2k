"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function TaskDetailBackButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const source = searchParams.get("source");

  const handleBackClick = () => {
    if (from) {
      router.push(from);
      return;
    }

    // Handle the global dashboard case
    if (source === "global") {
      router.push("/dashboard");
      return;
    }

    // Handle specific dashboard cases (pm, qc, qa)
    if (source) {
      router.push(`/dashboard/${source}`);
      return;
    }

    // Default case - go to main dashboard
    router.push("/dashboard");
  };

  const getBackText = () => {
    if (source === "global") {
      return "Back to Global Dashboard";
    }
    return source ? `Back to ${source.toUpperCase()} Dashboard` : "Back to Dashboard";
  };

  return (
    <Button 
      variant="ghost" 
      className="flex items-center text-gray-600 hover:text-gray-900" 
      onClick={handleBackClick}
    >
      <ChevronLeft className="mr-1 h-4 w-4" />
      {getBackText()}
    </Button>
  );
}

function formatSourceName(path: string): string {
  const segments = path.replace(/^\//, '').split('/');

  if (segments[0] === "dashboard") {
    if (segments.length > 1) {
      return `${segments[1].toUpperCase()} Dashboard`;
    }
    return "Dashboard";
  }

  return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
}