// File: components/task-card.tsx

import React, { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Save,
  Upload,
  Languages,
} from "lucide-react";
import { toast } from "react-toastify";

import { supabase } from "../utils/supabase";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: () => void;
}

interface FormData {
  // Form1 Fields
  serialNumber: string;
  taskId: string;
  clientInstruction: string;
  mailInstruction: string;
  projectName: string;
  numberOfFiles: string;
  numberOfPages: string;
  language: string;
  processType: string;
  deliveryDate: string;
  estimatePOHours: string;
  listOfFiles: string;
  uploadedFiles: FileList | null;

  // Form2 Fields
  fileName: string;
  estimatedHoursOCR: string;
  estimatedHoursQC: string;
  estimatedHoursQA: string;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onTaskAdded,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    // Form1 Fields
    serialNumber: "",
    taskId: "",
    clientInstruction: "",
    mailInstruction: "",
    projectName: "",
    numberOfFiles: "",
    numberOfPages: "",
    language: "",
    processType: "",
    deliveryDate: "",
    estimatePOHours: "",
    listOfFiles: "",
    uploadedFiles: null,

    // Form2 Fields
    fileName: "",
    estimatedHoursOCR: "",
    estimatedHoursQC: "",
    estimatedHoursQA: "",
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "file" ? (e.target as HTMLInputElement).files : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let currentUserId: string | null = null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      currentUserId = user?.id || null;
      if (
        !currentUserId &&
        formData.uploadedFiles &&
        formData.uploadedFiles.length > 0
      ) {
        console.warn(
          "Attempting to upload file without an authenticated user. This might be restricted by RLS."
        );
      }
    } catch (authError) {
      console.warn("Could not get authenticated user:", authError);
    }

    try {
      // 1. Insert into 'projects' table
      const file_names = [];
      if (formData.uploadedFiles && formData.uploadedFiles.length > 0) {
        for (let i = 0; i < formData.uploadedFiles.length; i++) {
          file_names.push(formData.uploadedFiles[i].name);
        }
      }

      const projectCoreData = {
        project_name: formData.projectName,
        task_id: formData.taskId,
        po_hours: parseFloat(formData.estimatePOHours) || 0,
        mail_instruction: formData.mailInstruction,
        file_count: formData.numberOfFiles,
        page_count: formData.numberOfPages,
        language: formData.language,
        process_type: formData.processType,
        delivery_date: formData.deliveryDate || null,
        serial_number: formData.serialNumber,
        client_instruction: formData.clientInstruction,
        list_of_files: file_names,
        reference_file_name: formData.fileName || null,
        estimated_hours_ocr: parseFloat(formData.estimatedHoursOCR) || 0,
        estimated_hours_qc: parseFloat(formData.estimatedHoursQC) || 0,
        estimated_hours_qa: parseFloat(formData.estimatedHoursQA) || 0,
        created_by: currentUserId,
        created_at: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
        updated_at: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      };

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .insert([projectCoreData])
        .select()
        .single();

      if (projectError) {
        console.error("Error inserting project:", projectError);
        alert(`Failed to save project: ${projectError.message}`);
        setIsSubmitting(false);
        return;
      }

      if (!projectData) {
        console.error("No project data returned after insert.");
        alert("Failed to save project: No data returned.");
        setIsSubmitting(false);
        return;
      }

      const newProjectId = projectData.id;
      let newFileId: string | null = null;
      let uploadedFilePath: string | null = null;
      let originalFileName: string | null = null;
      let fileSize: number | null = null;

      // 2. Handle File Upload
      if (formData.uploadedFiles && formData.uploadedFiles.length > 0) {
        for (let i = 0; i < formData.uploadedFiles.length; i++) {
          const fileToUpload = formData.uploadedFiles[i];
          originalFileName = fileToUpload.name;
          fileSize = fileToUpload.size;
          let date = new Date().toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          });
          date = date.replaceAll("/", "-");
          const filePathInStorage = `${newProjectId}/${date}_${originalFileName}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("task-files")
              .upload(filePathInStorage, fileToUpload, {
                contentType: fileToUpload.type,
                upsert: true,
              });

          if (uploadError) {
            console.error("Error uploading file:", uploadError);
            alert(`Failed to upload file: ${uploadError.message}`);
            setIsSubmitting(false);
            return;
          }
          uploadedFilePath = uploadData.path;
        }
      }

      // 3. Insert into 'file_versions' table (if a file was uploaded)
      if (uploadedFilePath && originalFileName) {
        const fileVersionData = {
          project_id: newProjectId,
          uploaded_by_user_id: currentUserId,
          stage_uploaded_at: "PM",
          file_name: originalFileName,
          file_path_supabase_storage: uploadedFilePath,
          page_count: formData.numberOfPages
            ? parseInt(formData.numberOfPages)
            : null,
          file_size_bytes: fileSize,
          version_notes: "Initial file uploaded during task creation.",
        };

        const { data: fileVersion, error: fileVersionError } = await supabase
          .from("file_versions")
          .insert([fileVersionData])
          .select("id")
          .single();

        if (fileVersionError) {
          console.error("Error inserting file version:", fileVersionError);
          alert(`Failed to save file version: ${fileVersionError.message}`);
          setIsSubmitting(false);
          return;
        }
        newFileId = fileVersion.id;
      }

      // 4. Insert into 'task_iterations' table
      const taskIterationData = {
        project_id: newProjectId,
        iteration_number: 1,
        current_stage: "PM",
        status_flag: "pending_action",
        // current_file_version_id: newFileId,
        assigned_to_processor_user_id: currentUserId,
        notes: "Task created.",
        sent_by: "PM",
      };

      const { data: iteration, error: iterationError } = await supabase
        .from("task_iterations")
        .insert([taskIterationData])
        .select("id")
        .single();

      if (iterationError) {
        console.error("Error inserting task iteration:", iterationError);
        alert(`Failed to save task iteration: ${iterationError.message}`);
        setIsSubmitting(false);
        return;
      }
      const newTaskIterationId = iteration.id;
      if (newFileId && newTaskIterationId) {
        const { error: updateFileError } = await supabase
          .from("file_versions")
          .update({ task_iteration_id: newTaskIterationId })
          .eq("id", newFileId);

        if (updateFileError) {
          console.error(
            "Error updating file version with iteration ID:",
            updateFileError
          );
        }
      }

      // 5. Insert into 'process_logs' table
      const processLogData = {
        task_iteration_id: newTaskIterationId,
        user_id: currentUserId,
        stage_acted_upon: "PM",
        action_taken: "created_task",
        log_notes: `Project '${formData.projectName}' created. ${
          originalFileName
            ? `Initial file: ${originalFileName}`
            : "No initial file."
        }`,
        hours_spent_ocr: formData.estimatedHoursOCR
          ? parseFloat(formData.estimatedHoursOCR)
          : null,
        hours_spent_qc: formData.estimatedHoursQC
          ? parseFloat(formData.estimatedHoursQC)
          : null,
        hours_spent_qa: formData.estimatedHoursQA
          ? parseFloat(formData.estimatedHoursQA)
          : null,
      };

      const { error: logError } = await supabase
        .from("process_logs")
        .insert([processLogData]);

      if (logError) {
        console.warn("Failed to save process log:", logError.message);
      }

      console.log(
        "Successfully added project and initial iteration. Project ID:",
        newProjectId,
        "Iteration ID:",
        newTaskIterationId
      );

      toast("Task successfully added ", {
        type: "success",
        position: "top-right",
      });

      setFormData({
        serialNumber: "",
        taskId: "",
        clientInstruction: "",
        mailInstruction: "",
        projectName: "",
        numberOfFiles: "",
        numberOfPages: "",
        language: "",
        processType: "",
        deliveryDate: "",
        estimatePOHours: "",
        listOfFiles: "",
        uploadedFiles: null,
        fileName: "",
        estimatedHoursOCR: "",
        estimatedHoursQC: "",
        estimatedHoursQA: "",
      });
      setCurrentPage(1);
      if (onTaskAdded) {
        onTaskAdded();
      }
      onClose();
    } catch (error) {
      console.error("Unexpected error during submission:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as Error).message
          : "An unknown error occurred.";
      alert(
        `An unexpected error occurred: ${errorMessage}. Check console for details.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextPage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentPage(2);
  };

  const prevPage = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-screen overflow-auto pointer-events-auto">
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            Loading Engineer Task
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {currentPage === 1 ? (
          <div className="p-4">
            <h3 className="text-lg font-semibold text-blue-600 mb-4">Form 1</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Task ID
                  </label>
                  <input
                    type="text"
                    name="taskId"
                    value={formData.taskId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Client Instruction
                </label>
                <textarea
                  name="clientInstruction"
                  value={formData.clientInstruction}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mail Instruction
                </label>
                <textarea
                  name="mailInstruction"
                  value={formData.mailInstruction}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project Name
                  </label>
                  <input
                    type="text"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Files (Informational)
                  </label>
                  <input
                    type="number"
                    name="numberOfFiles"
                    value={formData.numberOfFiles}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Number of Pages
                  </label>
                  <input
                    type="number"
                    name="numberOfPages"
                    value={formData.numberOfPages}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <input
                    type="text"
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Process Type
                </label>
                <select
                  name="processType"
                  value={formData.processType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Process Type</option>
                  <option value="OCR">OCR</option>
                  <option value="Prep">Prep</option>
                  <option value="Dtp">DTP</option>
                  <option value="Source Creation">Source Creation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Date
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estimate PO Hours
                </label>
                <input
                  type="number"
                  name="estimatePOHours"
                  value={formData.estimatePOHours}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  step="0.5"
                />
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-gray-700">
                  List of Files (Informational)
                </label>
                <textarea
                  name="listOfFiles"
                  value={formData.listOfFiles}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter file names separated by commas"
                />
              </div> */}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Input Files
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-3 pb-3">
                      <Upload className="w-6 h-6 mb-1 text-gray-500" />
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                    </div>
                    <input
                      type="file"
                      name="uploadedFiles"
                      onChange={handleChange}
                      className="hidden"
                      multiple
                    />
                  </label>
                </div>
                {formData.uploadedFiles && (
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.uploadedFiles.length} file(s) selected
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-between sticky bottom-0 bg-white pt-3 pb-3 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={nextPage}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Next <ChevronRight size={16} className="ml-2" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            <h3 className="text-lg font-semibold text-blue-600 mb-4">
              Form 2 - Estimated Hours
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reference File Name (Optional)
                </label>
                <input
                  type="text"
                  name="fileName"
                  value={formData.fileName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estimated Working Hours for OCR
                </label>
                <input
                  type="number"
                  name="estimatedHoursOCR"
                  value={formData.estimatedHoursOCR}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  step="0.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estimated Working Hours for QC
                </label>
                <input
                  type="number"
                  name="estimatedHoursQC"
                  value={formData.estimatedHoursQC}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  step="0.5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Estimated Working Hours for QA
                </label>
                <input
                  type="number"
                  name="estimatedHoursQA"
                  value={formData.estimatedHoursQA}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  step="0.5"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-between sticky bottom-0 bg-white pt-3 pb-3 border-t">
              <button
                type="button"
                onClick={prevPage}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                <ChevronLeft size={16} className="mr-2" /> Back
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                disabled={isSubmitting}
              >
                <Save size={16} className="mr-2" />{" "}
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TaskModal;
