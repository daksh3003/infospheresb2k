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
  fileType?: string; // Optional: File type (editable, scanned, mixed)
  fileFormat?: string; // Optional: File format (indesign, ms_excel, etc.)
  customFileFormat?: string; // Optional: Custom format when format is 'others'
  pageCount?: number | null; // Optional: Page count
  showFileMetadata?: boolean; // Optional: Whether to show file metadata
  hideViewButton?: boolean; // Optional: Whether to hide the view button
  disableStatusFetch?: boolean; // Optional: Disable internal status fetching (for lists)
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
  fileType,
  fileFormat,
  customFileFormat,
  pageCount,
  showFileMetadata = false,
  hideViewButton = false,
  disableStatusFetch = false,
}: TaskCardProps) {
  const router = useRouter();
  const [realStatus, setRealStatus] = useState<TaskStatus>(propStatus);
  const [_statusLoading, setStatusLoading] = useState(false);

  // Check if task is due today
  const isDueToday = () => {
    if (!dueDate || dueDate === "null" || dueDate === "undefined") return false;
    try {
      const today = new Date();
      const taskDue = new Date(dueDate);

      // Set both dates to start of day for comparison
      today.setHours(0, 0, 0, 0);
      taskDue.setHours(0, 0, 0, 0);

      return today.getTime() === taskDue.getTime();
    } catch {
      return false;
    }
  };

  const isTaskDueToday = isDueToday();

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

    if (taskId && !disableStatusFetch) {
      fetchRealStatus();
    }
  }, [taskId, propStatus, disableStatusFetch]);

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
    pending: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800",
    "in-progress": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    overdue: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
    returned: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    paused: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
  };

  const priorityColor = {
    low: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    critical: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
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

  const formatFileFormat = (format: string | undefined, custom: string | undefined) => {
    if (!format) return null;

    const formatMap: { [key: string]: string } = {
      'indesign': 'InDesign',
      'ms_excel': 'MS Excel',
      'ms_word': 'MS Word',
      'photoshop': 'Photoshop',
      'powerpoint': 'PowerPoint',
      'illustrator': 'Illustrator',
      'others': custom || 'Others'
    };

    return formatMap[format] || format;
  };

  return (
    <div
      className="w-full border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-150 cursor-pointer"
      onClick={handleViewDetails}
    >
      <div className="px-6 py-4">
        <div className="grid grid-cols-9 gap-4 items-center">
          {/* Left side - Title and Description */}
          <div className="col-span-2 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-0.5">
              {title}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {description}
            </p>
          </div>

          {/* Page Count Column */}
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold border-gray-200 dark:border-gray-700 rounded-full">
              {pageCount !== null && pageCount !== undefined ? pageCount : '-'}
            </Badge>
          </div>

          {/* File Type Column */}
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold capitalize border-gray-200 dark:border-gray-700 rounded-full">
              {fileType || '-'}
            </Badge>
          </div>

          {/* File Format Column */}
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold border-gray-200 dark:border-gray-700 rounded-full">
              {formatFileFormat(fileFormat, customFileFormat) || '-'}
            </Badge>
          </div>

          {/* Currently Working On (Col 6-7) */}
          <div className="col-span-2 flex items-center justify-center text-gray-600 dark:text-gray-400">
            {currentWorkers && currentWorkers.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {currentWorkers.slice(0, 3).map((worker, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900 flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-sm"
                        title={worker.email || worker.name}
                      >
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-200">
                          {worker.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    ))}
                    {currentWorkers.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-2 ring-white dark:ring-gray-800 shadow-sm">
                        <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">
                          +{currentWorkers.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                  {currentWorkers.length === 1 && (
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[100px]">
                      {currentWorkers[0].name}
                    </span>
                  )}
                  {currentWorkers.length > 1 && (
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                      {currentWorkers.length} Assigned
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 italic">
                Unassigned
              </span>
            )}
          </div>

          {/* Status Column (Col 8) */}
          <div className="flex items-center justify-center">
            <Badge
              variant="outline"
              className={`px-3 py-0.5 text-[9px] font-bold w-[100px] justify-center rounded-full uppercase tracking-wider border transition-colors ${statusColor[status] ||
                "bg-slate-100 text-slate-800"
                }`}
            >
              {status === 'completed' ? 'Completed' : status}
            </Badge>
          </div>

          {/* Action Column (Col 9) - Placeholder to maintain grid */}
          <div className="flex items-center justify-center">
          </div>
        </div>
      </div>
    </div>
  );
}
