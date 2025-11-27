import { Paperclip, DownloadCloud, Upload, X, Pencil, Trash2 } from "lucide-react";

interface FileWithPageCount extends File {
  pageCount?: number;
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

export const FileUpload = ({
  handleFileUpload,
  uploadedFiles,
  filesToBeUploaded,
  handleDownloadOffilesToBeUploaded,
  handleRemoveFile,
  handleSubmitFileUpload,
  updateFilePageCount,
  currentUser,
  onDeleteUploadedFile,
  onReplaceUploadedFile,
  fileEdits,
}: {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadedFiles: { name: string; pageCount: number | null }[] | null;
  filesToBeUploaded: FileWithPageCount[];
  handleDownloadOffilesToBeUploaded: (item: string, index: number) => void;
  handleRemoveFile: (index: number) => void;
  handleSubmitFileUpload: () => void;
  updateFilePageCount: (index: number, pageCount: number) => void;
  currentUser?: { id: string; name: string; email: string; role: string } | null;
  onDeleteUploadedFile?: (fileName: string) => void;
  onReplaceUploadedFile?: (fileName: string, pageCount: number | null) => void;
  fileEdits?: Record<string, FileEditInfo>;
}) => {
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
    const editInfo = fileEdits?.[fileName];
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
              <span className="text-gray-400">By:</span> {editInfo.edited_by.name}
            </div>
            <div>
              <span className="text-gray-400">Email:</span> {editInfo.edited_by.email}
            </div>
            <div>
              <span className="text-gray-400">Role:</span> {editInfo.edited_by.role}
            </div>
            <div>
              <span className="text-gray-400">When:</span>{" "}
              {new Date(editInfo.edited_at).toLocaleString()}
            </div>
          </div>
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  };
  return (
    <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
      <div className="p-6 pb-2">
        <h2 className="text-lg font-medium">Upload Files</h2>
        <p className="text-sm text-gray-500">
          Add your completed work or relevant documents
        </p>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex-row items-center justify-center w-full">
          <label
            htmlFor="dropzone-file"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-1 text-sm text-gray-500">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOCX, XLSX, JPG, PNG (MAX. 10MB)
              </p>
            </div>
            <input
              id="dropzone-file"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              multiple
            />
          </label>
          <div className="p-6">
            <div className="space-y-2">
              {uploadedFiles && uploadedFiles.length > 0 && (
                <h3 className="text-sm font-medium mb-2">Files Uploaded</h3>
              )}
              {uploadedFiles?.map((item, index: number) => (
                <div
                  key={item.name}
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
                        handleDownloadOffilesToBeUploaded(item.name, index)
                      }
                      className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <DownloadCloud className="h-4 w-4" /> Download
                    </button>
                    {currentUser?.role === "projectManager" &&
                      onReplaceUploadedFile && (
                        <button
                          onClick={() =>
                            onReplaceUploadedFile(item.name, item.pageCount)
                          }
                          className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                          title="Replace file"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    {currentUser?.role === "projectManager" &&
                      onDeleteUploadedFile && (
                        <button
                          onClick={() => onDeleteUploadedFile(item.name)}
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
        </div>

        {/* Uploaded files list */}
        {filesToBeUploaded.length > 0 && (
          <div className="space-y-2 mt-4">
            <h3 className="text-sm font-medium mb-2">Files to be uploaded</h3>

            {/* <p> Harish </p> */}
            {filesToBeUploaded.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <Paperclip className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.size} bytes</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Pages:</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Count"
                      value={(file as FileWithPageCount).pageCount || ""}
                      className="w-20 px-2 py-1 text-sm border rounded"
                      onChange={(e) =>
                        updateFilePageCount(idx, parseInt(e.target.value) || 0)
                      }
                      required
                    />
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700 p-1"
                    onClick={() => handleRemoveFile(idx)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto"
          onClick={handleSubmitFileUpload}
        >
          Submit Files
        </button>
      </div>
    </div>
  );
};
