import { Calendar, Clock } from "lucide-react";
import React from "react";
import { getPriorityBadge } from "./task/priority";
import { getStatusBadge } from "./task/status";
import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useEffect } from "react";

export const MainTaskCard = ({
  task,
  status,
  progress,
  onAssignTask,
}: {
  task: any;
  status: string;
  progress: number;
  onAssignTask: () => void;
}) => {
  const [assignedTo, setAssignedTo] = useState<any[]>([]);

  const fetchAssignedTo = async () => {
    const { data, error } = await supabase
      .from("process_logs_test")
      .select("assigned_to")
      .eq("project_id", task.id);
    if (error) {
      console.error("Error fetching assigned to:", error);
      return;
    }
    if (data && data.length > 0) {
      console.log("assigned to: ", data[0].assigned_to);
      setAssignedTo(data[0].assigned_to);
    }
  };

  useEffect(() => {
    fetchAssignedTo();
  }, [onAssignTask]);

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
              <p className="text-gray-900">{task.mail_instruction}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Assigned To
                </h3>
                <div className="space-y-2">
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
                  <span className="text-gray-900">{task.dueDate}</span>
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
                          const timeStr = task.deliveryTime.substring(11, 16);
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
