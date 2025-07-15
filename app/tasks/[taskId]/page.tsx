"use client";

import { TaskDetailBackButton } from "@/components/task-detail-back-button";
import React, { useState, Fragment, use, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { supabase } from "@/utils/supabase";
import TimelineModal from "@/components/Timeline/TimelineModal";
import Dialog from "@/components/Dialog";
import { MainTaskCard } from "@/components/MainTaskCard";
import { TaskAttachments } from "@/components/TaskAttachments";
import { FileUpload } from "@/components/FileUpload";
import { Comments } from "@/components/Comments";
import { FooterButtons } from "@/components/FooterButtons";
import LoadingScreen from "@/components/ui/loading-screen";

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const router = useRouter();

  // Loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // state hooks  :
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
    comments: [],
    createdDate: "",
    estimatedHours: 0,
    project_id: "",
  });

  // file states :
  const [PMFiles, setPMFiles] = useState<string[]>([]);
  const [correctionFiles, setCorrectionFiles] = useState<string[]>([]);
  const [processorFiles, setProcessorFiles] = useState<string[]>([]);

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

  // Handle task actions
  const handleStartTask = async () => {
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

      setPMFiles(PMFiles.map((file) => file.name));

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
        setCorrectionFiles(correctionFiles?.map((file) => file.name) || []);
        // }
      }

      let folder_path = "";
      let storage_name = "";

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
        .select("id,  name, email, role")
        .eq("id", simpleTaskData.created_by)
        .single();

      if (creatorError) {
        console.error("Error fetching creator data:", creatorError);
        return;
      }

      // Set task with creator info
      setTask((prev: any) => ({
        ...prev,
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
      }));

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

      setUploadedFiles(uploadedFiles.map((file) => file.name));
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

      if (existingLog) {
        const { error: upsertError } = await supabase
          .from("files_test")
          .update({ assigned_to: logData.assigned_to })
          .eq("task_id", taskId);

        if (upsertError) {
          throw upsertError;
        }
      } else {
        const { error: upsertError } = await supabase
          .from("files_test")
          .insert(logData);

        if (upsertError) {
          throw upsertError;
        }
      }
      // Upsert the record

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
          status={status}
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
          status={status}
          SubmitTo={SubmitTo}
          onAssignTask={handleAssignTask}
        />
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
          />
        </div>
      )}

      {activeTab === "comments" && (
        <Comments
          task={task}
          newComment={newComment}
          setNewComment={setNewComment}
          handleSubmitComment={handleSubmitComment}
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
