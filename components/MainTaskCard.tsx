import { Calendar, Clock, ChevronDown } from "lucide-react";
import React from "react";
import { getPriorityBadge } from "./task/priority";
import { getStatusBadge } from "./task/status";
import { useState } from "react";
import { createClient } from "@/lib/client";
import { useEffect } from "react";
import { getTaskActions } from "@/utils/taskActions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// Updated Task interface to match the one from page.tsx
interface Task {
  // From tasks_test
  task_id: string;
  task_name: string;
  client_instruction: string;
  processor_type: string;
  estimated_hours_ocr: number;
  estimated_hours_qc: number;
  estimated_hours_qa: number;
  completion_status: boolean;
  created_at: string;
  status: string;
  feedback: string;

  // From projects_test
  project_id: string;
  project_name: string;
  po_hours: number;
  mail_instruction: string;
  list_of_files: string[];
  reference_file: string;
  delivery_date: string;
  delivery_time: string;

  // Creator information
  created_by: {
    id: string;
    name: string;
    email: string;
    role: string;
  };

  // Frontend display properties
  title: string; // Maps to task_name
  priority: string; // Maps from processor_type
  dueDate: string; // Maps to delivery_date
  deliveryTime: string; // Maps to delivery_time
  assignedTo: string;
  attachments: string[];
  estimatedHours: number; // Sum of all estimated hours
  overall_completion_status: boolean;
}

