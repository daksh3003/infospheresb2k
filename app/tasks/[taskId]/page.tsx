"use client";

import { TaskDetailBackButton } from "@/components/task-detail-back-button";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
import { supabase } from "@/utils/supabase";
import { logTaskAction, createTaskActionMetadata } from "@/utils/taskActions";
import TimelineModal from "@/components/Timeline/TimelineModal";
import Dialog from "@/components/Dialog";
import { MainTaskCard } from "@/components/MainTaskCard";
import { TaskAttachments } from "@/components/TaskAttachments";
import { FileUpload } from "@/components/FileUpload";
import { Comments } from "@/components/Comments";
import { FooterButtons } from "@/components/FooterButtons";
import LoadingScreen from "@/components/ui/loading-screen";
import { DownloadHistory } from "@/components/DownloadHistory";

// Updated interfaces based on actual database schema
// interface TaskFromDB {
//   task_id: string;
//   task_name: string;
//   client_instruction: string | null;
//   processor_type: string | null;
//   estimated_hours_ocr: number | null;
//   estimated_hours_qc: number | null;
//   estimated_hours_qa: number | null;
//   completion_status: boolean | null;
//   project_id: string | null;
//   created_at: string | null;
//   created_by: string | null;
//   status: string | null;
//   updated_at: string | null;
//   feedback: string | null;
// }

// interface ProjectFromDB {
//   project_id: string;
//   project_name: string;
//   po_hours: number | null;
//   mail_instruction: string | null;
//   list_of_files: string[] | null;
//   reference_file: string | null;
//   delivery_date: string | null;
//   delivery_time: string | null;
//   created_at: string | null;
//   updated_at: string | null;
//   completion_status: boolean | null;
//   created_by: string | null;
// }

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Combined task interface for frontend use
interface Task {
  // From tasks_test
  task_id: string;
  task_name: string;
  client_instruction: string;
  processor_type: string;
  estimated_hours_ocr: number;
  estimated_hours_qc: number;
  estimated_hours_qa: number;
  completion_status: boolean;
  created_at: string;
  status: string;
  feedback: string;

  // From projects_test
  project_id: string;
  project_name: string;
  po_hours: number;
  mail_instruction: string;
  list_of_files: string[];
  reference_file: string;
  delivery_date: string;
  delivery_time: string;

  // Creator information
  created_by: UserProfile;

  // Frontend display properties
  title: string; // Will map to task_name
  priority: string; // Will derive from processor_type or default
  dueDate: string; // Will map to delivery_date
  deliveryTime: string; // Will map to delivery_time
  assignedTo: string;
  attachments: string[];
  estimatedHours: number; // Will sum all estimated hours
  overall_completion_status: boolean;
}

