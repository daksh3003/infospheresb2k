"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function TaskDetailBackButton() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const from = searchParams.get("from");

  const handleBackClick = () => {
    if (from) {
      router.push(from);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <Button 
      variant="ghost" 
      className="flex items-center text-gray-600 hover:text-gray-900" 
      onClick={handleBackClick}
    >
      <ChevronLeft className="mr-1 h-4 w-4" />
      Back to {from ? formatSourceName(from) : "Dashboard"}
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