export const MainTaskCard = ({
  task,
  status,
  progress,
  onAssignTask: _onAssignTask,
}: {
  task: Task;
  status: string;
  progress: number;
  onAssignTask: (_user: {
    id: string;
    name: string;
    email: string;
    role: string;
  }) => void;
}) => {
  const [assignedTo, setAssignedTo] = useState<
    {
      user_id: string;
      name: string;
      email: string;
      role: string;
      action_type: string;
    }[]
  >([]);
  const [realStatus, setRealStatus] = useState<string>(status);
  const [statusLoading, _setStatusLoading] = useState(false);

  const supabase = createClient();

  const fetchAssignedTo = async () => {
    try {
      // Fetch from task_actions table for 'taken_by' and 'assigned_to' actions
      const actionsResult = await getTaskActions({
        task_id: task.task_id,
        action_type: ["taken_by", "assigned_to"],
      });

      let taskActionsUsers: {
        user_id: string;
        name: string;
        email: string;
        role: string;
        action_type: string;
        assigned_at: string;
        stage: string;
        source: string;
      }[] = [];

      if (actionsResult.success && actionsResult.data) {
        // Process task actions to get assigned users
        taskActionsUsers = actionsResult.data.map(
          (action: {
            user_id: string;
            action_type: string;
            created_at: string;
            metadata?: {
              user_name?: string;
              user_email?: string;
              user_role?: string;
              stage?: string;
            };
          }) => ({
            user_id: action.user_id,
            name: action.metadata?.user_name || action.user_id,
            email: action.metadata?.user_email || "",
            role: action.metadata?.user_role || "",
            action_type: action.action_type,
            assigned_at: action.created_at,
            stage: action.metadata?.stage || "",
            source: "task_actions",
          })
        );
      }

      // Fetch from files_test table
      const { data: filesData, error: filesError } = await supabase
        .from("files_test")
        .select("taken_by, assigned_to, created_at")
        .eq("task_id", task.task_id);

      const filesUsers: {
        user_id: string;
        name: string;
        email: string;
        role: string;
        action_type: string;
        assigned_at: string;
        stage: string;
        source: string;
      }[] = [];

      if (!filesError && filesData) {
        // Process files_test data
        filesData.forEach(
          (file: {
            taken_by?: string;
            assigned_to?: {
              user_id?: string;
              id?: string;
              name?: string;
              email?: string;
              role?: string;
              assigned_at?: string;
            }[];
            created_at: string;
          }) => {
            // Process taken_by field
            if (file.taken_by) {
              filesUsers.push({
                user_id: file.taken_by,
                name: file.taken_by, // This might need to be resolved to actual name
                email: "",
                role: "",
                action_type: "taken_by",
                assigned_at: file.created_at,
                stage: "",
                source: "files_test",
              });
            }

            // Process assigned_to array
            if (file.assigned_to && Array.isArray(file.assigned_to)) {
              file.assigned_to.forEach(
                (assignment: {
                  user_id?: string;
                  id?: string;
                  name?: string;
                  email?: string;
                  role?: string;
                  assigned_at?: string;
                }) => {
                  if (assignment && typeof assignment === "object") {
                    filesUsers.push({
                      user_id: assignment.user_id || assignment.id || "unknown",
                      name:
                        assignment.name ||
                        assignment.user_id ||
                        assignment.id ||
                        "unknown",
                      email: assignment.email || "",
                      role: assignment.role || "",
                      action_type: "assigned_to",
                      assigned_at: assignment.assigned_at || file.created_at,
                      stage: "",
                      source: "files_test",
                    });
                  }
                }
              );
            }
          }
        );
      }

      // Combine both sources
      const allUsers = [...taskActionsUsers, ...filesUsers];

      // Remove duplicates based on user_id and keep the latest action
      const uniqueAssignedUsers = allUsers.reduce(
        (
          acc: {
            user_id: string;
            name: string;
            email: string;
            role: string;
            action_type: string;
            assigned_at: string;
            stage: string;
            source: string;
          }[],
          current: {
            user_id: string;
            name: string;
            email: string;
            role: string;
            action_type: string;
            assigned_at: string;
            stage: string;
            source: string;
          }
        ) => {
          const existingIndex = acc.findIndex(
            (user) => user.user_id === current.user_id
          );
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Keep the latest assignment
            if (
              new Date(current.assigned_at) >
              new Date(acc[existingIndex].assigned_at)
            ) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        },
        []
      );

      // Resolve user names for user_ids that don't have names
      const usersWithResolvedNames = await Promise.all(
        uniqueAssignedUsers.map(async (user) => {
          if (!user.name || user.name === user.user_id) {
            try {
              const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("name, email, role")
                .eq("id", user.user_id)
                .single();

              if (!profileError && profileData) {
                return {
                  ...user,
                  name: profileData.name || user.name,
                  email: profileData.email || user.email,
                  role: profileData.role || user.role,
                };
              }
            } catch (error) {
              console.warn(
                `Failed to fetch profile for user ${user.user_id}:`,
                error
              );
            }
          }
          return user;
        })
      );

      setAssignedTo(usersWithResolvedNames);
    } catch (error) {
      console.error("Error fetching assigned to:", error);
      setAssignedTo([]);
    }
  };

  useEffect(() => {
    fetchAssignedTo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.task_id]);

  // Sync realStatus with status prop when it changes
  useEffect(() => {
    setRealStatus(status);
  }, [status]);

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Format time helper
  const formatTime = (timeString: string) => {
    if (!timeString) return "Not set";
    try {
      let timeStr;
      // Handle different time formats
      if (timeString.includes("T")) {
        // Full datetime format (2023-01-01T14:30:00)
        timeStr = timeString.substring(11, 16);
      } else if (timeString.includes(":")) {
        // Time only format (14:30:00 or 14:30)
        timeStr = timeString.substring(0, 5);
      } else {
        return timeString;
      }

      const [hours, minutes] = timeStr.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  return (
    <>
      <div className="p-6 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {task.task_name || task.title}
            </h1>
            <p className="mt-1 text-gray-500">Project: {task.project_name}</p>
            <p className="mt-1 text-gray-500">
              Created on {formatDate(task.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {statusLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            ) : (
              getStatusBadge(realStatus)
            )}
            {getPriorityBadge(task.priority || task.processor_type || "normal")}
          </div>
        </div>
      </div>

      <div className="p-6 pb-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">Progress</span>
            <span className="text-sm font-medium text-gray-900">
              {progress}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Client Instructions
              </h3>
              <p className="text-gray-900">
                {task.client_instruction || "No client instructions provided"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Mail Instructions
              </h3>
              <p className="text-gray-900">
                {task.mail_instruction || "No mail instructions provided"}
              </p>
            </div>

            {/* <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Processor Type
              </h3>
              <p className="text-gray-900">
                {task.processor_type || "Not specified"}
              </p>
            </div> */}

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                PO Hours
              </h3>
              <p className="text-gray-900">{task.po_hours || 0} hours</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Assigned To
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex -space-x-2">
                        {assignedTo.slice(0, 3).map((user, index) => (
                          <div
                            key={index}
                            className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ring-2 ring-white"
                          >
                            <span className="text-xs text-gray-600">
                              {user.name?.charAt(0) || "?"}
                            </span>
                          </div>
                        ))}
                      </div>
                      {assignedTo.length > 3 && (
                        <span className="text-sm text-gray-600">
                          +{assignedTo.length - 3}
                        </span>
                      )}
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="py-2 px-3 space-y-2">
                      {assignedTo.length === 0 ? (
                        <div className="text-sm text-gray-500">
                          No assignments yet
                        </div>
                      ) : (
                        assignedTo.map((user, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                              <span className="text-xs text-gray-600">
                                {user.name?.charAt(0) || "?"}
                              </span>
                            </div>
                            <span className="text-gray-900">{user.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Created By
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-600">
                      {task.created_by?.name?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-900">
                      {task.created_by?.name || "Unknown"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {task.created_by?.role || ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Est. Hours (OCR)
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">
                    {task.estimated_hours_ocr || 0}h
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Est. Hours (QC)
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">
                    {task.estimated_hours_qc || 0}h
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Est. Hours (QA)
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">
                    {task.estimated_hours_qa || 0}h
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Due Date
                </h3>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">
                    {formatDate(task.delivery_date || task.dueDate)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Due Time
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">
                    {formatTime(task.delivery_time || task.deliveryTime)}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Total Est. Hours
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">
                    {task.estimatedHours ||
                      (task.estimated_hours_ocr || 0) +
                        (task.estimated_hours_qc || 0) +
                        (task.estimated_hours_qa || 0)}
                    h
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Task Status
                </h3>
                <p className="text-gray-900">
                  {task.completion_status ? "Completed" : "In Progress"}
                </p>
              </div> */}

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Overall Status
                </h3>
                <p className="text-gray-900">
                  {task.overall_completion_status ? "Completed" : "Pending"}
                </p>
              </div>
            </div>

            {task.reference_file && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Reference File
                </h3>
                <p className="text-gray-900">{task.reference_file}</p>
              </div>
            )}

            {task.feedback && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Feedback
                </h3>
                <p className="text-gray-900">{task.feedback}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
