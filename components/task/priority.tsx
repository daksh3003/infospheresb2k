import React from "react";

export const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full border border-red-200 text-red-700">
          High Priority
        </span>
      );
    case "medium":
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full border border-amber-200 text-amber-700">
          Medium Priority
        </span>
      );
    default:
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full border border-green-200 text-green-700">
          Low Priority
        </span>
      );
  }
};
