import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  variant?: "page" | "overlay" | "inline" | "minimal";
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  variant = "page",
  message = "Loading...",
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const variants = {
    page: "min-h-screen bg-gray-50 flex items-center justify-center",
    overlay:
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
    inline: "flex items-center justify-center py-8",
    minimal: "flex items-center justify-center",
  };

  return (
    <div className={`${variants[variant]} ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <Loader2
          className={`${sizeClasses[size]} animate-spin text-blue-600`}
        />
        <div className="text-center">
          <p className="text-sm text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
