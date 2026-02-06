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
import { ChevronDownIcon, Box, House, PanelsTopLeft, Users, ClipboardCheck, ShieldCheck, Cpu, ChartNoAxesCombined, FileText, MessageSquare } from "lucide-react"
import * as XLSX from "xlsx"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parse } from "date-fns"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
  import { 
    Clock, 
    Timer, 
    TrendingUp, 
    Coffee, 
    UserX, 
    User, 
    Calendar as CalendarIcon, 
    RefreshCw, 
    Download, 
    Search, 
    ChevronLeft, 
    ChevronRight, 
    Check, 
    AlertCircle, 
    Table as TableIcon, 
    BarChart3 
} from "lucide-react"

const analyticsTables = [
    { id: "attendance", name: "Attendance", icon: Users },
    { id: "daily-user", name: "User Daily Report", icon: FileText },
    { id: "monthly-user", name: "User Monthly Report", icon: BarChart3 },
    { id: "po-report", name: "PO Report", icon: PanelsTopLeft },
    { id: "qc-report", name: "QC Report", icon: ClipboardCheck },
    { id: "processor-report", name: "Processor Report", icon: Cpu },
    { id: "qa-report", name: "QA Report", icon: ShieldCheck },
    { id: "dtp-monthly", name: "DTP Monthly Report", icon: ChartNoAxesCombined },
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
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')

    // State for selected columns (all selected by default)
    const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
        department: true,
        employee_name: true,
        role: true,
        attendance_date: true,
        in_time: true,
        out_time: true,
        shift: true,
        shift_in_time: true,
        shift_out_time: true,
        work_duration: true,
        ot: true,
        total_duration: true,
        late_by: true,
        early_going_by: true,
        status: true,
        punch_records: true,
    })

    // Define column categories
    const COLUMN_CATEGORIES = {
        employeeInfo: {
            label: "Employee Information",
            columns: [
                { key: "department", label: "Department" },
                { key: "employee_name", label: "Employee Name" },
                { key: "role", label: "Role" },
                { key: "attendance_date", label: "Date" },
            ],
        },
        timeTracking: {
            label: "Time Tracking",
            columns: [
                { key: "in_time", label: "In" },
                { key: "out_time", label: "Out" },
                { key: "shift", label: "Shift" },
                { key: "shift_in_time", label: "Shift In Time" },
                { key: "shift_out_time", label: "Shift Out Time" },
            ],
        },
        workHours: {
            label: "Work Hours & Overtime",
            columns: [
                { key: "work_duration", label: "Work" },
                { key: "ot", label: "OT" },
                { key: "total_duration", label: "Total Duration" },
            ],
        },
        attendance: {
            label: "Attendance & Punctuality",
            columns: [
                { key: "late_by", label: "Late By" },
                { key: "early_going_by", label: "Early Going By" },
                { key: "status", label: "Status" },
                { key: "punch_records", label: "Punch Records" },
            ],
        },
    }

    useEffect(() => {
        fetchAttendanceData()
    }, [selectedDate])

    const fetchAttendanceData = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const formattedDate = format(selectedDate, "yyyy-MM-dd")
            const response = await fetch(`/api/analytics/attendance?date=${formattedDate}`)
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

    // Filter data based on selected user, date, and search query.
    // We always filter by the chosen date; we only show rows once an employee is selected.
    const filteredData = selectedUser
        ? attendanceData.filter((r) => {
            const selectedDateStr = format(selectedDate, "dd/MM/yyyy")
            const matchesDate = r.attendance_date === selectedDateStr
            const matchesUser = r.employee_name === selectedUser
            const matchesSearch = !searchQuery ||
                r.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.department?.toLowerCase().includes(searchQuery.toLowerCase())
            
            return matchesDate && matchesUser && matchesSearch
        })
        : []

    // Summary stats now come directly from the API (already in HH:MM:SS format)
    const summaryStats = (() => {
        if (!selectedUser || filteredData.length === 0) {
            return {
                totalWorking: "00:00:00",
                totalTimeSpent: "00:00:00",
                idleTime: "00:00:00",
            }
        }

        // All rows for a user+date share the same day-level totals; read from first row
        const first = filteredData[0] as any
        return {
            totalWorking: first.total_working_time || "00:00:00",
            totalTimeSpent: first.total_time_spent || "00:00:00",
            idleTime: first.idle_time || "00:00:00",
        }
    })()

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedData = filteredData.slice(startIndex, endIndex)

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [selectedUser, searchQuery, selectedDate])

    // Handle category selection
    const handleCategoryToggle = (categoryKey: string, checked: boolean) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES]
        const newSelected = { ...selectedColumns }
        category.columns.forEach(col => {
            newSelected[col.key] = checked
        })
        setSelectedColumns(newSelected)
    }

    const isCategoryFullySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES]
        return category.columns.every(col => selectedColumns[col.key])
    }

    const isCategoryPartiallySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES]
        const selectedCount = category.columns.filter(col => selectedColumns[col.key]).length
        return selectedCount > 0 && selectedCount < category.columns.length
    }

    const handleSelectAll = () => {
        const newSelected: Record<string, boolean> = {}
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = true
            })
        })
        setSelectedColumns(newSelected)
    }

    const handleDeselectAll = () => {
        const newSelected: Record<string, boolean> = {}
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = false
            })
        })
        setSelectedColumns(newSelected)
    }

    const exportToExcel = () => {
        const exportData = filteredData.map((r) => {
            const row: Record<string, any> = {}
            
            Object.values(COLUMN_CATEGORIES).forEach(category => {
                category.columns.forEach(col => {
                    if (selectedColumns[col.key]) {
                        row[col.label] = r[col.key] || "N/A"
                    }
                })
            })
            
            return row
        })

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Attendance Report")
        XLSX.writeFile(wb, `Attendance_Report_${format(selectedDate, "yyyy-MM-dd")}.xlsx`)
    }

    const selectedColumnsCount = Object.values(selectedColumns).filter(Boolean).length

    const CustomCheckbox = ({ 
        checked, 
        onCheckedChange, 
        id, 
        className = "" 
    }: { 
        checked: boolean
        onCheckedChange: (checked: boolean) => void
        id: string
        className?: string
    }) => {
        return (
            <button
                id={id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={`h-4 w-4 rounded border border-gray-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    checked ? "bg-blue-600 border-blue-600" : "bg-white"
                } ${className}`}
            >
                {checked && <Check className="h-3 w-3 text-white" />}
            </button>
        )
    }

    // Timeline visualization component
    const TimelineRow = ({ record }: { record: any }) => {
        const shiftStart = record.shift_in_time ? parseInt(record.shift_in_time.split(':')[0]) : 0
        const shiftEnd = record.shift_out_time ? parseInt(record.shift_out_time.split(':')[0]) : 24
        const actualIn = record.in_time ? parseInt(record.in_time.split(':')[0]) + parseInt(record.in_time.split(':')[1])/60 : null
        const actualOut = record.out_time ? parseInt(record.out_time.split(':')[0]) + parseInt(record.out_time.split(':')[1])/60 : null

        return (
            <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                {/* Shift time background */}
                <div 
                    className="absolute top-0 h-full bg-blue-50 border-l-2 border-r-2 border-blue-200"
                    style={{
                        left: `${(shiftStart / 24) * 100}%`,
                        width: `${((shiftEnd - shiftStart) / 24) * 100}%`
                    }}
                />
                
                {/* Actual working time */}
                {actualIn && actualOut && (
                    <div 
                        className="absolute top-1 h-10 bg-green-400 rounded"
                        style={{
                            left: `${(actualIn / 24) * 100}%`,
                            width: `${((actualOut - actualIn) / 24) * 100}%`
                        }}
                    />
                )}

                {/* Time markers */}
                <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-gray-600">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                </div>
            </div>
        )
    }

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
        <div className="space-y-6">
            {/* -------------------- HEADER WITH STATS -------------------- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-blue-600 uppercase">Total Working Time</p>
                                <p className="text-2xl font-bold text-blue-900 mt-1">{summaryStats.totalWorking}</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-purple-600 uppercase">Total Time</p>
                                <p className="text-2xl font-bold text-purple-900 mt-1">{summaryStats.totalTimeSpent}</p>
                            </div>
                            <Timer className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-yellow-600 uppercase">Idle Time</p>
                                <p className="text-2xl font-bold text-yellow-900 mt-1">{summaryStats.idleTime}</p>
                            </div>
                            <Coffee className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* -------------------- FILTERS BAR -------------------- */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
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

                        {/* Employee Dropdown - required to view records */}
                        <Select
                            value={selectedUser || ""}
                            onValueChange={(value) => setSelectedUser(value || null)}
                        >
                            <SelectTrigger className="w-full lg:w-[250px]">
                                <SelectValue placeholder="Select employee..." />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueUsers.map((user) => (
                                    <SelectItem key={user} value={user}>
                                        {user}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Date Picker */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full lg:w-[240px] justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(selectedDate, "EEEE, MMMM dd, yyyy")}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => date && setSelectedDate(date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {/* View Mode Toggle */}
                        <div className="flex gap-2">
                            <Button
                                variant={viewMode === 'table' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('table')}
                                className={viewMode === 'table' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                            >
                                <TableIcon className="h-4 w-4 mr-2" />
                                Table
                            </Button>
                            <Button
                                variant={viewMode === 'timeline' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setViewMode('timeline')}
                                className={viewMode === 'timeline' ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Timeline
                            </Button>
                        </div>

                        {/* Refresh Button */}
                        <Button
                            onClick={fetchAttendanceData}
                            disabled={isLoading}
                            className="bg-blue-600 text-white hover:bg-blue-700 w-full lg:w-auto"
                        >
                            Refresh
                        </Button>

                        {/* Export Excel Button */}
                        <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={filteredData.length === 0}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh]">
                                <DialogHeader>
                                    <DialogTitle>Select Columns for Export</DialogTitle>
                                    <DialogDescription>
                                        Choose which columns to include in the Excel export
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <div className="flex gap-2 mb-4">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleSelectAll}
                                    >
                                        Select All
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleDeselectAll}
                                    >
                                        Deselect All
                                    </Button>
                                </div>

                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-6">
                                        {Object.entries(COLUMN_CATEGORIES).map(([categoryKey, category]) => (
                                            <div key={categoryKey} className="space-y-3">
                                                <div className="flex items-center space-x-2 pb-2 border-b">
                                                    <CustomCheckbox
                                                        id={`category-${categoryKey}`}
                                                        checked={isCategoryFullySelected(categoryKey)}
                                                        onCheckedChange={(checked) => 
                                                            handleCategoryToggle(categoryKey, checked)
                                                        }
                                                        className={isCategoryPartiallySelected(categoryKey) ? "bg-blue-400 border-blue-400" : ""}
                                                    />
                                                    <label
                                                        htmlFor={`category-${categoryKey}`}
                                                        className="text-sm font-semibold cursor-pointer"
                                                    >
                                                        {category.label}
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 pl-6">
                                                    {category.columns.map((column) => (
                                                        <div key={column.key} className="flex items-center space-x-2">
                                                            <CustomCheckbox
                                                                id={column.key}
                                                                checked={selectedColumns[column.key]}
                                                                onCheckedChange={(checked) =>
                                                                    setSelectedColumns(prev => ({
                                                                        ...prev,
                                                                        [column.key]: checked
                                                                    }))
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={column.key}
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                {column.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <DialogFooter>
                                    <div className="flex justify-between w-full items-center">
                                        <p className="text-sm text-muted-foreground">
                                            {selectedColumnsCount} columns selected
                                        </p>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline"
                                                onClick={() => setIsColumnDialogOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                onClick={() => {
                                                    exportToExcel()
                                                    setIsColumnDialogOpen(false)
                                                }}
                                                className="bg-blue-600 text-white hover:bg-blue-700"
                                                disabled={selectedColumnsCount === 0}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Export ({selectedColumnsCount} columns)
                                            </Button>
                                        </div>
                                    </div>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>

            {/* -------------------- TIMELINE VIEW -------------------- */}
            {viewMode === 'timeline' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Timeline View</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {format(selectedDate, "EEEE, MMMM dd, yyyy")} · {filteredData.length} record{filteredData.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <p className="text-lg font-medium">No attendance records found</p>
                                <p className="text-sm mt-1">Try selecting a different date or employee</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {paginatedData.map((record, index) => (
                                    <div key={index} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{record.employee_name}</p>
                                                    <p className="text-sm text-gray-500">{record.department} · {record.role}</p>
                                                </div>
                                            </div>
                                            <Badge
                                                className={
                                                    record.status === "Present"
                                                        ? "bg-green-50 text-green-700 border-green-200"
                                                        : record.status === "Half Day"
                                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                                        : "bg-red-50 text-red-700 border-red-200"
                                                }
                                            >
                                                {record.status || "N/A"}
                                            </Badge>
                                        </div>
                                        
                                        <TimelineRow record={record} />
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                            <div>
                                                <p className="text-xs text-gray-500">Check In</p>
                                                <p className="font-mono font-semibold text-green-600">{record.in_time || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Check Out</p>
                                                <p className="font-mono font-semibold text-red-600">{record.out_time || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Work Duration</p>
                                                <p className="font-mono font-semibold">{record.work_duration || "00:00:00"}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Overtime</p>
                                                <p className="font-mono font-semibold text-purple-600">{record.ot || "00:00:00"}</p>
                                            </div>
                                        </div>

                                        {(record.late_by !== "00:00:00" || record.early_going_by !== "00:00:00") && (
                                            <div className="flex gap-4 mt-3 pt-3 border-t">
                                                {record.late_by !== "00:00:00" && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                        <span className="text-gray-600">Late by:</span>
                                                        <span className="font-mono font-semibold text-red-600">{record.late_by}</span>
                                                    </div>
                                                )}
                                                {record.early_going_by !== "00:00:00" && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <AlertCircle className="h-4 w-4 text-orange-500" />
                                                        <span className="text-gray-600">Early by:</span>
                                                        <span className="font-mono font-semibold text-orange-600">{record.early_going_by}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* -------------------- TABLE VIEW -------------------- */}
            {viewMode === 'table' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Attendance Records</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {format(selectedDate, "EEEE, MMMM dd, yyyy")} · {filteredData.length} record{filteredData.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {selectedColumns.department && <TableHead className="text-center min-w-[150px]">Department</TableHead>}
                                    {selectedColumns.employee_name && <TableHead className="text-center min-w-[150px]">Employee Name</TableHead>}
                                    {selectedColumns.role && <TableHead className="text-center min-w-[150px]">Role</TableHead>}
                                    {selectedColumns.attendance_date && <TableHead className="text-center min-w-[120px]">Date</TableHead>}
                                    {selectedColumns.in_time && <TableHead className="text-center min-w-[100px]">In</TableHead>}
                                    {selectedColumns.out_time && <TableHead className="text-center min-w-[100px]">Out</TableHead>}
                                    {selectedColumns.shift && <TableHead className="text-center min-w-[100px]">Shift</TableHead>}
                                    {selectedColumns.shift_in_time && <TableHead className="text-center min-w-[120px]">Shift In Time</TableHead>}
                                    {selectedColumns.shift_out_time && <TableHead className="text-center min-w-[120px]">Shift Out Time</TableHead>}
                                    {selectedColumns.work_duration && <TableHead className="text-center min-w-[100px]">Work</TableHead>}
                                    {selectedColumns.ot && <TableHead className="text-center min-w-[100px]">OT</TableHead>}
                                    {selectedColumns.total_duration && <TableHead className="text-center min-w-[120px]">Total Duration</TableHead>}
                                    {selectedColumns.late_by && <TableHead className="text-center min-w-[100px]">Late By</TableHead>}
                                    {selectedColumns.early_going_by && <TableHead className="text-center min-w-[130px]">Early Going By</TableHead>}
                                    {selectedColumns.status && <TableHead className="text-center min-w-[100px]">Status</TableHead>}
                                    {selectedColumns.punch_records && <TableHead className="text-center min-w-[120px]">Punch Records</TableHead>}
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={16} className="text-center py-12">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <p className="text-lg font-medium">No attendance records found</p>
                                                <p className="text-sm mt-1">Try selecting a different date or employee</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((r, i) => (
                                        <TableRow key={r.id ?? i} className="hover:bg-muted/50">
                                            {selectedColumns.department && (
                                                <TableCell className="text-center font-medium">{r.department || "N/A"}</TableCell>
                                            )}
                                            {selectedColumns.employee_name && (
                                                <TableCell className="text-center font-semibold">
                                                    {r.employee_name || "N/A"}
                                                </TableCell>
                                            )}
                                            {selectedColumns.role && (
                                                <TableCell className="text-center">{r.role || "N/A"}</TableCell>
                                            )}
                                            {selectedColumns.attendance_date && (
                                                <TableCell className="text-center">{r.attendance_date || "N/A"}</TableCell>
                                            )}
                                            {selectedColumns.in_time && (
                                                <TableCell className="text-center">{r.in_time || "N/A"}</TableCell>
                                            )}
                                            {selectedColumns.out_time && (
                                                <TableCell className="text-center">{r.out_time || "N/A"}</TableCell>
                                            )}
                                            {selectedColumns.shift && (
                                                <TableCell className="text-center">{r.shift || "N/A"}</TableCell>
                                            )}
                                            {selectedColumns.shift_in_time && (
                                                <TableCell className="text-center">{r.shift_in_time || "N/A"}</TableCell>
                                            )}
                                            {selectedColumns.shift_out_time && (
                                                <TableCell className="text-center">{r.shift_out_time || "N/A"}</TableCell>
                                            )}
                                            {selectedColumns.work_duration && (
                                                <TableCell className="text-center">{r.work_duration || "00:00:00"}</TableCell>
                                            )}
                                            {selectedColumns.ot && (
                                                <TableCell className="text-center">{r.ot || "00:00:00"}</TableCell>
                                            )}
                                            {selectedColumns.total_duration && (
                                                <TableCell className="text-center">{r.total_duration || "00:00:00"}</TableCell>
                                            )}
                                            {selectedColumns.late_by && (
                                                <TableCell className="text-center">{r.late_by || "00:00:00"}</TableCell>
                                            )}
                                            {selectedColumns.early_going_by && (
                                                <TableCell className="text-center">{r.early_going_by || "00:00:00"}</TableCell>
                                            )}
                                            {selectedColumns.status && (
                                                <TableCell className="text-center">
                                                    <Badge
                                                        className={`text-black-700 bg-white-100 border-transparent`
                                                        }
                                                    >
                                                        <span
                                                            className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                                                                r.status === "Present" 
                                                                    ? "bg-green-500" 
                                                                    : r.status === "Half Day"
                                                                    ? "bg-yellow-500"
                                                                    : "bg-red-500"
                                                            }`}
                                                        />
                                                        {r.status || "N/A"}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                            {selectedColumns.punch_records && (
                                                <TableCell className="text-center">{r.punch_records || "0"}</TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* -------------------- PAGINATION -------------------- */}
            {filteredData.length > 0 && (
                <Card>
                    <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
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
                </Card>
            )}
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
    const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

    // State for selected columns (all selected by default)
    const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
        s_no: true,
        year: true,
        month: true,
        working_date: true,
        name: true,
        client_name: true,
        task_name: true,
        project_name: true,
        file_no: true,
        work_type: true,
        no_of_pages: true,
        start_time: true,
        end_time: true,
        total_working_time: true,
    });

    // Define column categories
    const COLUMN_CATEGORIES = {
        basicInfo: {
            label: "Basic Information",
            columns: [
                { key: "s_no", label: "S.No" },
                { key: "year", label: "Year" },
                { key: "month", label: "Month" },
                { key: "working_date", label: "Working Date" },
                { key: "name", label: "Name" },
            ],
        },
        projectDetails: {
            label: "Project Details",
            columns: [
                { key: "client_name", label: "Client Name" },
                { key: "task_name", label: "Task Name" },
                { key: "project_name", label: "Project Name" },
                { key: "file_no", label: "File No" },
            ],
        },
        workDetails: {
            label: "Work Details",
            columns: [
                { key: "work_type", label: "Work Type" },
                { key: "no_of_pages", label: "No of Pages" },
            ],
        },
        timeTracking: {
            label: "Time Tracking",
            columns: [
                { key: "start_time", label: "Start Time" },
                { key: "end_time", label: "End Time" },
                { key: "total_working_time", label: "Total Working Time" },
            ],
        },
    };

    // Fetch available users based on selected date
    useEffect(() => {
        fetchAvailableUsers();
    }, [selectedDate]);

    const fetchAvailableUsers = async () => {
        try {
            const response = await fetch(`/api/analytics/attendance?date=${selectedDate}`);
            if (response.ok) {
                const data = await response.json();
                // Get unique users from attendance data using name as the unique key
                const uniqueUsers = Array.from(
                    new Map(data.map((record: any) => {
                        const userName = record.employee_name || record.name;
                        const userId = record.employee_id || record.id || userName;
                        return [
                            userName, // Use name as the unique key to prevent duplicates
                            {
                                id: userId,
                                name: userName
                            }
                        ];
                    })).values()
                ).sort((a: any, b: any) => a.name.localeCompare(b.name)); // Sort alphabetically
                
                setAvailableUsers(uniqueUsers);
                
                // Reset selected user if they're not in the new list
                if (selectedUserId && !uniqueUsers.find((u: any) => u.id === selectedUserId)) {
                    setSelectedUserId(null);
                }
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

    // Handle category selection
    const handleCategoryToggle = (categoryKey: string, checked: boolean) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const newSelected = { ...selectedColumns };
        category.columns.forEach(col => {
            newSelected[col.key] = checked;
        });
        setSelectedColumns(newSelected);
    };

    // Check if all columns in a category are selected
    const isCategoryFullySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        return category.columns.every(col => selectedColumns[col.key]);
    };

    // Check if some (but not all) columns in a category are selected
    const isCategoryPartiallySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const selectedCount = category.columns.filter(col => selectedColumns[col.key]).length;
        return selectedCount > 0 && selectedCount < category.columns.length;
    };

    // Handle select/deselect all columns
    const handleSelectAll = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = true;
            });
        });
        setSelectedColumns(newSelected);
    };

    const handleDeselectAll = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = false;
            });
        });
        setSelectedColumns(newSelected);
    };

    // Export to Excel function with selected columns
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => {
            const row: Record<string, any> = {};
            
            Object.values(COLUMN_CATEGORIES).forEach(category => {
                category.columns.forEach(col => {
                    if (selectedColumns[col.key]) {
                        row[col.label] = entry[col.key] || "N/A";
                    }
                });
            });
            
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "User Daily Report");
        XLSX.writeFile(wb, `User_Daily_Report_${selectedDate}.xlsx`);
    };

    // Count selected columns
    const selectedColumnsCount = Object.values(selectedColumns).filter(Boolean).length;
    const totalColumnsCount = Object.values(COLUMN_CATEGORIES).reduce(
        (acc, cat) => acc + cat.columns.length, 
        0
    );

    // Custom Checkbox component
    const CustomCheckbox = ({ 
        checked, 
        onCheckedChange, 
        id, 
        className = "" 
    }: { 
        checked: boolean;
        onCheckedChange: (checked: boolean) => void;
        id: string;
        className?: string;
    }) => {
        return (
            <button
                id={id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={`h-4 w-4 rounded border border-gray-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    checked ? "bg-blue-600 border-blue-600" : "bg-white"
                } ${className}`}
            >
                {checked && <Check className="h-3 w-3 text-white" />}
            </button>
        );
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

                        {/* Date Selection - Now comes before User Selection */}
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

                        {/* Refresh Button */}
                        <Button
                            onClick={fetchDailyReport}
                            disabled={!selectedUserId || isLoading}
                            className="bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"
                        >
                            Refresh
                        </Button>

                        {/* Export Excel Button with Column Selection Dialog */}
                        <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={filteredData.length === 0}
                                    className="w-full sm:w-auto"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Excel
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh]">
                                <DialogHeader>
                                    <DialogTitle>Select Columns for Export</DialogTitle>
                                    <DialogDescription>
                                        Choose which columns to include in the Excel export
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <div className="flex gap-2 mb-4">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleSelectAll}
                                    >
                                        Select All
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleDeselectAll}
                                    >
                                        Deselect All
                                    </Button>
                                </div>

                                <ScrollArea className="h-[400px] pr-4">
                                    <div className="space-y-6">
                                        {Object.entries(COLUMN_CATEGORIES).map(([categoryKey, category]) => (
                                            <div key={categoryKey} className="space-y-3">
                                                <div className="flex items-center space-x-2 pb-2 border-b">
                                                    <CustomCheckbox
                                                        id={`category-${categoryKey}`}
                                                        checked={isCategoryFullySelected(categoryKey)}
                                                        onCheckedChange={(checked) => 
                                                            handleCategoryToggle(categoryKey, checked)
                                                        }
                                                        className={isCategoryPartiallySelected(categoryKey) ? "bg-blue-400 border-blue-400" : ""}
                                                    />
                                                    <label
                                                        htmlFor={`category-${categoryKey}`}
                                                        className="text-sm font-semibold cursor-pointer"
                                                    >
                                                        {category.label}
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 pl-6">
                                                    {category.columns.map((column) => (
                                                        <div key={column.key} className="flex items-center space-x-2">
                                                            <CustomCheckbox
                                                                id={column.key}
                                                                checked={selectedColumns[column.key]}
                                                                onCheckedChange={(checked) =>
                                                                    setSelectedColumns(prev => ({
                                                                        ...prev,
                                                                        [column.key]: checked
                                                                    }))
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={column.key}
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                {column.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <DialogFooter>
                                    <div className="flex justify-between w-full items-center">
                                        <p className="text-sm text-muted-foreground">
                                            {selectedColumnsCount} columns selected
                                        </p>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline"
                                                onClick={() => setIsColumnDialogOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                onClick={() => {
                                                    exportToExcel();
                                                    setIsColumnDialogOpen(false);
                                                }}
                                                className="bg-blue-600 text-white hover:bg-blue-700"
                                                disabled={selectedColumnsCount === 0}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Export ({selectedColumnsCount} columns)
                                            </Button>
                                        </div>
                                    </div>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
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
                                    <TableCell colSpan={14} className="text-center">
                                        {selectedUserId
                                            ? "No data found for the selected date"
                                            : "Please select a user and date"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedData.map((entry, index) => (
                                    <TableRow key={`row-${index}`}>
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
                                                key={`page-${i}`}
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
    const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

    // State for selected columns (all selected by default)
    const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
        s_no: true,
        name: true,
        total_pages: true,
        total_hours: true,
    });

    // Define column categories
    const COLUMN_CATEGORIES = {
        userInfo: {
            label: "User Information",
            columns: [
                { key: "s_no", label: "S.No" },
                { key: "name", label: "Name Of The User" },
            ],
        },
        performance: {
            label: "Performance Metrics",
            columns: [
                { key: "total_pages", label: "Page Count" },
                { key: "total_hours", label: "PO Hours" },
            ],
        },
    };

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
                // Get unique users with roles from attendance data - using name as unique key
                const uniqueUsers = Array.from(
                    new Map(data.map((record: any) => {
                        const userName = record.employee_name || record.name;
                        const userId = record.employee_id || record.id || userName;
                        return [
                            userName, // Use name as the unique key to prevent duplicates
                            {
                                id: userId,
                                name: userName,
                                role: record.role
                            }
                        ];
                    })).values()
                ).sort((a: any, b: any) => a.name.localeCompare(b.name)); // Sort alphabetically

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

    // Handle category selection
    const handleCategoryToggle = (categoryKey: string, checked: boolean) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const newSelected = { ...selectedColumns };
        category.columns.forEach(col => {
            newSelected[col.key] = checked;
        });
        setSelectedColumns(newSelected);
    };

    // Check if all columns in a category are selected
    const isCategoryFullySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        return category.columns.every(col => selectedColumns[col.key]);
    };

    // Check if some (but not all) columns in a category are selected
    const isCategoryPartiallySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const selectedCount = category.columns.filter(col => selectedColumns[col.key]).length;
        return selectedCount > 0 && selectedCount < category.columns.length;
    };

    // Handle select/deselect all columns
    const handleSelectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = true;
            });
        });
        setSelectedColumns(newSelected);
    };

    const handleDeselectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = false;
            });
        });
        setSelectedColumns(newSelected);
    };

    // Export to Excel function with selected columns
    const exportToExcel = () => {
        const exportData = tableData.map((entry: any) => {
            const row: Record<string, any> = {};
            
            Object.values(COLUMN_CATEGORIES).forEach(category => {
                category.columns.forEach(col => {
                    if (selectedColumns[col.key]) {
                        let value = entry[col.key];
                        
                        // Format specific fields
                        if (col.key === "total_hours") {
                            value = parseFloat(value || 0).toFixed(2);
                        } else if (col.key === "total_pages") {
                            value = value || 0;
                        }
                        
                        row[col.label] = value || "N/A";
                    }
                });
            });
            
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "User Monthly Report");
        XLSX.writeFile(wb, `User_Monthly_Report_${selectedMonth}.xlsx`);
    };

    // Count selected columns
    const selectedColumnsCount = Object.values(selectedColumns).filter(Boolean).length;
    const totalColumnsCount = Object.values(COLUMN_CATEGORIES).reduce(
        (acc, cat) => acc + cat.columns.length, 
        0
    );

    // Custom Checkbox component
    const CustomCheckbox = ({ 
        checked, 
        onCheckedChange, 
        id, 
        className = "" 
    }: { 
        checked: boolean;
        onCheckedChange: (checked: boolean) => void;
        id: string;
        className?: string;
    }) => {
        return (
            <button
                id={id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={`h-4 w-4 rounded border border-gray-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    checked ? "bg-blue-600 border-blue-600" : "bg-white"
                } ${className}`}
            >
                {checked && <Check className="h-3 w-3 text-white" />}
            </button>
        );
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

                        {/* Export Excel Button with Column Selection Dialog */}
                        <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={tableData.length === 0}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Excel
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh]">
                                <DialogHeader>
                                    <DialogTitle>Select Columns for Export</DialogTitle>
                                    <DialogDescription>
                                        Choose which columns to include in the Excel export
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <div className="flex gap-2 mb-4">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleSelectAllColumns}
                                    >
                                        Select All
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleDeselectAllColumns}
                                    >
                                        Deselect All
                                    </Button>
                                </div>

                                <ScrollArea className="h-[250px] pr-4">
                                    <div className="space-y-6">
                                        {Object.entries(COLUMN_CATEGORIES).map(([categoryKey, category]) => (
                                            <div key={categoryKey} className="space-y-3">
                                                <div className="flex items-center space-x-2 pb-2 border-b">
                                                    <CustomCheckbox
                                                        id={`category-${categoryKey}`}
                                                        checked={isCategoryFullySelected(categoryKey)}
                                                        onCheckedChange={(checked) => 
                                                            handleCategoryToggle(categoryKey, checked)
                                                        }
                                                        className={isCategoryPartiallySelected(categoryKey) ? "bg-blue-400 border-blue-400" : ""}
                                                    />
                                                    <label
                                                        htmlFor={`category-${categoryKey}`}
                                                        className="text-sm font-semibold cursor-pointer"
                                                    >
                                                        {category.label}
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 pl-6">
                                                    {category.columns.map((column) => (
                                                        <div key={column.key} className="flex items-center space-x-2">
                                                            <CustomCheckbox
                                                                id={column.key}
                                                                checked={selectedColumns[column.key]}
                                                                onCheckedChange={(checked) =>
                                                                    setSelectedColumns(prev => ({
                                                                        ...prev,
                                                                        [column.key]: checked
                                                                    }))
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={column.key}
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                {column.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <DialogFooter>
                                    <div className="flex justify-between w-full items-center">
                                        <p className="text-sm text-muted-foreground">
                                            {selectedColumnsCount} columns selected
                                        </p>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline"
                                                onClick={() => setIsColumnDialogOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                onClick={() => {
                                                    exportToExcel();
                                                    setIsColumnDialogOpen(false);
                                                }}
                                                className="bg-blue-600 text-white hover:bg-blue-700"
                                                disabled={selectedColumnsCount === 0}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Export ({selectedColumnsCount} columns)
                                            </Button>
                                        </div>
                                    </div>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Selected Users Display */}
                    {selectedUserIds.length > 0 && selectedUserIds.length < availableUsers.length && (
                        <div className="mt-4">
                            <div className="flex flex-wrap gap-2">
                                {getSelectedUserNames().map((name: string, idx: number) => {
                                    const userId = availableUsers.find((u: any) => u.name === name)?.id;
                                    return (
                                        <Badge
                                            key={`badge-${userId}-${idx}`}
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
                                paginatedData.map((entry: any, index: number) => (
                                    <TableRow key={`row-${entry.user_id || index}`}>
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
                                                key={`page-${i}`}
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
    const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

    const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
        s_no: true,
        received_date: true,
        project_name: true,
        received_pages: true,
        process: true,
        po_hours: true,
        output_pages: true,
        delivery_date: true,
        status: true,
        po_status: true,
        po_number: true,
    });

    const COLUMN_CATEGORIES = {
        projectInfo: {
            label: "Project Information",
            columns: [
                { key: "s_no", label: "S. No" },
                { key: "project_name", label: "Project Name" },
                { key: "po_number", label: "PO Number" },
            ],
        },
        workDetails: {
            label: "Work Details",
            columns: [
                { key: "received_pages", label: "Received Pages" },
                { key: "process", label: "Process" },
                { key: "po_hours", label: "PO Hours" },
                { key: "output_pages", label: "Output Pages" },
            ],
        },
        timeline: {
            label: "Timeline & Status",
            columns: [
                { key: "received_date", label: "Received Date" },
                { key: "delivery_date", label: "Delivery Date" },
                { key: "status", label: "Status" },
                { key: "po_status", label: "PO Status" },
            ],
        },
    };

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

    // Handle category selection
    const handleCategoryToggle = (categoryKey: string, checked: boolean) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const newSelected = { ...selectedColumns };
        category.columns.forEach(col => {
            newSelected[col.key] = checked;
        });
        setSelectedColumns(newSelected);
    };

    // Check if all columns in a category are selected
    const isCategoryFullySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        return category.columns.every(col => selectedColumns[col.key]);
    };

    // Check if some (but not all) columns in a category are selected
    const isCategoryPartiallySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const selectedCount = category.columns.filter(col => selectedColumns[col.key]).length;
        return selectedCount > 0 && selectedCount < category.columns.length;
    };

    // Handle select/deselect all columns
    const handleSelectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = true;
            });
        });
        setSelectedColumns(newSelected);
    };

    const handleDeselectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = false;
            });
        });
        setSelectedColumns(newSelected);
    };

    // Export to Excel function with selected columns
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => {
            const row: Record<string, any> = {};
            
            Object.values(COLUMN_CATEGORIES).forEach(category => {
                category.columns.forEach(col => {
                    if (selectedColumns[col.key]) {
                        row[col.label] = entry[col.key] || "N/A";
                    }
                });
            });
            
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PO Report");
        XLSX.writeFile(wb, `PO_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    // Count selected columns
    const selectedColumnsCount = Object.values(selectedColumns).filter(Boolean).length;
    const totalColumnsCount = Object.values(COLUMN_CATEGORIES).reduce(
        (acc, cat) => acc + cat.columns.length, 
        0
    );

    // Custom Checkbox component
    const CustomCheckbox = ({ 
        checked, 
        onCheckedChange, 
        id, 
        className = "" 
    }: { 
        checked: boolean;
        onCheckedChange: (checked: boolean) => void;
        id: string;
        className?: string;
    }) => {
        return (
            <button
                id={id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={`h-4 w-4 rounded border border-gray-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    checked ? "bg-blue-600 border-blue-600" : "bg-white"
                } ${className}`}
            >
                {checked && <Check className="h-3 w-3 text-white" />}
            </button>
        );
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

                            {/* Export Excel Button with Column Selection Dialog */}
                            <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={filteredData.length === 0}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Excel
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh]">
                                    <DialogHeader>
                                        <DialogTitle>Select Columns for Export</DialogTitle>
                                        <DialogDescription>
                                            Choose which columns to include in the Excel export
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="flex gap-2 mb-4">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleSelectAllColumns}
                                        >
                                            Select All
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleDeselectAllColumns}
                                        >
                                            Deselect All
                                        </Button>
                                    </div>

                                    <ScrollArea className="h-[300px] pr-4">
                                        <div className="space-y-6">
                                            {Object.entries(COLUMN_CATEGORIES).map(([categoryKey, category]) => (
                                                <div key={categoryKey} className="space-y-3">
                                                    <div className="flex items-center space-x-2 pb-2 border-b">
                                                        <CustomCheckbox
                                                            id={`category-${categoryKey}`}
                                                            checked={isCategoryFullySelected(categoryKey)}
                                                            onCheckedChange={(checked) => 
                                                                handleCategoryToggle(categoryKey, checked)
                                                            }
                                                            className={isCategoryPartiallySelected(categoryKey) ? "bg-blue-400 border-blue-400" : ""}
                                                        />
                                                        <label
                                                            htmlFor={`category-${categoryKey}`}
                                                            className="text-sm font-semibold cursor-pointer"
                                                        >
                                                            {category.label}
                                                        </label>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 pl-6">
                                                        {category.columns.map((column) => (
                                                            <div key={column.key} className="flex items-center space-x-2">
                                                                <CustomCheckbox
                                                                    id={column.key}
                                                                    checked={selectedColumns[column.key]}
                                                                    onCheckedChange={(checked) =>
                                                                        setSelectedColumns(prev => ({
                                                                            ...prev,
                                                                            [column.key]: checked
                                                                        }))
                                                                    }
                                                                />
                                                                <label
                                                                    htmlFor={column.key}
                                                                    className="text-sm cursor-pointer"
                                                                >
                                                                    {column.label}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <DialogFooter>
                                        <div className="flex justify-between w-full items-center">
                                            <p className="text-sm text-muted-foreground">
                                                {selectedColumnsCount} columns selected
                                            </p>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline"
                                                    onClick={() => setIsColumnDialogOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    onClick={() => {
                                                        exportToExcel();
                                                        setIsColumnDialogOpen(false);
                                                    }}
                                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                                    disabled={selectedColumnsCount === 0}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export ({selectedColumnsCount} columns)
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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
    const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

    const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
        working_date: true,
        name: true,
        client_name: true,
        file_name: true,
        work_type: true,
        page_no: true,
        start_time: true,
        end_time: true,
        total_working_hours: true,
        po: true,
    });

    const COLUMN_CATEGORIES = {
        workDetails: {
            label: "Work Details",
            columns: [
                { key: "working_date", label: "Working Date" },
                { key: "name", label: "Name" },
                { key: "client_name", label: "Client Name" },
                { key: "file_name", label: "File Name" },
                { key: "work_type", label: "Work type" },
                { key: "page_no", label: "Page Count" }
            ],
        },
        timeline: {
            label: "Timeline & Status",
            columns: [
                { key: "start_time", label: "Start Time" },
                { key: "end_time", label: "End Time" },
                { key: "total_working_hours", label: "Total Working Hours" },
                { key: "po", label: "PO" },
            ],
        },
    };

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

    // Handle category selection
    const handleCategoryToggle = (categoryKey: string, checked: boolean) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const newSelected = { ...selectedColumns };
        category.columns.forEach(col => {
            newSelected[col.key] = checked;
        });
        setSelectedColumns(newSelected);
    };

    // Check if all columns in a category are selected
    const isCategoryFullySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        return category.columns.every(col => selectedColumns[col.key]);
    };

    // Check if some (but not all) columns in a category are selected
    const isCategoryPartiallySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const selectedCount = category.columns.filter(col => selectedColumns[col.key]).length;
        return selectedCount > 0 && selectedCount < category.columns.length;
    };

    // Handle select/deselect all columns
    const handleSelectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = true;
            });
        });
        setSelectedColumns(newSelected);
    };

    const handleDeselectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = false;
            });
        });
        setSelectedColumns(newSelected);
    };

    // Export to Excel function
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => {
            const row: Record<string, any> = {};

            Object.values(COLUMN_CATEGORIES).forEach(category => {
                category.columns.forEach(col => {
                    if(selectedColumns[col.key]) {
                        row[col.label] = entry[col.key] || "N/A";
                    }
                });
            });
            
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "QA Report");
        XLSX.writeFile(wb, `QA_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    const selectedColumnsCount = Object.values(selectedColumns).filter(Boolean).length;
    const totalColumnsCount = Object.values(COLUMN_CATEGORIES).reduce(
        (acc, cat) => acc + cat.columns.length,
        0
    );

    const CustomCheckbox = ({
        checked,
        onCheckedChange,
        id,
        className = ""
    }: {
        checked: boolean;
        onCheckedChange: (checked: boolean) => void;
        id: string;
        className?: string;
    }) => {
        return (
            <button
                id={id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={`h-4 w-4 rounded border border-gray-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    checked ? "bg-blue-600 border-blue-600" : "bg-white"
                } ${className}`}
            >
                {checked && <Check className="h-3 w-3 text-white" />}
            </button>
        );
    }

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
                            <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={filteredData.length === 0}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Excel
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh]">
                                    <DialogHeader>
                                        <DialogTitle>Select Columns for Export</DialogTitle>
                                        <DialogDescription>
                                            Choose which columns to include in the Excel export
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="flex gap-2 mb-4">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleSelectAllColumns}
                                        >
                                            Select All
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleDeselectAllColumns}
                                        >
                                            Deselect All
                                        </Button>
                                    </div>

                                    <ScrollArea className="h-[300px] pr-4">
                                        <div className="space-y-6">
                                            {Object.entries(COLUMN_CATEGORIES).map(([categoryKey, category]) => (
                                                <div key={categoryKey} className="space-y-3">
                                                    <div className="flex items-center space-x-2 pb-2 border-b">
                                                        <CustomCheckbox
                                                            id={`category-${categoryKey}`}
                                                            checked={isCategoryFullySelected(categoryKey)}
                                                            onCheckedChange={(checked) => 
                                                                handleCategoryToggle(categoryKey, checked)
                                                            }
                                                            className={isCategoryPartiallySelected(categoryKey) ? "bg-blue-400 border-blue-400" : ""}
                                                        />
                                                        <label
                                                            htmlFor={`category-${categoryKey}`}
                                                            className="text-sm font-semibold cursor-pointer"
                                                        >
                                                            {category.label}
                                                        </label>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 pl-6">
                                                        {category.columns.map((column) => (
                                                            <div key={column.key} className="flex items-center space-x-2">
                                                                <CustomCheckbox
                                                                    id={column.key}
                                                                    checked={selectedColumns[column.key]}
                                                                    onCheckedChange={(checked) =>
                                                                        setSelectedColumns(prev => ({
                                                                            ...prev,
                                                                            [column.key]: checked
                                                                        }))
                                                                    }
                                                                />
                                                                <label
                                                                    htmlFor={column.key}
                                                                    className="text-sm cursor-pointer"
                                                                >
                                                                    {column.label}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <DialogFooter>
                                        <div className="flex justify-between w-full items-center">
                                            <p className="text-sm text-muted-foreground">
                                                {selectedColumnsCount} columns selected
                                            </p>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline"
                                                    onClick={() => setIsColumnDialogOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    onClick={() => {
                                                        exportToExcel();
                                                        setIsColumnDialogOpen(false);
                                                    }}
                                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                                    disabled={selectedColumnsCount === 0}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export ({selectedColumnsCount} columns)
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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
    const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

    const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
        s_no: true,
        date: true,
        name: true,
        client_name: true,
        job_no: true,
        process: true,
        page_count: true,
        start_time: true,
        end_time: true,
        total_time: true,
        shift: true,
        po_hours: true,
    });

    const COLUMN_CATEGORIES = {
        projectInfo: {
            label: "Project Information",
            columns: [
                { key: "s_no", label: "S. No" },
                { key: "date", label: "Date" },
            ],
        },
        workDetails: {
            label: "Work Details",
            columns: [
                { key: "name", label: "Employee Name" },
                { key: "client_name", label: "Client Name" },
                { key: "job_no", label: "Job No." },
                { key: "process", label: "Process" },
                { key: "page_count", label: "Page Count" },
                { key: "po_hours", label: "PO Hours" },
            ],
        },
        timeline: {
            label: "Timeline",
            columns: [
                { key: "start_time", label: "Start Time" },
                { key: "end_time", label: "End Time" },
                { key: "total_time", label: "Total Time" },
                { key: "shift", label: "Shift" },
            ],
        },
    };

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

    // Handle category selection
    const handleCategoryToggle = (categoryKey: string, checked: boolean) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const newSelected = { ...selectedColumns };
        category.columns.forEach(col => {
            newSelected[col.key] = checked;
        });
        setSelectedColumns(newSelected);
    };

    // Check if all columns in a category are selected
    const isCategoryFullySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        return category.columns.every(col => selectedColumns[col.key]);
    };

    // Check if some (but not all) columns in a category are selected
    const isCategoryPartiallySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const selectedCount = category.columns.filter(col => selectedColumns[col.key]).length;
        return selectedCount > 0 && selectedCount < category.columns.length;
    };

    // Handle select/deselect all columns
    const handleSelectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = true;
            });
        });
        setSelectedColumns(newSelected);
    };

    const handleDeselectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = false;
            });
        });
        setSelectedColumns(newSelected);
    };

    // Export to Excel function with selected columns
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => {
            const row: Record<string, any> = {};
            
            Object.values(COLUMN_CATEGORIES).forEach(category => {
                category.columns.forEach(col => {
                    if (selectedColumns[col.key]) {
                        row[col.label] = entry[col.key] || "N/A";
                    }
                });
            });
            
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PO Report");
        XLSX.writeFile(wb, `DTP_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };


    // Count selected columns
    const selectedColumnsCount = Object.values(selectedColumns).filter(Boolean).length;
    const totalColumnsCount = Object.values(COLUMN_CATEGORIES).reduce(
        (acc, cat) => acc + cat.columns.length, 
        0
    );

    // Custom Checkbox component
    const CustomCheckbox = ({ 
        checked, 
        onCheckedChange, 
        id, 
        className = "" 
    }: { 
        checked: boolean;
        onCheckedChange: (checked: boolean) => void;
        id: string;
        className?: string;
    }) => {
        return (
            <button
                id={id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={`h-4 w-4 rounded border border-gray-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    checked ? "bg-blue-600 border-blue-600" : "bg-white"
                } ${className}`}
            >
                {checked && <Check className="h-3 w-3 text-white" />}
            </button>
        );
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
                            <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={filteredData.length === 0}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Excel
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh]">
                                    <DialogHeader>
                                        <DialogTitle>Select Columns for Export</DialogTitle>
                                        <DialogDescription>
                                            Choose which columns to include in the Excel export
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="flex gap-2 mb-4">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleSelectAllColumns}
                                        >
                                            Select All
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleDeselectAllColumns}
                                        >
                                            Deselect All
                                        </Button>
                                    </div>

                                    <ScrollArea className="h-[300px] pr-4">
                                        <div className="space-y-6">
                                            {Object.entries(COLUMN_CATEGORIES).map(([categoryKey, category]) => (
                                                <div key={categoryKey} className="space-y-3">
                                                    <div className="flex items-center space-x-2 pb-2 border-b">
                                                        <CustomCheckbox
                                                            id={`category-${categoryKey}`}
                                                            checked={isCategoryFullySelected(categoryKey)}
                                                            onCheckedChange={(checked) => 
                                                                handleCategoryToggle(categoryKey, checked)
                                                            }
                                                            className={isCategoryPartiallySelected(categoryKey) ? "bg-blue-400 border-blue-400" : ""}
                                                        />
                                                        <label
                                                            htmlFor={`category-${categoryKey}`}
                                                            className="text-sm font-semibold cursor-pointer"
                                                        >
                                                            {category.label}
                                                        </label>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 pl-6">
                                                        {category.columns.map((column) => (
                                                            <div key={column.key} className="flex items-center space-x-2">
                                                                <CustomCheckbox
                                                                    id={column.key}
                                                                    checked={selectedColumns[column.key]}
                                                                    onCheckedChange={(checked) =>
                                                                        setSelectedColumns(prev => ({
                                                                            ...prev,
                                                                            [column.key]: checked
                                                                        }))
                                                                    }
                                                                />
                                                                <label
                                                                    htmlFor={column.key}
                                                                    className="text-sm cursor-pointer"
                                                                >
                                                                    {column.label}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <DialogFooter>
                                        <div className="flex justify-between w-full items-center">
                                            <p className="text-sm text-muted-foreground">
                                                {selectedColumnsCount} columns selected
                                            </p>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline"
                                                    onClick={() => setIsColumnDialogOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    onClick={() => {
                                                        exportToExcel();
                                                        setIsColumnDialogOpen(false);
                                                    }}
                                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                                    disabled={selectedColumnsCount === 0}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export ({selectedColumnsCount} columns)
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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
    const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

    const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
        s_no: true,
        date: true,
        client: true,
        task: true,
        filename: true,
        pages: true,
        language: true,
        task_type: true,
        process: true,
        qc: true,
        qa: true,
        delivery: true,
        internal_auditor: true,
        internal_comments: true,
        external_comments: true,
        total_errors: true,
        remarks: true,
        impact: true,
        action_impact: true,
        rca_impact: true,
        action_rca: true,
        rca: true,
    });

    const COLUMN_CATEGORIES = {
        jobDetails: {
            label: "Job Details",
            columns: [
                { key: "s_no", label: "S.No" },
                { key: "date", label: "Date" },
                { key: "client", label: "Client" },
                { key: "task", label: "Task" },
                { key: "filename", label: "Filename" },
                { key: "pages", label: "Pages" },
                { key: "language", label: "Language" },
                { key: "task_type", label: "Task Type" },
                { key: "process", label: "Process" },
                { key: "qc", label: "QC" },
            ],
        },
        qualityAssurance: {
            label: "Quality Assurance",
            columns: [
                { key: "qa", label: "QA" },
                { key: "delivery", label: "Delivery" },
                { key: "internal_auditor", label: "Internal Auditor" },
                { key: "internal_comments", label: "Internal Comments" },
                { key: "external_comments", label: "External Comments" },
                { key: "total_errors", label: "Total No. Errors" },
                { key: "remarks", label: "Remarks" },
            ],
        },
        impactAndRCA: {
            label: "Impact and RCA",
            columns: [
                { key: "impact", label: "Impact" },
                { key: "action_impact", label: "Action (Impact)" },
                { key: "rca_impact", label: "RCA (Impact)" },
                { key: "action_rca", label: "Action (RCA)" },
                { key: "rca", label: "RCA" },
            ],
        },
    };

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

    // Handle category selection
    const handleCategoryToggle = (categoryKey: string, checked: boolean) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const newSelected = { ...selectedColumns };
        category.columns.forEach(col => {
            newSelected[col.key] = checked;
        });
        setSelectedColumns(newSelected);
    };

    // Check if all columns in a category are selected
    const isCategoryFullySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        return category.columns.every(col => selectedColumns[col.key]);
    };

    // Check if some (but not all) columns in a category are selected
    const isCategoryPartiallySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const selectedCount = category.columns.filter(col => selectedColumns[col.key]).length;
        return selectedCount > 0 && selectedCount < category.columns.length;
    };

    // Handle select/deselect all columns
    const handleSelectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = true;
            });
        });
        setSelectedColumns(newSelected);
    };

    const handleDeselectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = false;
            });
        });
        setSelectedColumns(newSelected);
    };

    // Export to Excel function with selected columns
    const exportToExcel = () => {
        const exportData = reportData.map((entry) => {
            const row: Record<string, any> = {};

            Object.values(COLUMN_CATEGORIES).forEach(category => {
                category.columns.forEach(col => {
                    if(selectedColumns[col.key]) {
                        row[col.label] = entry[col.key] || "N/A";
                    }
                });
            });
            
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Feedback Report");
        XLSX.writeFile(wb, `Feedback_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    // Count selected columns
    const selectedColumnsCount = Object.values(selectedColumns).filter(Boolean).length;
    const totalColumnsCount = Object.values(COLUMN_CATEGORIES).reduce(
        (acc, cat) => acc + cat.columns.length, 
        0
    );

    // Custom Checkbox component
    const CustomCheckbox = ({ 
        checked, 
        onCheckedChange, 
        id, 
        className = "" 
    }: { 
        checked: boolean;
        onCheckedChange: (checked: boolean) => void;
        id: string;
        className?: string;
    }) => {
        return (
            <button
                id={id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={`h-4 w-4 rounded border border-gray-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    checked ? "bg-blue-600 border-blue-600" : "bg-white"
                } ${className}`}
            >
                {checked && <Check className="h-3 w-3 text-white" />}
            </button>
        );
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
                        <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={reportData.length === 0}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Excel
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh]">
                                <DialogHeader>
                                    <DialogTitle>Select Columns for Export</DialogTitle>
                                    <DialogDescription>
                                        Choose which columns to include in the Excel export
                                    </DialogDescription>
                                </DialogHeader>
                                
                                <div className="flex gap-2 mb-4">
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleSelectAllColumns}
                                    >
                                        Select All
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleDeselectAllColumns}
                                    >
                                        Deselect All
                                    </Button>
                                </div>

                                <ScrollArea className="h-[300px] pr-4">
                                    <div className="space-y-6">
                                        {Object.entries(COLUMN_CATEGORIES).map(([categoryKey, category]) => (
                                            <div key={categoryKey} className="space-y-3">
                                                <div className="flex items-center space-x-2 pb-2 border-b">
                                                    <CustomCheckbox
                                                        id={`category-${categoryKey}`}
                                                        checked={isCategoryFullySelected(categoryKey)}
                                                        onCheckedChange={(checked) => 
                                                            handleCategoryToggle(categoryKey, checked)
                                                        }
                                                        className={isCategoryPartiallySelected(categoryKey) ? "bg-blue-400 border-blue-400" : ""}
                                                    />
                                                    <label
                                                        htmlFor={`category-${categoryKey}`}
                                                        className="text-sm font-semibold cursor-pointer"
                                                    >
                                                        {category.label}
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 pl-6">
                                                    {category.columns.map((column) => (
                                                        <div key={column.key} className="flex items-center space-x-2">
                                                            <CustomCheckbox
                                                                id={column.key}
                                                                checked={selectedColumns[column.key]}
                                                                onCheckedChange={(checked) =>
                                                                    setSelectedColumns(prev => ({
                                                                        ...prev,
                                                                        [column.key]: checked
                                                                    }))
                                                                }
                                                            />
                                                            <label
                                                                htmlFor={column.key}
                                                                className="text-sm cursor-pointer"
                                                            >
                                                                {column.label}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <DialogFooter>
                                    <div className="flex justify-between w-full items-center">
                                        <p className="text-sm text-muted-foreground">
                                            {selectedColumnsCount} columns selected
                                        </p>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline"
                                                onClick={() => setIsColumnDialogOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                onClick={() => {
                                                    exportToExcel();
                                                    setIsColumnDialogOpen(false);
                                                }}
                                                className="bg-blue-600 text-white hover:bg-blue-700"
                                                disabled={selectedColumnsCount === 0}
                                            >
                                                <Download className="h-4 w-4 mr-2" />
                                                Export ({selectedColumnsCount} columns)
                                            </Button>
                                        </div>
                                    </div>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
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
    const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

    const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
        working_date: true,
        name: true,
        client_name: true,
        file_name: true,
        work_type: true,
        page_no: true,
        start_time: true,
        end_time: true,
        total_working_hours: true,
        po: true,
    });

    const COLUMN_CATEGORIES = {
        workDetails: {
            label: "Work Details",
            columns: [
                { key: "working_date", label: "Working Date" },
                { key: "name", label: "Name" },
                { key: "client_name", label: "Client Name" },
                { key: "file_name", label: "File Name" },
                { key: "work_type", label: "Work type" },
                { key: "page_no", label: "Page Count" }
            ],
        },
        timeline: {
            label: "Timeline & Performance",
            columns: [
                { key: "start_time", label: "Start Time" },
                { key: "end_time", label: "End Time" },
                { key: "total_working_hours", label: "Total Working Hours" },
                { key: "po", label: "PO" },
            ],
        },
    };

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

    // Handle category selection
    const handleCategoryToggle = (categoryKey: string, checked: boolean) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const newSelected = { ...selectedColumns };
        category.columns.forEach(col => {
            newSelected[col.key] = checked;
        });
        setSelectedColumns(newSelected);
    };

    // Check if all columns in a category are selected
    const isCategoryFullySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        return category.columns.every(col => selectedColumns[col.key]);
    };

    // Check if some (but not all) columns in a category are selected
    const isCategoryPartiallySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const selectedCount = category.columns.filter(col => selectedColumns[col.key]).length;
        return selectedCount > 0 && selectedCount < category.columns.length;
    };

    // Handle select/deselect all columns
    const handleSelectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = true;
            });
        });
        setSelectedColumns(newSelected);
    };

    const handleDeselectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = false;
            });
        });
        setSelectedColumns(newSelected);
    };

    // Export to Excel function with selected columns
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => {
            const row: Record<string, any> = {};

            Object.values(COLUMN_CATEGORIES).forEach(category => {
                category.columns.forEach(col => {
                    if(selectedColumns[col.key]) {
                        row[col.label] = entry[col.key] || "N/A";
                    }
                });
            });
            
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "QA Report");
        XLSX.writeFile(wb, `QC_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    // Count selected columns
    const selectedColumnsCount = Object.values(selectedColumns).filter(Boolean).length;
    const totalColumnsCount = Object.values(COLUMN_CATEGORIES).reduce(
        (acc, cat) => acc + cat.columns.length, 
        0
    );

    // Custom Checkbox component
    const CustomCheckbox = ({ 
        checked, 
        onCheckedChange, 
        id, 
        className = "" 
    }: { 
        checked: boolean;
        onCheckedChange: (checked: boolean) => void;
        id: string;
        className?: string;
    }) => {
        return (
            <button
                id={id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={`h-4 w-4 rounded border border-gray-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    checked ? "bg-blue-600 border-blue-600" : "bg-white"
                } ${className}`}
            >
                {checked && <Check className="h-3 w-3 text-white" />}
            </button>
        );
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
                            <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={filteredData.length === 0}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Excel
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh]">
                                    <DialogHeader>
                                        <DialogTitle>Select Columns for Export</DialogTitle>
                                        <DialogDescription>
                                            Choose which columns to include in the Excel export
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="flex gap-2 mb-4">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleSelectAllColumns}
                                        >
                                            Select All
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleDeselectAllColumns}
                                        >
                                            Deselect All
                                        </Button>
                                    </div>

                                    <ScrollArea className="h-[300px] pr-4">
                                        <div className="space-y-6">
                                            {Object.entries(COLUMN_CATEGORIES).map(([categoryKey, category]) => (
                                                <div key={categoryKey} className="space-y-3">
                                                    <div className="flex items-center space-x-2 pb-2 border-b">
                                                        <CustomCheckbox
                                                            id={`category-${categoryKey}`}
                                                            checked={isCategoryFullySelected(categoryKey)}
                                                            onCheckedChange={(checked) => 
                                                                handleCategoryToggle(categoryKey, checked)
                                                            }
                                                            className={isCategoryPartiallySelected(categoryKey) ? "bg-blue-400 border-blue-400" : ""}
                                                        />
                                                        <label
                                                            htmlFor={`category-${categoryKey}`}
                                                            className="text-sm font-semibold cursor-pointer"
                                                        >
                                                            {category.label}
                                                        </label>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 pl-6">
                                                        {category.columns.map((column) => (
                                                            <div key={column.key} className="flex items-center space-x-2">
                                                                <CustomCheckbox
                                                                    id={column.key}
                                                                    checked={selectedColumns[column.key]}
                                                                    onCheckedChange={(checked) =>
                                                                        setSelectedColumns(prev => ({
                                                                            ...prev,
                                                                            [column.key]: checked
                                                                        }))
                                                                    }
                                                                />
                                                                <label
                                                                    htmlFor={column.key}
                                                                    className="text-sm cursor-pointer"
                                                                >
                                                                    {column.label}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <DialogFooter>
                                        <div className="flex justify-between w-full items-center">
                                            <p className="text-sm text-muted-foreground">
                                                {selectedColumnsCount} columns selected
                                            </p>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline"
                                                    onClick={() => setIsColumnDialogOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    onClick={() => {
                                                        exportToExcel();
                                                        setIsColumnDialogOpen(false);
                                                    }}
                                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                                    disabled={selectedColumnsCount === 0}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export ({selectedColumnsCount} columns)
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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
    const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

    const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>({
        working_date: true,
        name: true,
        client_name: true,
        file_name: true,
        work_type: true,
        page_no: true,
        start_time: true,
        end_time: true,
        total_working_hours: true,
        po: true,
    });

    const COLUMN_CATEGORIES = {
        workDetails: {
            label: "Work Details",
            columns: [
                { key: "working_date", label: "Working Date" },
                { key: "name", label: "Name" },
                { key: "client_name", label: "Client Name" },
                { key: "file_name", label: "File Name" },
                { key: "work_type", label: "Work type" },
                { key: "page_no", label: "Page Count" }
            ],
        },
        timeline: {
            label: "Timeline & Performance",
            columns: [
                { key: "start_time", label: "Start Time" },
                { key: "end_time", label: "End Time" },
                { key: "total_working_hours", label: "Total Working Hours" },
                { key: "po", label: "PO" },
            ],
        },
    };

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

    // Handle category selection
    const handleCategoryToggle = (categoryKey: string, checked: boolean) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const newSelected = { ...selectedColumns };
        category.columns.forEach(col => {
            newSelected[col.key] = checked;
        });
        setSelectedColumns(newSelected);
    };

    // Check if all columns in a category are selected
    const isCategoryFullySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        return category.columns.every(col => selectedColumns[col.key]);
    };

    // Check if some (but not all) columns in a category are selected
    const isCategoryPartiallySelected = (categoryKey: string) => {
        const category = COLUMN_CATEGORIES[categoryKey as keyof typeof COLUMN_CATEGORIES];
        const selectedCount = category.columns.filter(col => selectedColumns[col.key]).length;
        return selectedCount > 0 && selectedCount < category.columns.length;
    };

    // Handle select/deselect all columns
    const handleSelectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = true;
            });
        });
        setSelectedColumns(newSelected);
    };

    const handleDeselectAllColumns = () => {
        const newSelected: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                newSelected[col.key] = false;
            });
        });
        setSelectedColumns(newSelected);
    };

    // Export to Excel function with selected columns
    const exportToExcel = () => {
        const exportData = filteredData.map((entry) => {
            const row: Record<string, any> = {};

            Object.values(COLUMN_CATEGORIES).forEach(category => {
                category.columns.forEach(col => {
                    if(selectedColumns[col.key]) {
                        row[col.label] = entry[col.key] || "N/A";
                    }
                });
            });
            
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "QA Report");
        XLSX.writeFile(wb, `Processor_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    // Count selected columns
    const selectedColumnsCount = Object.values(selectedColumns).filter(Boolean).length;
    const totalColumnsCount = Object.values(COLUMN_CATEGORIES).reduce(
        (acc, cat) => acc + cat.columns.length, 
        0
    );

    // Custom Checkbox component
    const CustomCheckbox = ({ 
        checked, 
        onCheckedChange, 
        id, 
        className = "" 
    }: { 
        checked: boolean;
        onCheckedChange: (checked: boolean) => void;
        id: string;
        className?: string;
    }) => {
        return (
            <button
                id={id}
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onCheckedChange(!checked)}
                className={`h-4 w-4 rounded border border-gray-300 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    checked ? "bg-blue-600 border-blue-600" : "bg-white"
                } ${className}`}
            >
                {checked && <Check className="h-3 w-3 text-white" />}
            </button>
        );
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
                            <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={filteredData.length === 0}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Excel
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[80vh]">
                                    <DialogHeader>
                                        <DialogTitle>Select Columns for Export</DialogTitle>
                                        <DialogDescription>
                                            Choose which columns to include in the Excel export
                                        </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="flex gap-2 mb-4">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleSelectAllColumns}
                                        >
                                            Select All
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={handleDeselectAllColumns}
                                        >
                                            Deselect All
                                        </Button>
                                    </div>

                                    <ScrollArea className="h-[300px] pr-4">
                                        <div className="space-y-6">
                                            {Object.entries(COLUMN_CATEGORIES).map(([categoryKey, category]) => (
                                                <div key={categoryKey} className="space-y-3">
                                                    <div className="flex items-center space-x-2 pb-2 border-b">
                                                        <CustomCheckbox
                                                            id={`category-${categoryKey}`}
                                                            checked={isCategoryFullySelected(categoryKey)}
                                                            onCheckedChange={(checked) => 
                                                                handleCategoryToggle(categoryKey, checked)
                                                            }
                                                            className={isCategoryPartiallySelected(categoryKey) ? "bg-blue-400 border-blue-400" : ""}
                                                        />
                                                        <label
                                                            htmlFor={`category-${categoryKey}`}
                                                            className="text-sm font-semibold cursor-pointer"
                                                        >
                                                            {category.label}
                                                        </label>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 pl-6">
                                                        {category.columns.map((column) => (
                                                            <div key={column.key} className="flex items-center space-x-2">
                                                                <CustomCheckbox
                                                                    id={column.key}
                                                                    checked={selectedColumns[column.key]}
                                                                    onCheckedChange={(checked) =>
                                                                        setSelectedColumns(prev => ({
                                                                            ...prev,
                                                                            [column.key]: checked
                                                                        }))
                                                                    }
                                                                />
                                                                <label
                                                                    htmlFor={column.key}
                                                                    className="text-sm cursor-pointer"
                                                                >
                                                                    {column.label}
                                                                </label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <DialogFooter>
                                        <div className="flex justify-between w-full items-center">
                                            <p className="text-sm text-muted-foreground">
                                                {selectedColumnsCount} columns selected
                                            </p>
                                            <div className="flex gap-2">
                                                <Button 
                                                    variant="outline"
                                                    onClick={() => setIsColumnDialogOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    onClick={() => {
                                                        exportToExcel();
                                                        setIsColumnDialogOpen(false);
                                                    }}
                                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                                    disabled={selectedColumnsCount === 0}
                                                >
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Export ({selectedColumnsCount} columns)
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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