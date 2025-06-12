// app/dashboard/qa/page.tsx
"use client";

import { useState } from "react";
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
import { Search } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/utils/supabase";

export default function QADashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchTasks = async () => {
    // setIsLoading(true);
    // console.log("[PM Dashboard] Attempting fetch with ULTRA SIMPLE query...");
    try {
      const { data, error } = await supabase
        .from("task_iterations")
        .select(
          `
          id, 
          current_stage, 
          status_flag, 
          project_id, 
          iteration_number, 
          projects ( project_name, id ) // Minimal join
        `
        )
        .eq("current_stage", "QA");

      console.log(data);

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
        const dummyTasks: any[] = data.map((item: any) => ({
          status: "pending", // Default status, can be updated later
          priority: "medium", // Default priority, can be updated later
          dueDate: "2025-04-11", // Default due date, can be updated later
          assignedTo: `QC Iteration ${item.iteration_number || "N/A"}`, // Default assigned to, can be updated later
          description: "No Decription ",
          title: "No Project Name",
          taskIterationId: item.id,
          projectName:
            item.projects?.project_name ||
            `Project (ID: ${item.project_id?.substring(0, 8)})` ||
            "No Project Name",
          currentStage: item.current_stage,
          calculatedStatus: "pending",
          projectId: item.projects?.id || item.project_id || "dummy_project_id",
          projectTaskId: null,
          clientInstruction: null,
          deliveryDate: null,
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
            item.projects?.project_name ||
            `Project (ID: ${item.project_id?.substring(0, 8)})` ||
            "No Project Name",
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
      // setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchTasks();
  }, []);

  if (!mounted) {
    return null; // Prevents hydration mismatch
  }

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quality Assurance Dashboard</h1>
        <p className="text-gray-500">
          Track bugs, monitor quality, and ensure application readiness
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-2/5">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search tasks..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.taskIterationId}
              id={task.projectId}
              title={task.projectName}
              description={task.description}
              dueDate={task.dueDate}
              status={task.status as any}
              priority={task.priority as any}
              assignedTo={task.assignedTo}
            />
          ))
        ) : (
          <div className="col-span-3 py-8 text-center text-gray-500">
            <p>No tasks found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
