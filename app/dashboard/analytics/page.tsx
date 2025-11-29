"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const analyticsTables = [
    { id: "attendance", name: "Attendance"},
    { id: "daily-user", name: "User Daily Report"},
    { id: "monthly-user", name: "User Monthly Report"},
    { id: "po-report", name: "PO Report"},
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
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Analytics Tables</h2>
                </div>
                <nav className="flex-1 overflow-y-auto p-2">
                    {analyticsTables.map((table) => {
                        const isActive = selectedTable === table.id;
                        return (
                            <button
                                key={table.id}
                                onClick={() => setSelectedTable(table.id)}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-md mb-1 transition-colors ${
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
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {analyticsTables.find((table) => table.id === selectedTable)?.name || "Attendance Report"}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            View the latest analytics and metrics for your projects and tasks.
                        </p>
                    </div>
                    {renderTable()}
                </div>
            </div>
        </div>
    );
}

function AttendanceTable() {
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null); // null = all users

    useEffect(() => {
        fetchAttendanceData();
    }, []);

    const fetchAttendanceData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch("/api/analytics/attendance");
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            setAttendanceData(data);
        } catch (err) {
            console.error("Error fetching attendance:", err);
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Get unique usernames from attendance data
    const uniqueUsers = Array.from(
        new Set(attendanceData.map((record) => record.employee_name))
    ).filter(Boolean).sort();

    // Filter attendance data based on selected user
    const filteredData = selectedUser
        ? attendanceData.filter((record) => record.employee_name === selectedUser)
        : attendanceData;

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading attendance data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">Error: {error}</p>
                        <button
                            onClick={fetchAttendanceData}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-4">
            {/* User List Sidebar */}
            <div className="w-64 bg-white rounded-lg shadow border border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900">Filter by Employee</h4>
                    <p className="text-xs text-gray-500 mt-1">
                        ({uniqueUsers.length})
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                    <button
                        onClick={() => setSelectedUser(null)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md mb-1 transition-colors ${
                            selectedUser === null
                                ? "bg-blue-600 text-white"
                                : "text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                        All ({attendanceData.length})
                    </button>
                    {uniqueUsers.map((userName) => {
                        const userRecordCount = attendanceData.filter(
                            (record) => record.employee_name === userName
                        ).length;
                        return (
                            <button
                                key={userName}
                                onClick={() => setSelectedUser(userName)}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md mb-1 transition-colors ${
                                    selectedUser === userName
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-700 hover:bg-gray-100"
                                }`}
                            >
                                {userName} ({userRecordCount})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Attendance Table */}
            <div className="flex-1 bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Attendance Report</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {selectedUser 
                                ? `Showing records for: ${selectedUser}` 
                                : "Showing all employees"}
                            {" "}({filteredData.length} record{filteredData.length !== 1 ? 's' : ''})
                        </p>
                    </div>
                    <button
                        onClick={fetchAttendanceData}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                        Refresh
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Department
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Attendance Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    InTime
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    OutTime
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Shift
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Shift InTime
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Shift OutTime
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Work Duration
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    OT
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total Duration
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    LateBy
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    EarlyGoingBy
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Punch Records
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={17} className="px-6 py-4 text-center text-gray-500">
                                        No attendance data found
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((record, index) => (
                                    <tr key={record.id || index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.department}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.employee_id}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {record.employee_name}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.role}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.attendance_date}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.in_time}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.out_time}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.shift}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.shift_in_time}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.shift_out_time}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.work_duration}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.ot}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.total_duration}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.late_by}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.early_going_by}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                record.status === "Present" 
                                                    ? "bg-green-100 text-green-800" 
                                                    : "bg-red-100 text-red-800"
                                            }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                            {record.punch_records}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function UserDailyReport() {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Daily Report</h3>
            <p className="text-gray-500">View the user daily activity and performance metrics.</p>
        </div>
    );
}

function UserMonthlyReport() {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Monthly Report</h3>
            <p className="text-gray-500">View the user monthly activity and performance metrics.</p>
        </div>
    );
}

function POReport() {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PO Report</h3>
            <p className="text-gray-500">View the PO data and tracking information.</p>
        </div>
    );
}

function QAReport() {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">QA Report</h3>
            <p className="text-gray-500">View the QA data and tracking information.</p>
        </div>
    );
}

function DTPMonthlyReport() {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">DTP Monthly Report</h3>
            <p className="text-gray-500">View the DTP monthly data and tracking information.</p>
        </div>
    );
}

function DTPTracking() {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">DTP Tracking</h3>
            <p className="text-gray-500">View the DTP tracking data and information.</p>
        </div>
    );
}

function FeedbackReport() {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Report</h3>
            <p className="text-gray-500">View the feedback data and information.</p>
        </div>
    );
}