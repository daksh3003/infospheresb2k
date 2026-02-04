"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { Tooltip } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight, CalendarIcon, ChevronDownIcon, Box, House, PanelsTopLeft, Users, ClipboardCheck, ShieldCheck, Cpu, ChartNoAxesCombined, FileText, BarChart3, MessageSquare, Download } from "lucide-react"
import * as XLSX from "xlsx"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parse } from "date-fns"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const analyticsTables = [
    { id: "attendance", name: "Attendance", icon: Users },
    { id: "daily-user", name: "User Daily Report", icon: FileText },
    { id: "monthly-user", name: "User Monthly Report", icon: BarChart3 },
    { id: "po-report", name: "PO Report", icon: PanelsTopLeft },
    { id: "qc-report", name: "QC Report", icon: ClipboardCheck },
    { id: "processor-report", name: "Processor Report", icon: Cpu },
    { id: "qa-report", name: "QA Report", icon: ShieldCheck },
    { id: "dtp-monthly", name: "DTP Monthly Report", icon: ChartNoAxesCombined },
    //{ id: "dtp-tracking", name: "DTP Tracking", icon: Box },
    { id: "feedback", name: "Feedback Report", icon: MessageSquare },
];
export default function AnalyticsPage() {
    const [selectedTable, setSelectedTable] = useState("attendance");
    const pathname = usePathname();

    const renderTable = () => {
        switch (selectedTable) {
            case "attendance":
                return <AttendanceTable />;
            case "daily-user":
                return <UserDailyReport />;
            case "monthly-user":
                return <UserMonthlyReport />;
            case "po-report":
                return <POReport />;
            case "qa-report":
                return <QAReport />;
            case "qc-report":
                return <QCReport />;
            case "processor-report":
                return <ProcessorReport />;
            case "dtp-monthly":
                return <DTPMonthlyReport />;
            //case "dtp-tracking":
                //return <DTPTracking />;
            case "feedback":
                return <FeedbackReport />;
            default:
                return <AttendanceTable />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Header with Report Tabs */}
            <div className="border-b border-gray-200 bg-white shrink-0">
                <div className="px-6 pt-6 pb-4">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1 font-outfit">Analytics</h1>
                    <p className="text-sm text-gray-600">
                        View the latest analytics and metrics for your projects and tasks.
                    </p>
                </div>

                <div className="px-6 pb-4">
                    <Tabs value={selectedTable} onValueChange={setSelectedTable} className="w-full">
                        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto p-1 bg-gray-100/50 rounded-xl gap-1 w-full">
                            {analyticsTables.map((table) => (
                                <TabsTrigger
                                    key={table.id}
                                    value={table.id}
                                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-black/5"
                                >
                                    <table.icon
                                        className="mr-2 opacity-70"
                                        size={14}
                                        strokeWidth={2}
                                    />
                                    {table.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Main Content Area - Full Width */}
            <div className="flex-1 min-w-0 bg-gray-50/30 p-6">
                {renderTable()}
            </div>
        </div>
    );
}

function AttendanceTable() {
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    useEffect(() => {
        fetchAttendanceData()
    }, [])

    const fetchAttendanceData = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch("/api/analytics/attendance")
            if (!response.ok) throw new Error("Failed to fetch attendance data")

            const data = await response.json()
            setAttendanceData(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    const uniqueUsers = Array.from(
        new Set(attendanceData.map((r) => r.employee_name))
    ).filter(Boolean)

    // Filter data based on selected user and search query
    const filteredData = attendanceData.filter((r) => {
        const matchesUser = !selectedUser || r.employee_name === selectedUser
        const matchesSearch = !searchQuery ||
            r.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.department?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesUser && matchesSearch
    })

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedData = filteredData.slice(startIndex, endIndex)

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedUser, searchQuery])

    // Export to Excel function
    const exportToExcel = () => {
        const exportData = filteredData.map((r) => ({
            "Department": r.department,
            "Employee Name": r.employee_name,
            "Role": r.role,
            "Date": r.attendance_date,
            "In": r.in_time,
            "Out": r.out_time,
            "Shift": r.shift,
            "Work": r.work_duration,
            "OT": r.ot,
            "Status": r.status,
        }))

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Attendance Report")
        XLSX.writeFile(wb, `Attendance_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`)
    }

    /* -------------------- LOADING -------------------- */
    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-lg" />
    }

    /* -------------------- ERROR -------------------- */
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={fetchAttendanceData} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
                    Retry
                </Button>
            </Alert>
        )
    }

    return (
        <div className="space-y-4">
            {/* -------------------- FILTERS BAR -------------------- */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name, ID, or department..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Employee Dropdown */}
                        <Select
                            value={selectedUser || "all"}
                            onValueChange={(value) => setSelectedUser(value === "all" ? null : value)}
                        >
                            <SelectTrigger className="w-full sm:w-[250px]">
                                <SelectValue placeholder="Filter by Employee" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All
                                </SelectItem>
                                {uniqueUsers.map((user) => {
                                    return (
                                        <SelectItem key={user} value={user}>
                                            {user}
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>

                        {/* Refresh Button */}
                        <Button
                            onClick={fetchAttendanceData}
                            className="bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"
                        >
                            Refresh
                        </Button>

                        {/* Download Excel Button */}
                        <Button
                            onClick={exportToExcel}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Excel
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* -------------------- TABLE -------------------- */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>Attendance Report</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {selectedUser ?? "All employees"} · {filteredData.length} records
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">Department</TableHead>
                                <TableHead className="text-center">Employee Name</TableHead>
                                <TableHead className="text-center">Role</TableHead>
                                <TableHead className="text-center">Date</TableHead>
                                <TableHead className="text-center">In</TableHead>
                                <TableHead className="text-center">Out</TableHead>
                                <TableHead className="text-center">Shift</TableHead>
                                <TableHead className="text-center">Work</TableHead>
                                <TableHead className="text-center">OT</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center">
                                        No data found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((r, i) => (
                                    <TableRow key={r.id ?? i}>
                                        <TableCell className="text-center">{r.department}</TableCell>
                                        <TableCell className="text-center font-medium">
                                            {r.employee_name}
                                        </TableCell>
                                        <TableCell className="text-center">{r.role}</TableCell>
                                        <TableCell className="text-center">{r.attendance_date}</TableCell>
                                        <TableCell className="text-center">{r.in_time}</TableCell>
                                        <TableCell className="text-center">{r.out_time}</TableCell>
                                        <TableCell className="text-center">{r.shift}</TableCell>
                                        <TableCell className="text-center">{r.work_duration}</TableCell>
                                        <TableCell className="text-center">{r.ot}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                className={
                                                    r.status === "Present"
                                                        ? "bg-white-100 text-black-700 hover:bg-green-200 border-transparent"
                                                        : "bg-white-100 text-black-700 hover:bg-red-200 border-transparent"
                                                }
                                            >
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${r.status === "Present" ? "bg-green-500" : "bg-red-500"
                                                        }`}
                                                />
                                                {r.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* -------------------- PAGINATION -------------------- */}
                {filteredData.length > 0 && (
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value))
                                    setCurrentPage(1)
                                }}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                    <SelectItem value="100">100 per page</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={currentPage === pageNum ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    )
}

function UserDailyReport() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(
        new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
    );
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const [isUserPopoverOpen, setIsUserPopoverOpen] = useState(false);

    // Fetch available users
    useEffect(() => {
        fetchAvailableUsers();
    }, []);

    const fetchAvailableUsers = async () => {
        try {
            const response = await fetch("/api/analytics/attendance");
            if (response.ok) {
                const data = await response.json();
                // Get unique users from attendance data
                const uniqueUsers = Array.from(
                    new Map(data.map((record: any) => [record.employee_id, {
                        id: record.employee_id,
                        name: record.employee_name
                    }])).values()
                );
                setAvailableUsers(uniqueUsers);
            }
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    // Fetch daily report when user or date changes
    useEffect(() => {
        if (selectedUserId) {
            fetchDailyReport();
        }
    }, [selectedUserId, selectedDate]);

    const fetchDailyReport = async () => {
        if (!selectedUserId) {
            setError("Please select a user");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(
                `/api/analytics/daily-user?userId=${selectedUserId}&date=${selectedDate}`
            );

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setReportData(data);
        } catch (err) {
            console.error("Error fetching daily report:", err);
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter data based on search query
    const filteredData = reportData.filter((entry) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            entry.name?.toLowerCase().includes(query) ||
            entry.client_name?.toLowerCase().includes(query) ||
            entry.file_no?.toLowerCase().includes(query) ||
            entry.work_type?.toLowerCase().includes(query)
        );
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedUserId, selectedDate]);

    // Export to Excel function
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => ({
            "S.No": entry.s_no,
            "Year": entry.year,
            "Month": entry.month,
            "Working Date": entry.working_date,
            "Name": entry.name,
            "Client Name": entry.client_name,
            "Task Name": entry.task_name,
            "Project Name": entry.project_name,
            "File No": entry.file_no,
            "Work Type": entry.work_type,
            "No of Pages": entry.no_of_pages,
            "Start Time": entry.start_time,
            "End Time": entry.end_time,
            "Total Working Time": entry.total_working_time,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "User Daily Report");
        XLSX.writeFile(wb, `User_Daily_Report_${selectedDate}.xlsx`);
    };

    // Filter users for dropdown search
    const filteredUsers = availableUsers.filter((user) =>
        user.name.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    /* -------------------- LOADING -------------------- */
    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-lg" />;
    }

    /* -------------------- ERROR -------------------- */
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={fetchDailyReport} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name, client, file no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* User Selection */}
                        <Select
                            value={selectedUserId || ""}
                            onValueChange={(value) => setSelectedUserId(value || null)}
                        >
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Select user..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {availableUsers.length === 0 ? (
                                    <SelectItem value="no-users" disabled>
                                        No users available
                                    </SelectItem>
                                ) : (
                                    availableUsers.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>

                        {/* Date Selection */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full sm:w-[200px] justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate ? parse(selectedDate, 'yyyy-MM-dd', new Date()) : undefined}
                                    onSelect={(date) => {
                                        if (date) {
                                            setSelectedDate(format(date, 'yyyy-MM-dd'));
                                        }
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Refresh Button */}
                        <Button
                            onClick={fetchDailyReport}
                            disabled={!selectedUserId || isLoading}
                            className="bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"
                        >
                            Refresh
                        </Button>

                        {/* Download Excel Button */}
                        <Button
                            onClick={exportToExcel}
                            variant="outline"
                            disabled={filteredData.length === 0}
                            className="w-full sm:w-auto"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Excel
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>User Daily Report</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {selectedUserId && filteredData.length > 0
                                ? `${filteredData.length} record${filteredData.length !== 1 ? 's' : ''} found`
                                : "Select a user and date to view daily report"}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">S.No</TableHead>
                                <TableHead className="text-center">Year</TableHead>
                                <TableHead className="text-center">Month</TableHead>
                                <TableHead className="text-center">Working Date</TableHead>
                                <TableHead className="text-center">Name</TableHead>
                                <TableHead className="text-center">Client Name</TableHead>
                                <TableHead className="text-center">Task Name</TableHead>
                                <TableHead className="text-center">Project Name</TableHead>
                                <TableHead className="text-center">File No</TableHead>
                                <TableHead className="text-center">Work Type</TableHead>
                                <TableHead className="text-center">No of Pages</TableHead>
                                <TableHead className="text-center">Start Time</TableHead>
                                <TableHead className="text-center">End Time</TableHead>
                                <TableHead className="text-center">Total Working Time</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={12} className="text-center">
                                        {selectedUserId
                                            ? "No data found for the selected date"
                                            : "Please select a user and date"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center">{entry.s_no}</TableCell>
                                        <TableCell className="text-center">{entry.year}</TableCell>
                                        <TableCell className="text-center">{entry.month}</TableCell>
                                        <TableCell className="text-center">{entry.working_date}</TableCell>
                                        <TableCell className="text-center font-medium">
                                            {entry.name}
                                        </TableCell>
                                        <TableCell className="text-center">{entry.client_name}</TableCell>
                                        <TableCell className="text-center">{entry.task_name}</TableCell>
                                        <TableCell className="text-center">{entry.project_name}</TableCell>
                                        <TableCell className="text-center">{entry.file_no}</TableCell>
                                        <TableCell className="text-center">{entry.work_type}</TableCell>
                                        <TableCell className="text-center">{entry.no_of_pages}</TableCell>
                                        <TableCell className="text-center">{entry.start_time}</TableCell>
                                        <TableCell className="text-center">{entry.end_time}</TableCell>
                                        <TableCell className="text-center">{entry.total_working_time}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                    <SelectItem value="100">100 per page</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={currentPage === pageNum ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

function UserMonthlyReport() {
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [selectedTeamType, setSelectedTeamType] = useState<string>("");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Fetch available users with roles
    useEffect(() => {
        fetchAvailableUsers();
    }, [selectedTeamType]);

    const fetchAvailableUsers = async () => {
        try {
            // Fetch all users from profiles to get roles
            const response = await fetch("/api/analytics/attendance");
            if (response.ok) {
                const data = await response.json();
                // Get unique users with roles from attendance data
                const uniqueUsers = Array.from(
                    new Map(data.map((record: any) => [record.employee_id, {
                        id: record.employee_id,
                        name: record.employee_name,
                        role: record.role
                    }])).values()
                );

                // Filter by team type if selected
                let filteredUsers = uniqueUsers;
                if (selectedTeamType) {
                    const roleMap: Record<string, string> = {
                        "QA": "qaTeam",
                        "QC": "qcTeam",
                        "Processor": "processor"
                    };
                    const targetRole = roleMap[selectedTeamType];
                    filteredUsers = uniqueUsers.filter((user: any) => user.role === targetRole);
                }

                setAvailableUsers(filteredUsers);

                // If team type is selected, auto-select all users of that team
                if (selectedTeamType && filteredUsers.length > 0) {
                    setSelectedUserIds(filteredUsers.map((u: any) => u.id));
                } else if (!selectedTeamType) {
                    // If no team type, select all users
                    setSelectedUserIds(filteredUsers.map((u: any) => u.id));
                }
            }
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    // Fetch monthly report when filters change
    useEffect(() => {
        if (selectedUserIds.length > 0 || !selectedTeamType) {
            fetchMonthlyReport();
        }
    }, [selectedUserIds, selectedMonth, selectedTeamType]);

    const fetchMonthlyReport = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Build query parameters
            const params = new URLSearchParams();
            params.append("month", selectedMonth);

            if (selectedUserIds.length > 0) {
                params.append("userIds", selectedUserIds.join(","));
            }

            if (selectedTeamType) {
                params.append("teamType", selectedTeamType);
            }

            const response = await fetch(
                `/api/analytics/monthly-user?${params.toString()}`
            );

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setReportData(data);
        } catch (err) {
            console.error("Error fetching monthly report:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserToggle = (userId: string) => {
        setSelectedUserIds(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedUserIds.length === availableUsers.length) {
            setSelectedUserIds([]);
            setIsAllSelected(false);
        } else {
            setSelectedUserIds(availableUsers.map((u: any) => u.id));
            setIsAllSelected(true);
        }
    };

    const handleAllToggle = () => {
        if (isAllSelected) {
            setSelectedUserIds([]);
            setIsAllSelected(false);
        } else {
            setSelectedUserIds(availableUsers.map((u: any) => u.id));
            setIsAllSelected(true);
        }
    };

    // Update isAllSelected when selectedUserIds changes
    useEffect(() => {
        setIsAllSelected(selectedUserIds.length === availableUsers.length && availableUsers.length > 0);
    }, [selectedUserIds, availableUsers.length]);

    const getSelectedUserNames = () => {
        return availableUsers
            .filter((u: any) => selectedUserIds.includes(u.id))
            .map((u: any) => u.name);
    };

    const filteredUsers = availableUsers.filter((user: any) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get the data array, handling both empty and populated states
    const tableData = reportData?.data || [];

    // Pagination calculations
    const totalPages = Math.ceil(tableData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = tableData.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedUserIds, selectedMonth, selectedTeamType]);

    // Month/Year for display
    const getMonthYearDisplay = () => {
        if (!selectedMonth) return "Select month";
        const [year, month] = selectedMonth.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return format(date, 'MMMM yyyy');
    };

    // Export to Excel function
    const exportToExcel = () => {
        const exportData = tableData.map((entry: any) => ({
            "S.No": entry.s_no,
            "Name Of The User": entry.name,
            "Page Count": entry.total_pages || 0,
            "PO Hours": parseFloat(entry.total_hours || 0).toFixed(2),
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "User Monthly Report");
        XLSX.writeFile(wb, `User_Monthly_Report_${selectedMonth}.xlsx`);
    };

    /* -------------------- LOADING -------------------- */
    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-lg" />;
    }

    /* -------------------- ERROR -------------------- */
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={fetchMonthlyReport} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                        {/* Team Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Team Type
                            </label>
                            <Select
                                value={selectedTeamType || "all"}
                                onValueChange={(value) => {
                                    setSelectedTeamType(value === "all" ? "" : value);
                                    setSelectedUserIds([]);
                                }}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All Teams" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Teams</SelectItem>
                                    <SelectItem value="QA">QA</SelectItem>
                                    <SelectItem value="QC">QC</SelectItem>
                                    <SelectItem value="Processor">Processor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* User Selection - using Popover for multi-select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Users
                            </label>
                            <Popover open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-[200px] justify-between"
                                    >
                                        <span className="truncate">
                                            {isAllSelected
                                                ? "All users"
                                                : selectedUserIds.length === 0
                                                    ? "Select users..."
                                                    : `${selectedUserIds.length} user${selectedUserIds.length > 1 ? 's' : ''}`}
                                        </span>
                                        <ChevronRight className={`ml-2 h-4 w-4 transition-transform ${isUserDropdownOpen ? 'rotate-90' : ''}`} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[250px] p-0" align="start">
                                    <div className="p-2 border-b">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search users..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        <label className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer border-b">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleAllToggle}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <span className="text-sm font-medium">Select All</span>
                                        </label>
                                        {filteredUsers.map((user) => (
                                            <label
                                                key={user.id}
                                                className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.includes(user.id)}
                                                    onChange={() => handleUserToggle(user.id)}
                                                    className="h-4 w-4 rounded border-gray-300"
                                                />
                                                <span className="text-sm flex-1 truncate">{user.name}</span>
                                                {user.role && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {user.role}
                                                    </Badge>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Month Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Month
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[180px] justify-start">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {getMonthYearDisplay()}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedMonth ? parse(selectedMonth, 'yyyy-MM', new Date()) : undefined}
                                        onSelect={(date) => {
                                            if (date) {
                                                setSelectedMonth(format(date, 'yyyy-MM'));
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Refresh Button */}
                        <Button
                            onClick={fetchMonthlyReport}
                            disabled={isLoading}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Refresh
                        </Button>

                        {/* Download Excel Button */}
                        <Button
                            onClick={exportToExcel}
                            variant="outline"
                            disabled={tableData.length === 0}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Excel
                        </Button>
                    </div>

                    {/* Selected Users Display */}
                    {selectedUserIds.length > 0 && selectedUserIds.length < availableUsers.length && (
                        <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                                {getSelectedUserNames().map((name: string) => {
                                    const userId = availableUsers.find((u: any) => u.name === name)?.id;
                                    return (
                                        <Badge
                                            key={userId}
                                            variant="secondary"
                                            className="inline-flex items-center gap-1 px-3 py-1"
                                        >
                                            {name}
                                            <button
                                                onClick={() => handleUserToggle(userId!)}
                                                className="ml-1 hover:text-destructive focus:outline-none"
                                                type="button"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>Monthly User Report</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {tableData.length > 0
                                ? `${tableData.length} record${tableData.length !== 1 ? 's' : ''} found`
                                : "Select users and month to view report"}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">S.No</TableHead>
                                <TableHead className="text-center">Name Of The User</TableHead>
                                <TableHead className="text-center">Page Count</TableHead>
                                <TableHead className="text-center">PO Hours</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        {selectedUserIds.length > 0
                                            ? "No data found for the selected month"
                                            : "Please select users and month"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((entry: any) => (
                                    <TableRow key={entry.user_id}>
                                        <TableCell className="text-center">{entry.s_no}</TableCell>
                                        <TableCell className="text-center font-medium">{entry.name}</TableCell>
                                        <TableCell className="text-center">{entry.total_pages || 0}</TableCell>
                                        <TableCell className="text-center">{parseFloat(entry.total_hours || 0).toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination */}
                {tableData.length > 0 && (
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, tableData.length)} of {tableData.length} records
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                    <SelectItem value="100">100 per page</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={currentPage === pageNum ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

function POReport() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchPOReport();
    }, []);

    const fetchPOReport = async () => {
        try {
            setIsLoading(true);
            setError(null);

            let url = "/api/analytics/po-report";
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setReportData(data);
        } catch (err) {
            console.error("Error fetching PO report:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter data based on search query
    const filteredData = reportData.filter((entry) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            entry.project_name?.toLowerCase().includes(query) ||
            entry.status?.toLowerCase().includes(query) ||
            entry.po_number?.toLowerCase().includes(query)
        );
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, startDate, endDate]);

    // Export to Excel function
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => ({
            "S. No": entry.s_no,
            "Received Date": entry.received_date,
            "Project Name": entry.project_name,
            "Received Pages": entry.received_pages,
            "Process": entry.process,
            "PO Hours": entry.po_hours,
            "Output Pages": entry.output_pages,
            "Delivery Date": entry.delivery_date,
            "Status": entry.status,
            "PO Status": entry.po_status,
            "PO Number": entry.po_number,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PO Report");
        XLSX.writeFile(wb, `PO_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    /* -------------------- LOADING -------------------- */
    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-lg" />;
    }

    /* -------------------- ERROR -------------------- */
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={fetchPOReport} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by project, status, PO number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Date Filters */}
                        <div className="flex flex-wrap gap-4 items-end">
                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(parse(startDate, 'yyyy-MM-dd', new Date()), 'PP') : <span className="text-muted-foreground">Pick date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setStartDate(format(date, 'yyyy-MM-dd'));
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(parse(endDate, 'yyyy-MM-dd', new Date()), 'PP') : <span className="text-muted-foreground">Pick date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate ? parse(endDate, 'yyyy-MM-dd', new Date()) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setEndDate(format(date, 'yyyy-MM-dd'));
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Filter Button */}
                            <Button
                                onClick={fetchPOReport}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Filter
                            </Button>

                            {/* Download Excel Button */}
                            <Button
                                onClick={exportToExcel}
                                variant="outline"
                                disabled={filteredData.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Excel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>PO Report</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {filteredData.length} record{filteredData.length !== 1 ? 's' : ''} found
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">S. No</TableHead>
                                <TableHead className="text-center">Received Date</TableHead>
                                <TableHead className="text-center">Project Name</TableHead>
                                <TableHead className="text-center">Received Pages</TableHead>
                                <TableHead className="text-center">Process</TableHead>
                                <TableHead className="text-center">PO Hours</TableHead>
                                <TableHead className="text-center">Output Pages</TableHead>
                                <TableHead className="text-center">Delivery Date</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-center">PO Status</TableHead>
                                <TableHead className="text-center">PO Number</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center">
                                        No PO report data found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center">{entry.s_no}</TableCell>
                                        <TableCell className="text-center">{entry.received_date}</TableCell>
                                        <TableCell className="text-center font-medium">{entry.project_name}</TableCell>
                                        <TableCell className="text-center">{entry.received_pages}</TableCell>
                                        <TableCell className="text-center">{entry.process}</TableCell>
                                        <TableCell className="text-center">{entry.po_hours}</TableCell>
                                        <TableCell className="text-center">{entry.output_pages}</TableCell>
                                        <TableCell className="text-center">{entry.delivery_date}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                className={
                                                    entry.status === "Delivered" || entry.status === "Completed"
                                                        ? "bg-white-100 text-black-700 hover:bg-green-200 border-transparent"
                                                        : "bg-white-100 text-black-700 hover:bg-yellow-200 border-transparent"
                                                }
                                            >
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${entry.status === "Delivered" || entry.status === "Completed"
                                                        ? "bg-green-500"
                                                        : "bg-yellow-500"
                                                        }`}
                                                />
                                                {entry.status === "Delivered" || entry.status === "Completed"
                                                    ? "Completed"
                                                    : entry.status === "In Progress"
                                                        ? "In Progress"
                                                        : entry.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">{entry.po_status}</TableCell>
                                        <TableCell className="text-center">{entry.po_number}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                    <SelectItem value="100">100 per page</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={currentPage === pageNum ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

function QAReport() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchQAReport();
    }, []);

    const fetchQAReport = async () => {
        try {
            setIsLoading(true);
            setError(null);

            let url = "/api/analytics/qa-report";
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setReportData(data);
        } catch (err) {
            console.error("Error fetching QA report:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter data based on search query
    const filteredData = reportData.filter((entry) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            entry.name?.toLowerCase().includes(query) ||
            entry.client_name?.toLowerCase().includes(query) ||
            entry.file_name?.toLowerCase().includes(query) ||
            entry.work_type?.toLowerCase().includes(query)
        );
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, startDate, endDate]);

    // Export to Excel function
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => ({
            "Working Date": entry.working_date,
            "Name": entry.name,
            "Client Name": entry.client_name,
            "File Name": entry.file_name,
            "Work Type": entry.work_type,
            "Page Count": entry.page_no,
            "Start Time": entry.start_time,
            "End Time": entry.end_time,
            "Total Working Hours": entry.total_working_hours,
            "PO": entry.po,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "QA Report");
        XLSX.writeFile(wb, `QA_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    /* -------------------- LOADING -------------------- */
    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-lg" />;
    }

    /* -------------------- ERROR -------------------- */
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={fetchQAReport} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name, client, file..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Date Filters */}
                        <div className="flex flex-wrap gap-4 items-end">
                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(parse(startDate, 'yyyy-MM-dd', new Date()), 'PP') : <span className="text-muted-foreground">Pick date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setStartDate(format(date, 'yyyy-MM-dd'));
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(parse(endDate, 'yyyy-MM-dd', new Date()), 'PP') : <span className="text-muted-foreground">Pick date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate ? parse(endDate, 'yyyy-MM-dd', new Date()) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setEndDate(format(date, 'yyyy-MM-dd'));
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Filter Button */}
                            <Button
                                onClick={fetchQAReport}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Filter
                            </Button>

                            {/* Download Excel Button */}
                            <Button
                                onClick={exportToExcel}
                                variant="outline"
                                disabled={filteredData.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Excel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>QA Report</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {filteredData.length} record{filteredData.length !== 1 ? 's' : ''} found
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">Working Date</TableHead>
                                <TableHead className="text-center">Name</TableHead>
                                <TableHead className="text-center">Client Name</TableHead>
                                <TableHead className="text-center">File Name</TableHead>
                                <TableHead className="text-center">Work Type</TableHead>
                                <TableHead className="text-center">Page Count</TableHead>
                                <TableHead className="text-center">Start Time</TableHead>
                                <TableHead className="text-center">End Time</TableHead>
                                <TableHead className="text-center">Total Working Hours</TableHead>
                                <TableHead className="text-center">PO</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center">
                                        No QA report data found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center">{entry.working_date}</TableCell>
                                        <TableCell className="text-center font-medium">{entry.name}</TableCell>
                                        <TableCell className="text-center max-w-[150px]">
                                            <Tooltip content={entry.client_name || "N/A"}>
                                                <span className="block truncate cursor-default">{entry.client_name || "N/A"}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-center max-w-[250px]">
                                            <Tooltip content={entry.file_name || "N/A"}>
                                                <span className="block truncate cursor-default">{entry.file_name || "N/A"}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-center">{entry.work_type}</TableCell>
                                        <TableCell className="text-center">{entry.page_no}</TableCell>
                                        <TableCell className="text-center">{entry.start_time}</TableCell>
                                        <TableCell className="text-center">{entry.end_time}</TableCell>
                                        <TableCell className="text-center">{entry.total_working_hours}</TableCell>
                                        <TableCell className="text-center">{entry.po}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                    <SelectItem value="100">100 per page</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={currentPage === pageNum ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

function DTPMonthlyReport() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchDTPMonthlyReport();
    }, [selectedMonth]);

    const fetchDTPMonthlyReport = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch(`/api/analytics/dtp-report?month=${selectedMonth}`);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setReportData(data);
        } catch (err) {
            console.error("Error fetching DTP Monthly report:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter data based on search query
    const filteredData = reportData.filter((entry) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            entry.name?.toLowerCase().includes(query) ||
            entry.client_name?.toLowerCase().includes(query) ||
            entry.job_no?.toLowerCase().includes(query) ||
            entry.process?.toLowerCase().includes(query)
        );
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedMonth]);

    // Month/Year display
    const getMonthYearDisplay = () => {
        if (!selectedMonth) return "Select month";
        const [year, month] = selectedMonth.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return format(date, 'MMMM yyyy');
    };

    // Export to Excel function
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => ({
            "S.No": entry.s_no,
            "Date": entry.date,
            "Employee Name": entry.name,
            "Client Name": entry.client_name,
            "Job No.": entry.job_no,
            "Process": entry.process,
            "Page Count": entry.page_count,
            "Start Time": entry.start_time,
            "End Time": entry.end_time,
            "Total Time Taken": entry.total_time,
            "Shift": entry.shift,
            "PO Hours": entry.po_hours,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DTP Monthly Report");
        XLSX.writeFile(wb, `DTP_Monthly_Report_${selectedMonth}.xlsx`);
    };

    /* -------------------- LOADING -------------------- */
    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-lg" />;
    }

    /* -------------------- ERROR -------------------- */
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={fetchDTPMonthlyReport} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name, client, job no..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Date Filters */}
                        <div className="flex flex-wrap gap-4 items-end">
                            {/* Month Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Month
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[180px] justify-start">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {getMonthYearDisplay()}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={selectedMonth ? parse(selectedMonth, 'yyyy-MM', new Date()) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setSelectedMonth(format(date, 'yyyy-MM'));
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Refresh Button */}
                            <Button
                                onClick={fetchDTPMonthlyReport}
                                disabled={isLoading}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Refresh
                            </Button>

                            {/* Download Excel Button */}
                            <Button
                                onClick={exportToExcel}
                                variant="outline"
                                disabled={filteredData.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Excel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>DTP Monthly Report</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {filteredData.length > 0
                                ? `${filteredData.length} record${filteredData.length !== 1 ? 's' : ''} found`
                                : "Select a month to view report"}
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">S.No</TableHead>
                                <TableHead className="text-center">Date</TableHead>
                                <TableHead className="text-center">Employee Name</TableHead>
                                <TableHead className="text-center">Client Name</TableHead>
                                <TableHead className="text-center">Job No.</TableHead>
                                <TableHead className="text-center">Process</TableHead>
                                <TableHead className="text-center">Page Count</TableHead>
                                <TableHead className="text-center">Start Time</TableHead>
                                <TableHead className="text-center">End Time</TableHead>
                                <TableHead className="text-center">Total Time Taken</TableHead>
                                <TableHead className="text-center">Shift</TableHead>
                                <TableHead className="text-center">PO Hours</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={12} className="text-center">
                                        No DTP Monthly report data found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center">{entry.s_no}</TableCell>
                                        <TableCell className="text-center">{entry.date}</TableCell>
                                        <TableCell className="text-center font-medium">{entry.name}</TableCell>
                                        <TableCell className="text-center max-w-[150px]">
                                            <Tooltip content={entry.client_name || "N/A"}>
                                                <span className="block truncate cursor-default">{entry.client_name || "N/A"}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-center max-w-[150px]">
                                            <Tooltip content={entry.job_no || "N/A"}>
                                                <span className="block truncate cursor-default">{entry.job_no || "N/A"}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-center">{entry.process}</TableCell>
                                        <TableCell className="text-center">{entry.page_count}</TableCell>
                                        <TableCell className="text-center">{entry.start_time}</TableCell>
                                        <TableCell className="text-center">{entry.end_time}</TableCell>
                                        <TableCell className="text-center">{entry.total_time_taken}</TableCell>
                                        <TableCell className="text-center">{entry.shift}</TableCell>
                                        <TableCell className="text-center">{entry.po}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                    <SelectItem value="100">100 per page</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={currentPage === pageNum ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

function FeedbackReport() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    useEffect(() => {
        fetchFeedbackReport();
    }, []);

    const fetchFeedbackReport = async () => {
        try {
            setIsLoading(true);
            setError(null);

            let url = "/api/analytics/feedback-report";
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (params.toString()) {
                url += `?${params.toString()}`;
            }


            const response = await fetch(url);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();


            if (data.error) {
                throw new Error(data.error);
            }

            setReportData(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching Feedback Report:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Export to Excel function
    const exportToExcel = () => {
        const exportData = reportData.map((entry) => ({
            "S.No": entry.s_no,
            "Date": entry.date,
            "Client": entry.client,
            "Task": entry.task,
            "Filename": entry.filename,
            "Pages": entry.pages,
            "Language": entry.language,
            "Task Type": entry.task_type,
            "Process": entry.process,
            "QC": entry.qc,
            "QA": entry.qa,
            "Delivery": entry.delivery,
            "Internal Auditor": entry.internal_auditor,
            "Internal Comments": entry.internal_comments,
            "External Comments": entry.external_comments,
            "Total No. Errors": entry.total_errors,
            "Remarks": entry.remarks,
            "Impact": entry.impact,
            "Action (Impact)": entry.action_impact,
            "RCA (Impact)": entry.rca_impact,
            "Action (RCA)": entry.action_rca,
            "RCA": entry.rca,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Feedback Report");
        XLSX.writeFile(wb, `Feedback_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    /* -------------------- LOADING -------------------- */
    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-lg" />;
    }

    /* -------------------- ERROR -------------------- */
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={fetchFeedbackReport} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Feedback Report</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {reportData.length} record{reportData.length !== 1 ? 's' : ''} found
                    </p>
                </div>
                <div className="flex items-end gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 invisible">
                            Filter
                        </label>
                        <Button
                            onClick={fetchFeedbackReport}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Filter
                        </Button>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 invisible">
                            Export
                        </label>
                        <Button
                            onClick={exportToExcel}
                            variant="outline"
                            disabled={reportData.length === 0}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Excel
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {/* Section 1: Job Details */}
                            <TableHead className="text-center">S.No</TableHead>
                            <TableHead className="text-center">Date</TableHead>
                            <TableHead className="text-center">Client</TableHead>
                            <TableHead className="text-center">Task</TableHead>
                            <TableHead className="text-center">Filename</TableHead>
                            <TableHead className="text-center">Pages</TableHead>
                            <TableHead className="text-center">Language</TableHead>
                            <TableHead className="text-center">Task Type</TableHead>
                            <TableHead className="text-center">Process</TableHead>
                            <TableHead className="text-center">QC</TableHead>

                            {/* Section 2: Quality Assurance */}
                            <TableHead className="text-center">QA</TableHead>
                            <TableHead className="text-center">Delivery</TableHead>
                            <TableHead className="text-center">Internal Auditor</TableHead>
                            <TableHead className="text-center">Internal Comments</TableHead>
                            <TableHead className="text-center">External Comments</TableHead>
                            <TableHead className="text-center">Total No. Errors</TableHead>
                            <TableHead className="text-center">Remarks</TableHead>

                            {/* Section 3: Impact and RCA */}
                            <TableHead className="text-center">Impact</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                            <TableHead className="text-center">RCA</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                            <TableHead className="text-center">RCA</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reportData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={22} className="text-center">
                                    No Feedback report data found
                                </TableCell>
                            </TableRow>
                        ) : (
                            reportData.map((entry, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-center">{entry.s_no}</TableCell>
                                    <TableCell className="text-center">{entry.date}</TableCell>
                                    <TableCell className="text-center">{entry.client}</TableCell>
                                    <TableCell className="text-center">{entry.task}</TableCell>
                                    <TableCell className="text-center">{entry.filename}</TableCell>
                                    <TableCell className="text-center">{entry.pages}</TableCell>
                                    <TableCell className="text-center">{entry.language}</TableCell>
                                    <TableCell className="text-center">{entry.task_type}</TableCell>
                                    <TableCell className="text-center">{entry.process}</TableCell>
                                    <TableCell className="text-center">{entry.qc}</TableCell>
                                    <TableCell className="text-center">{entry.qa}</TableCell>
                                    <TableCell className="text-center">{entry.delivery}</TableCell>
                                    <TableCell className="text-center">{entry.internal_auditor}</TableCell>
                                    <TableCell className="text-center">{entry.internal_comments}</TableCell>
                                    <TableCell className="text-center">{entry.external_comments}</TableCell>
                                    <TableCell className="text-center">{entry.total_errors}</TableCell>
                                    <TableCell className="text-center">{entry.remarks}</TableCell>
                                    <TableCell className="text-center">{entry.impact}</TableCell>
                                    <TableCell className="text-center">{entry.action}</TableCell>
                                    <TableCell className="text-center">{entry.rca}</TableCell>
                                    <TableCell className="text-center">{entry.action_2}</TableCell>
                                    <TableCell className="text-center">{entry.rca_2}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function QCReport() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchQCReport();
    }, []);

    const fetchQCReport = async () => {
        try {
            setIsLoading(true);
            setError(null);

            let url = "/api/analytics/qc-report";
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setReportData(data);
        } catch (err) {
            console.error("Error fetching QC report:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter data based on search query
    const filteredData = reportData.filter((entry) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            entry.name?.toLowerCase().includes(query) ||
            entry.client_name?.toLowerCase().includes(query) ||
            entry.file_name?.toLowerCase().includes(query) ||
            entry.work_type?.toLowerCase().includes(query)
        );
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, startDate, endDate]);

    // Export to Excel function
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => ({
            "Working Date": entry.working_date,
            "Name": entry.name,
            "Client Name": entry.client_name,
            "File Name": entry.file_name,
            "Work Type": entry.work_type,
            "Page Count": entry.page_no,
            "Start Time": entry.start_time,
            "End Time": entry.end_time,
            "Total Working Hours": entry.total_working_hours,
            "PO": entry.po,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "QC Report");
        XLSX.writeFile(wb, `QC_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    /* -------------------- LOADING -------------------- */
    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-lg" />;
    }

    /* -------------------- ERROR -------------------- */
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={fetchQCReport} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name, client, file..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Date Filters */}
                        <div className="flex flex-wrap gap-4 items-end">
                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(parse(startDate, 'yyyy-MM-dd', new Date()), 'PP') : <span className="text-muted-foreground">Pick date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setStartDate(format(date, 'yyyy-MM-dd'));
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(parse(endDate, 'yyyy-MM-dd', new Date()), 'PP') : <span className="text-muted-foreground">Pick date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate ? parse(endDate, 'yyyy-MM-dd', new Date()) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setEndDate(format(date, 'yyyy-MM-dd'));
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Filter Button */}
                            <Button
                                onClick={fetchQCReport}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Filter
                            </Button>

                            {/* Download Excel Button */}
                            <Button
                                onClick={exportToExcel}
                                variant="outline"
                                disabled={filteredData.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Excel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>QC Report</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {filteredData.length} record{filteredData.length !== 1 ? 's' : ''} found
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">Working Date</TableHead>
                                <TableHead className="text-center">Name</TableHead>
                                <TableHead className="text-center">Client Name</TableHead>
                                <TableHead className="text-center">File Name</TableHead>
                                <TableHead className="text-center">Work Type</TableHead>
                                <TableHead className="text-center">Page Count</TableHead>
                                <TableHead className="text-center">Start Time</TableHead>
                                <TableHead className="text-center">End Time</TableHead>
                                <TableHead className="text-center">Total Working Hours</TableHead>
                                <TableHead className="text-center">PO</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center">
                                        No QC report data found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center">{entry.working_date}</TableCell>
                                        <TableCell className="text-center font-medium">{entry.name}</TableCell>
                                        <TableCell className="text-center max-w-[150px]">
                                            <Tooltip content={entry.client_name || "N/A"}>
                                                <span className="block truncate cursor-default">{entry.client_name || "N/A"}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-center max-w-[250px]">
                                            <Tooltip content={entry.file_name || "N/A"}>
                                                <span className="block truncate cursor-default">{entry.file_name || "N/A"}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-center">{entry.work_type}</TableCell>
                                        <TableCell className="text-center">{entry.page_no}</TableCell>
                                        <TableCell className="text-center">{entry.start_time}</TableCell>
                                        <TableCell className="text-center">{entry.end_time}</TableCell>
                                        <TableCell className="text-center">{entry.total_working_hours}</TableCell>
                                        <TableCell className="text-center">{entry.po}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                    <SelectItem value="100">100 per page</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={currentPage === pageNum ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}

function ProcessorReport() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    useEffect(() => {
        fetchProcessorReport();
    }, []);

    const fetchProcessorReport = async () => {
        try {
            setIsLoading(true);
            setError(null);

            let url = "/api/analytics/processor-report";
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            setReportData(data);
        } catch (err) {
            console.error("Error fetching Processor report:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter data based on search query
    const filteredData = reportData.filter((entry) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            entry.name?.toLowerCase().includes(query) ||
            entry.client_name?.toLowerCase().includes(query) ||
            entry.file_name?.toLowerCase().includes(query) ||
            entry.work_type?.toLowerCase().includes(query)
        );
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, startDate, endDate]);

    // Export to Excel function
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => ({
            "Working Date": entry.working_date,
            "Name": entry.name,
            "Client Name": entry.client_name,
            "File Name": entry.file_name,
            "Work Type": entry.work_type,
            "Page Count": entry.page_no,
            "Start Time": entry.start_time,
            "End Time": entry.end_time,
            "Total Working Hours": entry.total_working_hours,
            "PO": entry.po,
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Processor Report");
        XLSX.writeFile(wb, `Processor_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    /* -------------------- LOADING -------------------- */
    if (isLoading) {
        return <Skeleton className="h-[400px] w-full rounded-lg" />;
    }

    /* -------------------- ERROR -------------------- */
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
                <Button onClick={fetchProcessorReport} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search by name, client, file..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* Date Filters */}
                        <div className="flex flex-wrap gap-4 items-end">
                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(parse(startDate, 'yyyy-MM-dd', new Date()), 'PP') : <span className="text-muted-foreground">Pick date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate ? parse(startDate, 'yyyy-MM-dd', new Date()) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setStartDate(format(date, 'yyyy-MM-dd'));
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-[160px] justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(parse(endDate, 'yyyy-MM-dd', new Date()), 'PP') : <span className="text-muted-foreground">Pick date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate ? parse(endDate, 'yyyy-MM-dd', new Date()) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    setEndDate(format(date, 'yyyy-MM-dd'));
                                                }
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Filter Button */}
                            <Button
                                onClick={fetchProcessorReport}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Filter
                            </Button>

                            {/* Download Excel Button */}
                            <Button
                                onClick={exportToExcel}
                                variant="outline"
                                disabled={filteredData.length === 0}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Excel
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Card */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>Processor Report</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            {filteredData.length} record{filteredData.length !== 1 ? 's' : ''} found
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">Working Date</TableHead>
                                <TableHead className="text-center">Name</TableHead>
                                <TableHead className="text-center">Client Name</TableHead>
                                <TableHead className="text-center">File Name</TableHead>
                                <TableHead className="text-center">Work Type</TableHead>
                                <TableHead className="text-center">Page Count</TableHead>
                                <TableHead className="text-center">Start Time</TableHead>
                                <TableHead className="text-center">End Time</TableHead>
                                <TableHead className="text-center">Total Working Hours</TableHead>
                                <TableHead className="text-center">PO</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={10} className="text-center">
                                        No Processor report data found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center">{entry.working_date}</TableCell>
                                        <TableCell className="text-center font-medium">{entry.name}</TableCell>
                                        <TableCell className="text-center max-w-[150px]">
                                            <Tooltip content={entry.client_name || "N/A"}>
                                                <span className="block truncate cursor-default">{entry.client_name || "N/A"}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-center max-w-[250px]">
                                            <Tooltip content={entry.file_name || "N/A"}>
                                                <span className="block truncate cursor-default">{entry.file_name || "N/A"}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-center">{entry.work_type}</TableCell>
                                        <TableCell className="text-center">{entry.page_no}</TableCell>
                                        <TableCell className="text-center">{entry.start_time}</TableCell>
                                        <TableCell className="text-center">{entry.end_time}</TableCell>
                                        <TableCell className="text-center">{entry.total_working_hours}</TableCell>
                                        <TableCell className="text-center">
                                        {typeof entry.po === 'number' ? entry.po.toFixed(2) : entry.po || "N/A"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination */}
                {filteredData.length > 0 && (
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} records
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={itemsPerPage.toString()}
                                onValueChange={(value) => {
                                    setItemsPerPage(Number(value));
                                    setCurrentPage(1);
                                }}
                            >
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10 per page</SelectItem>
                                    <SelectItem value="25">25 per page</SelectItem>
                                    <SelectItem value="50">50 per page</SelectItem>
                                    <SelectItem value="100">100 per page</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={currentPage === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={currentPage === pageNum ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}