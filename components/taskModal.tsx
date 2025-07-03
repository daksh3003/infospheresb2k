// File: components/taskModal.tsx

"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Save,
  Upload,
  Plus,
  Minus,
  FileText,
  Split,
  Info,
} from "lucide-react";
import { toast } from "react-toastify";
import { Progress } from "./ui/progress";
import { Tooltip } from "./ui/tooltip";
import { cn } from "@/lib/utils";

import { supabase } from "../utils/supabase";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
}

interface ProjectFormData {
  project_name: string;
  po_hours: string;
  mail_instruction: string;
  list_of_files: string;
  reference_file: string;
  delivery_date: string;
  delivery_time: string;
  completion_status: boolean;
  created_by: string;
}

interface TaskFormData {
  task_name: string;
  client_instruction: string;
  processor_type: string[];
  estimated_hours_ocr: string;
  estimated_hours_qc: string;
  estimated_hours_qa: string;
  completion_status: boolean;
  project_id: string;
  created_by: string;
}

interface FileFormData {
  file_name: string;
  page_count: string;
  assigned_to: {
    user_id: string;
    name: string;
    email: string;
    role: string;
  }[];
}

interface FileGroup {
  files: File[];
  taskData: TaskFormData;
  filesData: FileFormData[];
}

interface TaskIteration {
  task_id: string;
  iteration_number: number;
  current_stage: string;
  sent_by: string;
  assigned_to_processor_user_id: string;
  assigned_to_qc_user_id: string;
  assigned_to_qa_user_id: string;
  notes: string;
  stages: string[];
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Processor extends UserProfile {
  role: "processor";
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onTaskAdded,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [processors, setProcessors] = useState<Processor[]>([]);

  // Project form data
  const [projectData, setProjectData] = useState<ProjectFormData>({
    project_name: "",
    po_hours: "",
    mail_instruction: "",
    list_of_files: "",
    reference_file: "",
    delivery_date: "",
    delivery_time: "",
    completion_status: false,
    created_by: "",
  });

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileGroups, setFileGroups] = useState<FileGroup[]>([]);

  const steps = [
    {
      number: 1,
      title: "Project Information",
      description: "Enter basic project details",
      icon: FileText,
    },
    {
      number: 2,
      title: "File Upload",
      description: "Upload your project files",
      icon: Upload,
    },
    {
      number: 3,
      title: "File Organization",
      description: "Organize files into tasks",
      icon: Split,
    },
    {
      number: 4,
      title: "Task & File Details",
      description: "Configure task settings",
      icon: Save,
    },
  ];

  const progressPercentage = (currentStep / steps.length) * 100;

