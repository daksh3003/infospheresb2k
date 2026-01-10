import React, { useEffect, useState } from "react";
import { Paperclip, DownloadCloud, Pencil, Trash2 } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface FileEditInfo {
  edited_at: string;
  edited_by: {
    name: string;
    email: string;
    role: string;
  };
  old_file_name: string;
}

export const TaskAttachments = ({
  PMFiles,
  processorFiles,
  correctionFiles,
  version,
  taskId,
  handleDownload,
  storage_name,
  folder_path,
  fetchProcessorFiles,
  currentUser,
  onDeleteFile,
  onReplaceFile,
}: {
  PMFiles: { name: string; pageCount: number | null }[];
  processorFiles: { name: string; pageCount: number | null }[];
  correctionFiles: { name: string; pageCount: number | null }[];
  version: number;
  taskId: string;
  handleDownload: (
    item: string,
    storage_name: string,
    folder_path: string,
    index: number
  ) => void;
  storage_name: string;
  folder_path: string;
  fetchProcessorFiles: () => void;
  currentUser: UserProfile | null;
  onDeleteFile?: (
    fileName: string,
    storage_name: string,
    folder_path: string
  ) => void;
  onReplaceFile?: (
    fileName: string,
    storage_name: string,
    folder_path: string,
    pageCount: number | null
  ) => void;
}) => {
  const [fileEdits, setFileEdits] = useState<Record<string, FileEditInfo>>({});



  // Fetch file edit history
  useEffect(() => {
    const fetchFileEdits = async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}/file-edits`);
        if (response.ok) {
          const data = await response.json();
          setFileEdits(data.fileEdits || {});
        }
      } catch (error) {
        console.error("Error fetching file edits:", error);
      }
    };

    fetchFileEdits();
  }, [taskId]);

  useEffect(() => {
    fetchProcessorFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  // Helper function to format time difference
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Helper function to render edit indicator
  const renderEditIndicator = (fileName: string) => {
    const editInfo = fileEdits[fileName];
    if (!editInfo) return null;

    return (
      <div
        className="group relative inline-block ml-2"
        title={`Edited by ${editInfo.edited_by.name} (${editInfo.edited_by.email})`}
      >
        <span className="text-xs text-blue-600 font-medium cursor-help">
          edited {getTimeAgo(editInfo.edited_at)}
        </span>
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
          <div className="font-semibold mb-1">File Edited</div>
          <div className="space-y-1">
            <div>
              <span className="text-gray-400">By:</span>{" "}
              {editInfo.edited_by.name}
            </div>
            <div>
              <span className="text-gray-400">Role:</span>{" "}
              {editInfo.edited_by.role}
            </div>
            <div>
              <span className="text-gray-400">Timestamp:</span>{" "}
              {new Date(editInfo.edited_at).toLocaleString()}
            </div>
          </div>
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        <div className="p-6 pb-2">
          <h2 className="text-xl font-medium">Task Attachments</h2>
          <p className="text-sm text-gray-500">
            Files attached to this task by the creator
          </p>
        </div>
        <div className="p-6 space-y-6">
          {/* PM Files */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-500 border-b pb-2 mb-3">
              Client Files
            </h3>
            <div className="space-y-2">
              {PMFiles.map((item, index: number) => (
                <div
                  key={`pm-${item.name}-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="flex items-center">
                        <p className="font-medium">
                          {item.name.split("/").pop()}
                        </p>
                        {renderEditIndicator(item.name)}
                      </div>
                      {item.pageCount && (
                        <p className="text-xs text-gray-500">
                          Pages: {item.pageCount}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleDownload(item.name, "task-files", taskId, index)
                      }
                      className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <DownloadCloud className="h-4 w-4" /> Download
                    </button>
                    {currentUser?.role === "projectManager" &&
                      onReplaceFile && (
                        <button
                          onClick={() =>
                            onReplaceFile(
                              item.name,
                              "task-files",
                              taskId,
                              item.pageCount
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                          title="Replace file"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    {currentUser?.role === "projectManager" && onDeleteFile && (
                      <button
                        onClick={() =>
                          onDeleteFile(item.name, "task-files", taskId)
                        }
                        className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                        title="Delete file"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Processor Files */}
          <div>
            {processorFiles && processorFiles.length > 0 ? (
              <>
                <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-500 border-b pb-2 mb-3">
                  Processor Files {"v" + version}
                </h3>
                <div className="space-y-2">
                  {processorFiles.map((item, index: number) => (
                    <div
                      key={`processor-${item.name}-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium">
                              {item.name.split("/").pop()}
                            </p>
                            {renderEditIndicator(item.name)}
                          </div>
                          {item.pageCount && (
                            <p className="text-xs text-gray-500">
                              Pages: {item.pageCount}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleDownload(
                              item.name,
                              storage_name,
                              folder_path,
                              index
                            )
                          }
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                        >
                          <DownloadCloud className="h-4 w-4" /> Download
                        </button>
                        {currentUser?.role === "projectManager" &&
                          onReplaceFile && (
                            <button
                              onClick={() =>
                                onReplaceFile(
                                  item.name,
                                  storage_name,
                                  folder_path,
                                  item.pageCount
                                )
                              }
                              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                              title="Replace file"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        {currentUser?.role === "projectManager" &&
                          onDeleteFile && (
                            <button
                              onClick={() =>
                                onDeleteFile(
                                  item.name,
                                  storage_name,
                                  folder_path
                                )
                              }
                              className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                              title="Delete file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* Correction Files */}
          <div>
            {correctionFiles && correctionFiles.length > 0 ? (
              <>
                <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-500 border-b pb-2 mb-3">
                  Correction Files
                </h3>
                <div className="space-y-2">
                  {correctionFiles.map((item, index: number) => (
                    <div
                      key={`correction-${item.name}-${index}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="flex items-center">
                            <p className="font-medium">
                              {item.name.split("/").pop()}
                            </p>
                            {renderEditIndicator(item.name)}
                          </div>
                          {item.pageCount && (
                            <p className="text-xs text-gray-500">
                              Pages: {item.pageCount}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleDownload(item.name, "qc-files", taskId, index)
                          }
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                        >
                          <DownloadCloud className="h-4 w-4" /> Download
                        </button>
                        {currentUser?.role === "projectManager" &&
                          onReplaceFile && (
                            <button
                              onClick={() =>
                                onReplaceFile(
                                  item.name,
                                  "qc-files",
                                  taskId,
                                  item.pageCount
                                )
                              }
                              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                              title="Replace file"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                        {currentUser?.role === "projectManager" &&
                          onDeleteFile && (
                            <button
                              onClick={() =>
                                onDeleteFile(item.name, "qc-files", taskId)
                              }
                              className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-800"
                              title="Delete file"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};
