// app/tasks/[taskId]/page.tsx
"use client";
import { TaskDetailBackButton } from "@/components/task-detail-back-button";
import React, { useState, Fragment, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Calendar,
  Clock,
  DownloadCloud,
  Paperclip,
  Pause,
  Play,
  ArrowLeft,
  Share2,
  Upload,
  CheckCircle2,
  X,
  ArrowBigUpDashIcon,
} from "lucide-react";
import { supabase } from "@/utils/supabase";

// Simple dialog component
const Dialog = ({
  isOpen,
  onClose,
  title,
  description,
  confirmText = "Confirm",
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmText?: string;
  onConfirm: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = use(params);

  const router = useRouter();

  const [status, setStatus] = useState<
    "pending" | "in-progress" | "paused" | "completed"
  >("pending");
  const [progress, setProgress] = useState<number>(0);
  const [filesToBeUploaded, setfilesToBeUploaded] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<"files" | "comments">("files");
  const [newComment, setNewComment] = useState<string>("");
  const [uploadedFiles, setuploadedFiles] = useState<string[] | null>([]);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [sentBy, setSentBy] = useState<string>("");

  // Dialog states
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showSubmitToButton, setShowSubmitToButton] = useState(false);
  const [SubmitTo, setSubmitTo] = useState("QC");
  const [task, setTask] = useState<any>({
    id: taskId,
    title: "",
    description: "",
    priority: "low",
    dueDate: "",
    assignedTo: "",
    createdBy: "",
    attachments: [],
    comments: [],
    createdDate: "",
    estimatedHours: 0,
    tags: [],
  });

  const [PMFiles, setPMFiles] = useState<string[]>([]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => file);

      setfilesToBeUploaded([...filesToBeUploaded, ...newFiles]);

      // Reset file input
      e.target.value = "";
    }
  };

  //handling the remove file case.
  const handleRemoveFile = (index: number) => {
    const newFiles = [...filesToBeUploaded];
    newFiles.splice(index, 1);
    setfilesToBeUploaded(newFiles);
  };

  const handleSubmitComment = () => {
    if (newComment.trim() === "") return;

    const now = new Date();
    const formattedTime = now.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    setNewComment("");
  };

  // Handle task actions
  const handleStartTask = () => {
    setStatus("in-progress");
    setProgress(5);
  };

  const handlePauseResumeTask = () => {
    if (status === "in-progress") {
      setStatus("paused");
    } else if (status === "paused") {
      setStatus("in-progress");
    }
  };

  const handleCompleteTask = async () => {
    console.log("Completing task:", taskId);
    try {
      // Update the task in Supabase
      const { error } = await supabase
        .from("projects")
        .update({ completion_status: true })
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task:", error);
        return;
      }

      const { data, error: iterationError } = await supabase
        .from("task_iterations")
        .select("sent_by")
        .eq("project_id", taskId)
        .single();

      if (iterationError) {
        console.error("Error fetching task iteration:", iterationError);
        return;
      }

      if (filesToBeUploaded && filesToBeUploaded.length > 0) {
        toast("Failed to complete task. Files are added but not uploaded", {
          type: "warning",
          position: "top-right",
        });

        return;
      }

      if (data.sent_by === "PM") {
        setSubmitTo("Send to QC");
        setShowSubmitToButton(true);
      } else if (
        data.sent_by === "Processor" &&
        currentStage === "PM" &&
        uploadedFiles?.length === 0
      ) {
        setSubmitTo("Send to QA");
        setShowSubmitToButton(true);
      } else if (
        data.sent_by === "Processor" &&
        currentStage === "PM" &&
        uploadedFiles &&
        uploadedFiles.length > 0
      ) {
        setSubmitTo("Send to Processor Team");
        setShowSubmitToButton(true);
      } else if (
        data.sent_by === "QC" &&
        currentStage === "QA" &&
        uploadedFiles?.length === 0
      ) {
        setSubmitTo("Send to Delivery");
        setShowSubmitToButton(true);
      } else if (
        data.sent_by === "QC" &&
        currentStage === "QA" &&
        uploadedFiles &&
        uploadedFiles.length > 0
      ) {
        setSubmitTo("Send to Processor Team");
        setShowSubmitToButton(true);
      } else {
        setShowSubmitToButton(false);
      }

      setSentBy(data.sent_by);
      // console.log(data.sent_by);

      // Update local state
      setStatus("completed");
      setProgress(100);
      setShowCompleteDialog(false);

      // Navigate back to dashboard after brief delay
      // setTimeout(() => {
      //   router.push("/dashboard/pm");
      // }, 1500);
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleSendTo = async () => {
    let next_current_stage = "";
    let next_sent_by = "";

    // console.log(currentStage, sentBy);

    if (SubmitTo === "Send to QC") {
      next_current_stage = "QC";
      next_sent_by = "Processor";
    } else if (SubmitTo === "Send to QA" && currentStage === "Processor") {
      next_current_stage = "QA";
      next_sent_by = "Processor";
    } else if (SubmitTo === "Send to QA" && currentStage === "QC") {
      next_current_stage = "QA";
      next_sent_by = "QC";
    } else if (SubmitTo === "Send to Processor Team" && currentStage === "QC") {
      next_current_stage = "Processor";
      next_sent_by = "QC";
    } else if (SubmitTo === "Send to Processor Team" && currentStage === "QA") {
      next_current_stage = "Processor";
      next_sent_by = "QA";
    } else if (
      SubmitTo === "Send to Delivery" &&
      currentStage === "Processor"
    ) {
      next_current_stage = "Delivery";
      next_sent_by = "Processor";
    } else if (SubmitTo === "Send to Delivery" && currentStage === "QC") {
      next_current_stage = "Delivery";
      next_sent_by = "QC";
    }

    const { data, error } = await supabase
      .from("task_iterations")
      .update({ current_stage: next_current_stage, sent_by: next_sent_by })
      .eq("project_id", taskId);

    if (error) {
      console.error("Error updating task iteration:", error);
      toast("Failed to send task to QC", {
        type: "error",
        position: "top-right",
      });
      return;
    }

    if (status !== "completed") {
      toast("Task not completed", {
        type: "error",
        position: "top-right",
      });
    } else {
      toast("Task sent to QC", {
        type: "success",
        position: "top-right",
      });
      setTimeout(() => {
        router.push(`/dashboard/pm`);
      }, 4000);
    }
  };

  // Status UI helpers
  const getStatusBadge = () => {
    switch (status) {
      case "in-progress":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            In Progress
          </span>
        );
      case "paused":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
            Paused
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Pending
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full border border-red-200 text-red-700">
            High Priority
          </span>
        );
      case "medium":
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full border border-amber-200 text-amber-700">
            Medium Priority
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full border border-green-200 text-green-700">
            Low Priority
          </span>
        );
    }
  };

  const getPauseResumeButton = () => {
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

  const handleDownloadOffilesToBeUploaded = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("processor-files")
        .download(`${currentStage}_${taskId}/${fileName}`);

      if (error) throw new Error("Download failed: " + error.message);
      if (!data) throw new Error("No file data found");

      const url = URL.createObjectURL(data); // `data` is a Blob
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "downloaded_file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleDownload = async (fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("task-files")
        .download(`${taskId}/${fileName}`);

      if (error) throw new Error("Download failed: " + error.message);
      if (!data) throw new Error("No file data found");

      const url = URL.createObjectURL(data); // `data` is a Blob
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "downloaded_file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const onAdd = () => {
    console.log("File added");
  };

  const fetchProcessorFiles = async () => {
    const { data: current_stage, error: current_stageError } = await supabase
      .from("task_iterations")
      .select("current_stage")
      .eq("project_id", taskId)
      .single();

    if (current_stageError) {
      console.error("Error fetching current stage:", current_stageError);
      return;
    }
    // console.log(current_stage.current_stage);
    setCurrentStage(current_stage.current_stage);

    let storage_name = "";
    let folder_path = "";

    console.log(current_stage.current_stage, sentBy);

    if (current_stage.current_stage === "PM") {
      folder_path = `${current_stage.current_stage}_${taskId}`;
      storage_name = "processor-files";
    } else if (sentBy === "Processor" || current_stage.current_stage === "QC") {
      folder_path = `${taskId}`;
      storage_name = "qc-files";
    } else if (current_stage.current_stage === "QA") {
      folder_path = `${taskId}`;
      storage_name = "qa-files";
    }

    const { data: processorFiles, error: processorError } =
      await supabase.storage.from(storage_name).list(folder_path);

    if (processorFiles === null) {
      console.warn("No processor files found for this task.");
      setfilesToBeUploaded([]);
      return;
    }

    setuploadedFiles(processorFiles.map((file) => file.name));

    if (processorError) {
      console.error("Error fetching processor files:", processorError);
      return;
    }
    console.log("Processor Files:", processorFiles);
  };

  const handleSubmitFileUpload = async () => {
    if (!taskId) {
      alert("Task ID is not available.");
      return;
    }

    const { data, error } = await supabase
      .from("task_iterations")
      .select("current_stage")
      .eq("project_id", taskId)
      .single();
    console.log("Task Iteration Data:", data);
    if (error) {
      console.error("Error fetching task iteration data:", error);
      return;
    }

    if (filesToBeUploaded.length === 0) {
      alert("Please select files to upload.");
      return;
    }
    try {
      filesToBeUploaded.map(async (file) => {
        let date = new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        });
        date = date.replaceAll("/", "-");

        let file_path = `${data.current_stage}_${taskId}/${date}_${file.name}`;
        let storage_name = "processor-files";

        if (currentStage === "PM") {
          file_path = `${data.current_stage}_${taskId}/${date}_${file.name}`;
          storage_name = "processor-files";
        } else if (sentBy === "Processor" || currentStage === "QC") {
          file_path = `${taskId}/${date}_${file.name}`;
          storage_name = "qc-files";
        } else if (currentStage === "QA") {
          file_path = `${taskId}/${date}_${file.name}`;
          storage_name = "qa-files";
        }

        // const filePath = `${data.current_stage}_${taskId}/${date}_${file.name}`;

        const { data: StoreFiles, error } = await supabase.storage
          .from(storage_name)
          .upload(file_path, file, {
            contentType: file.type,
            upsert: true,
          });
        if (error) {
          console.error("Error uploading file:", error);
          return;
        }
      });
      fetchProcessorFiles();
      toast("Selected files uploaded successfully!", {
        type: "success",
        position: "top-right",
      });
      setfilesToBeUploaded([]);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("task_iterations")
      .select("sent_by")
      .eq("project_id", taskId)
      .single();

    if (error) {
      console.log("Error while fetching 'sent_by' data");
    }

    // console.log(storage_folder);
    // console.log(data);
    // Step 1: Fetch files first
    // console.log(sent_by, folder_path);

    const { data: PMFiles, error: PMError } = await supabase.storage
      .from("task-files")
      .list(taskId);
    // console.log(PMFiles);

    if (PMError) {
      console.error("Error fetching PM files:", PMError);
      return;
    }

    setPMFiles(PMFiles.map((file) => file.name));

    const sent_by = data?.sent_by;
    let folder_path = "";
    let storage_name = "";

    if (sent_by == "Processor" || sent_by == "QC") {
      folder_path = "PM_" + taskId;
      storage_name = "processor-files";
    } else if (sent_by == "PM") {
      folder_path = taskId;
      storage_name = "task-files";
    }
    // console.log(PMFiles);

    const { data: fileData, error: fileError } = await supabase.storage
      .from(storage_name)
      .list(folder_path);

    if (fileError) {
      console.error("Error fetching task files:", fileError);
      return;
    }

    // Set attachments after getting files
    setTask((prev: any) => ({
      ...prev,
      attachments: fileData.map((file) => file.name),
    }));

    // Step 2: Then fetch task data
    const { data: taskData, error: taskError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError) {
      console.error("Error fetching task data:", taskError);
      return;
    }

    // Merge in the task data without touching attachments
    setTask((prev: any) => ({
      ...prev,
      id: taskData.id,
      title: taskData.project_name,
      description: taskData.description,
      priority: taskData.priority || "low",
      dueDate: taskData.due_date || "",
      assignedTo: "",
      createdBy: "",
      comments: taskData.comments || [],
      createdDate: taskData.created_at,
    }));
  };

  useEffect(() => {
    fetchProcessorFiles();
    fetchData();
  }, [taskId]);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Back button and task ID */}
      <div className="flex items-center justify-between mb-6">
        {/* <button 
          className="flex items-center gap-2 px-3 py-1 text-gray-600 hover:text-gray-900"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button> */}
        <TaskDetailBackButton />
        <div className="text-sm text-gray-500">Task ID: {task.id}</div>
      </div>

      {/* Main task card */}
      <div className="mb-6 border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              <p className="mt-1 text-gray-500">
                Created on {task.createdDate}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {getPriorityBadge(task.priority)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pb-6">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500">
                Progress
              </span>
              <span className="text-sm font-medium text-gray-900">
                {progress}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Task metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Description
                </h3>
                <p className="text-gray-900">{task.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {/* {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-gray-100 rounded-full"
                    >
                      {tag}
                    </span>
                  ))} */}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Assigned To
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                      <img
                        src={task.assignedTo.avatar}
                        alt={task.assignedTo.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-gray-900">
                      {task.assignedTo.name}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Created By
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                      <img
                        src={task.createdBy.avatar}
                        alt={task.createdBy.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-gray-900">{task.createdBy.name}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Due Date
                  </h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{task.dueDate}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Estimated Hours
                  </h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      {task.estimatedHours} hours
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-between gap-4">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {status === "pending" && (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleStartTask}
              >
                <Play className="h-4 w-4" /> Start Task
              </button>
            )}

            {getPauseResumeButton()}

            <button
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => setShowHandoverDialog(true)}
            >
              <Share2 className="h-4 w-4" /> Handover
            </button>

            {status !== "completed" && (
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowCompleteDialog(true)}
              >
                <CheckCircle2 className="h-4 w-4" /> Mark Complete
              </button>
            )}
            {showSubmitToButton && status === "completed" && (
              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={() => handleSendTo()}
              >
                <ArrowBigUpDashIcon className="h-4 w-4" /> {SubmitTo}
              </button>
            )}
            {/* <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={handleSendToQC}
            >
              <ArrowBigUpDashIcon className="h-4 w-4" /> Send To QC
            </button> */}
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === "files"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("files")}
          >
            Files & Attachments
          </button>
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === "comments"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("comments")}
          >
            Comments
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "files" && (
        <div className="space-y-6">
          {/* Downloadable task files */}
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
                  {PMFiles.map((item: string) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{item.split("/").pop()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(item)}
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
                <h3 className="text-sm font-semibold tracking-wider uppercase text-gray-500 border-b pb-2 mb-3">
                  Processor Files
                </h3>
                <div className="space-y-2">
                  {task.attachments.map((item: string) => (
                    <div
                      key={item}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{item.split("/").pop()}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(item)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                      >
                        <DownloadCloud className="h-4 w-4" /> Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* File upload section */}
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
                      <h3 className="text-sm font-medium mb-2">
                        Files Uploaded
                      </h3>
                    )}
                    {uploadedFiles?.map((item: string) => (
                      <div
                        key={item}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center gap-3">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">
                              {item.split("/").pop()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleDownloadOffilesToBeUploaded(item)
                          }
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
                        >
                          <DownloadCloud className="h-4 w-4" /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Uploaded files list */}
              {filesToBeUploaded.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-medium mb-2">
                    Files to be uploaded
                  </h3>

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
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <button
                        className="text-red-500 hover:text-red-700 p-1"
                        onClick={() => handleRemoveFile(idx)}
                      >
                        <X size={16} />
                      </button>
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
        </div>
      )}

      {activeTab === "comments" && (
        <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
          <div className="p-6 pb-2">
            <h2 className="text-lg font-medium">Discussion</h2>
            <p className="text-sm text-gray-500">
              Communicate with team members about this task
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* {task.comments.map((comment) => (
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
              ))} */}
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
      )}

      {/* Handover Dialog */}
      <Dialog
        isOpen={showHandoverDialog}
        onClose={() => setShowHandoverDialog(false)}
        title="Hand over this task?"
        description="This will transfer ownership of the task to another team member."
        confirmText="Continue"
        onConfirm={() => console.log("Handover task")}
      />

      {/* Complete Task Dialog */}
      <Dialog
        isOpen={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        title="Mark task as completed?"
        description="This will update the task status and notify all stakeholders. Make sure all deliverables have been uploaded."
        confirmText="Complete Task"
        onConfirm={handleCompleteTask}
      />
    </div>
  );
}
