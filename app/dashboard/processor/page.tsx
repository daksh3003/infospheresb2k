// // app/dashboard/pm/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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

import LoadingScreen from "@/components/ui/loading-screen";
import { fetchBatchTaskAssignments } from "@/utils/taskAssignments";

interface PMDashboardTask {
  taskId: string;
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

export default function ProcessorDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<PMDashboardTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectNames, setProjectNames] = useState<{
    [key: string]: {
      name: string;
      delivery_date: string;
      delivery_time: string;
    };
  }>({});
  const [currentWorkers, setCurrentWorkers] = useState<{
    [key: string]: {
      name: string;
      email?: string;
    }[];
  }>({});

  useEffect(() => {
    setMounted(true);
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjectNames = async (projectIds: string[]) => {
    try {
      const data = await fetch("/api/projects/names", {
        method: "POST",
        body: JSON.stringify({ projectIds }),
      });

      const projectNamesData = await data.json();

      const projectNameMap = projectNamesData.reduce(
        (
          acc: {
            [key: string]: {
              name: string;
              delivery_date: string;
              delivery_time: string;
            };
          },
          project: {
            project_id: string;
            project_name: string;
            delivery_date: string;
            delivery_time: string;
          }
        ) => {
          acc[project.project_id] = {
            name: project.project_name,
            delivery_date: project.delivery_date,
            delivery_time: project.delivery_time,
          };
          return acc;
        },
        {}
      );

      setProjectNames(projectNameMap);
    } catch (error) {
      console.error("Error fetching project names:", error);
    }
  };

  const fetchCurrentWorkers = async (taskIds: string[]) => {
    try {
      // Use the new utility function instead of individual API calls
      // const { fetchBatchTaskAssignments } = await import('@/utils/taskAssignments');
      const result = await fetchBatchTaskAssignments(taskIds);

      // Convert to the format expected by the component
      const workerMap: { [key: string]: { name: string; email?: string }[] } = {};

      for (const [taskId, assignments] of Object.entries(result)) {
        workerMap[taskId] = assignments.map(user => ({
          name: user.name,
          email: user.email || undefined,
        }));
      }

      setCurrentWorkers(workerMap);
    } catch (error) {
      console.error("Error fetching current workers:", error);
    }
  };

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/tasks/current_stage/processor", {
        method: "GET",
      });
      const data = await response.json();

      if (data && data.length > 0) {
        const processedTasks: PMDashboardTask[] = data.map(
          (item: {
            id: number;
            current_stage: string;
            status: string | null;
            task_id: string;
            iteration_number: number | null;
            tasks_test: {
              task_name: string;
              task_id: string;
              project_id: string;
            } | null;
          }) => ({
            projectId: item.tasks_test?.project_id || item.task_id || "unknown",
            projectName: item.tasks_test?.task_name || "No Project Name",
            projectTaskId: item.tasks_test?.task_id || null,
            clientInstruction: null,
            deliveryDate: null,
            deliveryTime: null,
            processType: null,
            poHours: null,
            isProjectOverallComplete: false,
            taskIterationId: item.id,
            iterationNumber: item.iteration_number || 1,
            currentStage: item.current_stage,
            status: item.status || null,
            iterationNotes: null,
            currentFileVersionId: null,
            currentFileName: null,
            calculatedStatus: "pending",
            calculatedPriority: "medium",
            displayId: item.id.toString(),
            displayTitle: item.tasks_test?.task_name || "No Project Name",
            displayDescription: `Status: ${item.status || "N/A"}`,
            displayDueDate: null,
            displayAssignedTo: `Iteration: ${item.iteration_number || "N/A"}`,
            taskId: item.task_id,
          })
        );
        setTasks(processedTasks);

        // Get unique project IDs and fetch their names and delivery info
        const uniqueProjectIds = [
          ...new Set(processedTasks.map((task) => task.projectId)),
        ];
        await fetchProjectNames(uniqueProjectIds);

        // Fetch current workers for all tasks
        await fetchCurrentWorkers(processedTasks.map((task) => task.taskId));
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.taskId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.displayTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.displayDescription
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.calculatedStatus === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.calculatedPriority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (!mounted) {
    return <LoadingScreen message="Initializing processor dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Processor Dashboard
        </h1>
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
              {
                tasks.filter((task) => task.calculatedStatus === "pending")
                  .length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                tasks.filter((task) => task.calculatedStatus === "in-progress")
                  .length
              }
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
          <LoadingScreen
            variant="inline"
            message="Loading processor tasks..."
          />
        ) : (
          <div className="flex flex-col space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No tasks found matching your criteria.
                </p>
              </div>
            ) : (
              filteredTasks.map((task, index) => (
                <TaskCard
                  key={index}
                  taskId={task.taskId}
                  // id={task.projectTaskId || task.displayId}
                  title={task.displayTitle}
                  description={task.displayDescription || "No description"}
                  dueDate={projectNames[task.projectId]?.delivery_date || ""}
                  dueTime={projectNames[task.projectId]?.delivery_time || ""}
                  status={task.calculatedStatus}
                  priority={task.calculatedPriority}
                  currentWorkers={currentWorkers[task.taskId] || []}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
