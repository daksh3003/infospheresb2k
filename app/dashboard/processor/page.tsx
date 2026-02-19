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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Inbox, Users } from "lucide-react";

import LoadingScreen from "@/components/ui/loading-screen";
import { fetchBatchTaskAssignments, AssignedUser } from "@/utils/taskAssignments";
import { api } from "@/utils/api";

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

  // File metadata
  fileType: string | null;
  fileFormat: string | null;
  customFileFormat: string | null;

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
  const [workers, setWorkers] = useState<Record<string, AssignedUser[]>>({});
  const [projectNames, setProjectNames] = useState<{
    [key: string]: {
      name: string;
      delivery_date: string;
      delivery_time: string;
      language: string | null;
    };
  }>({});
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [handoverTasks, setHandoverTasks] = useState<PMDashboardTask[]>([]);
  const [isHandoverLoading, setIsHandoverLoading] = useState(false);


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
              language: string | null;
            };
          },
          project: {
            project_id: string;
            project_name: string;
            delivery_date: string;
            delivery_time: string;
            language: string | null;
          }
        ) => {
          acc[project.project_id] = {
            name: project.project_name,
            delivery_date: project.delivery_date,
            delivery_time: project.delivery_time,
            language: project.language,
          };
          return acc;
        },
        {} as { [key: string]: { name: string; delivery_date: string; delivery_time: string; language: string | null } }
      );

      setProjectNames(projectNameMap);
    } catch (error) {
      console.error("Error fetching project names:", error);
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
              file_type: string | null;
              file_format: string | null;
              custom_file_format: string | null;
            } | null;
            latest_action: string | null;
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
            fileType: item.tasks_test?.file_type || null,
            fileFormat: item.tasks_test?.file_format || null,
            customFileFormat: item.tasks_test?.custom_file_format || null,
            calculatedStatus: "pending",
            calculatedPriority: "medium",
            displayId: item.id.toString(),
            displayTitle: item.tasks_test?.task_name || "No Project Name",
            displayDescription: `Status: ${item.status || "N/A"}`,
            displayDueDate: null,
            displayAssignedTo: `Iteration: ${item.iteration_number || "N/A"}`,
            taskId: item.task_id,
            latest_action: item.latest_action,
          })
        );

        // Set tasks immediately to render the UI
        setTasks(processedTasks);
        setIsLoading(false);

        // Get unique project IDs and fetch their names and delivery info (non-blocking)
        const uniqueProjectIds = [
          ...new Set(processedTasks.map((task) => task.projectId)),
        ];
        fetchProjectNames(uniqueProjectIds);

        // Fetch task assignments (workers) for all tasks
        const taskIds = processedTasks.map((t: any) => t.taskId);
        if (taskIds.length > 0) {
          fetchBatchTaskAssignments(taskIds).then(workersData => {
            setWorkers(workersData);
          });
        }
      } else {
        setTasks([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
      setIsLoading(false);
    }
  }, []);

  const fetchHandoverTasks = useCallback(async () => {
    setIsHandoverLoading(true);
    try {
      const data = await api.getHandoverQueue();
      // Filter for Processor stage
      const filtered = data.filter((t: any) => t.current_stage === "Processor");

      const processedTasks = filtered.map((item: any) => ({
        taskId: item.task_id,
        projectId: item.project_id,
        projectName: item.task_name || "No Project Name",
        projectTaskId: item.task_id,
        clientInstruction: item.client_instruction,
        deliveryDate: item.delivery_date,
        deliveryTime: item.delivery_time,
        processType: item.process_type,
        poHours: item.po_hours,
        isProjectOverallComplete: item.completion_status,
        taskIterationId: "", // Not directly available here easily
        iterationNumber: 1,
        currentStage: "Processor",
        status: "pending",
        calculatedStatus: "pending",
        calculatedPriority: "medium",
        displayId: item.task_id,
        displayTitle: item.task_name || "No Project Name",
        displayDescription: item.client_instruction || "No description",
        displayDueDate: item.delivery_date,
        displayAssignedTo: "Handover Queue",
      }));

      setHandoverTasks(processedTasks);

      const uniqueProjectIds = [...new Set(processedTasks.map((task: any) => task.projectId))];
      fetchProjectNames(uniqueProjectIds as string[]);
    } catch (error) {
      console.error("Error fetching handover tasks:", error);
    } finally {
      setIsHandoverLoading(false);
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

    const isHandedOver = (task as any).latest_action === 'handover';

    return matchesSearch && matchesStatus && matchesPriority && !isHandedOver;
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
        <Tabs defaultValue="my-tasks" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="my-tasks">
              <Users className="h-4 w-4 mr-2" />
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="handover" onClick={fetchHandoverTasks}>
              <Inbox className="h-4 w-4 mr-2" />
              Handover Queue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="mt-6">
            {isLoading ? (
              <LoadingScreen
                variant="inline"
                message="Loading processor tasks..."
              />
            ) : (
              <div className="flex flex-col space-y-4">
                {/* Table Header */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border rounded-t-xl border-gray-200 dark:border-gray-700 -mb-4">
                  <div className="grid grid-cols-9 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="col-span-2">Task Details</div>
                    <div className="text-center">Page Count</div>
                    <div className="text-center">File Type</div>
                    <div className="text-center">File Format</div>
                    <div className="text-center">Language</div>
                    <div className="text-center">Working On</div>
                    <div className="text-center">Status</div>
                    <div className="text-center">Action</div>
                  </div>
                </div>

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
                      title={task.displayTitle}
                      description={task.displayDescription || "No description"}
                      dueDate={projectNames[task.projectId]?.delivery_date || ""}
                      dueTime={projectNames[task.projectId]?.delivery_time || ""}
                      status={task.calculatedStatus}
                      priority={task.calculatedPriority}
                      currentWorkers={workers[task.taskId]?.map(w => ({ name: w.name, email: w.email }))}
                      fileType={task.fileType || undefined}
                      fileFormat={task.fileFormat || undefined}
                      customFileFormat={task.customFileFormat || undefined}
                      language={projectNames[task.projectId]?.language || undefined}
                      disableStatusFetch={true}
                    />
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="handover" className="mt-6">
            {isHandoverLoading ? (
              <LoadingScreen variant="inline" message="Loading handover queue..." />
            ) : (
              <div className="flex flex-col space-y-4">
                {/* Table Header */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border rounded-t-xl border-gray-200 dark:border-gray-700 -mb-4">
                  <div className="grid grid-cols-9 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="col-span-2">Task Details</div>
                    <div className="text-center">Page Count</div>
                    <div className="text-center">File Type</div>
                    <div className="text-center">File Format</div>
                    <div className="text-center">Language</div>
                    <div className="text-center">Working On</div>
                    <div className="text-center">Status</div>
                    <div className="text-center">Action</div>
                  </div>
                </div>

                {handoverTasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Handover queue is empty.</p>
                  </div>
                ) : (
                  handoverTasks.map((task, index) => (
                    <TaskCard
                      key={index}
                      taskId={task.taskId}
                      title={task.displayTitle}
                      description={task.displayDescription || "No description"}
                      dueDate={projectNames[task.projectId]?.delivery_date || ""}
                      dueTime={projectNames[task.projectId]?.delivery_time || ""}
                      status={task.calculatedStatus}
                      priority={task.calculatedPriority}
                      currentWorkers={[]}
                      fileType={task.fileType || undefined}
                      fileFormat={task.fileFormat || undefined}
                      customFileFormat={task.customFileFormat || undefined}
                      language={projectNames[task.projectId]?.language || undefined}
                      disableStatusFetch={true}
                    />
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
