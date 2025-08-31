import React, { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { authManager } from "@/utils/auth";

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
  task_id: string;
  user_name?: string;
  user_email?: string;
}

export const Comments = ({ taskId }: { taskId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    const initializeData = async () => {
      const user = await getCurrentUser();
      await fetchComments(user);
    };
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const getCurrentUser = async (): Promise<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null> => {
    try {
      // First try to get from authManager
      let user: {
        id: string;
        name: string;
        email: string;
        role: string;
      } | null = (await authManager.getCurrentUser()) as {
        id: string;
        name: string;
        email: string;
        role: string;
      } | null;

      // If that doesn't work, try to get directly from Supabase auth
      if (!user) {
        const {
          data: { user: authUser },
          error,
        } = await supabase.auth.getUser();
        if (authUser && !error) {
          // Get additional user info from profiles table
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name, email, role")
            .eq("id", authUser.id)
            .single();

          user = {
            id: authUser.id,
            name:
              profileData?.name ||
              authUser.user_metadata?.name ||
              "Unknown User",
            email: authUser.email || profileData?.email || "",
            role: profileData?.role || authUser.user_metadata?.role || "user",
          };
        }
      }

      setCurrentUser(user);
      console.log("Setting current user:", user);
      return user;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  };

  const fetchComments = async (
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    } | null
  ) => {
    try {
      console.log("fetchComments called with user:", user);
      const response = await fetch(`/api/comments?task_id=${taskId}`);
      const result = await response.json();

      if (!response.ok) {
        console.error("Error fetching comments:", result.error);
        return;
      }

      // For now, use whatever data we get and format it
      const allComments = result.comments || [];

      // Format the comments based on available data
      const formattedComments = allComments.map(
        (
          item: {
            comment_id?: string;
            id?: string;
            comment?: string;
            text?: string;
            message?: string;
            created_at: string;
            updated_at: string;
            user_id: string;
          },
          index: number
        ) => ({
          id: item.comment_id || item.id || `temp-${index}`,
          comment:
            item.comment ||
            item.text ||
            item.message ||
            "No comment text found",
          created_at: item.created_at,
          updated_at: item.updated_at,
          user_id: item.user_id,
          task_id: taskId,
          user_name: "Loading...",
          user_email: "",
        })
      );

      // Fetch user information for each comment, passing current user
      const validUser = user || currentUser;
      if (validUser) {
        await fetchUserInformation(formattedComments, validUser);
      }

      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchUserInformation = async (
    comments: {
      user_id: string;
      id: string;
      comment: string;
      created_at: string;
      updated_at: string;
      task_id: string;
      user_name: string;
      user_email: string;
    }[],
    user: { id: string; name: string; email: string; role: string }
  ) => {
    try {
      // Get unique user IDs from comments
      const userIds = [
        ...new Set(
          comments
            .map((comment) => comment.user_id)
            .filter((id) => id !== "unknown" && id !== "anonymous")
        ),
      ];

      if (userIds.length === 0) {
        // If no valid user IDs, set default names
        comments.forEach((comment) => {
          comment.user_name =
            comment.user_id === user?.id ? user?.name || "You" : "Anonymous";
        });
        return;
      }

      // Fetch user data from profiles table
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, name, email, role")
        .in("id", userIds);

      if (usersError) {
        console.error("Error fetching user data:", usersError);
        // Fallback to default names
        comments.forEach((comment) => {
          comment.user_name =
            comment.user_id === user?.id ? user?.name || "You" : "Team Member";
        });
        return;
      }

      // Map user data to comments
      comments.forEach((comment) => {
        console.log("Mapping user data for comment:", comment);
        console.log("Current user:", user);
        if (comment.user_id === user?.id) {
          comment.user_name = user?.name || "You";
          // comment.user_email = user?.email || "";
        } else {
          const userData = usersData?.find(
            (userItem) => userItem.id === comment.user_id
          );
          if (userData) {
            comment.user_name = userData.name || "Unknown User";
            // comment.user_email = userData.email || "";
          } else {
            comment.user_name = "Team Member";
          }
        }
      });
    } catch (error) {
      console.error("Error fetching user information:", error);
      // Fallback to default names
      comments.forEach((comment) => {
        comment.user_name =
          comment.user_id === user?.id ? user?.name || "You" : "Team Member";
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

    if (!userId) {
      alert(
        "Unable to identify current user. Please refresh the page and try again."
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
        if (
          result.error?.includes("row-level security") ||
          result.error?.includes("Database security policy")
        ) {
          alert(
            `Database Configuration Issue: ${result.error}\n\nTo fix this, you need to either:\n1. Disable Row Level Security on the comments table, or\n2. Create proper RLS policies\n\nPlease contact your database administrator.`
          );
        } else if (result.suggestion) {
          alert(
            `Comment save failed: ${result.error}\n\nSuggestion: ${result.suggestion}`
          );
        } else {
          alert(`Failed to save comment: ${result.error || "Unknown error"}`);
        }
        return;
      }

      // Clear the input immediately
      setNewComment("");

      // Refresh comments from database to get the latest data with proper user information
      setTimeout(async () => {
        await fetchComments(currentUser);
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

  const isCommentEdited = (comment: Comment) => {
    if (!comment.updated_at || !comment.created_at) return false;
    const created = new Date(comment.created_at);
    const updated = new Date(comment.updated_at);
    return updated.getTime() - created.getTime() > 1000; // More than 1 second difference
  };

  const handleEditComment = (commentId: string, currentText: string) => {
    setEditingComment(commentId);
    setEditText(currentText);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) {
      alert("Comment cannot be empty.");
      return;
    }

    if (!currentUser?.id) {
      alert("Unable to identify current user. Please refresh and try again.");
      return;
    }

    try {
      const response = await fetch("/api/comments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: commentId,
          comment: editText.trim(),
          user_id: currentUser.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error updating comment:", result);
        alert(`Failed to update comment: ${result.error || "Unknown error"}`);
        return;
      }

      // Cancel editing mode
      setEditingComment(null);
      setEditText("");

      // Refresh comments
      await fetchComments(currentUser);
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText("");
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    if (!currentUser?.id) {
      alert("Unable to identify current user. Please refresh and try again.");
      return;
    }

    try {
      const response = await fetch("/api/comments", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment_id: commentId,
          user_id: currentUser.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error deleting comment:", result);
        alert(`Failed to delete comment: ${result.error || "Unknown error"}`);
        return;
      }

      // Refresh comments
      await fetchComments(currentUser);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };
  return (
    <>
      <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <h2 className="text-lg font-medium">Discussion</h2>
          </div>
          <p className="text-sm text-gray-500">
            Communicate with team members about this task
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
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
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{comment.user_name}</span>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(comment.created_at)}
                          </span>
                          {isCommentEdited(comment) && (
                            <span className="text-xs text-gray-400 italic">
                              edited {formatTimestamp(comment.updated_at!)}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Show edit/delete buttons only for current user's comments */}
                      {currentUser && comment.user_id === currentUser.id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleEditComment(comment.id, comment.comment)
                            }
                            className="p-1 bg-gray-200 rounded-md hover:bg-blue-200  transition-colors duration-200 flex items-center justify-center"
                            title="Edit comment"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1 bg-gray-200  rounded-md hover:bg-red-200  transition-colors duration-200 flex items-center justify-center"
                            title="Delete comment"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Show edit textarea if this comment is being edited */}
                    {editingComment === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          className="w-full p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          autoFocus
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="p-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center justify-center"
                            title="Save changes"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
                            title="Cancel editing"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm mt-1">{comment.comment}</p>
                    )}
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
                className="p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors duration-200"
                onClick={handleSubmitComment}
                disabled={isLoading || !newComment.trim()}
                title={isLoading ? "Posting comment..." : "Post comment"}
              >
                {isLoading ? (
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
