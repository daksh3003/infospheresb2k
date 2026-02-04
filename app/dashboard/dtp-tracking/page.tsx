"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Search,
  CalendarIcon,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "xlsx";
import { format, parse } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";

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

// Define column categories and their fields
const COLUMN_CATEGORIES = {
  jobDetails: {
    label: "Job Details",
    columns: [
      { key: "job_no", label: "Job No" },
      { key: "delivered_by", label: "Delivered by" },
      { key: "po", label: "PO" },
      { key: "mail_instruction", label: "Mail instruction" },
      { key: "task_type", label: "Task type" },
      { key: "task_name", label: "Task Name" },
      { key: "file_count", label: "File Count" },
      { key: "page_count", label: "Page count" },
    ],
  },
  dtpProcessTracking: {
    label: "DTP Process Tracking",
    columns: [
      { key: "language", label: "Language" },
      { key: "platform", label: "Platform" },
      { key: "file_type", label: "File Type" },
      { key: "date", label: "Date" },
      { key: "delivery_time", label: "Delivery Time" },
      { key: "dtp_person", label: "DTP Person" },
      { key: "dtp_start_time", label: "DTP Start Time" },
      { key: "dtp_end_time", label: "DTP End Time" },
      { key: "abbyy_compare_dtp", label: "DTP Abbyy Compare" },
      { key: "dtp_status", label: "DTP Status" },
    ],
  },
  qcTracking: {
    label: "QC Tracking",
    columns: [
      { key: "qc_taken_by", label: "QC taken by" },
      { key: "qc_start_time", label: "QC Start Time" },
      { key: "qc_end_time", label: "QC End Time" },
      { key: "abbyy_compare_qc", label: "QC Abbyy Compare" },
      { key: "qc_status", label: "QC Status" },
      { key: "qc_cxn_taken", label: "QC CXN taken" },
      { key: "qc_cxn_start_time", label: "QC CXN Start Time" },
      { key: "qc_cxn_end_time", label: "QC CXN End Time" },
      { key: "cxn_status", label: "CXN Status" },
    ],
  },
  qaTrackingAndFinalStatus: {
    label: "QA Tracking & Final Status",
    columns: [
      { key: "qa_taken_by", label: "QA taken by" },
      { key: "qa_start_time", label: "QA Start Time" },
      { key: "qa_end_time", label: "QA End Time" },
      { key: "abbyy_compare_qa", label: "QA Abbyy Compare" },
      { key: "qa_status", label: "QA Status" },
      { key: "qa_cxn_taken", label: "QA CXN taken" },
      { key: "qa_cxn_start_time", label: "QA CXN Start Time" },
      { key: "qa_cxn_end_time", label: "QA CXN End Time" },
      { key: "file_status", label: "File Status" },
    ],
  },
};

