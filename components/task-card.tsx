"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Pause,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

type TaskStatus =
  | "pending"
  | "in-progress"
  | "paused"
  | "completed"
  | "overdue"
  | "returned";
type TaskPriority = "low" | "medium" | "high" | "critical";

interface TaskCardProps {
  taskId: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime?: string;
  status: TaskStatus;
  priority: TaskPriority;
  onClick?: () => void;
  onSendToQC?: (taskIterationId: string) => void;
  isActionableByPM?: boolean;
  isLoadingAction?: boolean; // Optional: For individual card action loading state
  currentWorkers?: {
    name: string;
    email?: string;
  }[]; // Optional: All users currently working on the task
}

export function TaskCard({
  taskId,
  title,
  description,
  dueDate,
  dueTime,
  status: propStatus,
  priority,
  onClick,
  onSendToQC,
  isActionableByPM,
  isLoadingAction, // Optional
  currentWorkers, // Optional
}: TaskCardProps) {
  const router = useRouter();
  const [realStatus, setRealStatus] = useState<TaskStatus>(propStatus);
  const [_statusLoading, setStatusLoading] = useState(false);

  // Fetch real status from tasks_test table
  useEffect(() => {


    const fetchRealStatus = async () => {
      try {
        setStatusLoading(true);
        const response = await fetch(`/api/tasks/${taskId}/status`);

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.status) {

            setRealStatus(result.data.status as TaskStatus);
          }
        }
      } catch (error) {
        console.error("Error fetching real status:", error);
        // Keep using prop status on error
      } finally {
        setStatusLoading(false);
      }
    };

    if (taskId) {
      fetchRealStatus();
    }
  }, [taskId, propStatus]);

  // Sync realStatus with propStatus when it changes
  useEffect(() => {
    if (propStatus && propStatus !== realStatus) {

      setRealStatus(propStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propStatus]);

  // Use real status from database, fallback to prop status
  const status = realStatus;

  const statusIcon = {
    pending: <CircleDashed className="h-4 w-4" />,
    "in-progress": <Clock className="h-4 w-4" />,
    completed: <CheckCircle2 className="h-4 w-4" />,
    overdue: <AlertCircle className="h-4 w-4 text-red-600" />,
    returned: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
    paused: <Pause className="h-4 w-4" />,
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
    paused:
      "bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100",
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
        router.push(`/tasks/${taskId}?source=${pathParts[2]}`);
      } else {
        // If we're in the main dashboard , hardcode the source to global.
        router.push(`/tasks/${taskId}?source=global`);
      }
    }
  };

  const handleSendToQCClick = () => {
    if (onSendToQC && !isLoadingAction) {
      // Check isLoadingAction here
      onSendToQC(taskId);
    }
  };

  return (
    <div className="w-full border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
      <div className="px-6 py-4">
        <div className="grid grid-cols-6 gap-4 items-center">
          {/* Left side - Title and Description */}
          <div className="col-span-2 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
              {title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {description}
            </p>
          </div>

          {/* Due Date */}
          <div className="flex items-center justify-center text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
            <div className="flex flex-col items-center">
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
                    } catch {
                      return "No due date";
                    }
                  })()
                  : "No due date"}
              </span>
              {dueTime && dueTime !== "null" && dueTime !== "undefined" && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {dueTime}
                </span>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <Badge
              className={`${statusColor[status] || statusColor["pending"]
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
          <div className="flex items-center justify-center">
            <Badge
              className={`${priorityColor[priority] || priorityColor["medium"]
                } px-2 py-1 text-xs font-medium`}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Badge>
          </div>

          {/* Currently Working On */}
          <div className="flex items-center justify-center text-gray-600 dark:text-gray-400">
            {currentWorkers && currentWorkers.length > 0 ? (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <div className="flex items-center gap-1">
                  {/* Show avatar circles for up to 3 members */}
                  <div className="flex -space-x-2">
                    {currentWorkers.slice(0, 3).map((worker, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900 flex items-center justify-center ring-2 ring-white dark:ring-gray-800"
                        title={worker.email || worker.name}
                      >
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-200">
                          {worker.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Show count if more than 3 members */}
                  {currentWorkers.length > 3 && (
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">
                      +{currentWorkers.length - 3}
                    </span>
                  )}
                  {/* Show first name for single member, or count for multiple */}
                  {currentWorkers.length === 1 && (
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100 ml-1">
                      {currentWorkers[0].name}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                Unassigned
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-center space-x-2">
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
        </div>
      </div>
    </div>
  );
}
