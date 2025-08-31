import React, { useState, useEffect } from "react";
import { getPauseResumeButton } from "./task/taskAction";
import {
  CheckCircle2,
  Play,
  Share2,
  ChevronDown,
  UserPlus,
  Clock,
  CircleDashed,
  AlertCircle,
  AlertTriangle,
  Pause,
  RefreshCw,
} from "lucide-react";
import { ArrowBigUpDashIcon } from "lucide-react";
import { api } from "@/utils/api";
import { supabase } from "@/utils/supabase";
import { logTaskAction, getTaskActions } from "@/utils/taskActions";
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
  onStatusUpdate,
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
  onStatusUpdate?: () => void;
}) => {
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [assignedTo, setAssignedTo] = useState<any[]>([]);
  const [showPickupDialog, setShowPickupDialog] = useState(false);
  const [isPickingUp, setIsPickingUp] = useState(false);
  const [hasAssignedUsers, setHasAssignedUsers] = useState(false);
  const [realStatus, setRealStatus] = useState<string>(status);
  const [statusLoading, setStatusLoading] = useState(false);

  // Status configuration
  const statusConfig = {
    pending: {
      icon: <CircleDashed className="h-4 w-4" />,
      color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      label: "Pending",
    },
    "in-progress": {
      icon: <Clock className="h-4 w-4" />,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100",
      label: "In Progress",
    },
    completed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color:
        "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100",
      label: "Completed",
    },
    overdue: {
      icon: <AlertCircle className="h-4 w-4 text-red-600" />,
      color: "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100",
      label: "Overdue",
    },
    returned: {
      icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-50",
      label: "Returned",
    },
    paused: {
      icon: <Pause className="h-4 w-4" />,
      color:
        "bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100",
      label: "Paused",
    },
  };

  // const fetchRealStatus = async () => {
  //   try {
  //     setStatusLoading(true);
  //     const response = await fetch(`/api/tasks/${taskId}/status`);

  //     if (response.ok) {
  //       const result = await response.json();
  //       if (result.success && result.data?.status) {
  //         console.log("Fetched real status:", result.data.status);
  //         setRealStatus(result.data.status);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error fetching real status:", error);
  //     // Keep using prop status on error
  //   } finally {
  //     setStatusLoading(false);
  //   }
  // };

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
      // Get task actions with filter for 'taken_by' and 'assigned_to' actions
      const actionsResult = await getTaskActions({
        task_id: taskId,
        action_type: ["taken_by", "assigned_to"],
      });

      if (!actionsResult.success || !actionsResult.data) {
        console.error("Failed to fetch task actions:", actionsResult.error);
        setAssignedTo([]);
        setHasAssignedUsers(false);
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
        stage: action.metadata?.stage || currentStage,
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
      setHasAssignedUsers(uniqueAssignedUsers.length > 0);
    } catch (error) {
      console.error("Error fetching assigned to:", error);
      setAssignedTo([]);
      setHasAssignedUsers(false);
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
      // Log the taken_by action
      const actionResult = await logTaskAction({
        user_id: currentUser.id,
        task_id: taskId,
        action_type: "taken_by",
        metadata: {
          stage: currentStage,
          user_name: currentUser.name || currentUser.email,
          user_role: currentUser.role,
          assigned_by: sentBy,
          pickup_timestamp: new Date().toISOString(),
        },
      });

      if (!actionResult.success) {
        console.error("Failed to log taken_by action:", actionResult.error);
        toast.warning("Task picked up but action logging failed");
      }

      await api.pickupTask(taskId, currentUser);
      toast.success("Task picked up successfully!");
      setShowPickupDialog(false);
      await fetchAssignedTo(); // Refresh the assigned users
      // await fetchRealStatus(); // Refresh the status display
      onStatusUpdate?.(); // Notify parent component to refresh status
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
    // fetchRealStatus();
  }, [currentStage, taskId]);

  // Sync realStatus with status prop when it changes
  useEffect(() => {
    if (status && status !== realStatus) {
      console.log(
        `FooterButtons: Status updated from ${realStatus} to ${status}`
      );
      setRealStatus(status);
    }
  }, [status]);

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

          {realStatus === "pending" && (
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={async () => {
                await handleStartTask();
                // await fetchRealStatus(); // Refresh local status
                onStatusUpdate?.(); // Notify parent component
              }}
            >
              <Play className="h-4 w-4" /> Start Task
            </button>
          )}
          {getPauseResumeButton(realStatus, async () => {
            await handlePauseResumeTask();
            // await fetchRealStatus(); // Refresh local status
            onStatusUpdate?.(); // Notify parent component
          })}

          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            onClick={() => setShowHandoverDialog(true)}
          >
            <Share2 className="h-4 w-4" /> Handover
          </button>

          {realStatus !== "completed" && (
            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => setShowCompleteDialog(true)}
            >
              <CheckCircle2 className="h-4 w-4" /> Mark Complete
            </button>
          )}
          {showSubmitToButton && realStatus === "completed" && (
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
