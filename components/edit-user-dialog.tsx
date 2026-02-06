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
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { SHIFT_NAMES } from "@/lib/shifts";
import { api } from "@/utils/api";
import { toast } from "react-toastify";

interface EditUserDialogProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        shift?: string | null;
        shift_start_date?: string | null;
        shift_end_date?: string | null;
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
        shift: "" as string,
        shift_start_date: null as Date | null,
        shift_end_date: null as Date | null,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                role: user.role,
                shift: user.shift || "",
                shift_start_date: user.shift_start_date
                    ? parse(user.shift_start_date, "yyyy-MM-dd", new Date())
                    : null,
                shift_end_date: user.shift_end_date
                    ? parse(user.shift_end_date, "yyyy-MM-dd", new Date())
                    : null,
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

    const handleShiftChange = (value: string) => {
        if (value === "unassigned") {
            setFormData((prev) => ({
                ...prev,
                shift: "",
                shift_start_date: null,
                shift_end_date: null,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                shift: value,
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Client-side validation
        if (formData.shift && (!formData.shift_start_date || !formData.shift_end_date)) {
            setError("Both start and end dates are required when a shift is assigned.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await api.updateUser(user.id, {
                name: formData.name,
                role: formData.role,
                shift: formData.shift || null,
                shift_start_date: formData.shift_start_date
                    ? format(formData.shift_start_date, "yyyy-MM-dd")
                    : null,
                shift_end_date: formData.shift_end_date
                    ? format(formData.shift_end_date, "yyyy-MM-dd")
                    : null,
            });
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

    const isShiftAssigned = formData.shift !== "";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit User Profile</DialogTitle>
                    <DialogDescription>
                        Update the name, role, and shift for {user?.email}.
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

                        <div className="space-y-2">
                            <label
                                htmlFor="edit-shift"
                                className="text-sm font-medium leading-none"
                            >
                                Shift
                            </label>
                            <Select
                                value={formData.shift || "unassigned"}
                                onValueChange={handleShiftChange}
                            >
                                <SelectTrigger id="edit-shift">
                                    <SelectValue placeholder="Select a shift" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {SHIFT_NAMES.map((name) => (
                                        <SelectItem key={name} value={name}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    Start Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData.shift_start_date && "text-muted-foreground"
                                            )}
                                            disabled={!isShiftAssigned}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.shift_start_date
                                                ? format(formData.shift_start_date, "yyyy-MM-dd")
                                                : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.shift_start_date ?? undefined}
                                            onSelect={(date) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    shift_start_date: date ?? null,
                                                    // Reset end date if it's before new start date
                                                    shift_end_date:
                                                        prev.shift_end_date && date && prev.shift_end_date < date
                                                            ? null
                                                            : prev.shift_end_date,
                                                }))
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    End Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData.shift_end_date && "text-muted-foreground"
                                            )}
                                            disabled={!isShiftAssigned || !formData.shift_start_date}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.shift_end_date
                                                ? format(formData.shift_end_date, "yyyy-MM-dd")
                                                : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formData.shift_end_date ?? undefined}
                                            onSelect={(date) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    shift_end_date: date ?? null,
                                                }))
                                            }
                                            disabled={(date) =>
                                                formData.shift_start_date
                                                    ? date < formData.shift_start_date
                                                    : false
                                            }
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
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