  const getStepTitle = () => {
    return steps[currentStep - 1].title;
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("id, name, email, role")
            .eq("id", user.id)
            .single();

          if (error) throw error;
          setCurrentUser(profile);
          setProjectData((prev) => ({ ...prev, created_by: user.id }));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    const fetchProcessors = async () => {
      try {
        const { data: processorData, error } = await supabase
          .from("profiles")
          .select("id, name, email, role")
          .eq("role", "processor");

        if (error) throw error;
        setProcessors(processorData);
      } catch (error) {
        console.error("Error fetching processors:", error);
        toast.error("Failed to load processors");
      }
    };

    if (isOpen) {
      fetchUserProfile();
      fetchProcessors();
    }
  }, [isOpen]);

  const handleProjectChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProjectData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
    e.target.value = "";
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate project form
      if (!projectData.project_name.trim()) {
        toast.error("Project name is required");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedFiles.length === 0) {
        toast.error("Please upload at least one file");
        return;
      }

      if (selectedFiles.length === 1) {
        // Single file - go directly to task creation
        initializeSingleFileGroup();
        setCurrentStep(4);
      } else {
        // Multiple files - show splitting option
        initializeFileGroups();
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (fileGroups.length === 0) {
        toast.error("Please organize files into groups");
        return;
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const initializeSingleFileGroup = () => {
    setFileGroups([
      {
        files: selectedFiles,
        taskData: {
          task_name: "",
          client_instruction: "",
          processor_type: [],
          estimated_hours_ocr: "",
          estimated_hours_qc: "",
          estimated_hours_qa: "",
          completion_status: false,
          project_id: "",
          created_by: currentUser?.id || "",
        },
        filesData: selectedFiles.map((file) => ({
          file_name: file.name,
          page_count: "",
          assigned_to: [],
        })),
      },
    ]);
  };

  const initializeFileGroups = () => {
    setFileGroups([
      {
        files: [],
        taskData: {
          task_name: "",
          client_instruction: "",
          processor_type: [],
          estimated_hours_ocr: "",
          estimated_hours_qc: "",
          estimated_hours_qa: "",
          completion_status: false,
          project_id: "",
          created_by: currentUser?.id || "",
        },
        filesData: [],
      },
    ]);
  };

  const addFileGroup = () => {
    setFileGroups((prev) => [
      ...prev,
      {
        files: [],
        taskData: {
          task_name: "",
          client_instruction: "",
          processor_type: [],
          estimated_hours_ocr: "",
          estimated_hours_qc: "",
          estimated_hours_qa: "",
          completion_status: false,
          project_id: "",
          created_by: currentUser?.id || "",
        },
        filesData: [],
      },
    ]);
  };

  const removeFileGroup = (groupIndex: number) => {
    if (fileGroups.length > 1) {
      setFileGroups((prev) => prev.filter((_, index) => index !== groupIndex));
    }
  };

  const assignFileToGroup = (fileIndex: number, groupIndexStr: string) => {
    const file = selectedFiles[fileIndex];

    // Remove file from all groups first
    setFileGroups((prev) => {
      const newGroups = prev.map((group) => ({
        ...group,
        files: group.files.filter((f) => f.name !== file.name),
        filesData: group.filesData.filter((fd) => fd.file_name !== file.name),
      }));

      // If groupIndexStr is empty, just remove from all groups
      if (groupIndexStr === "") {
        return newGroups;
      }

      const groupIndex = parseInt(groupIndexStr);

      // Add to the specified group
      if (groupIndex >= 0 && groupIndex < newGroups.length) {
        newGroups[groupIndex].files.push(file);
        newGroups[groupIndex].filesData.push({
          file_name: file.name,
          page_count: "",
          assigned_to: [],
        });
      }

      return newGroups;
    });
  };

  const removeFileFromGroup = (groupIndex: number, fileIndex: number) => {
    setFileGroups((prev) => {
      const newGroups = [...prev];
      newGroups[groupIndex].files.splice(fileIndex, 1);
      newGroups[groupIndex].filesData.splice(fileIndex, 1);
      return newGroups;
    });
  };

  const updateTaskData = (
    groupIndex: number,
    field: keyof TaskFormData,
    value: TaskFormData[keyof TaskFormData]
  ) => {
    setFileGroups((prev) => {
      const newGroups = [...prev];
      newGroups[groupIndex].taskData = {
        ...newGroups[groupIndex].taskData,
        [field]: value,
      };
      return newGroups;
    });
  };

  const updateFileData = (
    groupIndex: number,
    fileIndex: number,
    field: keyof FileFormData,
    value: string | string[]
  ) => {
    if (field === "assigned_to") {
      const processorId = value as string;
      setFileGroups((prev) => {
        const newGroups = [...prev];
        const currentAssignees =
          newGroups[groupIndex].filesData[fileIndex].assigned_to;

        // Check if processor is already assigned
        const isAlreadyAssigned = currentAssignees.some(
          (assignee) => assignee.user_id === processorId
        );

        if (isAlreadyAssigned) {
          // Remove processor if already assigned
          newGroups[groupIndex].filesData[fileIndex].assigned_to =
            currentAssignees.filter(
              (assignee) => assignee.user_id !== processorId
            );
        } else {
          // Add new processor
          const selectedProcessor = processors.find(
            (processor) => processor.id === processorId
          );
          if (selectedProcessor) {
            newGroups[groupIndex].filesData[fileIndex].assigned_to = [
              ...currentAssignees,
              {
                user_id: selectedProcessor.id,
                name: selectedProcessor.name,
                email: selectedProcessor.email,
                role: selectedProcessor.role,
              },
            ];
          }
        }
        console.log("newGroups", newGroups);
        return newGroups;
      });
    } else {
      setFileGroups((prev) => {
        const newGroups = [...prev];
        newGroups[groupIndex].filesData[fileIndex] = {
          ...newGroups[groupIndex].filesData[fileIndex],
          [field]: value,
        };
        return newGroups;
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    console.log("fileGroups", fileGroups);
    console.log("projectData", projectData);
    console.log("selectedFiles", selectedFiles);

    try {
      if (!currentUser) {
        toast.error("You must be logged in to create a project");
        return;
      }

      // 1. Create project in projects_test table
      const { data: projectResult, error: projectError } = await supabase
        .from("projects_test")
        .insert([
          {
            ...projectData,
            list_of_files: selectedFiles.map((f) => f.name),
          },
        ])
        .select("project_id")
        .single();

      if (projectError) {
        console.error("Error creating project:", projectError);
        toast.error(`Failed to create project: ${projectError.message}`);
        return;
      }

      const projectId = projectResult.project_id;

      // 2. Create tasks and files for each group
      for (let groupIndex = 0; groupIndex < fileGroups.length; groupIndex++) {
        const group = fileGroups[groupIndex];

        // Create task
        const { data: taskResult, error: taskError } = await supabase
          .from("tasks_test")
          .insert([
            {
              ...group.taskData,
              project_id: projectId,
            },
          ])
          .select("task_id")
          .single();

        if (taskError) {
          console.error("Error creating task:", taskError);
          toast.error(
            `Failed to create task ${groupIndex + 1}: ${taskError.message}`
          );
          continue;
        }

        const taskId = taskResult.task_id;

        const { data: taskIterationResult, error: taskIterationError } =
          await supabase.from("task_iterations").insert([
            {
              task_id: taskId,
              iteration_number: 1,
              current_stage: "Processor",
              sent_by: "PM",
              stages: ["PM"],
              notes: "",
            },
          ]);

        if (taskIterationError) {
          console.error("Error creating task iteration:", taskIterationError);
          toast.error(
            `Failed to create task iteration: ${taskIterationError.message}`
          );
          continue;
        }

        const { data: process_logs, error: process_logsError } = await supabase
          .from("process_logs_test")
          .insert([
            {
              task_id: taskId,
              current_stage: "Processor",
              sent_by: "PM",
              assigned_to: [],
            },
          ]);

        if (process_logsError) {
          console.error("Error creating process logs:", process_logsError);
          toast.error(
            `Failed to create process logs: ${process_logsError.message}`
          );
          continue;
        }

        // Upload files and create file records
        for (let fileIndex = 0; fileIndex < group.files.length; fileIndex++) {
          const file = group.files[fileIndex];
          const fileData = group.filesData[fileIndex];

          // Upload file to storage
          let date = new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          });
          date = date.replaceAll("/", "-");
          const filePathInStorage = `${taskId}/${date}_${file.name}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("task-files")
              .upload(filePathInStorage, file, {
                contentType: file.type,
                upsert: true,
              });

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            toast.error(
              `Failed to upload file ${file.name}: ${uploadError.message}`
            );
            continue;
          }

          console.log("fileData", fileData);

          // Create file record
          const { error: fileRecordError } = await supabase
            .from("files_test")
            .insert([
              {
                ...fileData,
                task_id: taskId,
                file_name: file.name,
              },
            ]);

          if (fileRecordError) {
            console.error("Error creating file record:", fileRecordError);
            toast.error(
              `Failed to create file record for ${file.name}: ${fileRecordError.message}`
            );
          }
        }
      }

      toast.success("Project and tasks created successfully!");

      // Reset form
      setProjectData({
        project_name: "",
        po_hours: "",
        mail_instruction: "",
        list_of_files: "",
        reference_file: "",
        delivery_date: "",
        delivery_time: "",
        completion_status: false,
        created_by: currentUser.id,
      });
      setSelectedFiles([]);
      setFileGroups([]);
      setCurrentStep(1);

      if (onTaskAdded) {
        onTaskAdded();
      }
      onClose();
    } catch (error) {
      console.error("Unexpected error during submission:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast.error(`An unexpected error occurred: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="fixed inset-0 bg-black opacity-50"></div>
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{getStepTitle()}</h2>
            <p className="text-sm text-gray-500">
              {steps[currentStep - 1].description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2 bg-gray-50">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.number}
                  className={cn(
                    "flex flex-col items-center relative",
                    currentStep >= step.number
                      ? "text-blue-600"
                      : "text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      currentStep >= step.number ? "bg-blue-100" : "bg-gray-100"
                    )}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className="text-xs mt-1">{step.title}</span>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "absolute top-4 left-full w-[calc(100%-2rem)] h-[2px]",
                        currentStep > step.number
                          ? "bg-blue-600"
                          : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progressPercentage} className="h-1" />
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Project Name *
                  <Tooltip content="Enter a unique name for your project">
                    <Info className="inline-block w-4 h-4 ml-1 text-gray-400" />
                  </Tooltip>
                </label>
                <input
                  type="text"
                  name="project_name"
                  value={projectData.project_name}
                  onChange={handleProjectChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="Enter project name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    PO Hours
                    <Tooltip content="Estimated project hours">
                      <Info className="inline-block w-4 h-4 ml-1 text-gray-400" />
                    </Tooltip>
                  </label>
                  <input
                    type="text"
                    name="po_hours"
                    value={projectData.po_hours}
                    onChange={handleProjectChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter PO hours"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reference File
                  </label>
                  <input
                    type="text"
                    name="reference_file"
                    value={projectData.reference_file}
                    onChange={handleProjectChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Enter reference file"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mail Instructions
                  <Tooltip content="Special instructions for email communications">
                    <Info className="inline-block w-4 h-4 ml-1 text-gray-400" />
                  </Tooltip>
                </label>
                <textarea
                  name="mail_instruction"
                  value={projectData.mail_instruction}
                  onChange={handleProjectChange}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Enter mail instructions"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    name="delivery_date"
                    value={projectData.delivery_date}
                    onChange={handleProjectChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Delivery Time
                  </label>
                  <input
                    type="time"
                    name="delivery_time"
                    value={projectData.delivery_time}
                    onChange={handleProjectChange}
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-sm font-medium">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500">
                    Support for multiple files
                  </span>
                </label>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Selected Files</h3>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* File Organization Step */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">File Groups</h3>
                <button
                  onClick={addFileGroup}
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Group
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Available Files</h4>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2"
                    >
                      <span className="text-sm">{file.name}</span>
                      <select
                        onChange={(e) =>
                          assignFileToGroup(index, e.target.value)
                        }
                        className="text-sm border rounded"
                      >
                        <option value="">Select Group</option>
                        {fileGroups.map((_, groupIndex) => (
                          <option key={groupIndex} value={groupIndex}>
                            Group {groupIndex + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  {fileGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Group {groupIndex + 1}</h4>
                        <button
                          onClick={() => removeFileGroup(groupIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {group.files.map((file, fileIndex) => (
                        <div
                          key={fileIndex}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2"
                        >
                          <span className="text-sm">{file.name}</span>
                          <button
                            onClick={() =>
                              removeFileFromGroup(groupIndex, fileIndex)
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Task Details Step */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {fileGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <h3 className="font-medium">
                    Task Group {groupIndex + 1} Details
                  </h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Task Name *
                    </label>
                    <input
                      type="text"
                      value={group.taskData.task_name}
                      onChange={(e) =>
                        updateTaskData(groupIndex, "task_name", e.target.value)
                      }
                      className="w-full p-2 border rounded-md"
                      placeholder="Enter task name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Client Instructions
                    </label>
                    <textarea
                      value={group.taskData.client_instruction}
                      onChange={(e) =>
                        updateTaskData(
                          groupIndex,
                          "client_instruction",
                          e.target.value
                        )
                      }
                      className="w-full p-2 border rounded-md"
                      rows={3}
                      placeholder="Enter client instructions"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Est. Hours (OCR)
                      </label>
                      <input
                        type="number"
                        value={group.taskData.estimated_hours_ocr}
                        onChange={(e) =>
                          updateTaskData(
                            groupIndex,
                            "estimated_hours_ocr",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded-md"
                        placeholder="Hours"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Est. Hours (QC)
                      </label>
                      <input
                        type="number"
                        value={group.taskData.estimated_hours_qc}
                        onChange={(e) =>
                          updateTaskData(
                            groupIndex,
                            "estimated_hours_qc",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded-md"
                        placeholder="Hours"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Est. Hours (QA)
                      </label>
                      <input
                        type="number"
                        value={group.taskData.estimated_hours_qa}
                        onChange={(e) =>
                          updateTaskData(
                            groupIndex,
                            "estimated_hours_qa",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border rounded-md"
                        placeholder="Hours"
                      />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Files</h4>
                    <div className="space-y-2">
                      {group.filesData.map((fileData, fileIndex) => (
                        <div
                          key={fileIndex}
                          className="grid grid-cols-2 gap-4 p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <label className="block text-xs text-gray-500">
                              File Name
                            </label>
                            <span className="text-sm">
                              {fileData.file_name}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Page Count
                              </label>
                              <input
                                type="number"
                                value={
                                  group.filesData[fileIndex]?.page_count || ""
                                }
                                onChange={(e) =>
                                  updateFileData(
                                    groupIndex,
                                    fileIndex,
                                    "page_count",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-2">
                                Assigned To
                              </label>
                              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                {processors.map((processor) => {
                                  const isAssigned = group.filesData[
                                    fileIndex
                                  ].assigned_to.some(
                                    (assignee) =>
                                      assignee.user_id === processor.id
                                  );
                                  return (
                                    <div
                                      key={processor.id}
                                      className="flex items-center space-x-2"
                                    >
                                      <input
                                        type="checkbox"
                                        id={`processor-${groupIndex}-${fileIndex}-${processor.id}`}
                                        checked={isAssigned}
                                        onChange={() =>
                                          updateFileData(
                                            groupIndex,
                                            fileIndex,
                                            "assigned_to",
                                            processor.id
                                          )
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <label
                                        htmlFor={`processor-${groupIndex}-${fileIndex}-${processor.id}`}
                                        className="text-sm text-gray-700 cursor-pointer hover:text-gray-900"
                                      >
                                        {processor.name}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-between">
          <button
            onClick={handlePrevStep}
            className={`flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors ${
              currentStep === 1 ? "invisible" : ""
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          <button
            onClick={currentStep === 4 ? handleSubmit : handleNextStep}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
          >
            {currentStep === 4 ? (
              isSubmitting ? (
                "Creating..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Create Task
                </>
              )
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
