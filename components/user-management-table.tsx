"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AddUserDialog } from "./add-user-dialog";
import { ChevronLeft, ChevronRight, UserPlus, Search, Edit, Trash2, Key } from "lucide-react";
import LoadingScreen from "./ui/loading-screen";
import { EditUserDialog } from "./edit-user-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import { api } from "@/utils/api";
import { toast } from "react-toastify";
import { isShiftActive, isShiftExpired } from "@/lib/shifts";
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

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
    shift?: string | null;
    shift_start_date?: string | null;
    shift_end_date?: string | null;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export function UserManagementTable() {
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(true);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    const fetchUsers = async (page = 1, search = searchQuery, role = roleFilter) => {
        setLoading(true);
        try {
            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "10",
            });

            if (search.trim()) {
                params.append("search", search.trim());
            }

            if (role && role !== "all") {
                params.append("role", role);
            }

            const response = await fetch(`/api/users?${params.toString()}`);
            const data = await response.json();

            if (response.ok) {
                setUsers(data.users);
                setPagination(data.pagination);
            } else {
                console.error("Error fetching users:", data.error);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers(1, searchQuery, roleFilter);
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, roleFilter]);

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchUsers(newPage, searchQuery, roleFilter);
        }
    };

    const handleUserAdded = () => {
        // Refresh the user list
        fetchUsers(pagination.page, searchQuery, roleFilter);
    };


    const handleRoleFilterChange = (value: string) => {
        setRoleFilter(value);
    };

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setIsEditDialogOpen(true);
    };

    const handlePasswordClick = (user: User) => {
        setSelectedUser(user);
        setIsPasswordDialogOpen(true);
    };

    const handleDeleteClick = (user: User) => {
        setDeletingUserId(user.id);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingUserId) return;
        try {
            await api.deleteUser(deletingUserId);
            handleUserAdded(); // Refresh list
            toast.success("User deleted successfully");
        } catch (error) {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user. They might be assigned to tasks.");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeletingUserId(null);
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case "projectManager":
                return "default";
            case "processor":
                return "secondary";
            case "qcTeam":
                return "outline";
            case "qaTeam":
                return "outline";
            default:
                return "secondary";
        }
    };

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case "projectManager":
                return "Project Manager";
            case "processor":
                return "Processor";
            case "qcTeam":
                return "QC Team";
            case "qaTeam":
                return "QA Team";
            default:
                return role;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    if (loading && users.length === 0) {
        return <LoadingScreen variant="inline" message="Loading users..." />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage user accounts and permissions
                    </p>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex gap-4">
                <div className="w-full max-w-sm relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="projectManager">Project Manager</SelectItem>
                        <SelectItem value="processor">Processor</SelectItem>
                        <SelectItem value="qcTeam">QC Team</SelectItem>
                        <SelectItem value="qaTeam">QA Team</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Shift</TableHead>
                            <TableHead>Created Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <div className="flex justify-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <p className="text-muted-foreground">
                                        No users found matching your criteria.
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                            {getRoleDisplayName(user.role)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.shift ? (
                                            isShiftActive(user.shift_start_date ?? null, user.shift_end_date ?? null) ? (
                                                <Badge variant="default">{user.shift}</Badge>
                                            ) : isShiftExpired(user.shift_end_date ?? null) ? (
                                                <Badge variant="secondary">{user.shift} (Expired)</Badge>
                                            ) : (
                                                <Badge variant="outline">{user.shift} (Upcoming)</Badge>
                                            )
                                        ) : (
                                            <Badge variant="secondary">Unassigned</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(user.created_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handlePasswordClick(user)}
                                                title="Change Password"
                                            >
                                                <Key className="h-4 w-4 text-amber-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditClick(user)}
                                                title="Edit User"
                                            >
                                                <Edit className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteClick(user)}
                                                title="Delete User"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                        {pagination.total} users
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <div className="text-sm font-medium">
                            Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}


            <AddUserDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onUserAdded={handleUserAdded}
            />

            <EditUserDialog
                user={selectedUser}
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                onUserUpdated={handleUserAdded}
            />

            <ChangePasswordDialog
                userId={selectedUser?.id || null}
                userEmail={selectedUser?.email || null}
                open={isPasswordDialogOpen}
                onOpenChange={setIsPasswordDialogOpen}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user
                            account and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingUserId(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
