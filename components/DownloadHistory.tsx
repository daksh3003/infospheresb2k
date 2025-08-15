import React, { useState, useEffect } from "react";
import {
  DownloadCloud,
  User,
  Calendar,
  FileText,
  X,
  AlertCircle,
} from "lucide-react";
import { api } from "@/utils/api";
import { supabase } from "@/utils/supabase";

interface DownloadDetail {
  name: string;
  email: string;
  role: string;
  time: string;
}

interface DownloadRecord {
  id: string;
  task_id: string;
  file_id: string;
  file_name: string;
  storage_name: string;
  folder_path: string;
  downloaded_details: DownloadDetail[];
}

interface DownloadHistoryProps {
  taskId: string;
  refreshTrigger?: number;
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  taskId,
  refreshTrigger = 0,
}) => {
  const [downloadHistory, setDownloadHistory] = useState<DownloadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  const fetchDownloadHistory = async () => {
    try {
      const result = await api.getDownloadHistory(taskId);
      setDownloadHistory(result.downloadHistory);
    } catch (error) {
      console.error("Error fetching download history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloadHistory();
  }, [taskId, refreshTrigger]);

  // Show alert when refreshTrigger changes (new download)
  useEffect(() => {
    if (refreshTrigger > 0 && downloadHistory.length > 0) {
      const totalDownloads = downloadHistory.reduce(
        (total, record) => total + (record.downloaded_details?.length || 0),
        0
      );
      setAlertMessage(
        `Recorded ${totalDownloads} download${
          totalDownloads !== 1 ? "s" : ""
        } for this task`
      );
      setShowAlert(true);

      // Auto-hide alert after 3 seconds
      setTimeout(() => setShowAlert(false), 3000);
    }
  }, [refreshTrigger, downloadHistory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileName = (filePath: string) => {
    return filePath.split("/").pop() || filePath;
  };

  const getTotalDownloads = () => {
    return downloadHistory.reduce(
      (total, record) => total + (record.downloaded_details?.length || 0),
      0
    );
  };

  const getUniqueFiles = () => {
    const uniqueFiles = new Set(
      downloadHistory.map((record) => record.file_name)
    );
    return uniqueFiles.size;
  };

  return (
    <>
      {/* Alert Notification */}
      {showAlert && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{alertMessage}</span>
          <button
            onClick={() => setShowAlert(false)}
            className="ml-2 text-green-500 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Download History Summary Card */}
      <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden mb-6">
        <button
          className="w-full flex items-center justify-between p-6 focus:outline-none hover:bg-gray-50 transition"
          onClick={() => setIsModalOpen(true)}
          type="button"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <DownloadCloud className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-medium">Download History</h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {getUniqueFiles()} file{getUniqueFiles() !== 1 ? "s" : ""}
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                {getTotalDownloads()} download
                {getTotalDownloads() !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <span className="text-sm text-gray-500">View Details</span>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <DownloadCloud className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-medium">Download History</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {getUniqueFiles()} file{getUniqueFiles() !== 1 ? "s" : ""}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {getTotalDownloads()} download
                    {getTotalDownloads() !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isLoading ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
              ) : downloadHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No downloads recorded yet
                </div>
              ) : (
                <div className="space-y-6">
                  {downloadHistory.map((record) => (
                    <div
                      key={record.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* File Header */}
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <DownloadCloud className="h-4 w-4" />
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {getFileName(record.file_name)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Download Details */}
                      <div className="p-4">
                        {record.downloaded_details &&
                        record.downloaded_details.length > 0 ? (
                          <div className="space-y-3">
                            {record.downloaded_details.map((detail, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <User className="h-4 w-4" />
                                    <span className="font-medium">
                                      {detail.name}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      ({detail.role})
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {detail.email}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(detail.time)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            No download details available
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
