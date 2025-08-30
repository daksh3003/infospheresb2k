import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { authManager } from "@/utils/auth";

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  user_id: string;
  task_id: string;
  user_name?: string;
  user_email?: string;
}

export const Comments = ({
  taskId,
}: {
  taskId: string;
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchComments();
    getCurrentUser();
  }, [taskId]);

  const getCurrentUser = async () => {
    try {
      // First try to get from authManager
      let user = await authManager.getCurrentUser();
      
      // If that doesn't work, try to get directly from Supabase auth
      if (!user) {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        if (authUser && !error) {
          // Get additional user info from profiles table
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name, email, role")
            .eq("id", authUser.id)
            .single();
          
          user = {
            ...authUser,
            role: profileData?.role || authUser.user_metadata?.role || "user"
          } as any; // Type assertion to handle the dynamic properties
          
          // Add name and email as dynamic properties
          if (user) {
            (user as any).name = profileData?.name || authUser.user_metadata?.name || "Unknown User";
            (user as any).email = authUser.email || profileData?.email || "";
          }
        }
      }
      
      console.log("Current user in Comments:", user);
      setCurrentUser(user);
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?task_id=${taskId}`);
      const result = await response.json();

      if (!response.ok) {
        console.error("Error fetching comments:", result.error);
        return;
      }

      console.log("Comments API Response:", result);
      
      if (result.tableInfo) {
        console.log("Comments table structure:");
        console.log("- Available columns:", result.tableInfo.availableColumns);
        console.log("- Sample data count:", result.tableInfo.sampleCount);
      }

      // For now, use whatever data we get and format it
      const allComments = result.comments || [];
      
      // Format the comments based on available data
      const formattedComments = allComments.map((item: any, index: number) => ({
        id: item.id || `temp-${index}`,
        comment: item.comment || item.text || item.message || "No comment text found",
        created_at: item.created_at || item.timestamp || new Date().toISOString(),
        user_id: item.user_id || item.userId || item.author_id || "unknown",
        task_id: taskId,
        user_name: "Loading...",
        user_email: "",
      }));

      // Fetch user information for each comment
      await fetchUserInformation(formattedComments);

      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchUserInformation = async (comments: any[]) => {
    try {
      // Get unique user IDs from comments
      const userIds = [...new Set(comments.map(comment => comment.user_id).filter(id => id !== "unknown" && id !== "anonymous"))];
      
      if (userIds.length === 0) {
        // If no valid user IDs, set default names
        comments.forEach(comment => {
          comment.user_name = comment.user_id === currentUser?.id ? (currentUser?.name || "You") : "Anonymous";
        });
        return;
      }

      console.log("Fetching user data for user IDs:", userIds);

      // Fetch user data from profiles table
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, name, email, role")
        .in("id", userIds);

      if (usersError) {
        console.error("Error fetching user data:", usersError);
        // Fallback to default names
        comments.forEach(comment => {
          comment.user_name = comment.user_id === currentUser?.id ? (currentUser?.name || "You") : "Team Member";
        });
        return;
      }

      console.log("Fetched user data:", usersData);

      // Map user data to comments
      comments.forEach(comment => {
        if (comment.user_id === currentUser?.id) {
          comment.user_name = currentUser?.name || "You";
          comment.user_email = currentUser?.email || "";
        } else {
          const userData = usersData?.find(user => user.id === comment.user_id);
          if (userData) {
            comment.user_name = userData.name || "Unknown User";
            comment.user_email = userData.email || "";
          } else {
            comment.user_name = "Team Member";
          }
        }
      });

    } catch (error) {
      console.error("Error fetching user information:", error);
      // Fallback to default names
      comments.forEach(comment => {
        comment.user_name = comment.user_id === currentUser?.id ? (currentUser?.name || "You") : "Team Member";
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment.");
      return;
    }

    // Ensure we have current user info
    if (!currentUser) {
      await getCurrentUser();
    }

    const userId = currentUser?.id;
    console.log("Submitting comment with user ID:", userId);
    console.log("Current user object:", currentUser);

    if (!userId) {
      alert("Unable to identify current user. Please refresh the page and try again.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comment: newComment.trim(),
          user_id: userId,
          task_id: taskId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error saving comment:", result);
        
        // Show specific error for RLS
        if (result.error?.includes('row-level security') || result.error?.includes('Database security policy')) {
          alert(`Database Configuration Issue: ${result.error}\n\nTo fix this, you need to either:\n1. Disable Row Level Security on the comments table, or\n2. Create proper RLS policies\n\nPlease contact your database administrator.`);
        } else if (result.suggestion) {
          alert(`Comment save failed: ${result.error}\n\nSuggestion: ${result.suggestion}`);
        } else {
          alert(`Failed to save comment: ${result.error || 'Unknown error'}`);
        }
        return;
      }

      console.log("Comment saved successfully:", result);

      // Clear the input immediately
      setNewComment("");
      
      // Refresh comments from database to get the latest data with proper user information
      setTimeout(() => {
        fetchComments();
      }, 500);
      
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to save comment. Please check the console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  return (
    <>
      <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        <div className="p-6 pb-2">
          <h2 className="text-lg font-medium">Discussion</h2>
          <p className="text-sm text-gray-500">
            Communicate with team members about this task
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No comments yet. Be the first to add a comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-3 p-3 rounded-md bg-gray-50"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-blue-500 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {comment.user_name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-medium">{comment.user_name}</span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{comment.comment}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add comment form */}
          <div className="mt-6">
            <textarea
              className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add a comment..."
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={isLoading}
            />
            <div className="mt-2 flex justify-end">
              <button
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmitComment}
                disabled={isLoading || !newComment.trim()}
              >
                {isLoading ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
