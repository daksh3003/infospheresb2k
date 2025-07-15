// app/dashboard/qc/page.tsx
"use client";

import { use, useEffect, useState } from "react";
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
import { supabase } from "@/utils/supabase";
import LoadingScreen from "@/components/ui/loading-screen";

interface QCDashboardTask {
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "overdue" | "returned";
  priority: "low" | "medium" | "high" | "critical";
  // From projects table
  projectId: string;
  projectName: string;
  projectTaskId: string | null;
  clientInstruction: string | null;
  deliveryDate: string | null;
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
  dueDate: string; // Optional for filtering
  assignedTo: string; // Optional for filtering
}

export default function QCDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<QCDashboardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
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
          tasks_test ( task_name, task_id )
        `
        )
        .eq("current_stage", "QC");

      if (error) {
        console.error("Error fetching QC tasks:", error);
        setTasks([]);
      } else if (data && data.length > 0) {
        const processedTasks: QCDashboardTask[] = data.map((item: any) => ({
          projectId: item.tasks_test?.task_id || item.task_id || "unknown",
          projectName: item.tasks_test?.task_name || "No Project Name",
          projectTaskId: item.tasks_test?.task_id || null,
          clientInstruction: null,
          deliveryDate: null,
          processType: null,
          poHours: null,
          isProjectOverallComplete: false,
          taskIterationId: item.id,
          iterationNumber: item.iteration_number || 1,
          currentStage: item.current_stage,
          statusFlag: item.status_flag || null,
          iterationNotes: null,
          currentFileVersionId: null,
          currentFileName: null,
          calculatedStatus: "pending",
          calculatedPriority: "medium",
          displayId: item.id,
          displayTitle: item.tasks_test?.task_name || "No Project Name",
          displayDescription: `Status Flag: ${item.status_flag || "N/A"}`,
          displayDueDate: null,
          displayAssignedTo: `Iteration: ${item.iteration_number || "N/A"}`,
          title: item.tasks_test?.task_name || "No Project Name",
          description: `Status Flag: ${item.status_flag || "N/A"}`,
          status: "pending",
          priority: "medium",
          dueDate: "",
          assignedTo: `Iteration: ${item.iteration_number || "N/A"}`,
        }));
        setTasks(processedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error in fetchTasks:", error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (!mounted) {
    return <LoadingScreen message="Initializing QC dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">QC Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter((task) => task.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter((task) => task.status === "in-progress").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
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
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <LoadingScreen variant="inline" message="Loading QC tasks..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">
                  No tasks found matching your criteria.
                </p>
              </div>
            ) : (
              filteredTasks.map((task, index) => (
                <TaskCard
                  key={index}
                  id={task.projectTaskId || task.displayId}
                  title={task.title}
                  description={task.description}
                  dueDate={task.dueDate}
                  status={task.status}
                  priority={task.priority}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
