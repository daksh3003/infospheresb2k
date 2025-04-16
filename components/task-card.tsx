// components/task-card.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Clock, 
  Calendar, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  CircleDashed 
} from "lucide-react";
import { useRouter } from "next/navigation"; // Import the router

type TaskStatus = "pending" | "in-progress" | "completed" | "overdue";
type TaskPriority = "low" | "medium" | "high" | "critical";

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  assignedAvatar?: string;
  onClick?: () => void;
}

export function TaskCard({
  id,
  title,
  description,
  dueDate,
  status,
  priority,
  assignedTo,
  assignedAvatar,
  onClick
}: TaskCardProps) {
  const router = useRouter(); // Initialize the router

  // Status icon mapping
  const statusIcon = {
    "pending": <CircleDashed className="h-4 w-4" />,
    "in-progress": <Clock className="h-4 w-4" />,
    "completed": <CheckCircle2 className="h-4 w-4" />,
    "overdue": <AlertCircle className="h-4 w-4" />
  };

  // Status color mapping
  const statusColor = {
    "pending": "bg-gray-100 text-gray-800",
    "in-progress": "bg-blue-100 text-blue-800",
    "completed": "bg-green-100 text-green-800",
    "overdue": "bg-red-100 text-red-800"
  };

  // Priority color mapping
  const priorityColor = {
    "low": "bg-gray-100 text-gray-800",
    "medium": "bg-yellow-100 text-yellow-800",
    "high": "bg-orange-100 text-orange-800",
    "critical": "bg-red-100 text-red-800"
  };

  // Handle view details click - navigate to task detail page
  const handleViewDetails = () => {
    if (onClick) {
      // Use custom onClick handler if provided
      onClick();
    } else {
      // Otherwise use default routing
      router.push(`/tasks/${id}`);
    }
  };

  return (
    <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <Badge className={priorityColor[priority]}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
          </Badge>
          <Badge className={statusColor[status]} variant="outline">
            <span className="flex items-center">
              {statusIcon[status]}
              <span className="ml-1 capitalize">{status}</span>
            </span>
          </Badge>
        </div>
        <CardTitle className="mt-2 text-lg">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm pb-2">
        <div className="flex items-center text-gray-500 mb-2">
          <Calendar className="h-4 w-4 mr-2" />
          <span>Due: {new Date(dueDate).toLocaleDateString()}</span>
        </div>
        {assignedTo && (
          <div className="flex items-center justify-between mt-3">
            <span className="text-gray-500 text-sm">Assigned to:</span>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-blue-800 text-white flex items-center justify-center text-xs mr-2 overflow-hidden">
                {assignedAvatar ? (
                  <img src={assignedAvatar} alt={assignedTo} className="w-full h-full object-cover" />
                ) : (
                  assignedTo.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-sm font-medium">{assignedTo}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="ghost" 
          className="w-full justify-between text-blue-800 hover:text-blue-900 hover:bg-blue-50"
          onClick={handleViewDetails}
        >
          <span>View Details</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}