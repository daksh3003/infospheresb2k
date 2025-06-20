import React, { useState, useEffect } from "react";
import { getPauseResumeButton } from "./task/taskAction";
import { CheckCircle2, Play, Share2, ChevronDown } from "lucide-react";
import { ArrowBigUpDashIcon } from "lucide-react";
import { supabase } from "@/utils/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export const FooterButtons = ({
  currentUser,
  currentStage,
  sentBy,
  taskId,
  handleStartTask,
  handlePauseResumeTask,
  handleSendTo,
  showSubmitToButton,
  setShowHandoverDialog,
  setShowCompleteDialog,
  status,
  SubmitTo,
  onAssignTask,
}: {
  currentUser: any;
  currentStage: string;
  sentBy: string;
  taskId: string;
  handleStartTask: () => void;
  handlePauseResumeTask: () => void;
  handleSendTo: () => void;
  showSubmitToButton: boolean;
  setShowHandoverDialog: (value: boolean) => void;
  setShowCompleteDialog: (value: boolean) => void;
  status: string;
  SubmitTo: string;
  onAssignTask: (user: any) => void;
}) => {
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [assignedTo, setAssignedTo] = useState<any[]>([]);

  const fetchAvailableUsers = async () => {
    try {
      const { data: users, error } = await supabase
        .from("profiles")
        .select("*");

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      // Filter users based on current stage
      const filteredUsers = users?.filter((user) => {
        switch (currentStage) {
          case "Processor":
            return user.role === "Processor";
          case "QC":
            return user.role === "qcTeam";
          case "QA":
            return user.role === "qaTeam";
          default:
            return true;
        }
      });

      setAvailableUsers(filteredUsers || []);
    } catch (error) {
      console.error("Error in fetchAvailableUsers:", error);
    }
  };

  const fetchAssignedTo = async () => {
    const { data, error } = await supabase
      .from("process_logs_test")
      .select("assigned_to")
      .eq("project_id", taskId);
    if (error) {
      console.error("Error fetching assigned to:", error);
      return;
    }
    if (data && data.length > 0) {
      setAssignedTo(data[0].assigned_to || []);
    }
  };

  // const handleAssignUser = async (user: any) => {
  //   try {
  //     // Check if user is already assigned
  //     const isAlreadyAssigned = assignedTo.some(
  //       (assigned) => assigned.user_id === user.id
  //     );

  //     if (isAlreadyAssigned) {
  //       console.log("User already assigned");
  //       return;
  //     }

  //     const newAssignment = {
  //       user_id: user.id,
  //       name: user.name || user.email,
  //       assigned_at: new Date().toISOString(),
  //     };

  //     const updatedAssignedTo = [...assignedTo, newAssignment];

  //     const { error } = await supabase.from("process_logs_test").up({
  //       current_stage: currentStage,
  //       sent_by: sentBy,
  //       project_id: taskId,
  //       assigned_to: updatedAssignedTo,
  //     });

  //     if (error) throw error;

  //     setAssignedTo(updatedAssignedTo);
  //     // onAssignTask();
  //   } catch (error) {
  //     console.error("Error assigning user:", error);
  //   }
  // };

  useEffect(() => {
    fetchAvailableUsers();
    fetchAssignedTo();
  }, [currentStage]);

  return (
    <>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          {currentUser?.role === "projectManager" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="p-5">
                  <ChevronDown className="h-4 w-4" />
                  Select User to Assign
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                {availableUsers.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => onAssignTask(user)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-600">
                          {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                        </span>
                      </div>
                      <span>{user.name || user.email}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={handleStartTask}
          >
            <Play className="h-4 w-4" /> Start Task
          </button>

          {getPauseResumeButton(status, handlePauseResumeTask)}

          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={() => setShowHandoverDialog(true)}
          >
            <Share2 className="h-4 w-4" /> Handover
          </button>

          {status !== "completed" && (
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => setShowCompleteDialog(true)}
            >
              <CheckCircle2 className="h-4 w-4" /> Mark Complete
            </button>
          )}
          {showSubmitToButton && status === "completed" && (
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => handleSendTo()}
            >
              <ArrowBigUpDashIcon className="h-4 w-4" /> {SubmitTo}
            </button>
          )}
        </div>
      </div>
    </>
  );
};
