import React, { use, useEffect } from "react";
import { Paperclip, DownloadCloud } from "lucide-react";

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
}) => {
  console.log("Task Attachments Props:", {
    PMFiles,
    processorFiles,
    correctionFiles,
    version,
    taskId,
    storage_name,
    folder_path,
  });

  useEffect(() => {
    // processorFiles.forEach((file) => {
    //   console.log("Processor file:", file);
    // });
    fetchProcessorFiles();
  }, [taskId]);

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
                  key={item.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="font-medium">
                        {item.name.split("/").pop()}
                      </p>
                      {item.pageCount && (
                        <p className="text-xs text-gray-500">
                          Pages: {item.pageCount}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleDownload(item.name, "task-files", taskId, index)
                    }
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <DownloadCloud className="h-4 w-4" /> Download
                  </button>
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
                      key={item.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {item.name.split("/").pop()}
                          </p>
                          {item.pageCount && (
                            <p className="text-xs text-gray-500">
                              Pages: {item.pageCount}
                            </p>
                          )}
                        </div>
                      </div>
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
                      key={item.name}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {item.name.split("/").pop()}
                          </p>
                          {item.pageCount && (
                            <p className="text-xs text-gray-500">
                              Pages: {item.pageCount}
                            </p>
                          )}
                        </div>
                      </div>
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
