"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { api } from "@/utils/api";
import { toast } from "react-toastify";

interface EditUserDialogProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserUpdated: () => void;
}

export function EditUserDialog({
    user,
    open,
    onOpenChange,
    onUserUpdated,
}: EditUserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        role: "",
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                role: user.role,
            });
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRoleChange = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            role: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            await api.updateUser(user.id, formData);
            onOpenChange(false);
            onUserUpdated();
            toast.success("User profile updated successfully");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An error occurred while updating user";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit User Profile</DialogTitle>
                    <DialogDescription>
                        Update the name and role for {user?.email}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label
                                htmlFor="edit-name"
                                className="text-sm font-medium leading-none"
                            >
                                Full Name
                            </label>
                            <Input
                                id="edit-name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="edit-role"
                                className="text-sm font-medium leading-none"
                            >
                                Role
                            </label>
                            <Select value={formData.role} onValueChange={handleRoleChange}>
                                <SelectTrigger id="edit-role">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="projectManager">Project Manager</SelectItem>
                                    <SelectItem value="processor">Processor</SelectItem>
                                    <SelectItem value="qcTeam">QC Team</SelectItem>
                                    <SelectItem value="qaTeam">QA Team</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && <div className="text-sm text-red-600">{error}</div>}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
