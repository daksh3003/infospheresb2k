"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    ChevronRight,
    MessageSquare,
    Upload,
    X,
    FileText,
    Download,
    Trash2
} from "lucide-react";
import { toast } from "react-toastify";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectFeedbackProps {
    projectId: string;
    isCompleted: boolean; // Only show feedback when project is 100% complete
}

export function ProjectFeedback({ projectId, isCompleted }: ProjectFeedbackProps) {
    const [feedback, setFeedback] = useState("");
    const [editingFeedback, setEditingFeedback] = useState("");
    const [rcaRequired, setRcaRequired] = useState(false);
    const [editingRcaRequired, setEditingRcaRequired] = useState(false);
    const [rcaDetails, setRcaDetails] = useState("");
    const [editingRcaDetails, setEditingRcaDetails] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [existingFilePath, setExistingFilePath] = useState<string | null>(null);
    const [existingFileName, setExistingFileName] = useState<string | null>(null);
    const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch existing feedback when component mounts or project is completed
    useEffect(() => {
        if (isCompleted) {
            fetchFeedback();
        }
    }, [projectId, isCompleted]);

    const fetchFeedback = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/projects/${projectId}/feedback`);
            if (response.ok) {
                const data = await response.json();
                setFeedback(data.feedback || "");
                setEditingFeedback(data.feedback || "");
                setRcaRequired(data.rca_required || false);
                setEditingRcaRequired(data.rca_required || false);
                setRcaDetails(data.rca_details || "");
                setEditingRcaDetails(data.rca_details || "");
                setExistingFilePath(data.feedback_file_path || null);
                setExistingFileName(data.feedback_file_name || null);
                setExistingFileUrl(data.feedback_file_url || null);
            }
        } catch (error) {
            console.error("Error fetching feedback:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error("File size must be less than 10MB");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('feedback-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleDeleteFile = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/projects/${projectId}/feedback/delete-file`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setExistingFilePath(null);
                setExistingFileName(null);
                setExistingFileUrl(null);

                // Show toast first, then close dialog and reset loading state
                toast.success('File deleted successfully');
                setShowDeleteConfirm(false);
                setIsDeleting(false);
            } else {
                toast.error('Failed to delete file');
                setIsDeleting(false);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
            toast.error('Failed to delete file');
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('feedback', editingFeedback);
            formData.append('rca_required', editingRcaRequired.toString());
            formData.append('rca_details', editingRcaDetails);

            if (selectedFile) {
                formData.append('file', selectedFile);
            }

            const response = await fetch(`/api/projects/${projectId}/feedback`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                setFeedback(editingFeedback);
                setRcaRequired(editingRcaRequired);
                setRcaDetails(editingRcaDetails);
                if (selectedFile) {
                    setExistingFilePath('updated'); // Mark as updated
                    setSelectedFile(null);
                }
                setIsOpen(false);
                toast.success("Feedback saved successfully");
                // Refresh feedback to get new file URL
                fetchFeedback();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to save feedback");
            }
        } catch (error) {
            console.error("Error saving feedback:", error);
            toast.error("Failed to save feedback");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenEdit = () => {
        setEditingFeedback(feedback);
        setEditingRcaRequired(rcaRequired);
        setEditingRcaDetails(rcaDetails);
        setSelectedFile(null);
        setIsOpen(true);
    };

    const getFileName = () => {
        if (selectedFile) return selectedFile.name;
        if (existingFileName) return existingFileName;
        return 'Attached file';
    };

    // Don't show anything if project is not completed
    if (!isCompleted) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 animate-pulse">
                <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs font-medium">Loading feedback...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div
                className="px-6 py-3 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group"
                onClick={handleOpenEdit}
            >
                <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                            Project Feedback
                            {rcaRequired && (
                                <span className="ml-2 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                    RCA Required
                                </span>
                            )}
                        </p>
                        {feedback && (
                            <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate max-w-[400px]">
                                {feedback}
                            </p>
                        )}
                        {existingFilePath && (
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                                <FileText className="h-3 w-3" />
                                File attached
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                        {feedback ? "Edit feedback" : "Add feedback"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Project Feedback</DialogTitle>
                        <DialogDescription>
                            Provide feedback for this completed project. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        {/* Feedback Textarea */}
                        <div className="grid gap-2">
                            <label htmlFor="feedback" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Your Feedback
                            </label>
                            <Textarea
                                id="feedback"
                                value={editingFeedback}
                                onChange={(e) => setEditingFeedback(e.target.value)}
                                placeholder="Share your thoughts..."
                                className="min-h-[120px] resize-none"
                            />
                        </div>

                        {/* RCA Toggle */}
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg bg-slate-50 dark:bg-slate-900">
                                <Label htmlFor="rca-toggle" className="text-sm font-medium cursor-pointer">
                                    Root Cause Analysis (RCA) Required?
                                </Label>
                                <Switch
                                    id="rca-toggle"
                                    checked={editingRcaRequired}
                                    onCheckedChange={setEditingRcaRequired}
                                />
                            </div>

                            {/* RCA Details - Show when RCA is enabled */}
                            {editingRcaRequired && (
                                <div className="grid gap-2">
                                    <label htmlFor="rca-details" className="text-sm font-medium">
                                        RCA Details
                                    </label>
                                    <Textarea
                                        id="rca-details"
                                        value={editingRcaDetails}
                                        onChange={(e) => setEditingRcaDetails(e.target.value)}
                                        placeholder="Describe the root cause analysis..."
                                        className="min-h-[100px] resize-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* File Upload */}
                        <div className="grid gap-3">
                            <label className="text-sm font-medium">
                                Attach File (Optional)
                            </label>

                            {/* File input or selected file preview */}
                            {selectedFile ? (
                                /* New file selected - show preview */
                                <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                                    <Upload className="h-5 w-5 text-green-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-green-900 dark:text-green-100 truncate">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-xs text-green-700 dark:text-green-300">
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleRemoveFile}
                                        className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors flex-shrink-0"
                                        type="button"
                                    >
                                        <X className="h-4 w-4 text-green-600" />
                                    </button>
                                </div>
                            ) : existingFileUrl ? (
                                /* Existing file - show with replace option */
                                <div className="grid gap-2">
                                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                        <span className="text-sm text-blue-900 dark:text-blue-100 flex-1 truncate">
                                            {getFileName() || 'Attached file'}
                                        </span>
                                        <a
                                            href={existingFileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors flex-shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Download className="h-4 w-4 text-blue-600" />
                                        </a>
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors flex-shrink-0"
                                            type="button"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </button>
                                    </div>
                                    <Input
                                        id="feedback-file-input"
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                        className="cursor-pointer"
                                    />
                                    <p className="text-xs text-slate-500">
                                        Choose a new file to replace the existing one
                                    </p>
                                </div>
                            ) : (
                                /* No file - show file input */
                                <div className="grid gap-2">
                                    <Input
                                        id="feedback-file-input"
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                        className="cursor-pointer"
                                    />
                                    <p className="text-xs text-slate-500">
                                        PDF, Word, Excel, or Images (max 10MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving || !editingFeedback.trim()}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Feedback File</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this file? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <Button
                            onClick={handleDeleteFile}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
