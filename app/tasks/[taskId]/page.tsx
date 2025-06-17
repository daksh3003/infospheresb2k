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
import TimelineModal from "@/components/Timeline/TimelineModal";

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
  const [uploadedFiles, setUploadedFiles] = useState<string[] | null>([]);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [sentBy, setSentBy] = useState<string>("");
  const [completionStatus, setCompletionStatus] = useState<boolean>(false);

  // Dialog states
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showSubmitToButton, setShowSubmitToButton] = useState(false);
  const [SubmitTo, setSubmitTo] = useState("QC");
  const [task, setTask] = useState<any>({
    id: taskId,
    title: "",
    client_instruction: "",
    mail_instruction: "",
    estimated_hours_qc: 0,
    estimated_hours_qa: 0,
    estimated_hours_ocr: 0,
    priority: "low",
    dueDate: "",
    assignedTo: "",
    createdBy: "",
    attachments: [],
    comments: [],
    createdDate: "",
    estimatedHours: 0,
  });

  const [PMFiles, setPMFiles] = useState<string[]>([]);
  const [correctionFiles, setCorrectionFiles] = useState<string[]>([]);
  const [processorFiles, setProcessorFiles] = useState<string[]>([]);
  const [timelineItems, setTimelineItems] = useState<any[]>([]);
  const [isQcinLoop, setIsQcinLoop] = useState<boolean>(true);

  const [storage_name, setStorageName] = useState<string>("");
  const [folder_path, setFolderPath] = useState<string>("");
  const [version, setVersion] = useState<number>(1);

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
    let overall_completion_status = false;
    console.log("Current Stage:", currentStage);
    console.log("Sent By:", sentBy);
    if (
      (currentStage === "Processor" && sentBy === "QA") ||
      (currentStage === "QA" && sentBy === "QC") ||
      (currentStage === "QA" && sentBy === "Processor")
    ) {
      overall_completion_status = true;
    }
    // console.log("Overall Completion Status:", overall_completion_status);
    if (overall_completion_status) {
      setCompletionStatus(true);
    }
    try {
      // Update the task in Supabase
      const { error } = await supabase
        .from("projects")
        .update({
          completion_status: true,
          overall_completion_status: overall_completion_status,
        })
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
        (data.sent_by === "Processor" &&
          currentStage === "QC" &&
          uploadedFiles?.length === 0) ||
        (data.sent_by === "QC" && currentStage === "Processor")
      ) {
        setSubmitTo("Send to QA");
        setShowSubmitToButton(true);
      } else if (
        data.sent_by === "Processor" &&
        currentStage === "QC" &&
        uploadedFiles &&
        uploadedFiles.length > 0
      ) {
        setSubmitTo("Send to Processor Team");
        // console.log("hello");
        setShowSubmitToButton(true);
      } else if (
        (data.sent_by === "QC" &&
          currentStage === "QA" &&
          uploadedFiles?.length === 0) ||
        (currentStage === "Processor" && data.sent_by === "QA") ||
        (data.sent_by === "Processor" &&
          currentStage === "QA" &&
          uploadedFiles &&
          uploadedFiles.length === 0)
      ) {
        setSubmitTo("Send to Delivery");
        setShowSubmitToButton(true);
      } else if (
        (data.sent_by === "QC" &&
          currentStage === "QA" &&
          uploadedFiles &&
          uploadedFiles.length > 0) ||
        (data.sent_by === "Processor" &&
          currentStage === "QA" &&
          uploadedFiles &&
          uploadedFiles.length > 0)
      ) {
        setSubmitTo("Send to Processor Team");
        setShowSubmitToButton(true);
      } else {
        setShowSubmitToButton(false);
      }

      // Update local state
      setStatus("completed");
      setProgress(100);
      setShowCompleteDialog(false);
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
    } else if (SubmitTo === "Send to Delivery" && currentStage === "QA") {
      next_current_stage = "Delivery";
      next_sent_by = "QA";
    }

    const { data: stages, error: stagesError } = await supabase
      .from("task_iterations")
      .select("stages")
      .eq("project_id", taskId)
      .single();

    if (stagesError) {
      console.error("Error fetching stages:", stagesError);
      return;
    }

    let updatedStages = [...stages.stages];
    if (next_current_stage === "Delivery") {
      updatedStages = [...updatedStages, currentStage, next_current_stage];
    } else {
      updatedStages.push(currentStage);
    }

    const { data, error } = await supabase
      .from("task_iterations")
      .update({
        current_stage: next_current_stage,
        sent_by: next_sent_by,
        stages: updatedStages,
      })
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
      // Get the source from URL parameters
      const searchParams = new URLSearchParams(window.location.search);
      const source = searchParams.get("source");

      toast("Task sent to " + next_current_stage, {
        type: "success",
        position: "top-right",
      });

      setTimeout(() => {
        // Redirect based on source
        if (source === "global") {
          router.push("/dashboard");
        } else if (source) {
          router.push(`/dashboard/${source}`);
        } else {
          // Default fallback to PM dashboard if no source
          router.push("/dashboard");
        }
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

  const handleDownloadOffilesToBeUploaded = async (
    fileName: string,
    index: number
  ) => {
    try {
      let storage_name = "";
      let folder_path = "";

      if (currentStage === "Processor") {
        if (sentBy === "PM") {
          storage_name = "task-files";
          folder_path = taskId;
        } else if (sentBy === "QC") {
          storage_name = "qc-files";
          folder_path = taskId;
        } else if (sentBy === "QA") {
          storage_name = "qa-files";
          folder_path = taskId;
        }
      } else if (currentStage === "QC") {
        storage_name = "qc-files";
        folder_path = taskId;
      } else if (currentStage === "QA") {
        storage_name = "qa-files";
        folder_path = taskId;
      }

      const { data, error } = await supabase.storage
        .from(storage_name)
        .download(`${folder_path}/${fileName}`);

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

  const handleDownload = async (
    fileName: string,
    storage_name: string,
    folder_path: string,
    index: number
  ) => {
    try {
      console.log("storage_name : ", storage_name);
      console.log("folder_path : ", folder_path);
      console.log("fileName : ", fileName);
      const { data, error } = await supabase.storage
        .from(storage_name)
        .download(`${folder_path}/${fileName}`);

      if (error) throw new Error("Download failed: " + error.message);
      if (!data) throw new Error("No file data found");

      const url = URL.createObjectURL(data); // `data` is a Blob
      const a = document.createElement("a");
      a.href = url;

      let new_file_name = "";

      if (storage_name === "processor-files") {
        if (folder_path.includes("PM_")) {
          new_file_name = "processor_file_v1_" + index;
        } else if (folder_path.includes("QC_")) {
          new_file_name = "processor_file_v2_" + index;
        } else if (folder_path.includes("QA_")) {
          new_file_name = "processor_file_v3_" + index;
        }
      } else if (storage_name === "qc-files") {
        new_file_name = "qc_file_" + index;
      } else if (storage_name === "qa-files") {
        new_file_name = "qa_file_" + index;
      } else if (storage_name === "task-files") {
        console.log("index : ", index);
        new_file_name = "client_file_" + index;
      }

      a.download = new_file_name || "downloaded_file";
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
      .select("current_stage, sent_by")
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

    // console.log(current_stage.current_stage, current_stage.sent_by);

    let isQcInLoop = true;

    const { data: qcData, error: qcError } = await supabase.storage
      .from("qc-files")
      .list(taskId);

    if (qcData && qcData.length === 0) {
      console.log("Error fetching QC data:", qcError);
      isQcInLoop = false;
    }

    setIsQcinLoop(isQcInLoop);

    // console.log("qcData : ", qcData);

    // console.log("isQcInLoop : ", isQcInLoop);

    if (
      (current_stage.sent_by === "Processor" &&
        current_stage.current_stage === "QC") ||
      (current_stage.sent_by === "QC" &&
        current_stage.current_stage === "QA") ||
      (current_stage.sent_by === "QA" &&
        current_stage.current_stage === "Processor" &&
        !isQcInLoop) ||
      (current_stage.sent_by === "QC" &&
        current_stage.current_stage === "Processor") ||
      (current_stage.current_stage === "Delivery" &&
        current_stage.sent_by === "QA" &&
        !isQcInLoop)
    ) {
      folder_path = `PM_${taskId}`;
      storage_name = "processor-files";
    } else if (
      (current_stage.sent_by === "Processor" &&
        current_stage.current_stage === "QA") ||
      (current_stage.sent_by === "QC" &&
        current_stage.current_stage === "Processor" &&
        isQcInLoop) ||
      (current_stage.sent_by === "QA" &&
        current_stage.current_stage === "Processor") ||
      (current_stage.current_stage === "Delivery" &&
        current_stage.sent_by === "QA" &&
        isQcInLoop)
    ) {
      folder_path = `QC_${taskId}`;
      storage_name = "processor-files";
    }
    // console.log(current_stage.current_stage, current_stage.sent_by);
    else if (
      current_stage.current_stage === "Delivery" &&
      current_stage.sent_by === "Processor"
    ) {
      folder_path = `QA_${taskId}`;
      storage_name = "processor-files";
    } else if (
      current_stage.current_stage === "Delivery" &&
      current_stage.sent_by === "QA"
    ) {
      folder_path = `PM_${taskId}`;
      storage_name = "processor-files";
    }

    setStorageName(storage_name);
    setFolderPath(folder_path);

    if (storage_name === "processor-files") {
      if (
        folder_path.includes("PM_") &&
        folder_path.includes("QC_") &&
        folder_path.includes("QA_")
      ) {
        setVersion(3);
      } else if (
        folder_path.includes("PM_") &&
        !folder_path.includes("QC_") &&
        !folder_path.includes("QA_")
      ) {
        setVersion(1);
      } else {
        setVersion(2);
      }
    }

    console.log(folder_path, storage_name);

    if (current_stage.sent_by !== "PM") {
      const { data: processorFiles, error: processorError } =
        await supabase.storage.from(storage_name).list(folder_path);

      if (processorError) {
        console.error("Error fetching processor files:", processorError);
        return;
      }
      if (processorFiles === null) {
        console.warn("No processor files found for this task.");
        setfilesToBeUploaded([]);
        return;
      }

      console.log("processorFiles : ", processorFiles);

      setProcessorFiles(processorFiles.map((file) => file.name));

      console.log("Processor Files:", processorFiles);
    }
  };

  const handleSubmitFileUpload = async () => {
    if (!taskId) {
      alert("Task ID is not available.");
      return;
    }

    const { data, error } = await supabase
      .from("task_iterations")
      .select("current_stage, sent_by")
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

        let file_path = "";
        let storage_name = "";

        if (currentStage === "Processor") {
          file_path = `${data.sent_by}_${taskId}/${date}_${file.name}`;
          storage_name = "processor-files";
        } else if (currentStage === "QC") {
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

      // fetchUploadedFiles();
      fetchData();
      toast("Selected files uploaded successfully!", {
        type: "success",
        position: "top-right",
      });
      setfilesToBeUploaded([]);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  // const fetchUploadedFiles = async () => {};

  const fetchData = async () => {
    // console.log("Fetching data");
    const { data, error } = await supabase
      .from("task_iterations")
      .select("sent_by, current_stage")
      .eq("project_id", taskId)
      .single();

    if (error) {
      console.log("Error while fetching 'sent_by' data");
      return;
    }

    console.log(data);

    setSentBy(data?.sent_by);
    setCurrentStage(data?.current_stage);

    // console.log(storage_folder);
    // console.log(data);
    // Step 1: Fetch files first
    // console.log(sent_by, folder_path);
    const sent_by = data?.sent_by;
    const current_stage = data?.current_stage;

    const { data: PMFiles, error: PMError } = await supabase.storage
      .from("task-files")
      .list(taskId);
    // console.log(PMFiles);

    if (PMError) {
      console.error("Error fetching PM files:", PMError);
      return;
    }

    setPMFiles(PMFiles.map((file) => file.name));

    // console.log("Current Stage:", current_stage, "Sent By:", sent_by);

    // if (sent_by !== "PM") {
    var folder_path_correction = "";
    var storage_name_correction = "";

    if (current_stage === "Processor") {
      if (sent_by === "QC") {
        folder_path_correction = taskId;
        storage_name_correction = "qc-files";
      } else if (sent_by === "QA") {
        folder_path_correction = taskId;
        storage_name_correction = "qa-files";
      }
    } else if (current_stage === "QA" && sent_by === "Processor") {
      folder_path_correction = taskId;
      storage_name_correction = "qc-files";
    }

    const { data: correctionFiles, error: correctionError } =
      await supabase.storage
        .from(storage_name_correction)
        .list(folder_path_correction);

    if (correctionError) {
      console.log("Error fetching correction files:", correctionError);
      // return;
    }
    setCorrectionFiles(correctionFiles?.map((file) => file.name) || []);
    // }

    // console.log("hello");

    let folder_path = "";
    let storage_name = "";

    // Step 2: Then fetch task data with creator information
    const { data: taskData, error: taskError } = await supabase
      .from("projects")
      .select(
        `
        *,
        creator:profiles!inner (
          user_id,
          name,
          email,
          role
        )
      `
      )
      .eq("id", taskId)
      .single();

    if (taskError) {
      console.error("Error fetching task data:", taskError);
      // Try alternative approach if the join fails
      const { data: simpleTaskData, error: simpleError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", taskId)
        .single();

      console.log("simpleTaskData : ", simpleTaskData);

      if (simpleError) {
        console.error("Error fetching simple task data:", simpleError);
        return;
      }

      // Fetch creator info separately
      const { data: creatorData, error: creatorError } = await supabase
        .from("profiles")
        .select("user_id,  emaname,il, role")
        .eq("user_id", simpleTaskData.created_by)
        .single();

      if (creatorError) {
        console.error("Error fetching creator data:", creatorError);
        setTask((prev: any) => ({
          ...prev,
          id: simpleTaskData.id,
          title: simpleTaskData.project_name,
          client_instruction: simpleTaskData.client_instruction || "",
          mail_instruction: simpleTaskData.mail_instruction || "",
          estimated_hours_qc: simpleTaskData.estimated_hours_qc || 0,
          estimated_hours_qa: simpleTaskData.estimated_hours_qa || 0,
          estimated_hours_ocr: simpleTaskData.estimated_hours_ocr || 0,
          priority: simpleTaskData.priority || "low",
          dueDate: simpleTaskData.delivery_date || "",
          assignedTo: "",
          createdBy: {
            id: simpleTaskData.created_by,
            name: "Unknown",
            email: "",
            role: "",
          },
          comments: simpleTaskData.comments || [],
          createdDate: simpleTaskData.created_at,
          overall_completion_status: simpleTaskData.overall_completion_status,
        }));
        return;
      }

      // Set task with creator info
      setTask((prev: any) => ({
        ...prev,
        id: simpleTaskData.id,
        title: simpleTaskData.project_name,
        client_instruction: simpleTaskData.client_instruction || "",
        mail_instruction: simpleTaskData.mail_instruction || "",
        estimated_hours_qc: simpleTaskData.estimated_hours_qc || 0,
        estimated_hours_qa: simpleTaskData.estimated_hours_qa || 0,
        estimated_hours_ocr: simpleTaskData.estimated_hours_ocr || 0,
        priority: simpleTaskData.priority || "low",
        dueDate: simpleTaskData.delivery_date || "",
        assignedTo: "",
        createdBy: {
          id: creatorData.user_id,
          name: creatorData.name,
          email: creatorData.email,
          role: creatorData.role,
        },
        comments: simpleTaskData.comments || [],
        createdDate: simpleTaskData.created_at,
        overall_completion_status: simpleTaskData.overall_completion_status,
      }));
      return;
    }

    console.log("Task Data with creator:", taskData);

    // Merge in the task data without touching attachments
    setTask((prev: any) => ({
      ...prev,
      id: taskData.id,
      title: taskData.project_name,
      client_instruction: taskData.client_instruction || "",
      mail_instruction: taskData.mail_instruction || "",
      estimated_hours_qc: taskData.estimated_hours_qc || 0,
      estimated_hours_qa: taskData.estimated_hours_qa || 0,
      estimated_hours_ocr: taskData.estimated_hours_ocr || 0,
      priority: taskData.priority || "low",
      dueDate: taskData.delivery_date || "",
      assignedTo: "",
      createdBy: {
        id: taskData.creator?.user_id || "",
        name: taskData.creator?.name || "Unknown",
        email: taskData.creator?.email || "",
        role: taskData.creator?.role || "",
      },
      comments: taskData.comments || [],
      createdDate: taskData.created_at,
      overall_completion_status: taskData.overall_completion_status,
    }));

    // console.log("Current Stage:", data?.current_stage);
    // let folder_path = "";
    // let storage_name = "";
    // console.log("Current Stage:", current_stage, "Sent By:", sent_by);
    if (current_stage === "Processor") {
      folder_path = `${sent_by}_${taskId}`;
      storage_name = "processor-files";
    } else if (current_stage === "QC") {
      folder_path = taskId;
      storage_name = "qc-files";
    } else if (current_stage === "QA") {
      folder_path = taskId;
      storage_name = "qa-files";
    }
    console.log("Folder Path:", folder_path, "Storage Name:", storage_name);

    const { data: uploadedFiles, error: uploadedError } = await supabase.storage
      .from(storage_name)
      .list(folder_path);
    if (uploadedError) {
      console.log("Error fetching uploaded files:", uploadedError);
      return;
    }
    console.log(uploadedFiles);

    setUploadedFiles(uploadedFiles.map((file) => file.name));
  };

  const fetchTimelineItems = async () => {
    const { data: stages, error: timelineError } = await supabase
      .from("task_iterations")
      .select("stages")
      .eq("project_id", taskId)
      .single();
    if (timelineError) {
      console.log("Error fetching timeline items:", timelineError);
      return;
    }
    console.log("stages : ", stages);
    const stagesArray = stages.stages;
    const len = stagesArray.length;

    let timelineItems: any[] = [];

    let cnt_of_processor = 1;

    for (let i = 0; i < len; i++) {
      console.log("i : ", i);
      let folder_path = "";
      let storage_name = "";
      let current_stage = "";

      if (stagesArray[i] === "PM") {
        folder_path = taskId;
        storage_name = "task-files";
        current_stage = "PM";
      } else if (stagesArray[i] === "Processor") {
        if (stagesArray[i - 1] === "PM") {
          folder_path = `PM_${taskId}`;
          storage_name = "processor-files";
          current_stage = "Processor (" + cnt_of_processor + ")";
        } else if (stagesArray[i - 1] === "QC") {
          folder_path = `QC_${taskId}`;
          storage_name = "processor-files";
          current_stage = "Processor (" + cnt_of_processor + ")";
        } else if (stagesArray[i - 1] === "QA") {
          folder_path = `QA_${taskId}`;
          storage_name = "processor-files";
          current_stage = "Processor (" + cnt_of_processor + ")";
        }
        cnt_of_processor++;
      } else if (stagesArray[i] === "QC") {
        folder_path = taskId;
        storage_name = "qc-files";
        current_stage = "QC";
      } else if (stagesArray[i] === "QA") {
        folder_path = taskId;
        storage_name = "qa-files";
        current_stage = "QA";
      } else if (stagesArray[i] === "Delivery") {
        // console.log("cnt_of_processor : ", cnt_of_processor);
        if (cnt_of_processor == 2) {
          folder_path = `PM_${taskId}`;
        } else if (cnt_of_processor == 3) {
          folder_path = `QC_${taskId}`;
        } else if (cnt_of_processor == 4) {
          folder_path = `QA_${taskId}`;
        }
        storage_name = "processor-files";
        current_stage = "Delivery";
      }

      const { data: uploadedFiles, error: uploadedFilesError } =
        await supabase.storage.from(storage_name).list(folder_path);
      if (uploadedFilesError) {
        console.log("Error fetching uploaded files:" + i, uploadedFilesError);
        return;
      }
      // console.log("uploadedFiles : ", uploadedFiles);
      const timelineItem = {
        id: taskId,
        title: current_stage,
        content: uploadedFiles.map((file, index) => ({
          name: file.name,
          onClick: () => {
            handleDownload(file.name, storage_name, folder_path, index);
          },
        })),
        completed: true,
        date: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      };

      timelineItems.push(timelineItem);
    }
    console.log("timelineItems : ", timelineItems);
    setTimelineItems(timelineItems);
  };

  useEffect(() => {
    fetchProcessorFiles();
    fetchData();
    fetchTimelineItems();
    // console.log("timelineItems : ", timelineItems);
    // fetchUploadedFiles();
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
        {task.overall_completion_status ? (
          <h3 className="text-sm font-medium text-green-500 mb-1">
            Overall Task Status: Completed
          </h3>
        ) : (
          <h3 className="text-sm font-medium text-red-500 mb-1">
            Overall Task Status: Pending
          </h3>
        )}
        <div className="flex justify-end">
          <TimelineModal
            items={timelineItems}
            title="Timeline"
            buttonText="View Timeline"
            handleDownload={handleDownload}
          />
        </div>
      </div>

      {/* <div style={{ maxWidth: "800px", margin: "40px auto" }}> */}
      {/* </div> */}

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
                  Client Instructions
                </h3>
                <p className="text-gray-900">{task.client_instruction}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Mail Instructions
                </h3>
                <p className="text-gray-900">{task.mail_instruction}</p>
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
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      <span className="text-xs text-gray-600">
                        {task.createdBy?.name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-900">
                        {task.createdBy?.name || "Unknown"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {task.createdBy?.email || ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Est. Hours (QC)
                  </h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      {task.estimated_hours_qc} hours
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Est. Hours (QA)
                  </h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      {task.estimated_hours_qa} hours
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Est. Hours (OCR)
                  </h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">
                      {task.estimated_hours_ocr} hours
                    </span>
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
                    Total Est. Hours
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
                  {PMFiles.map((item: string, index: number) => (
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
                        onClick={() =>
                          handleDownload(item, "task-files", taskId, index)
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
                      {processorFiles.map((item: string, index: number) => (
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
                              handleDownload(
                                item,
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
                      {correctionFiles.map((item: string, index: number) => (
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
                              handleDownload(
                                item,
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
                    {uploadedFiles?.map((item: string, index: number) => (
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
                            handleDownloadOffilesToBeUploaded(item, index)
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
