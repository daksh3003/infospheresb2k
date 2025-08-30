import { Calendar, Clock, ChevronDown } from "lucide-react";
import React from "react";
import { getPriorityBadge } from "./task/priority";
import { getStatusBadge } from "./task/status";
import { useState } from "react";
import { api } from "@/utils/api";
import { supabase } from "@/utils/supabase";
import { useEffect } from "react";
import { getTaskActions } from "@/utils/taskActions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const MainTaskCard = ({
  task,
  status,
  progress,
  onAssignTask,
}: {
  task: any;
  status: string;
  progress: number;
  onAssignTask: (user: any) => void;
}) => {
  const [assignedTo, setAssignedTo] = useState<any[]>([]);

  const fetchAssignedTo = async () => {
    try {
      // Get task actions with filter for 'taken_by' and 'assigned_to' actions
      const actionsResult = await getTaskActions({
        task_id: task.task_id,
        action_type: ["taken_by", "assigned_to"],
      });

      if (!actionsResult.success || !actionsResult.data) {
        console.error("Failed to fetch task actions:", actionsResult.error);
        setAssignedTo([]);
        return;
      }

      // Process the task actions to get assigned users
      const assignedUsers = actionsResult.data.map((action: any) => ({
        user_id: action.user_id,
        name: action.metadata?.user_name || action.user_id,
        email: action.metadata?.user_email || "",
        role: action.metadata?.user_role || "",
        action_type: action.action_type,
        assigned_at: action.created_at,
        stage: action.metadata?.stage || action.metadata?.current_stage,
      }));

      // Remove duplicates based on user_id and keep the latest action
      const uniqueAssignedUsers = assignedUsers.reduce(
        (acc: any[], current: any) => {
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

      setAssignedTo(uniqueAssignedUsers);
    } catch (error) {
      console.error("Error fetching assigned to:", error);
      setAssignedTo([]);
    }
  };

  useEffect(() => {
    fetchAssignedTo();
  }, [task.task_id]);

  return (
    <>
      <div className="p-6 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <p className="mt-1 text-gray-500">Created on {task.createdDate}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(status)}
            {getPriorityBadge(task.priority)}
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
              <p className="text-gray-900">{task.client_instruction}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Mail Instructions
              </h3>
              <p className="text-gray-900">
                {task.mail_instruction || "No mail instructions provided"}
              </p>
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
                      {assignedTo.map((user, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                            <span className="text-xs text-gray-600">
                              {user.name?.charAt(0) || "?"}
                            </span>
                          </div>
                          <span className="text-gray-900">{user.name}</span>
                        </div>
                      ))}
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
                      {task.createdBy?.name?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-900">
                      {task.createdBy?.name || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Est. Hours (QC)
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">
                    {task.estimated_hours_qc} hours
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
                    {task.estimated_hours_qa} hours
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Est. Hours (OCR)
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900">
                    {task.estimated_hours_ocr} hours
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
                    {task.dueDate 
                      ? (() => {
                          try {
                            const date = new Date(task.dueDate);
                            return date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            });
                          } catch (error) {
                            return task.dueDate;
                          }
                        })()
                      : "Not set"
                    }
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
                    {task.deliveryTime
                      ? (() => {
                          let timeStr;
                          // Handle different time formats
                          if (task.deliveryTime.includes('T')) {
                            // Full datetime format (2023-01-01T14:30:00)
                            timeStr = task.deliveryTime.substring(11, 16);
                          } else if (task.deliveryTime.includes(':')) {
                            // Time only format (14:30:00 or 14:30)
                            timeStr = task.deliveryTime.substring(0, 5);
                          } else {
                            return task.deliveryTime;
                          }
                          
                          const [hours, minutes] = timeStr.split(":");
                          const hour = parseInt(hours);
                          const ampm = hour >= 12 ? "PM" : "AM";
                          const displayHour =
                            hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                          return `${displayHour}:${minutes} ${ampm}`;
                        })()
                      : "Not set"}
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
                    {task.estimatedHours || 0} hours
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
