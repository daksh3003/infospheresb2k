import React, { useState } from "react";
import { getPauseResumeButton } from "./task/taskAction";
import { CheckCircle2, Play, Share2 } from "lucide-react";
import { ArrowBigUpDashIcon } from "lucide-react";

export const FooterButtons = ({
  currentUser,
  selectedUserId,
  setSelectedUserId,
  availableUsers,
  handleAssignTask,
  isAssigning,
  handleStartTask,
  handlePauseResumeTask,
  handleSendTo,
  showSubmitToButton,
  setShowHandoverDialog,
  setShowCompleteDialog,
  status,
  SubmitTo,
}: {
  currentUser: any;
  selectedUserId: string;
  setSelectedUserId: (value: string) => void;
  availableUsers: any[];
  handleAssignTask: () => void;
  isAssigning: boolean;
  handleStartTask: () => void;
  handlePauseResumeTask: () => void;
  handleSendTo: () => void;
  showSubmitToButton: boolean;
  setShowHandoverDialog: (value: boolean) => void;
  setShowCompleteDialog: (value: boolean) => void;
  status: string;
  SubmitTo: string;
}) => {
  return (
    <>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          {currentUser?.role === "projectManager" && (
            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Select user to assign</option>
                {availableUsers.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                onClick={handleAssignTask}
                disabled={isAssigning || !selectedUserId}
              >
                {isAssigning ? "Assigning..." : "Assign Task"}
              </button>
            </div>
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
    </>
  );
};