interface FileWithPageCount extends File {
  pageCount?: number;
}

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const router = useRouter();

  // Loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // state hooks  :
  const [_status, _setStatus] = useState<
    "pending" | "in-progress" | "paused" | "completed" | "overdue" | "returned"
  >("pending");
  const [realStatus, setRealStatus] = useState<string>("pending");
  const [_statusLoading, _setStatusLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  const [filesToBeUploaded, setfilesToBeUploaded] = useState<
    FileWithPageCount[]
  >([]);
  const [activeTab, setActiveTab] = useState<"files" | "comments">("files");
  const [uploadedFiles, _setUploadedFiles] = useState<
    { name: string; pageCount: number | null }[] | null
  >([]);
  const [currentStage, setCurrentStage] = useState<string>("");
  const [sentBy, setSentBy] = useState<string>("");
  const [completionStatus, setCompletionStatus] = useState<boolean>(false);

  // Dialog states :
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showSubmitToButton, setShowSubmitToButton] = useState(false);
  const [SubmitTo, setSubmitTo] = useState("QC");

  // Updated task state with proper typing
  const [task, setTask] = useState<Task>({
    task_id: taskId,
    task_name: "",
    title: "",
    client_instruction: "",
    processor_type: "",
    estimated_hours_ocr: 0,
    estimated_hours_qc: 0,
    estimated_hours_qa: 0,
    completion_status: false,
    created_at: "",
    status: "pending",
    feedback: "",
    project_id: "",
    project_name: "",
    po_hours: 0,
    mail_instruction: "",
    list_of_files: [],
    reference_file: "",
    delivery_date: "",
    delivery_time: "",
    created_by: { id: "", name: "", email: "", role: "" },
    priority: "low",
    dueDate: "",
    deliveryTime: "",
    assignedTo: "",
    attachments: [],
    estimatedHours: 0,
    overall_completion_status: false,
  });

  // file states :
  const [PMFiles, setPMFiles] = useState<
    { name: string; pageCount: number | null }[]
  >([]);
  const [correctionFiles, setCorrectionFiles] = useState<
    { name: string; pageCount: number | null }[]
  >([]);
  const [processorFiles, setProcessorFiles] = useState<
    { name: string; pageCount: number | null }[]
  >([]);

  // user states :
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [_isQcinLoop, _setIsQcinLoop] = useState<boolean>(true);

  // file states :
  const [storage_name, setStorageName] = useState<string>("");
  const [folder_path, setFolderPath] = useState<string>("");
  const [version, setVersion] = useState<number>(1);

  // user states :
  const [_availableUsers, _setAvailableUsers] = useState<UserProfile[]>([]);
  const [_selectedUserData, _setSelectedUserData] =
    useState<UserProfile | null>(null);
  const [_isAssigning, _setIsAssigning] = useState(false);
  const [_isTaskPickedUp, _setIsTaskPickedUp] = useState(false);

  // Download history refresh trigger
  const [downloadHistoryRefresh, setDownloadHistoryRefresh] = useState(0);

  // New function to fetch complete task details with project information
  const fetchCompleteTaskDetails = async (): Promise<Task | null> => {
    try {
      // Fetch task data
      const { data: taskData, error: taskError } = await supabase
        .from("tasks_test")
        .select("*")
        .eq("task_id", taskId)
        .single();

      if (taskError) {
        console.error("Error fetching task data:", taskError);
        return null;
      }

      if (!taskData.project_id) {
        console.error("Task has no associated project");
        return null;
      }

      // Fetch project data
      const { data: projectData, error: projectError } = await supabase
        .from("projects_test")
        .select("*")
        .eq("project_id", taskData.project_id)
        .single();

      if (projectError) {
        console.error("Error fetching project data:", projectError);
        return null;
      }

      // Fetch creator information
      let creatorData: UserProfile = {
        id: "",
        name: "Unknown",
        email: "",
        role: "",
      };
      if (taskData.created_by) {
        const { data: creator, error: creatorError } = await supabase
          .from("profiles")
          .select("id, name, email, role")
          .eq("id", taskData.created_by)
          .single();

        if (!creatorError && creator) {
          creatorData = creator;
        }
      }

      // Calculate total estimated hours
      const totalEstimatedHours =
        (taskData.estimated_hours_ocr || 0) +
        (taskData.estimated_hours_qc || 0) +
        (taskData.estimated_hours_qa || 0);

      // Map priority from processor_type or default
      const priority = taskData.processor_type?.toLowerCase() || "normal";

      // Combine data into Task interface
      const completeTask: Task = {
        // From tasks_test
        task_id: taskData.task_id,
        task_name: taskData.task_name,
        client_instruction: taskData.client_instruction || "",
        processor_type: taskData.processor_type || "",
        estimated_hours_ocr: taskData.estimated_hours_ocr || 0,
        estimated_hours_qc: taskData.estimated_hours_qc || 0,
        estimated_hours_qa: taskData.estimated_hours_qa || 0,
        completion_status: taskData.completion_status || false,
        created_at: taskData.created_at || "",
        status: taskData.status || "pending",
        feedback: taskData.feedback || "",

        // From projects_test
        project_id: projectData.project_id,
        project_name: projectData.project_name,
        po_hours: projectData.po_hours || 0,
        mail_instruction: projectData.mail_instruction || "",
        list_of_files: projectData.list_of_files || [],
        reference_file: projectData.reference_file || "",
        delivery_date: projectData.delivery_date || "",
        delivery_time: projectData.delivery_time || "",

        // Creator information
        created_by: creatorData,

        // Frontend display properties
        title: taskData.task_name,
        priority: priority,
        dueDate: projectData.delivery_date || "",
        deliveryTime: projectData.delivery_time || "",
        assignedTo: "", // Will be populated separately if needed
        attachments: projectData.list_of_files || [],
        estimatedHours: totalEstimatedHours,
        overall_completion_status: taskData.completion_status || false,
      };

      return completeTask;
    } catch (error) {
      console.error("Error in fetchCompleteTaskDetails:", error);
      return null;
    }
  };

  // Fetch real status from database
  const fetchRealStatus = async () => {
    try {
      _setStatusLoading(true);
      const { data: taskData, error } = await supabase
        .from("tasks_test")
        .select("status")
        .eq("task_id", taskId)
        .single();

      if (error) {
        console.error("Error fetching task status:", error);
        return;
      }

      if (taskData?.status) {
        setRealStatus(taskData.status);
        _setStatus(
          taskData.status as
            | "pending"
            | "in-progress"
            | "paused"
            | "completed"
            | "overdue"
            | "returned"
        );
      }
    } catch (error) {
      console.error("Error in fetchRealStatus:", error);
    } finally {
      _setStatusLoading(false);
    }
  };

  // Handle file page count updates
  const handleUpdateFilePageCount = (index: number, pageCount: number) => {
    setfilesToBeUploaded((files) => {
      const newFiles = [...files];
      (newFiles[index] as FileWithPageCount).pageCount = pageCount;
      return newFiles;
    });
  };

  // Handle task actions
  const logTaskActionHelper = async (
    actionType:
      | "start"
      | "pause"
      | "resume"
      | "complete"
      | "send_to"
      | "download"
      | "upload"
      | "taken_by"
      | "assigned_to",
    additionalMetadata?: Record<string, unknown>
  ) => {
    if (!currentUser || !taskId) return;

    try {
      const metadata = createTaskActionMetadata(
        currentUser,
        taskId,
        currentStage,
        sentBy,
        additionalMetadata
      );

      const result = await logTaskAction({
        user_id: currentUser.id,
        task_id: taskId,
        action_type: actionType,
        metadata: metadata,
      });

      if (!result.success) {
        console.error("Failed to log task action:", result.error);
      }
    } catch (error) {
      console.error("Error in logTaskActionHelper:", error);
    }
  };

  const handleStartTask = async () => {
    try {
      // Log the start action
      await logTaskActionHelper("start", { previous_status: realStatus });

      // Update the task status in tasks_test table
      const { error: statusError } = await supabase
        .from("tasks_test")
        .update({ status: "in-progress" })
        .eq("task_id", taskId);

      if (statusError) {
        console.error("Error updating task status:", statusError);
        toast("Failed to update task status", {
          type: "error",
          position: "top-right",
        });
        return;
      }

      // Update process_logs_test for legacy support
      const { data: _response, error: error } = await supabase
        .from("process_logs_test")
        .update({
          started_at: new Date(),
        })
        .eq("task_id", taskId);

      if (error) {
        toast("Failed to start task", {
          type: "error",
          position: "top-right",
        });
        return;
      }

      // Refresh the real status from database
      await fetchRealStatus();
      setProgress(5);
    } catch (error) {
      console.error("Error starting task:", error);
      toast("Failed to start task", {
        type: "error",
        position: "top-right",
      });
    }
  };

  const handlePauseResumeTask = async () => {
    const previousStatus = realStatus;
    let newStatus:
      | "pending"
      | "in-progress"
      | "paused"
      | "completed"
      | "overdue"
      | "returned";
    let actionType: string;

    if (realStatus === "in-progress") {
      newStatus = "paused";
      actionType = "pause";
    } else if (realStatus === "paused") {
      newStatus = "in-progress";
      actionType = "resume";
    } else {
      return;
    }

    try {
      // Log the pause/resume action
      await logTaskActionHelper(actionType as "pause" | "resume", {
        previous_status: previousStatus,
        new_status: newStatus,
      });

      // Update the task status in tasks_test table
      const { error: statusError } = await supabase
        .from("tasks_test")
        .update({ status: newStatus })
        .eq("task_id", taskId);

      if (statusError) {
        console.error("Error updating task status:", statusError);
        toast("Failed to update task status", {
          type: "error",
          position: "top-right",
        });
        return;
      }

      // Refresh the real status from database
      await fetchRealStatus();

      // Show success toast
      toast(`Task ${actionType}d successfully!`, {
        type: "success",
        position: "top-right",
      });
    } catch (error) {
      console.error("Error in handlePauseResumeTask:", error);
      toast("Failed to update task status", {
        type: "error",
        position: "top-right",
      });
    }
  };

  const handleCompleteTask = async () => {
    // Log the complete action
    await logTaskActionHelper("complete", {
      previous_status: realStatus,
      completion_status: completionStatus,
      files_uploaded: uploadedFiles?.length || 0,
    });

    // Update the task status in tasks_test table
    const { error: statusError } = await supabase
      .from("tasks_test")
      .update({ status: "completed" })
      .eq("task_id", taskId);

    if (statusError) {
      console.error("Error updating task status:", statusError);
      toast("Failed to update task status", {
        type: "error",
        position: "top-right",
      });
      return;
    }

    const { data: response, error: error } = await supabase
      .from("process_logs_test")
      .update({
        ended_at: new Date(),
      })
      .eq("task_id", taskId);

    if (error) {
      toast("Failed to complete task", {
        type: "error",
        position: "top-right",
      });
      return;
    }

    if (response) {
      toast("Task completed", {
        type: "success",
        position: "top-right",
      });
    }

    let overall_completion_status = false;
    if (
      (currentStage === "Processor" && sentBy === "QA") ||
      (currentStage === "QA" && sentBy === "QC") ||
      (currentStage === "QA" && sentBy === "Processor")
    ) {
      overall_completion_status = true;
    }

    if (overall_completion_status) {
      setCompletionStatus(true);
    }
    try {
      // Update the task in Supabase
      if (overall_completion_status) {
        const { error } = await supabase
          .from("tasks_test")
          .update({
            completion_status: true,
          })
          .eq("task_id", taskId);

        if (error) {
          console.error("Error updating task:", error);
          return;
        }

        // Check all the tasks mapped to the same project are completed or not
        const { data: projectTasks, error: projectTasksError } = await supabase
          .from("tasks_test")
          .select("completion_status")
          .eq("project_id", task.project_id);

        if (projectTasksError) {
          console.error("Error fetching project tasks:", projectTasksError);
          return;
        }

        const isAllTasksCompleted = projectTasks.every(
          (task) => task.completion_status
        );

        if (isAllTasksCompleted) {
          const { error: projectError } = await supabase
            .from("projects_test")
            .update({ completion_status: true })
            .eq("project_id", task.project_id);

          if (projectError) {
            console.error("Error updating project:", projectError);
            return;
          }
        }
      }

      const { data, error: iterationError } = await supabase
        .from("task_iterations")
        .select("sent_by")
        .eq("task_id", taskId)
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

      // Refresh status from database and update local state
      await fetchRealStatus();
      setProgress(100);
      setShowCompleteDialog(false);
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  const handleSendTo = async () => {
    let next_current_stage = "";
    let next_sent_by = "";

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

    // Log the send to action
    await logTaskActionHelper("send_to", {
      from_stage: currentStage,
      to_stage: next_current_stage,
      sent_by: next_sent_by,
      submit_to: SubmitTo,
    });

    const { data: stages, error: stagesError } = await supabase
      .from("task_iterations")
      .select("stages")
      .eq("task_id", taskId)
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

    const { data: _data, error } = await supabase
      .from("task_iterations")
      .update({
        current_stage: next_current_stage,
        sent_by: next_sent_by,
        stages: updatedStages,
      })
      .eq("task_id", taskId);

    if (error) {
      console.error("Error updating task iteration:", error);
      toast("Failed to send task to QC", {
        type: "error",
        position: "top-right",
      });
      return;
    }

    if (realStatus !== "completed") {
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

  const handleDownloadOffilesToBeUploaded = async (
    fileName: string,
    index: number
  ) => {
    try {
      // Log the download action
      await logTaskActionHelper("download", {
        file_name: fileName,
        file_index: index,
        storage_stage: currentStage,
        download_type: "uploaded_file",
      });

      // let storage_name = "";
      // let folder_path = "";

      // if (currentStage === "Processor") {
      //   if (sentBy === "PM") {
      //     storage_name = "task-files";
      //     folder_path = taskId;
      //   } else if (sentBy === "QC") {
      //     storage_name = "qc-files";
      //     folder_path = taskId;
      //   } else if (sentBy === "QA") {
      //     storage_name = "qa-files";
      //     folder_path = taskId;
      //   }
      // } else if (currentStage === "QC") {
      //   storage_name = "qc-files";
      //   folder_path = taskId;
      // } else if (currentStage === "QA") {
      //   storage_name = "qa-files";
      //   folder_path = taskId;
      // }

      const { data: filesData, error: filesDataError } = await supabase
        .from("files_test")
        .select("file_path, storage_name")
        .eq("task_id", taskId)
        .eq("file_name", fileName)
        .single();

      if (filesDataError) {
        console.error("Error fetching file data:", filesDataError);
        return;
      }

      console.log("Downloading file:", {
        fileName,
        storage_name: filesData.storage_name,
        folder_path: filesData.file_path,
        index,
      });

      const { data, error } = await supabase.storage
        .from(filesData.storage_name)
        .download(`${filesData.file_path}`);

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

      // Log the download to database
      // console.log("task_id:", taskId);
      // console.log("fileName:", fileName);
      // console.log("folder_path:", folder_path);
      if (currentUser) {
        try {
          // console.log("hello");
          // // Get file_id from files_test table based on task_id, file_name and file_path
          // console.log("Fetching file_id for:", {
          //   taskId,
          //   fileName,
          //   folder_path: `${folder_path}/${fileName}`,
          // });
          const { data: fileData, error: fileError } = await supabase
            .from("files_test")
            .select("file_id")
            .eq("task_id", taskId)
            .eq("file_name", fileName)
            .eq("file_path", `${filesData.file_path}`)
            .single();

          // console.log("task_id:", taskId);
          // console.log("fileName:", fileName);
          // console.log("folder_path:", folder_path);

          if (fileError) {
            console.error("Error fetching file_id from files_test:", fileError);
            return;
          }

          const file_id = fileData.file_id;

          // Check if a record for this file already exists
          const { data: existingRecord, error: checkError } = await supabase
            .from("track_downloads")
            .select("id, downloaded_details")
            .eq("file_id", file_id)
            .eq("task_id", taskId)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            console.error("Error checking existing record:", checkError);
            return;
          }

          const downloadDetail = {
            name: currentUser.name || "Unknown User",
            email: currentUser.email || "",
            role: currentUser.role || "user",
            time: new Date().toISOString(),
          };

          if (existingRecord) {
            // Update existing record by appending to downloaded_details array
            const updatedDetails = [
              ...(existingRecord.downloaded_details || []),
              downloadDetail,
            ];

            const { error: updateError } = await supabase
              .from("track_downloads")
              .update({ downloaded_details: updatedDetails })
              .eq("id", existingRecord.id);

            if (updateError) {
              console.error("Error updating download record:", updateError);
            } else {
              // Refresh download history
              setDownloadHistoryRefresh((prev) => prev + 1);
            }
          } else {
            // Create new record
            const { error: insertError } = await supabase
              .from("track_downloads")
              .insert({
                task_id: taskId,
                file_id: file_id,
                file_name: fileName,
                storage_name: storage_name,
                file_path: folder_path,
                downloaded_details: [downloadDetail],
              });

            if (insertError) {
              console.error("Error creating download record:", insertError);
            } else {
              // Refresh download history
              setDownloadHistoryRefresh((prev) => prev + 1);
            }
          }
        } catch (error) {
          console.error("Error logging download:", error);
        }
      }
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
      // Log the download action
      await logTaskActionHelper("download", {
        file_name: fileName,
        storage_name: storage_name,
        file_path: folder_path,
        file_index: index,
        download_type: "task_file",
      });

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
          new_file_name = "processor_file_v1_" + fileName;
        } else if (folder_path.includes("QC_")) {
          new_file_name = "processor_file_v2_" + fileName;
        } else if (folder_path.includes("QA_")) {
          new_file_name = "processor_file_v3_" + fileName;
        }
      }

      a.download = new_file_name || fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Log the download to database
      // console.log("task_id:", taskId);
      // console.log("fileName:", fileName);
      // console.log("folder_path:", folder_path);
      if (currentUser) {
        try {
          // Get file_id from files_test table based on task_id, file_name and file_path
          const { data: fileData, error: fileError } = await supabase
            .from("files_test")
            .select("file_id")
            .eq("task_id", taskId)
            .eq("file_name", fileName)
            .eq("file_path", `${folder_path}/${fileName}`) // Adjusted to include fileName in path
            .single();

          //       console.log("task_id:", taskId);
          // console.log("fileName:", fileName);
          // console.log("folder_path:", folder_path);

          if (fileError) {
            console.error("Error fetching file_id from files_test:", fileError);
            return;
          }

          const file_id = fileData.file_id;

          // Check if a record for this file already exists
          const { data: existingRecord, error: checkError } = await supabase
            .from("track_downloads")
            .select("id, downloaded_details")
            .eq("file_id", file_id)
            .eq("task_id", taskId)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            console.error("Error checking existing record:", checkError);
            return;
          }

          const downloadDetail = {
            name: currentUser.name || "Unknown User",
            email: currentUser.email || "",
            role: currentUser.role || "user",
            time: new Date().toISOString(),
          };

          if (existingRecord) {
            // Update existing record by appending to downloaded_details array
            const updatedDetails = [
              ...(existingRecord.downloaded_details || []),
              downloadDetail,
            ];

            const { error: updateError } = await supabase
              .from("track_downloads")
              .update({ downloaded_details: updatedDetails })
              .eq("id", existingRecord.id);

            if (updateError) {
              console.error("Error updating download record:", updateError);
            } else {
              // Refresh download history
              setDownloadHistoryRefresh((prev) => prev + 1);
            }
          } else {
            // Create new record
            const { error: insertError } = await supabase
              .from("track_downloads")
              .insert({
                task_id: taskId,
                file_id: file_id,
                file_name: fileName,
                storage_name: storage_name,
                file_path: folder_path,
                downloaded_details: [downloadDetail],
              });

            if (insertError) {
              console.error("Error creating download record:", insertError);
            } else {
              // Refresh download history
              setDownloadHistoryRefresh((prev) => prev + 1);
            }
          }
        } catch (error) {
          console.error("Error logging download:", error);
        }
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const fetchProcessorFiles = async () => {
    console.log("Fetching processor files for task:", taskId);
    const { data: current_stage, error: current_stageError } = await supabase
      .from("task_iterations")
      .select("current_stage, sent_by")
      .eq("task_id", taskId)
      .single();

    if (current_stageError) {
      console.error("Error fetching current stage:", current_stageError);
      return;
    }
    setCurrentStage(current_stage.current_stage);

    let storage_name = "";
    let folder_path = "";

    let isQcInLoop = true;

    const { data: qcData, error: qcError } = await supabase.storage
      .from("qc-files")
      .list(taskId);

    if (qcData && qcData.length === 0) {
      console.log("Error fetching QC data:", qcError);
      isQcInLoop = false;
    }

    _setIsQcinLoop(isQcInLoop);

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
    } else if (
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
    console.log("Determined storage:", storage_name, "folder:", folder_path);
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

      // Fetch page counts from files_test table for processor files
      const processorFilesWithPageCount = await Promise.all(
        processorFiles.map(async (file) => {
          try {
            console.log("Fetching page count for:", file.name);
            const { data: fileInfo, error: fileInfoError } = await supabase
              .from("files_test")
              .select("page_count")
              .eq("task_id", taskId)
              .eq("file_name", file.name)
              .single();

            if (fileInfoError && fileInfoError.code !== "PGRST116") {
              console.warn(
                `Error fetching page count for ${file.name}:`,
                fileInfoError
              );
            }

            return {
              name: file.name,
              pageCount: fileInfo?.page_count || null,
            };
          } catch (error) {
            console.warn(`Failed to fetch page count for ${file.name}:`, error);
            return {
              name: file.name,
              pageCount: null,
            };
          }
        })
      );
      console.log(
        "Processor files with page count:",
        processorFilesWithPageCount
      );
      setProcessorFiles(processorFilesWithPageCount);
    }

    // Use the new function to fetch complete task details
    const completeTask = await fetchCompleteTaskDetails();
    if (completeTask) {
      setTask(completeTask);

      // Set real status from database
      if (completeTask.status) {
        setRealStatus(completeTask.status);
        _setStatus(
          completeTask.status as
            | "pending"
            | "in-progress"
            | "paused"
            | "completed"
            | "overdue"
            | "returned"
        );
      }
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
      .eq("task_id", taskId)
      .single();

    if (error) {
      console.error("Error fetching task iteration data:", error);
      return;
    }

    if (filesToBeUploaded.length === 0) {
      alert("Please select files to upload.");
      return;
    }
    try {
      // Check if all files have page counts
      for (const file of filesToBeUploaded) {
        if (!(file as FileWithPageCount).pageCount) {
          toast("Please enter page count for all files", {
            type: "error",
            position: "top-right",
          });
          return;
        }
      }

      // Log the upload action
      await logTaskActionHelper("upload", {
        files_count: filesToBeUploaded.length,
        files_info: filesToBeUploaded.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          page_count: (file as FileWithPageCount).pageCount,
        })),
        upload_stage: currentStage,
      });

      for (const file of filesToBeUploaded) {
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

        // Upload the file
        const { data: _StoreFiles, error: uploadError } = await supabase.storage
          .from(storage_name)
          .upload(file_path, file, {
            contentType: file.type,
            upsert: true,
          });
        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          return;
        }

        // Store the file information in files_test table
        const { error: fileInfoError } = await supabase
          .from("files_test")
          .insert({
            task_id: taskId,
            file_name: `${date}_${file.name}`,
            page_count: (file as FileWithPageCount).pageCount,
            // taken_by: currentUser?.id || null,
            assigned_to: [], // Empty array for initial upload
            storage_name: storage_name,
            file_path: file_path,
          });

        if (fileInfoError) {
          console.error("Error storing file information:", fileInfoError);
          toast("Error saving file information", {
            type: "error",
            position: "top-right",
          });
          return;
        }
      }

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

  // Modified fetchData to handle loading state
  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("task_iterations")
        .select("sent_by, current_stage, assigned_to_processor_user_id")
        .eq("task_id", taskId)
        .single();

      if (error) {
        console.error("Error fetching 'sent_by' data:", error);
        return;
      }

      setSentBy(data?.sent_by);
      setCurrentStage(data?.current_stage);
      // setIsTaskPickedUp(data?.assigned_to_processor_user_id || false);

      const sent_by = data?.sent_by;
      const current_stage = data?.current_stage;

      const { data: PMFiles, error: PMError } = await supabase.storage
        .from("task-files")
        .list(taskId);

      if (PMError) {
        console.error("Error fetching PM files:", PMError);
        return;
      }

      // Fetch page counts from files_test table for PM files
      const pmFilesWithPageCount = await Promise.all(
        PMFiles.map(async (file) => {
          try {
            const { data: fileInfo, error: fileInfoError } = await supabase
              .from("files_test")
              .select("page_count")
              .eq("task_id", taskId)
              .eq("file_name", file.name)
              .single();

            if (fileInfoError && fileInfoError.code !== "PGRST116") {
              console.warn(
                `Error fetching page count for ${file.name}:`,
                fileInfoError
              );
            }

            console.log(`Fetched page count for ${file.name}:`, fileInfo);

            return {
              name: file.name,
              pageCount: fileInfo?.page_count || null,
            };
          } catch (error) {
            console.warn(`Failed to fetch page count for ${file.name}:`, error);
            return {
              name: file.name,
              pageCount: null,
            };
          }
        })
      );
      console.log("PM Files with page count:", PMFiles);
      setPMFiles(pmFilesWithPageCount);

      let folder_path_correction = "";
      let storage_name_correction = "";

      if (sent_by !== "PM") {
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

        // Fetch page counts from files_test table for correction files
        const correctionFilesWithPageCount = await Promise.all(
          (correctionFiles || []).map(async (file) => {
            try {
              const { data: fileInfo, error: fileInfoError } = await supabase
                .from("files_test")
                .select("page_count")
                .eq("task_id", taskId)
                .eq("file_name", file.name)
                .single();

              if (fileInfoError && fileInfoError.code !== "PGRST116") {
                console.warn(
                  `Error fetching page count for ${file.name}:`,
                  fileInfoError
                );
              }

              return {
                name: file.name,
                pageCount: fileInfo?.page_count || null,
              };
            } catch (error) {
              console.warn(
                `Failed to fetch page count for ${file.name}:`,
                error
              );
              return {
                name: file.name,
                pageCount: null,
              };
            }
          })
        );

        setCorrectionFiles(correctionFilesWithPageCount);
        // }
      }

      let folder_path = "";
      let storage_name = "";


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
      console.log("current_stage : ", current_stage);

      const { data: uploadedFiles, error: uploadedError } =
        await supabase.storage.from(storage_name).list(folder_path);
      if (uploadedError) {
        console.log("Error fetching uploaded files:", uploadedError);
        return;
      }
      console.log(uploadedFiles);

      // Fetch page counts from files_test table for uploaded files
      const uploadedFilesWithPageCount = await Promise.all(
        uploadedFiles.map(async (file) => {
          try {
            const { data: fileInfo, error: fileInfoError } = await supabase
              .from("files_test")
              .select("page_count")
              .eq("task_id", taskId)
              .eq("file_name", file.name)
              .single();

            if (fileInfoError && fileInfoError.code !== "PGRST116") {
              console.warn(
                `Error fetching page count for ${file.name}:`,
                fileInfoError
              );
            }

            return {
              name: file.name,
              pageCount: fileInfo?.page_count || null,
            };
          } catch (error) {
            console.warn(`Failed to fetch page count for ${file.name}:`, error);
            return {
              name: file.name,
              pageCount: null,
            };
          }
        })
      );

      _setUploadedFiles(uploadedFilesWithPageCount);
    } catch (error) {
      console.error("Error in fetchData:", error);
    }

  };

  const _fetchAvailableUsers = async () => {
    let roleToFetch = "";
    if (currentStage === "Processor") {
      roleToFetch = "processor";
    } else if (currentStage === "QC") {
      roleToFetch = "qcTeam";
    } else if (currentStage === "QA") {
      roleToFetch = "qaTeam";
    }

    try {
      const { data: users, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", roleToFetch);

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      _setAvailableUsers(users || []);
    } catch (error) {
      console.error("Error in fetchAvailableUsers:", error);
    }
  };

  const handleAssignTask = async (selectedUserData: UserProfile) => {
    if (!selectedUserData) {
      toast.error("Please select a user to assign the task");
      return;
    }

    _setIsAssigning(true);
    try {
      // Log the assignment action
      await logTaskActionHelper("assigned_to", {
        assigned_to_user_id: selectedUserData.id,
        assigned_to_user_name: selectedUserData.name,
        assigned_to_user_email: selectedUserData.email,
        assigned_to_user_role: selectedUserData.role,
        assignment_stage: currentStage,
      });

      // First, check if there's an existing record
      const { data: existingLog, error: fetchError } = await supabase
        .from("files_test")
        .select("assigned_to")
        .eq("task_id", taskId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error checking existing log:", fetchError);
        throw fetchError;
      }

      const now = new Date().toISOString();

      // Create new assignment entry
      const newAssignment = {
        user_name: selectedUserData.name,
        user_email: selectedUserData.email,
        user_role: selectedUserData.role,
        user_id: selectedUserData.id,
        assigned_at: now,
      };

      // Handle existing or new assignedTo array
      let assignedToArray: (typeof newAssignment)[] = [];

      if (existingLog?.assigned_to) {
        // Check if user is already assigned
        const isAlreadyAssigned = existingLog.assigned_to.some(
          (assignment: { user_id: string }) =>
            assignment.user_id === selectedUserData.id
        );

        if (isAlreadyAssigned) {
          toast.error("This user is already assigned to this task");
          _setIsAssigning(false);
          return;
        }

        // Add new assignment to existing array
        assignedToArray = [...existingLog.assigned_to, newAssignment];
      } else {
        // Create new array with first assignment
        assignedToArray = [newAssignment];
      }

      await api.assignTask(taskId, assignedToArray);
      toast.success("Task assigned successfully!");
      await fetchData(); // Refresh the data
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task. Please try again.");
    } finally {
      _setIsAssigning(false);
      _setSelectedUserData(null); // Reset selection
    }
  };

  // Fetch task details from API
  const _fetchTaskDetails = async () => {
    try {
      const taskDetails = await api.getTaskDetails(taskId);
      if (taskDetails.task) {
        // Use the new fetchCompleteTaskDetails function instead
        const completeTask = await fetchCompleteTaskDetails();
        if (completeTask) {
          setTask(completeTask);
        }

        // Also set available users if provided
        if (taskDetails.availableUsers) {
          _setAvailableUsers(taskDetails.availableUsers);
        }
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error("Failed to load task details");
    }
  };

  // useEffect hooks :
  useEffect(() => {
    const initializeData = async () => {
      setIsInitialLoading(true);
      try {
        const fetchCurrentUser = async () => {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single();

            if (error) {
              console.error("Error fetching user profile:", error);
              return;
            }
            setCurrentUser(profile);
          }
        };

        await Promise.all([
          fetchCurrentUser(),
          fetchProcessorFiles(),
          fetchData(),
          fetchRealStatus(),
        ]);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    initializeData();
  }, [taskId]);

  // Show loading screen while initial data is being fetched
  if (isInitialLoading) {
    return <LoadingScreen message="Loading task details..." />;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Back button and task ID */}
      <div className="flex items-center justify-between mb-6">
        <TaskDetailBackButton />
        <div className="text-sm text-gray-500">Task ID: {task.task_id}</div>
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
            title="Timeline"
            buttonText="View Timeline"
            handleDownload={handleDownload}
          />
        </div>
      </div>

      <div className="mb-6 border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        {/* Main task card */}
        <MainTaskCard
          task={task}
          status={realStatus}
          progress={progress}
          onAssignTask={handleAssignTask}
        />

        {/* Footer with buttons */}
        <FooterButtons
          currentUser={currentUser || { id: "", name: "", email: "", role: "" }}
          currentStage={currentStage}
          sentBy={sentBy}
          taskId={taskId}
          handleStartTask={handleStartTask}
          handlePauseResumeTask={handlePauseResumeTask}
          handleSendTo={handleSendTo}
          showSubmitToButton={showSubmitToButton}
          setShowCompleteDialog={setShowCompleteDialog}
          status={realStatus}
          SubmitTo={SubmitTo}
          onAssignTask={handleAssignTask}
          onStatusUpdate={fetchRealStatus}
        />
      </div>

      {/* Download History */}
      <DownloadHistory
        taskId={taskId}
        refreshTrigger={downloadHistoryRefresh}
      />

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
          <TaskAttachments
            PMFiles={PMFiles}
            processorFiles={processorFiles}
            fetchProcessorFiles={fetchProcessorFiles}
            correctionFiles={correctionFiles}
            version={version}
            taskId={taskId}
            handleDownload={handleDownload}
            storage_name={storage_name}
            folder_path={folder_path}
          />

          {/* File upload section */}
          <FileUpload
            handleFileUpload={handleFileUpload}
            uploadedFiles={uploadedFiles}
            filesToBeUploaded={filesToBeUploaded}
            handleDownloadOffilesToBeUploaded={
              handleDownloadOffilesToBeUploaded
            }
            handleRemoveFile={handleRemoveFile}
            handleSubmitFileUpload={handleSubmitFileUpload}
            updateFilePageCount={handleUpdateFilePageCount}
          />
        </div>
      )}

      {activeTab === "comments" && <Comments taskId={taskId} />}

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
