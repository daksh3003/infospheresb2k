import React from "react";

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "in-progress":
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
          In Progress
        </span>
      );
    case "paused":
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
          Paused
        </span>
      );
    case "completed":
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Completed
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
          Pending
        </span>
      );
  }
};
