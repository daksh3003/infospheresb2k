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
} from "lucide-react";
import { toast } from "react-toastify";

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
  taken_by: string;
  assigned_to: string;
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

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onTaskAdded,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

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

  // Steps: 1 = Project Form, 2 = File Upload, 3 = File Splitting (if multiple files), 4 = Task Creation
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Project Information";
      case 2:
        return "File Upload";
      case 3:
        return "File Organization";
      case 4:
        return "Task & File Details";
      default:
        return "Project Creation";
    }
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

    if (isOpen) {
      fetchUserProfile();
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
          taken_by: "",
          assigned_to: "",
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
          taken_by: "",
          assigned_to: "",
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
    value: string
  ) => {
    setFileGroups((prev) => {
      const newGroups = [...prev];
      newGroups[groupIndex].filesData[fileIndex] = {
        ...newGroups[groupIndex].filesData[fileIndex],
        [field]: value,
      };
      return newGroups;
    });
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {getStepTitle()}
            </h2>
            <p className="text-sm text-gray-500">Step {currentStep} of 4</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Project Form */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="project_name"
                  value={projectData.project_name}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Hours
                  </label>
                  <input
                    type="number"
                    name="po_hours"
                    value={projectData.po_hours}
                    onChange={handleProjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    step="0.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference File
                  </label>
                  <input
                    type="text"
                    name="reference_file"
                    value={projectData.reference_file}
                    onChange={handleProjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mail Instructions
                </label>
                <textarea
                  name="mail_instruction"
                  value={projectData.mail_instruction}
                  onChange={handleProjectChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Date
                  </label>
                  <input
                    type="date"
                    name="delivery_date"
                    value={projectData.delivery_date}
                    onChange={handleProjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Time
                  </label>
                  <input
                    type="time"
                    name="delivery_time"
                    value={projectData.delivery_time}
                    onChange={handleProjectChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: File Upload */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Files *
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-1 text-sm text-gray-500">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        Multiple files supported
                      </p>
                    </div>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      multiple
                    />
                  </label>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected Files ({selectedFiles.length}):
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-200"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: File Organization */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800">
                  Organize Files into Tasks
                </h3>
                <button
                  onClick={addFileGroup}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus size={16} className="mr-1" />
                  Add Task Group
                </button>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                You have {selectedFiles.length} files to organize into separate
                tasks. Use the dropdown below to assign files to different task
                groups.
              </div>

              {/* Available Files Section */}
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-800 mb-3">
                  Available Files ({selectedFiles.length})
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedFiles.map((file, fileIndex) => {
                    const assignedGroup = fileGroups.findIndex((group) =>
                      group.files.some((f) => f.name === file.name)
                    );

                    return (
                      <div
                        key={fileIndex}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {assignedGroup >= 0 && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              Task {assignedGroup + 1}
                            </span>
                          )}
                          <select
                            value={assignedGroup >= 0 ? assignedGroup : ""}
                            onChange={(e) =>
                              assignFileToGroup(fileIndex, e.target.value)
                            }
                            className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Unassigned</option>
                            {fileGroups.map((_, groupIndex) => (
                              <option key={groupIndex} value={groupIndex}>
                                Task Group {groupIndex + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Groups Section */}
              {fileGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">
                      Task Group {groupIndex + 1} ({group.files.length} files)
                    </h4>
                    {fileGroups.length > 1 && (
                      <button
                        onClick={() => removeFileGroup(groupIndex)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Minus size={16} />
                      </button>
                    )}
                  </div>

                  {group.files.length > 0 ? (
                    <div className="space-y-2">
                      {group.files.map((file, fileIndex) => (
                        <div
                          key={fileIndex}
                          className="flex items-center justify-between p-2 bg-blue-50 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-blue-700">
                              {file.name}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              removeFileFromGroup(groupIndex, fileIndex)
                            }
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-gray-200"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No files assigned to this group
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Step 4: Task and File Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {fileGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Task {groupIndex + 1} Details
                  </h3>

                  {/* Task Details */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-3">
                      Task Information
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Task Name *
                        </label>
                        <input
                          type="text"
                          value={group.taskData.task_name}
                          onChange={(e) =>
                            updateTaskData(
                              groupIndex,
                              "task_name",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Processor Type
                          </label>
                          <select
                            value={group.taskData.processor_type[0] || ""}
                            onChange={(e) =>
                              updateTaskData(groupIndex, "processor_type", [
                                e.target.value,
                              ])
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select Type</option>
                            <option value="OCR">OCR</option>
                            <option value="Prep">Prep</option>
                            <option value="DTP">DTP</option>
                            <option value="Source Creation">
                              Source Creation
                            </option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Est. Hours OCR
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            step="0.5"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Est. Hours QC
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            step="0.5"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Est. Hours QA
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            step="0.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File Details */}
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">
                      File Details ({group.files.length} files)
                    </h4>
                    <div className="space-y-3">
                      {group.files.map((file, fileIndex) => (
                        <div
                          key={fileIndex}
                          className="border border-gray-100 rounded p-3 bg-gray-50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">
                              {file.name}
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
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Taken By
                              </label>
                              <input
                                type="text"
                                value={
                                  group.filesData[fileIndex]?.taken_by || ""
                                }
                                onChange={(e) =>
                                  updateFileData(
                                    groupIndex,
                                    fileIndex,
                                    "taken_by",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Assigned To
                              </label>
                              <input
                                type="text"
                                value={
                                  group.filesData[fileIndex]?.assigned_to || ""
                                }
                                onChange={(e) =>
                                  updateFileData(
                                    groupIndex,
                                    fileIndex,
                                    "assigned_to",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              />
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
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <div className="flex space-x-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                <ChevronLeft size={16} className="mr-2" /> Back
              </button>
            )}
          </div>

          <div className="flex space-x-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Next <ChevronRight size={16} className="ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                disabled={isSubmitting}
              >
                <Save size={16} className="mr-2" />
                {isSubmitting ? "Creating..." : "Create Project"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
