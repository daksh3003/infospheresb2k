// // app/dashboard/pm/page.tsx
"use client";

import { useState, useEffect } from "react";
import { TaskCard } from "@/components/task-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase"; // Adjust the import path as needed

interface PMDashboardTask {
  // From projects table
  projectId: string;
  projectName: string;
  projectTaskId: string | null;
  clientInstruction: string | null;
  deliveryDate: string | null;
  deliveryTime: string | null;
  processType: string | null;
  poHours: number | null;
  isProjectOverallComplete: boolean;

  // From task_iterations table
  taskIterationId: string;
  iterationNumber: number;
  currentStage: string;
  statusFlag: string | null;
  iterationNotes: string | null;

  // From file_versions table (via task_iterations.current_file_version_id)
  currentFileVersionId: string | null;
  currentFileName: string | null;

  calculatedStatus:
    | "pending"
    | "in-progress"
    | "completed"
    | "overdue"
    | "returned";
  calculatedPriority: "low" | "medium" | "high" | "critical";

  displayId: string;
  displayTitle: string;
  displayDescription: string | null;
  displayDueDate: string | null;
  displayAssignedTo: string;
}

type DisplayStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "overdue"
  | "returned";

export default function PMDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [tasks, setTasks] = useState<PMDashboardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Mount tracking effect (runs only once)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch tasks when statusFilter changes
  useEffect(() => {
    if (mounted) {
      fetchTasks();
    }
  }, [statusFilter, mounted]);

  if (!mounted) return null;

  const fetchTasks = async () => {
    setIsLoading(true);
    // console.log("[PM Dashboard] Attempting fetch with ULTRA SIMPLE query...");
    try {
      const { data, error } = await supabase
        .from("task_iterations")
        .select(
          `
        id, 
        current_stage, 
        status_flag, 
        task_id, 
        iteration_number, 
        tasks_test ( task_name, task_id ) // Minimal join
      `
        )
        .in("current_stage", ["Processor", "PM"]);

      console.log("[PM Dashboard] ULTRA SIMPLE Query Data:", data);
      if (error && Object.keys(error).length > 0) {
        console.error(
          "[PM Dashboard] ULTRA SIMPLE Query Error:",
          JSON.stringify(error, null, 2)
        );
        setTasks([]);
      } else if (data && data.length > 0) {
        console.log(
          `[PM Dashboard] ULTRA SIMPLE Query successful, ${data.length} items found. First item:`,
          data[0]
        );
        const dummyTasks: PMDashboardTask[] = data.map((item: any) => ({
          taskIterationId: item.id,
          projectName:
            item.tasks_test?.task_name ||
            `Task (ID: ${item.tasks_test?.task_id?.substring(0, 8)})` ||
            "No Task Name",
          currentStage: item.current_stage,
          calculatedStatus: "pending",
          projectId: item.tasks_test?.task_id || "dummy_project_id",
          projectTaskId: null,
          clientInstruction: null,
          deliveryDate: null,
          deliveryTime: null,
          processType: null,
          poHours: null,
          isProjectOverallComplete: false,
          iterationNumber: item.iteration_number || 1,
          statusFlag: item.status_flag || null,
          iterationNotes: null,
          currentFileVersionId: null,
          currentFileName: null,
          calculatedPriority: "medium",
          displayId: item.id,
          displayTitle:
            item.tasks_test?.task_name ||
            `Task (ID: ${item.tasks_test?.task_id?.substring(0, 8)})` ||
            "No Task Name",
          displayDescription: `Status Flag: ${item.status_flag || "N/A"}`,
          displayDueDate: null,
          displayAssignedTo: `Iter: ${item.iteration_number || "N/A"}`,
        }));
        setTasks(dummyTasks);
      } else {
        console.log(
          "[PM Dashboard] ULTRA SIMPLE Query returned no data or data array is empty. Error (if any):",
          error ? JSON.stringify(error, null, 2) : "No error object"
        );
        setTasks([]);
      }
    } catch (err: any) {
      console.error(
        "[PM Dashboard] Catch block error during ULTRA SIMPLE fetch:",
        err.message ? err.message : err,
        err
      );
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };
  // Helper function to calculate status based on delivery date
  const calculateStatus = (
    deliveryDate: string | null | undefined
  ): DisplayStatus => {
    if (!deliveryDate) return "pending";

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const dueDate = new Date(deliveryDate);
    const normalizedDueDate = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate()
    );

    if (normalizedDueDate < today) {
      return "overdue";
    }

    const diffTime = normalizedDueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 2) {
      return "in-progress";
    }
    return "pending";
  };

  const calculatePriority = (
    deliveryDate: string | null | undefined,
    poHours: number
  ): "low" | "medium" | "high" | "critical" => {
    if (!deliveryDate) return "medium";

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(deliveryDate);
    const normalizedDueDate = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate()
    );

    if (normalizedDueDate < today) {
      return "critical";
    }

    const diffTime = normalizedDueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (poHours > 20 && diffDays <= 7) return "critical";
    if (poHours > 10 && diffDays <= 3) return "critical";

    if (diffDays <= 1) {
      return "critical";
    } else if (diffDays <= 3) {
      return "high";
    } else if (diffDays <= 7) {
      return "medium";
    }
    if (poHours > 15) return "medium";
    return "low";
  };

  const filteredTasks = tasks.filter((task) => {
    const searchQueryLower = searchQuery.toLowerCase();
    const matchesSearch =
      task.projectName?.toLowerCase().includes(searchQueryLower) ||
      task.projectTaskId?.toLowerCase().includes(searchQueryLower) ||
      task.clientInstruction?.toLowerCase().includes(searchQueryLower) ||
      task.iterationNotes?.toLowerCase().includes(searchQueryLower) ||
      task.currentFileName?.toLowerCase().includes(searchQueryLower);

    const matchesStatus =
      statusFilter === "all" || task.calculatedStatus === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.calculatedPriority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6 p-6">
      {" "}
      {}
      <div className="flex items-center justify-between w-full mb-6">
        <div>
          <h1 className="text-2xl font-bold">Processor Dashboard</h1>
          <p className="text-gray-500">
            Manage projects, teams, and tasks efficiently
          </p>
        </div>
      </div>
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-2/5">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />{" "}
              {/* Centered icon */}
              <Input
                placeholder="Search by Project, Task ID, Instruction, Notes, File..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-1/3">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed (Overall)</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="returned">
                  Returned for Correction
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-1/3">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Tasks Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg text-gray-700">Loading tasks...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.taskIterationId}
                id={task.projectId}
                title={task.projectName}
                description={task.displayDescription || "No details"}
                dueDate={
                  task.deliveryDate || new Date().toISOString().split("T")[0]
                }
                status={task.calculatedStatus}
                priority={task.calculatedPriority}
                assignedTo={task.displayAssignedTo}
              />
            ))
          ) : (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 py-8 text-center text-gray-500">
              {" "}
              {/* Ensure full width */}
              <p>No tasks found matching your filters.</p>
            </div>
          )}
        </div>
      )}
      {/* Refresh button */}
      <div className="flex justify-center mt-6">
        <Button
          variant="outline"
          onClick={fetchTasks}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Refresh Tasks"
          )}
        </Button>
      </div>
    </div>
  );
}
