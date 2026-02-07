import { Pause, Play } from "lucide-react";

export const getPauseResumeButton = (status: string, handlePauseResumeTask: () => void, isLoading: boolean = false) => {
  if (status === "in-progress") {
    return (
      <button
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        onClick={handlePauseResumeTask}
        disabled={isLoading}
      >
        <Pause className="h-4 w-4" /> {isLoading ? "Pausing..." : "Pause"}
      </button>
    );
  } else if (status === "paused") {
    return (
      <button
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        onClick={handlePauseResumeTask}
        disabled={isLoading}
      >
        <Play className="h-4 w-4" /> {isLoading ? "Resuming..." : "Resume"}
      </button>
    );
  }
  return (
    <button
      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md opacity-50 cursor-not-allowed"
      disabled
    >
      <Pause className="h-4 w-4" /> Pause
    </button>
  );
};