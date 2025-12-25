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

const analyticsTables = [
    { id: "attendance", name: "Attendance"},
    { id: "daily-user", name: "User Daily Report"},
    { id: "monthly-user", name: "User Monthly Report"},
    { id: "po-report", name: "PO Report"},
    { id: "qc-report", name: "QC Report"},
    { id: "processor-report", name: "Processor Report"},
    { id: "qa-report", name: "QA Report"},
    { id: "dtp-monthly", name: "DTP Monthly Report"},
    { id: "dtp-tracking", name: "DTP Tracking"},
    { id: "feedback", name: "Feedback Report"},
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
            case "dtp-tracking":
                return <DTPTracking />;
            case "feedback":
                return <FeedbackReport />;
            default:
                return <AttendanceTable />;
        }
    };

    return (
        <div className="flex h-[calc(100vh-6rem)]">
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-900">Analytics</h2>
                </div>
                <nav className="flex-1 overflow-y-auto p-2">
                    <div className="px-3 py-2 mb-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Reports</p>
                    </div>
                    {analyticsTables.map((table) => {
                        const isActive = selectedTable === table.id;
                        return (
                            <button
                                key={table.id}
                                onClick={() => setSelectedTable(table.id)}
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors mb-0.5 ${
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-700 hover:bg-gray-100"
                                 } `}
                            >
                                {table.name} 
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
                <div className="p-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">
                            {analyticsTables.find((table) => table.id === selectedTable)?.name || "Attendance Report"}
                        </h1>
                        <p className="mt-1.5 text-sm text-gray-600">
                            View the latest analytics and metrics for your projects and tasks.
                        </p>
                    </div>
                    <div>
                        {renderTable()}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AttendanceTable() {
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedUser, setSelectedUser] = useState<string | null>(null)
  
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
  
    const filteredData = selectedUser
      ? attendanceData.filter((r) => r.employee_name === selectedUser)
      : attendanceData
  
    /* -------------------- LOADING -------------------- */
    if (isLoading) {
      return <Skeleton className="h-[400px] w-full rounded-lg" />
    }

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
      <div className="flex gap-6">
        {/* -------------------- SIDEBAR -------------------- */}
        <Card className="w-64 shrink-0">
          <CardHeader>
            <CardTitle className="text-sm">Filter by Employee</CardTitle>
            <p className="text-xs text-muted-foreground">
              {uniqueUsers.length} employees
            </p>
          </CardHeader>
  
          <CardContent className="space-y-1">
            <Button
              variant={selectedUser === null ? "default" : "ghost"}
              className={`w-full justify-start ${selectedUser === null ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
              onClick={() => setSelectedUser(null)}
            >
              All ({attendanceData.length})
            </Button>
  
            {uniqueUsers.map((user) => {
              const count = attendanceData.filter(
                (r) => r.employee_name === user
              ).length
  
              return (
                <Button
                  key={user}
                  variant={selectedUser === user ? "default" : "ghost"}
                  className={`w-full justify-start ${selectedUser === user ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
                  onClick={() => setSelectedUser(user)}
                >
                  {user} ({count})
                </Button>
              )
            })}
          </CardContent>
        </Card>
  
        {/* -------------------- TABLE -------------------- */}
        <Card className="flex-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Attendance Report</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedUser ?? "All employees"} · {filteredData.length} records
              </p>
            </div>
  
            <Button onClick={fetchAttendanceData} className="bg-blue-600 text-white hover:bg-blue-700">Refresh</Button>
          </CardHeader>
  
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Department</TableHead>
                  <TableHead className="text-center">Employee ID</TableHead>
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
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((r, i) => (
                    <TableRow key={r.id ?? i}>
                      <TableCell className="text-center">{r.department}</TableCell>
                      <TableCell className="text-center">{r.employee_id}</TableCell>
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
                            className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                              r.status === "Present" ? "bg-green-500" : "bg-red-500"
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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>User Daily Report</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {selectedUserId && reportData.length > 0
                            ? `${reportData.length} record${reportData.length !== 1 ? 's' : ''} found`
                            : "Select a user and date to view daily report"}
                    </p>
                </div>
            </CardHeader>

            <CardContent>
                {/* Filters */}
                <div className="flex items-end gap-4 mb-6">
                    {/* User Selection */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select User
                        </label>
                        <select
                            value={selectedUserId || ""}
                            onChange={(e) => setSelectedUserId(e.target.value || null)}
                            className="w-full px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a user...</option>
                            {availableUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date Selection */}
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Select Date
                        </label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 invisible">
                            Refresh
                        </label>
                        <Button
                            onClick={fetchDailyReport}
                            disabled={!selectedUserId || isLoading}
                            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-center">S.No</TableHead>
                                <TableHead className="text-center">Year</TableHead>
                                <TableHead className="text-center">Month</TableHead>
                                <TableHead className="text-center">Working Date</TableHead>
                                <TableHead className="text-center">Name</TableHead>
                                <TableHead className="text-center">Client Name</TableHead>
                                <TableHead className="text-center">File No</TableHead>
                                <TableHead className="text-center">Work Type</TableHead>
                                <TableHead className="text-center">No of Pages</TableHead>
                                <TableHead className="text-center">Start Time</TableHead>
                                <TableHead className="text-center">End Time</TableHead>
                                <TableHead className="text-center">Total Working Time</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {reportData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={12} className="text-center">
                                        {selectedUserId
                                            ? "No data found for the selected date"
                                            : "Please select a user and date"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reportData.map((entry, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="text-center">{entry.s_no}</TableCell>
                                        <TableCell className="text-center">{entry.year}</TableCell>
                                        <TableCell className="text-center">{entry.month}</TableCell>
                                        <TableCell className="text-center">{entry.working_date}</TableCell>
                                        <TableCell className="text-center font-medium">
                                            {entry.name}
                                        </TableCell>
                                        <TableCell className="text-center">{entry.client_name}</TableCell>
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
                </div>
            </CardContent>
        </Card>
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

    if (!reportData || !reportData.data || reportData.data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Monthly User Report</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex items-end gap-4 mb-4">
                            {/* Team Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Team Type
                                </label>
                                <select
                                    value={selectedTeamType}
                                    onChange={(e) => {
                                        setSelectedTeamType(e.target.value);
                                        setSelectedUserIds([]);
                                    }}
                                    className="px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                                >
                                    <option value="">All Teams</option>
                                    <option value="QA">QA</option>
                                    <option value="QC">QC</option>
                                    <option value="Processor">Processor</option>
                                </select>
                            </div>

                            {/* User Selection Dropdown */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Users
                                </label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                        className="w-full min-w-[200px] px-3 py-2 h-[42px] text-left border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                                    >
                                        <span className="text-sm text-gray-700 truncate">
                                            {isAllSelected
                                                ? "All users"
                                                : selectedUserIds.length === 0
                                                ? "Select users..."
                                                : `${selectedUserIds.length} user${selectedUserIds.length > 1 ? 's' : ''} selected`}
                                        </span>
                                        <svg
                                            className={`h-5 w-5 text-gray-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isUserDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setIsUserDropdownOpen(false)}
                                            ></div>
                                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden">
                                                {/* Search Input */}
                                                <div className="p-2 border-b border-gray-200">
                                                    <input
                                                        type="text"
                                                        placeholder="Search users..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>

                                                {/* All Option */}
                                                <label
                                                    className="flex items-center space-x-3 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-200"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllSelected}
                                                        onChange={handleAllToggle}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <span className="text-sm font-medium text-gray-700 flex-1">All</span>
                                                </label>

                                                {/* Users List */}
                                                <div className="max-h-48 overflow-y-auto">
                                                    {filteredUsers.length === 0 ? (
                                                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                            No users found
                                                        </div>
                                                    ) : (
                                                        filteredUsers.map((user) => (
                                                            <label
                                                                key={user.id}
                                                                className="flex items-center space-x-3 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedUserIds.includes(user.id)}
                                                                    onChange={() => {
                                                                        handleUserToggle(user.id);
                                                                        if (selectedUserIds.includes(user.id)) {
                                                                            setIsAllSelected(false);
                                                                        }
                                                                    }}
                                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                                <span className="text-sm text-gray-700 flex-1">{user.name}</span>
                                                                {user.role && (
                                                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                                        {user.role}
                                                                    </span>
                                                                )}
                                                            </label>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Month Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Month
                                </label>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 invisible">
                                Refresh
                            </label>
                            <Button
                                onClick={fetchMonthlyReport}
                                disabled={isLoading}
                                className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Loading..." : "Refresh"}
                            </Button>
                        </div>
                    </div>

                    {/* Selected Users Display */}
                    {selectedUserIds.length > 0 && (
                        <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                                {getSelectedUserNames().map((name: string) => {
                                    const userId = availableUsers.find((u: any) => u.name === name)?.id;
                                    return (
                                        <Badge
                                            key={userId}
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                        >
                                            {name}
                                            <button
                                                onClick={() => handleUserToggle(userId!)}
                                                className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                                                type="button"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <p className="text-gray-500 text-center mt-4">
                        {selectedUserIds.length > 0
                            ? "No data found for the selected month"
                            : "Please select users and month"}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Monthly User Report</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {reportData.data.length} record{reportData.data.length !== 1 ? 's' : ''} found
                    </p>
                </div>
            </CardHeader>

            <CardContent>
                {/* Filters */}
                <div className="flex items-end gap-4 mb-6">
                        {/* Team Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Team Type
                            </label>
                            <select
                                value={selectedTeamType}
                                onChange={(e) => {
                                    setSelectedTeamType(e.target.value);
                                    setSelectedUserIds([]);
                                }}
                                className="px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                            >
                                <option value="">All Teams</option>
                                <option value="QA">QA</option>
                                <option value="QC">QC</option>
                                <option value="Processor">Processor</option>
                            </select>
                        </div>

                        {/* User Selection Dropdown */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Users
                            </label>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                    className="w-full min-w-[200px] px-3 py-2 h-[42px] text-left border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                                >
                                    <span className="text-sm text-gray-700 truncate">
                                        {isAllSelected
                                            ? "All users"
                                            : selectedUserIds.length === 0
                                            ? "Select users..."
                                            : `${selectedUserIds.length} user${selectedUserIds.length > 1 ? 's' : ''} selected`}
                                    </span>
                                    <svg
                                        className={`h-5 w-5 text-gray-400 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {isUserDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setIsUserDropdownOpen(false)}
                                        ></div>
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-hidden">
                                            {/* Search Input */}
                                            <div className="p-2 border-b border-gray-200">
                                                <input
                                                    type="text"
                                                    placeholder="Search users..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>

                                            {/* All Option */}
                                            <label
                                                className="flex items-center space-x-3 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-200"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={handleAllToggle}
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <span className="text-sm font-medium text-gray-700 flex-1">All</span>
                                            </label>

                                            {/* Users List */}
                                            <div className="max-h-48 overflow-y-auto">
                                                {filteredUsers.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                        No users found
                                                    </div>
                                                ) : (
                                                    filteredUsers.map((user) => (
                                                        <label
                                                            key={user.id}
                                                            className="flex items-center space-x-3 px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedUserIds.includes(user.id)}
                                                                onChange={() => {
                                                                    handleUserToggle(user.id);
                                                                    if (selectedUserIds.includes(user.id)) {
                                                                        setIsAllSelected(false);
                                                                    }
                                                                }}
                                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            <span className="text-sm text-gray-700 flex-1">{user.name}</span>
                                                            {user.role && (
                                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                                    {user.role}
                                                                </span>
                                                            )}
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Month Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Month
                            </label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 invisible">
                            Refresh
                        </label>
                        <Button
                            onClick={fetchMonthlyReport}
                            disabled={isLoading}
                            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>
                </div>

                {/* Selected Users Display */}
                {selectedUserIds.length > 0 && (
                    <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                            {getSelectedUserNames().map((name: string) => {
                                const userId = availableUsers.find((u: any) => u.name === name)?.id;
                                return (
                                    <Badge
                                        key={userId}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                    >
                                        {name}
                                        <button
                                            onClick={() => handleUserToggle(userId!)}
                                            className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                                            type="button"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
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
                            {reportData.data.map((entry: any) => (
                                <TableRow key={entry.user_id}>
                                    <TableCell className="text-center">{entry.s_no}</TableCell>
                                    <TableCell className="text-center font-medium">{entry.name}</TableCell>
                                    <TableCell className="text-center">{entry.total_pages || 0}</TableCell>
                                    <TableCell className="text-center">{parseFloat(entry.total_hours || 0).toFixed(2)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function POReport() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

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
                // Try to get error message from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    // If response is not JSON, use status text
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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>PO Report</CardTitle>
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
                            onClick={fetchPOReport}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Filter
                        </Button>
                    </div>
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
                        {reportData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={11} className="text-center">
                                    No PO report data found
                                </TableCell>
                            </TableRow>
                        ) : (
                            reportData.map((entry, index) => (
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
                                                className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                                                    entry.status === "Delivered" || entry.status === "Completed"
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
        </Card>
    );
}

function QAReport() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

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
                // Try to get error message from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    // If response is not JSON, use status text
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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>QA Report</CardTitle>
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
                            onClick={fetchQAReport}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Filter
                        </Button>
                    </div>
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
                        {reportData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center">
                                    No QA report data found
                                </TableCell>
                            </TableRow>
                        ) : (
                            reportData.map((entry, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-center">{entry.working_date}</TableCell>
                                    <TableCell className="text-center font-medium">{entry.name}</TableCell>
                                    <TableCell className="text-center">{entry.client_name}</TableCell>
                                    <TableCell className="text-center">{entry.file_name}</TableCell>
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
        </Card>
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

    useEffect(() => {
        fetchDTPMonthlyReport(); 
    }, [selectedMonth]);

    const fetchDTPMonthlyReport = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const response = await fetch(`/api/analytics/dtp-report?month=${selectedMonth}`);

            if (!response.ok) {
                // Try to get error message from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    // If response is not JSON, use status text
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

    if (!reportData || reportData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>DTP Monthly Report</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex items-end gap-4 mb-4">
                        {/* Month Selection */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Month
                            </label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 invisible">
                                Refresh
                            </label>
                            <Button
                                onClick={fetchDTPMonthlyReport}
                                disabled={isLoading}
                                className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Loading..." : "Refresh"}
                            </Button>
                        </div>
                    </div>

                    <p className="text-gray-500 text-center mt-4">
                        No DTP Monthly report data found for the selected month.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>DTP Monthly Report</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {reportData.length} record{reportData.length !== 1 ? 's' : ''} found
                    </p>
                </div>
                <div className="flex items-end gap-4">
                    {/* Month Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Month
                        </label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5 invisible">
                            Refresh
                        </label>
                        <Button
                            onClick={fetchDTPMonthlyReport}
                            disabled={isLoading}
                            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Loading..." : "Refresh"}
                        </Button>
                    </div>
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
                        {reportData.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell className="text-center">{entry.s_no}</TableCell>
                                <TableCell className="text-center">{entry.date}</TableCell>
                                <TableCell className="text-center font-medium">{entry.name}</TableCell>
                                <TableCell className="text-center">{entry.client_name}</TableCell>
                                <TableCell className="text-center">{entry.job_no}</TableCell>
                                <TableCell className="text-center">{entry.process}</TableCell>
                                <TableCell className="text-center">{entry.page_count}</TableCell>
                                <TableCell className="text-center">{entry.start_time}</TableCell>
                                <TableCell className="text-center">{entry.end_time}</TableCell>
                                <TableCell className="text-center">{entry.total_time_taken}</TableCell>
                                <TableCell className="text-center">{entry.shift}</TableCell>
                                <TableCell className="text-center">{entry.po}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function DTPTracking() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

    useEffect(() => {
        fetchDTPTracking();
    }, []);

    const fetchDTPTracking = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            let url = "/api/analytics/dtp-tracking";
            const params = new URLSearchParams();
            if (startDate) {
                params.append("startDate", startDate);
            }
            if (endDate) {
                params.append("endDate", endDate);
            }
            
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
            console.error("Error fetching DTP Tracking:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
            setReportData([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFilter = () => {
        fetchDTPTracking();
    };

    const handleClearFilters = () => {
        setStartDate("");
        setEndDate("");
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
                <Button onClick={fetchDTPTracking} className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
                    Retry
                </Button>
            </Alert>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <CardTitle>DTP Tracking</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                            View detailed DTP tracking information for all jobs
                        </p>
                    </div>
                </div>

                {/* Filter Section */}
                <div className="flex items-end gap-4 mt-4">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 h-[42px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5 invisible">
                            Filter
                        </label>
                        <div className="flex gap-2">
                            <Button
                                onClick={handleFilter}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Filter
                            </Button>
                            {(startDate || endDate) && (
                                <Button
                                    onClick={handleClearFilters}
                                    variant="outline"
                                    className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="overflow-x-auto">
                {reportData.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No DTP Tracking data found.</p>
                        {(startDate || endDate) && (
                            <Button
                                onClick={handleClearFilters}
                                variant="link"
                                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                                Clear filters to see all data
                            </Button>
                        )}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {/* Job Details Columns */}
                                <TableHead className="text-center">Job No</TableHead>
                                <TableHead className="text-center">Delivered by</TableHead>
                                <TableHead className="text-center">PO</TableHead>
                                <TableHead className="text-center min-w-[500px]">Mail instruction</TableHead>
                                <TableHead className="text-center">Task type</TableHead>
                                <TableHead className="text-center">Task Name</TableHead>
                                <TableHead className="text-center">File Count</TableHead>
                                <TableHead className="text-center">Page count</TableHead>
                                
                                {/* DTP Process Tracking Columns */}
                                <TableHead className="text-center">Language</TableHead>
                                <TableHead className="text-center">Platform</TableHead>
                                <TableHead className="text-center">Stage</TableHead>
                                <TableHead className="text-center">Date</TableHead>
                                <TableHead className="text-center">Delivery Time</TableHead>
                                <TableHead className="text-center">DTP Person</TableHead>
                                <TableHead className="text-center">DTP Start Time</TableHead>
                                <TableHead className="text-center">DTP End Time</TableHead>
                                <TableHead className="text-center">DTP Abbyy Compare</TableHead>
                                <TableHead className="text-center">DTP Status</TableHead>
                                
                                {/* QC Tracking Columns */}
                                <TableHead className="text-center">QC taken by</TableHead>
                                <TableHead className="text-center">QC Start Time</TableHead>
                                <TableHead className="text-center">QC End Time</TableHead>
                                <TableHead className="text-center">QC Abbyy Compare</TableHead>
                                <TableHead className="text-center">QC Status</TableHead>
                                <TableHead className="text-center">QC CXN taken</TableHead>
                                <TableHead className="text-center">QC CXN Start Time</TableHead>
                                <TableHead className="text-center">QC CXN End Time</TableHead>
                                <TableHead className="text-center">CXN Status</TableHead>
                                
                                {/* QA Tracking & Final Status Columns */}
                                <TableHead className="text-center">QA taken by</TableHead>
                                <TableHead className="text-center">QA Start Time</TableHead>
                                <TableHead className="text-center">QA End Time</TableHead>
                                <TableHead className="text-center">QA Abbyy Compare</TableHead>
                                <TableHead className="text-center">QA Status</TableHead>
                                <TableHead className="text-center">QA CXN taken</TableHead>
                                <TableHead className="text-center">QA CXN Start Time</TableHead>
                                <TableHead className="text-center">QA CXN End Time</TableHead>
                                <TableHead className="text-center">File Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.map((entry, index) => (
                                <TableRow key={entry.job_no || index}>
                                    {/* Job Details Data */}
                                    <TableCell className="text-center">{entry.job_no || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.delivered_by || "N/A"}</TableCell>
                                    <TableCell className="text-center">
                                        {typeof entry.po === 'number' ? entry.po.toFixed(2) : entry.po || "N/A"}
                                    </TableCell>
                                    <TableCell className="text-center min-w-[500px] max-w-[800px] whitespace-normal break-words">{entry.mail_instruction || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.task_type || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.task_name || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.file_count || 0}</TableCell>
                                    <TableCell className="text-center">{entry.page_count || 0}</TableCell>
                                    
                                    {/* DTP Process Tracking Data */}
                                    <TableCell className="text-center">{entry.language || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.platform || "N/A"}</TableCell>
                                    <TableCell className="text-center">
                                        {entry.stage && entry.stage !== "N/A" ? (
                                            <Badge
                                                className={
                                                    entry.stage === "Completed"
                                                        ? "bg-white-100 text-black-700 hover:bg-green-200 border-transparent"
                                                        : "bg-white-100 text-black-700 hover:bg-yellow-200 border-transparent"
                                                }
                                            >
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                                                        entry.stage === "Completed"
                                                            ? "bg-green-500"
                                                            : entry.stage === "Pending"
                                                            ? "bg-yellow-500"
                                                            : "bg-yellow-500"
                                                    }`}
                                                />
                                                {entry.stage === "Completed" ? "Completed" : entry.stage === "Pending" ? "Pending" : entry.stage}
                                            </Badge>
                                        ) : (
                                            "N/A"
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">{entry.date || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.delivery_time || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.dtp_person || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.dtp_start_time || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.dtp_end_time || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.abbyy_compare_dtp || "N/A"}</TableCell>
                                    <TableCell className="text-center">
                                        {entry.dtp_status && entry.dtp_status !== "N/A" ? (
                                            <Badge
                                                className={
                                                    entry.dtp_status === "Completed"
                                                        ? "bg-white-100 text-black-700 hover:bg-green-200 border-transparent"
                                                        : "bg-white-100 text-black-700 hover:bg-yellow-200 border-transparent"
                                                }
                                            >
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                                                        entry.dtp_status === "Completed"
                                                            ? "bg-green-500"
                                                            : entry.dtp_status === "Pending"
                                                            ? "bg-yellow-500"
                                                            : "bg-yellow-500"
                                                    }`}
                                                />
                                                {entry.dtp_status === "Completed" ? "Completed" : entry.dtp_status === "Pending" ? "Pending" : entry.dtp_status}
                                            </Badge>
                                        ) : (
                                            "N/A"
                                        )}
                                    </TableCell>
                                    
                                    {/* QC Tracking Data */}
                                    <TableCell className="text-center">{entry.qc_taken_by || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.qc_start_time || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.qc_end_time || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.abbyy_compare_qc || "N/A"}</TableCell>
                                    <TableCell className="text-center">
                                        {entry.qc_status && entry.qc_status !== "N/A" ? (
                                            <Badge
                                                className={
                                                    entry.qc_status === "Completed"
                                                        ? "bg-white-100 text-black-700 hover:bg-green-200 border-transparent"
                                                        : "bg-white-100 text-black-700 hover:bg-yellow-200 border-transparent"
                                                }
                                            >
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                                                        entry.qc_status === "Completed"
                                                            ? "bg-green-500"
                                                            : entry.qc_status === "Pending"
                                                            ? "bg-yellow-500"
                                                            : "bg-yellow-500"
                                                    }`}
                                                />
                                                {entry.qc_status === "Completed" ? "Completed" : entry.qc_status === "Pending" ? "Pending" : entry.qc_status}
                                            </Badge>
                                        ) : (
                                            "N/A"
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">{entry.qc_cxn_taken || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.qc_cxn_start_time || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.qc_cxn_end_time || "N/A"}</TableCell>
                                    <TableCell className="text-center">
                                        {entry.cxn_status && entry.cxn_status !== "N/A" ? (
                                            <Badge
                                                className={
                                                    entry.cxn_status === "Yes"
                                                        ? "bg-white-100 text-black-700 hover:bg-green-200 border-transparent"
                                                        : "bg-white-100 text-black-700 hover:bg-yellow-200 border-transparent"
                                                }
                                            >
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                                                        entry.cxn_status === "Yes"
                                                            ? "bg-green-500"
                                                            : entry.cxn_status === "Pending"
                                                            ? "bg-yellow-500"
                                                            : "bg-yellow-500"
                                                    }`}
                                                />
                                                {entry.cxn_status === "Completed" ? "Completed" : entry.cxn_status === "Pending" ? "Pending" : entry.cxn_status}
                                            </Badge>
                                        ) : (
                                            "N/A"
                                        )}
                                    </TableCell>
                                    
                                    {/* QA Tracking & Final Status Data */}
                                    <TableCell className="text-center">{entry.qa_taken_by || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.qa_start_time || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.qa_end_time || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.abbyy_compare_qa || "N/A"}</TableCell>
                                    <TableCell className="text-center">
                                        {entry.qa_status && entry.qa_status !== "N/A" ? (
                                            <Badge
                                                className={
                                                    entry.qa_status === "Completed"
                                                        ? "bg-white-100 text-black-700 hover:bg-green-200 border-transparent"
                                                        : "bg-white-100 text-black-700 hover:bg-yellow-200 border-transparent"
                                                }
                                            >
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                                                        entry.qa_status === "Completed"
                                                            ? "bg-green-500"
                                                            : entry.qa_status === "Pending"
                                                            ? "bg-yellow-500"
                                                            : "bg-yellow-500"
                                                    }`}
                                                />
                                                {entry.qa_status === "Completed" ? "Completed" : entry.qa_status === "Pending" ? "Pending" : entry.qa_status}
                                            </Badge>
                                        ) : (
                                            "N/A"
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">{entry.qa_cxn_taken || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.qa_cxn_start_time || "N/A"}</TableCell>
                                    <TableCell className="text-center">{entry.qa_cxn_end_time || "N/A"}</TableCell>
                                    <TableCell className="text-center">
                                        {entry.file_status && entry.file_status !== "N/A" ? (
                                            <Badge
                                                className={
                                                    entry.file_status === "Completed"
                                                        ? "bg-white-100 text-black-700 hover:bg-green-200 border-transparent"
                                                        : "bg-white-100 text-black-700 hover:bg-yellow-200 border-transparent"
                                                }
                                            >
                                                <span
                                                    className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                                                        entry.file_status === "Completed"
                                                            ? "bg-green-500"
                                                            : entry.file_status === "Pending"
                                                            ? "bg-yellow-500"
                                                            : "bg-yellow-500"
                                                    }`}
                                                />
                                                {entry.file_status === "Completed" ? "Completed" : entry.file_status === "Pending" ? "Pending" : entry.file_status}
                                            </Badge>
                                        ) : (
                                            "N/A"
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
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

            console.log("Feedback Report: Fetching from URL:", url);
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
            console.log("Feedback Report API Response:", data);
            console.log("Feedback Report Data Length:", Array.isArray(data) ? data.length : "Not an array");
            
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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>QC Report</CardTitle>
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
                            onClick={fetchQCReport}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Filter
                        </Button>
                    </div>
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
                        {reportData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center">
                                    No QC report data found
                                </TableCell>
                            </TableRow>
                        ) : (
                            reportData.map((entry, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-center">{entry.working_date}</TableCell>
                                    <TableCell className="text-center font-medium">{entry.name}</TableCell>
                                    <TableCell className="text-center">{entry.client_name}</TableCell>
                                    <TableCell className="text-center">{entry.file_name}</TableCell>
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
        </Card>
    );
}

function ProcessorReport() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");

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
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Processor Report</CardTitle>
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
                            onClick={fetchProcessorReport}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            Filter
                        </Button>
                    </div>
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
                        {reportData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={10} className="text-center">
                                    No Processor report data found
                                </TableCell>
                            </TableRow>
                        ) : (
                            reportData.map((entry, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-center">{entry.working_date}</TableCell>
                                    <TableCell className="text-center font-medium">{entry.name}</TableCell>
                                    <TableCell className="text-center">{entry.client_name}</TableCell>
                                    <TableCell className="text-center">{entry.file_name}</TableCell>
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
        </Card>
    );
}