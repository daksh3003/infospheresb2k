"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    ChevronRight,
    MessageSquare
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

interface ProjectFeedbackProps {
    projectId: string;
    isCompleted: boolean; // Only show feedback when project is 100% complete
}

export function ProjectFeedback({ projectId, isCompleted }: ProjectFeedbackProps) {
    const [feedback, setFeedback] = useState("");
    const [editingFeedback, setEditingFeedback] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

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
            }
        } catch (error) {
            console.error("Error fetching feedback:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch(`/api/projects/${projectId}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback: editingFeedback })
            });

            if (response.ok) {
                setFeedback(editingFeedback);
                setIsOpen(false);
                toast.success("Feedback saved successfully");
            } else {
                toast.error("Failed to save feedback");
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
        setIsOpen(true);
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
                        </p>
                        {feedback && (
                            <p className="text-[12px] text-slate-500 dark:text-slate-400 truncate max-w-[400px]">
                                {feedback}
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
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Project Feedback</DialogTitle>
                        <DialogDescription>
                            Provide feedback for this completed project. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
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
        </>
    );
}
