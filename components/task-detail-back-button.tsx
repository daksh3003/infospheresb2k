// components/task-detail-back-button.tsx
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/router";

export function TaskDetailBackButton() {
  const router = useRouter();
  const { from } = router.query;
  
  const handleBackClick = () => {
    if (from && typeof from === 'string') {
      // Navigate back to the source dashboard/page
      router.push(from);
    } else {
      // Fallback to default dashboard if no source is available
      router.push('/dashboard');
    }
  };

  return (
    <Button 
      variant="ghost" 
      className="flex items-center text-gray-600 hover:text-gray-900" 
      onClick={handleBackClick}
    >
      <ChevronLeft className="mr-1 h-4 w-4" />
      Back to {from ? formatSourceName(from as string) : 'Dashboard'}
    </Button>
  );
}

// Helper function to format the source path into a readable name
function formatSourceName(path: string): string {
  // Remove leading slash and split by '/'
  const segments = path.replace(/^\//, '').split('/');
  
  // Handle different dashboard types
  if (segments[0] === 'dashboard') {
    if (segments.length > 1) {
      // For specific dashboards like "dashboard/pm"
      return `${segments[1].toUpperCase()} Dashboard`;
    }
    return 'Dashboard';
  }
  
  // For other sources, capitalize first letter
  return segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
}