export default function DTPTrackingPage() {
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);

    // State for selected columns (all selected by default)
    const [selectedColumns, setSelectedColumns] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        Object.values(COLUMN_CATEGORIES).forEach(category => {
            category.columns.forEach(col => {
                initial[col.key] = true;
            });
        });
        return initial;
    });

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

    // Filter data based on search query
    const filteredData = reportData.filter((entry) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            entry.job_no?.toString().toLowerCase().includes(query) ||
            entry.delivered_by?.toLowerCase().includes(query) ||
            entry.mail_instruction?.toLowerCase().includes(query) ||
            entry.task_type?.toLowerCase().includes(query) ||
            entry.task_name?.toLowerCase().includes(query) ||
            entry.language?.toLowerCase().includes(query) ||
            entry.platform?.toLowerCase().includes(query) ||
            entry.dtp_person?.toLowerCase().includes(query) ||
            entry.qc_taken_by?.toLowerCase().includes(query) ||
            entry.qa_taken_by?.toLowerCase().includes(query)
        );
    });

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Handle category selection (select/deselect all columns in category)
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
                        let value = entry[col.key];
                        
                        // Format specific fields
                        if (col.key === "po" && typeof value === 'number') {
                            value = value.toFixed(2);
                        }
                        
                        row[col.label] = value || "N/A";
                    }
                });
            });
            
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DTP Tracking");
        XLSX.writeFile(wb, `DTP_Tracking_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    };

    // Count selected columns
    const selectedColumnsCount = Object.values(selectedColumns).filter(Boolean).length;
    const totalColumnsCount = Object.values(COLUMN_CATEGORIES).reduce(
        (acc, cat) => acc + cat.columns.length, 
        0
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
                <div className="flex flex-wrap items-end gap-4 mt-4 justify-between">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search by job, person, task..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-[42px]"
                            />
                        </div>
                    </div>

                    {/* Date Filters */}
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                Start Date
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[160px] h-[42px] justify-start text-left font-normal">
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
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                                End Date
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[160px] h-[42px] justify-start text-left font-normal">
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
                    </div>
                </div>
            </CardHeader>

            <CardContent className="overflow-x-auto">
                {filteredData.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No DTP Tracking data found.</p>
                        {(startDate || endDate || searchQuery) && (
                            <Button
                                onClick={() => {
                                    handleClearFilters();
                                    setSearchQuery("");
                                }}
                                variant="link"
                                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                            >
                                Clear filters to see all data
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Results count */}
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm text-gray-600">
                                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
                                {searchQuery && ` (filtered from ${reportData.length} total)`}
                            </p>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {/* Job Details Columns */}
                                    <TableHead className="text-center">Job No</TableHead>
                                    <TableHead className="text-center">Delivered by</TableHead>
                                    <TableHead className="text-center">PO</TableHead>
                                    <TableHead className="text-center">Mail instruction</TableHead>
                                    <TableHead className="text-center">Task type</TableHead>
                                    <TableHead className="text-center">Task Name</TableHead>
                                    <TableHead className="text-center">File Count</TableHead>
                                    <TableHead className="text-center">Page count</TableHead>

                                    {/* DTP Process Tracking Columns */}
                                    <TableHead className="text-center">Language</TableHead>
                                    <TableHead className="text-center">Platform</TableHead>
                                    <TableHead className="text-center">File Type</TableHead>
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
                                {paginatedData.map((entry, index) => (
                                    <TableRow key={entry.job_no || index}>
                                        {/* Job Details Data */}
                                        <TableCell className="text-center">{entry.job_no || "N/A"}</TableCell>
                                        <TableCell className="text-center">{entry.delivered_by || "N/A"}</TableCell>
                                        <TableCell className="text-center">
                                            {typeof entry.po === 'number' ? entry.po.toFixed(2) : entry.po || "N/A"}
                                        </TableCell>
                                        <TableCell className="text-center max-w-[300px]">
                                            <Tooltip content={entry.mail_instruction || "N/A"}>
                                                <span className="block truncate cursor-default">{entry.mail_instruction || "N/A"}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-center">{entry.task_type || "N/A"}</TableCell>
                                        <TableCell className="text-center max-w-[200px]">
                                            <Tooltip content={entry.task_name || "N/A"}>
                                                <span className="block truncate cursor-default">{entry.task_name || "N/A"}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell className="text-center">{entry.file_count || 0}</TableCell>
                                        <TableCell className="text-center">{entry.page_count || 0}</TableCell>

                                        {/* DTP Process Tracking Data */}
                                        <TableCell className="text-center">{entry.language || "N/A"}</TableCell>
                                        <TableCell className="text-center">{entry.platform || "N/A"}</TableCell>
                                        <TableCell className="text-center">{entry.file_type || "N/A"}</TableCell>
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
                                                        className={`inline-block w-2 h-2 rounded-full mr-1.5 ${entry.dtp_status === "Completed"
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
                                                        className={`inline-block w-2 h-2 rounded-full mr-1.5 ${entry.qc_status === "Completed"
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
                                                        entry.cxn_status === "Completed"
                                                            ? "bg-white-100 text-black-700 hover:bg-green-200 border-transparent"
                                                            : "bg-white-100 text-black-700 hover:bg-yellow-200 border-transparent"
                                                    }
                                                >
                                                    <span
                                                        className={`inline-block w-2 h-2 rounded-full mr-1.5 ${entry.cxn_status === "Completed"
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
                                                        className={`inline-block w-2 h-2 rounded-full mr-1.5 ${entry.qa_status === "Completed"
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
                                                        className={`inline-block w-2 h-2 rounded-full mr-1.5 ${entry.file_status === "Completed"
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

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">Rows per page:</span>
                                <Select
                                    value={itemsPerPage.toString()}
                                    onValueChange={(value) => {
                                        setItemsPerPage(Number(value));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger className="w-[70px] h-8">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
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
                                                className="w-8 h-8 p-0"
                                                onClick={() => setCurrentPage(pageNum)}
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
                    </>
                )}
            </CardContent>
        </Card>
    );
}