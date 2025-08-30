"use client";

import { TaskDetailBackButton } from "@/components/task-detail-back-button";
import React, { useState, Fragment, use, useEffect } from "react";
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

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const router = useRouter();

  // Loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // state hooks  :
  const [status, setStatus] = useState<
    "pending" | "in-progress" | "paused" | "completed" | "overdue" | "returned"
  >("pending");
  const [realStatus, setRealStatus] = useState<string>("pending");
  const [statusLoading, setStatusLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  interface FileWithPageCount extends File {
    pageCount?: number;
  }
  const [filesToBeUploaded, setfilesToBeUploaded] = useState<
    FileWithPageCount[]
  >([]);
  const [activeTab, setActiveTab] = useState<"files" | "comments">("files");
  const [uploadedFiles, setUploadedFiles] = useState<
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

  // task states :
  const [task, setTask] = useState<any>({
    task_id: taskId,
    title: "",
    client_instruction: "",
    mail_instruction: "",
    estimated_hours_qc: 0,
    estimated_hours_qa: 0,
    estimated_hours_ocr: 0,
    priority: "low",
    dueDate: "",
    deliveryTime: "",
    assignedTo: "",
    createdBy: "",
    attachments: [],
    createdDate: "",
    estimatedHours: 0,
    project_id: "",
    overall_completion_status: false,
    completion_status: false,
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isQcinLoop, setIsQcinLoop] = useState<boolean>(true);

  // file states :
  const [storage_name, setStorageName] = useState<string>("");
  const [folder_path, setFolderPath] = useState<string>("");
  const [version, setVersion] = useState<number>(1);

  // user states :

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const [selectedUserData, setSelectedUserData] = useState<any>({});
  const [isAssigning, setIsAssigning] = useState(false);
  const [isTaskPickedUp, setIsTaskPickedUp] = useState(false);

  // Download history refresh trigger
  const [downloadHistoryRefresh, setDownloadHistoryRefresh] = useState(0);

  // Fetch real status from database
  const fetchRealStatus = async () => {
    try {
      setStatusLoading(true);
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
        setStatus(
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
      setStatusLoading(false);
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
    additionalMetadata?: any
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
      const { data: response, error: error } = await supabase
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
    console.log("pressed");
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

    console.log(response);
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

    if (overall_completion_status) {
      setCompletionStatus(true);
    }
    try {
      // // Update the task in Supabase
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

        // check all the tasks mapped to the same project are completed or not
        const { data: projectTasks, error: projectTasksError } = await supabase
          .from("tasks_test")
          .select("completion_status")
          .eq("project_id", task.project_id);

        console.log("projectTasks", projectTasks);

        if (projectTasksError) {
          console.error("Error fetching project tasks:", projectTasksError);
          return;
        }

        const isAllTasksCompleted = projectTasks.every(
          (task) => task.completion_status
        );

        console.log("isAllTasksCompleted", isAllTasksCompleted);

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

    const { data, error } = await supabase
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

      // Log the download to database
      if (currentUser) {
        try {
          // Generate a unique file_id based on file name and path
          const file_id = `${storage_name}_${folder_path}_${fileName}`;

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
            name: currentUser.full_name || "Unknown User",
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
                folder_path: folder_path,
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
        folder_path: folder_path,
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
      if (currentUser) {
        const { error: logError } = await supabase
          .from("track_downloads")
          .insert({
            task_id: taskId,
            file_name: fileName,
            storage_name: storage_name,
            folder_path: folder_path,
            downloaded_details: [
              {
                name: currentUser.name || "Unknown User",
                email: currentUser.email || "",
                role: currentUser.role || "user",
                time: new Date().toISOString(),
              },
            ],
          });

        if (logError) {
          console.error("Error logging download:", logError);
        } else {
          // Refresh download history
          setDownloadHistoryRefresh((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const fetchProcessorFiles = async () => {
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

    setIsQcinLoop(isQcInLoop);

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

      // Fetch page counts from files_test table for processor files
      const processorFilesWithPageCount = await Promise.all(
        processorFiles.map(async (file) => {
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

      setProcessorFiles(processorFilesWithPageCount);

      console.log("Processor Files:", processorFiles);
    }

    // Fetch task data and set task state
    const { data: simpleTaskData, error: simpleError } = await supabase
      .from("tasks_test")
      .select("*")
      .eq("task_id", taskId)
      .single();

    if (simpleError) {
      console.error("Error fetching simple task data:", simpleError);
      return;
    }

    // Fetch creator info separately
    const { data: creatorData, error: creatorError } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("id", simpleTaskData.created_by)
      .single();

    if (creatorError) {
      console.error("Error fetching creator data:", creatorError);
      return;
    }

    // Set task with creator info
    const taskData = {
      task_id: simpleTaskData.task_id,
      project_id: simpleTaskData.project_id,
      title: simpleTaskData.task_name,
      client_instruction: simpleTaskData.client_instruction || "",
      mail_instruction: simpleTaskData.mail_instruction || "",
      estimated_hours_qc: simpleTaskData.estimated_hours_qc || 0,
      estimated_hours_qa: simpleTaskData.estimated_hours_qa || 0,
      estimated_hours_ocr: simpleTaskData.estimated_hours_ocr || 0,
      priority: simpleTaskData.priority || "low",
      dueDate: simpleTaskData.delivery_date || "",
      deliveryTime: simpleTaskData.delivery_time || "",
      assignedTo: "",
      createdBy: {
        id: creatorData.id,
        name: creatorData.name,
        email: creatorData.email,
        role: creatorData.role,
      },
      comments: simpleTaskData.comments || [],
      createdDate: simpleTaskData.created_at,
      overall_completion_status: simpleTaskData.overall_completion_status,
      completion_status: simpleTaskData.completion_status,
      attachments: simpleTaskData.attachments || [],
      estimatedHours: simpleTaskData.estimated_hours || 0,
    };
    
    setTask(taskData);

    // Set real status from database
    if (simpleTaskData.status) {
      setStatus(
        simpleTaskData.status as
          | "pending"
          | "in-progress"
          | "paused"
          | "completed"
          | "overdue"
          | "returned"
      );
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
        const { data: StoreFiles, error: uploadError } = await supabase.storage
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
            taken_by: currentUser?.id || null,
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
      setIsTaskPickedUp(data?.assigned_to_processor_user_id || false);

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

      var folder_path_correction = "";
      var storage_name_correction = "";

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
    } catch (error) {
      console.error("Error in fetchData:", error);
    }
  };

  const fetchAvailableUsers = async () => {
    let roleToFetch = "";
    if (currentStage === "Processor") {
      roleToFetch = "processor";
    } else if (currentStage === "QC") {
      roleToFetch = "qcTeam";
    } else if (currentStage === "QA") {
      roleToFetch = "qaTeam";
    }

    console.log("roleToFetch : ", roleToFetch);

    try {
      // This would need a new API endpoint for fetching users by role
      // For now, we'll keep the direct call but mark it for future API migration
      const { data: users, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", roleToFetch);

      if (error) {
        console.log("error : ", error);
        console.error("Error fetching users:", error);
        return;
      }

      console.log("users : ", users);

      setAvailableUsers(users || []);
    } catch (error) {
      console.error("Error in fetchAvailableUsers:", error);
    }
  };

  const handleAssignTask = async (selectedUserData: any) => {
    if (!selectedUserData) {
      toast.error("Please select a user to assign the task");
      return;
    }

    setIsAssigning(true);
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
        // PGRST116 is "not found" error
        console.error("Error checking existing log:", fetchError);
        throw fetchError;
      }

      const now = new Date().toISOString();

      // Create new assignment entry
      const newAssignment = {
        name: selectedUserData.name,
        email: selectedUserData.email,
        role: selectedUserData.role,
        user_id: selectedUserData.id,
        assigned_at: now,
      };

      console.log("newAssignment : ", newAssignment);
      console.log("existingLog : ", existingLog);

      // Handle existing or new assignedTo array
      let assignedToArray: any[] = [];

      // const logData = {
      //   task_id: taskId,
      //   current_stage: currentStage,
      //   sent_by: sentBy,
      //   assigned_to: assignedToArray,
      //   created_at: now,
      // };

      if (existingLog?.assigned_to) {
        // Check if user is already assigned
        const isAlreadyAssigned = existingLog.assigned_to.some(
          (assignment: any) => assignment.user_id === selectedUserData.id
        );

        if (isAlreadyAssigned) {
          toast.error("This user is already assigned to this task");
          setIsAssigning(false);
          return;
        }

        // Add new assignment to existing array
        assignedToArray = [...existingLog.assigned_to, newAssignment];
      } else {
        // Create new array with first assignment
        assignedToArray = [newAssignment];
      }

      const logData = {
        task_id: taskId,
        assigned_to: assignedToArray,
      };

      await api.assignTask(taskId, assignedToArray);
      toast.success("Task assigned successfully!");
      await fetchData(); // Refresh the data
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error("Failed to assign task. Please try again.");
    } finally {
      setIsAssigning(false);
      setSelectedUserData({}); // Reset selection
    }
  };

  // Fetch task details from API
  const fetchTaskDetails = async () => {
    try {
      const taskDetails = await api.getTaskDetails(taskId);
      if (taskDetails.task) {
        setTask({
          task_id: taskDetails.task.task_id || taskId,
          title: taskDetails.task.task_name || taskDetails.task.title || "",
          client_instruction: taskDetails.task.client_instruction || "",
          mail_instruction: taskDetails.task.mail_instruction || "",
          estimated_hours_qc: taskDetails.task.estimated_hours_qc || 0,
          estimated_hours_qa: taskDetails.task.estimated_hours_qa || 0,
          estimated_hours_ocr: taskDetails.task.estimated_hours_ocr || 0,
          priority: taskDetails.task.priority || "low",
          dueDate: taskDetails.task.delivery_date || taskDetails.task.dueDate || "",
          deliveryTime: taskDetails.task.delivery_time || taskDetails.task.deliveryTime || "",
          assignedTo: taskDetails.task.assigned_to || taskDetails.task.assignedTo || "",
          createdBy: taskDetails.task.created_by || taskDetails.task.createdBy || "",
          attachments: taskDetails.task.attachments || [],
          createdDate: taskDetails.task.created_at || taskDetails.task.createdDate || "",
          estimatedHours: taskDetails.task.estimated_hours || taskDetails.task.estimatedHours || 0,
          project_id: taskDetails.task.project_id || "",
          overall_completion_status: taskDetails.task.overall_completion_status || false,
          completion_status: taskDetails.task.completion_status || false,
        });

        // Also set available users if provided
        if (taskDetails.availableUsers) {
          setAvailableUsers(taskDetails.availableUsers);
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
          fetchRealStatus(), // Add fetchRealStatus to initial data loading
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
          currentUser={currentUser}
          currentStage={currentStage}
          sentBy={sentBy}
          taskId={taskId}
          handleStartTask={handleStartTask}
          handlePauseResumeTask={handlePauseResumeTask}
          handleSendTo={handleSendTo}
          showSubmitToButton={showSubmitToButton}
          setShowHandoverDialog={setShowHandoverDialog}
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

      {activeTab === "comments" && (
        <Comments
          taskId={taskId}
        />
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
