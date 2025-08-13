"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Clock,
  Calendar,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  AlertTriangle,
  Send,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

type TaskStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "overdue"
  | "returned";
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
  onSendToQC?: (taskIterationId: string) => void;
  isActionableByPM?: boolean;
  isLoadingAction?: boolean; // Optional: For individual card action loading state
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
  onClick,
  onSendToQC,
  isActionableByPM,
  isLoadingAction, // Optional
}: TaskCardProps) {
  const router = useRouter();

  const statusIcon = {
    pending: <CircleDashed className="h-4 w-4" />,
    "in-progress": <Clock className="h-4 w-4" />,
    completed: <CheckCircle2 className="h-4 w-4" />,
    overdue: <AlertCircle className="h-4 w-4 text-red-600" />,
    returned: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
  };

  const statusColor = {
    pending: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    "in-progress":
      "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100",
    completed:
      "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100",
    overdue: "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100",
    returned:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-50",
  };

  const priorityColor = {
    low: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    medium:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-50",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-orange-50",
    critical: "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100",
  };

  const handleViewDetails = () => {
    if (onClick) {
      onClick();
    } else {
      // To get the current path of the Dashboard.
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split("/");

      // If we're in a specific dashboard (pm, qc, qa)
      if (pathParts[2]) {
        router.push(`/tasks/${id}?source=${pathParts[2]}`);
      } else {
        // If we're in the main dashboard , hardcode the source to global.
        router.push(`/tasks/${id}?source=global`);
      }
    }
  };

  const handleSendToQCClick = () => {
    if (onSendToQC && !isLoadingAction) {
      // Check isLoadingAction here
      onSendToQC(id);
    }
  };

  return (
    <div className="w-full border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Title and Description */}
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
              {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {description}
            </p>
          </div>

          {/* Center - Due Date */}
          <div className="flex items-center text-gray-600 dark:text-gray-400 min-w-[120px]">
            <Calendar className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
            <span className="text-xs">
              {dueDate && dueDate !== "null" && dueDate !== "undefined"
                ? (() => {
                    try {
                      const date = new Date(dueDate);
                      if (isNaN(date.getTime())) {
                        return "No due date";
                      }
                      return date.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                    } catch (error) {
                      return "No due date";
                    }
                  })()
                : "No due date"}
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center min-w-[100px] justify-center">
            <Badge
              className={`${
                statusColor[status] || statusColor["pending"]
              } px-2 py-1 text-xs font-medium`}
              variant="outline"
            >
              <span className="flex items-center">
                {statusIcon[status] || statusIcon["pending"]}
                <span className="ml-1 capitalize">{status}</span>
              </span>
            </Badge>
          </div>

          {/* Priority Badge */}
          <div className="flex items-center min-w-[80px] justify-center">
            <Badge
              className={`${
                priorityColor[priority] || priorityColor["medium"]
              } px-2 py-1 text-xs font-medium`}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Badge>
          </div>

          {/* Assignment */}
          {assignedTo && (
            <div className="flex items-center min-w-[120px] justify-center">
              <div className="flex items-center">
                {assignedAvatar ? (
                  <img
                    src={assignedAvatar}
                    alt={assignedTo.substring(0, 15)}
                    className="w-5 h-5 rounded-full mr-2 border border-gray-200 dark:border-gray-600"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-medium mr-2">
                    {assignedTo.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[80px]">
                  {assignedTo}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2 min-w-[140px] justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-gray-700"
              onClick={handleViewDetails}
            >
              <ArrowRight className="h-3 w-3 mr-1" />
              <span className="text-xs">View</span>
            </Button>

            {isActionableByPM && onSendToQC && (
              <Button
                variant="default"
                size="sm"
                className="h-7 px-2 bg-green-500 hover:bg-green-600 text-white text-xs"
                onClick={handleSendToQCClick}
                disabled={isLoadingAction}
              >
                {isLoadingAction ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Send className="h-3 w-3 mr-1" />
                )}
                {isLoadingAction ? "..." : "QC"}
              </Button>
            )}
          </div>

          {/* Task ID */}
          <div className="text-xs text-gray-400 dark:text-gray-500 font-mono min-w-[80px] text-right">
            {id}
          </div>
        </div>
      </div>
    </div>
  );
}
