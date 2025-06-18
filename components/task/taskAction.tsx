import { Pause, Play } from "lucide-react";

export const getPauseResumeButton = (status: string, handlePauseResumeTask: () => void) => {
    if (status === "in-progress") {
      return (
        <button
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          onClick={handlePauseResumeTask}
        >
          <Pause className="h-4 w-4" /> Pause
        </button>
      );
    } else if (status === "paused") {
      return (
        <button
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          onClick={handlePauseResumeTask}
        >
          <Play className="h-4 w-4" /> Resume
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