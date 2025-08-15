import React, { useState, useEffect } from "react";
import { getPauseResumeButton } from "./task/taskAction";
import {
  CheckCircle2,
  Play,
  Share2,
  ChevronDown,
  UserPlus,
} from "lucide-react";
import { ArrowBigUpDashIcon } from "lucide-react";
import { api } from "@/utils/api";
import { supabase } from "@/utils/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Dialog from "./Dialog";
import { toast } from "react-toastify";

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
  const [showPickupDialog, setShowPickupDialog] = useState(false);
  const [isPickingUp, setIsPickingUp] = useState(false);
  const [hasAssignedUsers, setHasAssignedUsers] = useState(false);

  const fetchAvailableUsers = async () => {
    try {
      const result = await api.getAvailableUsers(currentStage);
      setAvailableUsers(result.users || []);
    } catch (error) {
      console.error("Error in fetchAvailableUsers:", error);
    }
  };

  const fetchAssignedTo = async () => {
    try {
      const result = await api.getTaskDetails(taskId);
      const assignedUsers = result.assignedTo || [];
      setAssignedTo(assignedUsers);
      setHasAssignedUsers(assignedUsers.length > 0);
    } catch (error) {
      console.error("Error fetching assigned to:", error);
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

  const handlePickupTask = async () => {
    if (!currentUser) {
      toast.error("User not found");
      return;
    }

    setIsPickingUp(true);
    try {
      await api.pickupTask(taskId, currentUser);
      toast.success("Task picked up successfully!");
      setShowPickupDialog(false);
      await fetchAssignedTo(); // Refresh the assigned users
    } catch (error) {
      console.error("Error picking up task:", error);
      toast.error("Failed to pick up task. Please try again.");
    } finally {
      setIsPickingUp(false);
    }
  };

  const canPickupTask = () => {
    if (!currentUser) return false;

    // Check if user's role matches the current stage
    switch (currentStage) {
      case "Processor":
        return currentUser.role === "processor";
      case "QC":
        return currentUser.role === "qcTeam";
      case "QA":
        return currentUser.role === "qaTeam";
      default:
        return false;
    }
  };

  useEffect(() => {
    fetchAvailableUsers();
    fetchAssignedTo();
  }, [currentStage, taskId]);

  return (
    <>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          {currentUser?.role === "projectManager" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="p-5">
                  <ChevronDown className="h-4 w-4" />
                  Select Member to Assign
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-[300px] overflow-y-auto">
                {availableUsers && availableUsers.length > 0 ? (
                  availableUsers.map((user) => (
                    <DropdownMenuItem
                      key={user.id}
                      onClick={() => onAssignTask(user)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-600">
                            {user.name?.charAt(0) ||
                              user.email?.charAt(0) ||
                              "?"}
                          </span>
                        </div>
                        <span>{user.name || user.email}</span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem>
                    No members available for {currentStage}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Pick up task button - shows when no one is assigned and user can pick up */}
          {!hasAssignedUsers && canPickupTask() && (
            <button
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              onClick={() => setShowPickupDialog(true)}
              disabled={isPickingUp}
            >
              <UserPlus className="h-4 w-4" />
              {isPickingUp ? "Picking up..." : "Pick up Task"}
            </button>
          )}

          {status === "pending" && (
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={handleStartTask}
            >
              <Play className="h-4 w-4" /> Start Task
            </button>
          )}
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

      {/* Pick up task confirmation dialog */}
      <Dialog
        isOpen={showPickupDialog}
        onClose={() => setShowPickupDialog(false)}
        title="Pick up this task?"
        description={`Are you sure you want to pick up this task? This will assign the task to you (${
          currentUser?.name || currentUser?.email
        }) and you'll be responsible for completing it.`}
        confirmText="Pick Up Task"
        onConfirm={handlePickupTask}
      />
    </>
  );
};
