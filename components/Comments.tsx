import React from "react";

export const Comments = ({
  task,
  newComment,
  setNewComment,
  handleSubmitComment,
}: {
  task: any;
  newComment: string;
  setNewComment: (value: string) => void;
  handleSubmitComment: () => void;
}) => {
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
            {task.comments.map((comment: any) => (
              <div
                key={comment.id}
                className="flex gap-3 p-3 rounded-md bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                  <img
                    src={comment.avatar}
                    alt={comment.user}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{comment.user}</span>
                    <span className="text-xs text-gray-500">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Add comment form */}
          <div className="mt-6">
            <textarea
              className="w-full p-3 border border-gray-200 rounded-md"
              placeholder="Add a comment..."
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <button
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                onClick={handleSubmitComment}
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
