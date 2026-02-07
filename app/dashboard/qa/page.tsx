// app/dashboard/qa/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { TaskCard } from "@/components/task-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchBatchTaskAssignments, AssignedUser } from "@/utils/taskAssignments";
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
import { api } from "@/utils/api";

interface QADashboardTask {
  id: string;
  taskId: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high" | "critical";
  dueDate: string;
  assignedTo: string;
  projectId: string;
  projectName: string;
  currentStage: string;
  statusFlag: string | null;
  iterationNumber: number;
}

export default function QADashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<QADashboardTask[]>([]);
  const [workers, setWorkers] = useState<Record<string, AssignedUser[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [projectNames, setProjectNames] = useState<{
    [key: string]: {
      name: string;
      delivery_date: string;
      delivery_time: string;
    };
  }>({});
  const [activeTab, setActiveTab] = useState("my-tasks");
  const [handoverTasks, setHandoverTasks] = useState<QADashboardTask[]>([]);
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



  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/tasks/current_stage/qa", {
        method: "GET",
      });
      const data = await response.json();

      if (data && data.length > 0) {
        const processedTasks: QADashboardTask[] = data.map(
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
            latest_action: string | null;
          }) => ({
            taskId: item.tasks_test?.task_id || item.task_id || "unknown",
            id: item.id.toString(),
            title: item.tasks_test?.task_name || "No Project Name",
            description: `Status: ${item.status || "N/A"}`,
            status: "pending",
            priority: "medium",
            dueDate: "",
            assignedTo: `Iteration: ${item.iteration_number || "N/A"}`,
            projectId: item.tasks_test?.project_id || item.task_id || "unknown",
            projectName: item.tasks_test?.task_name || "No Project Name",
            currentStage: item.current_stage,
            // status: item.status || null,
            iterationNumber: item.iteration_number || 1,
            latest_action: item.latest_action,
          })
        );

        // Set tasks immediately to render the UI
        setTasks(processedTasks);
        setIsLoading(false);

        // Get unique project IDs and fetch their names and delivery info (non-blocking)
        const uniqueProjectIds = [
          ...new Set(
            processedTasks.map((task: { projectId: string }) => task.projectId)
          ),
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
      console.error("Error in fetchTasks:", error);
      setTasks([]);
      setIsLoading(false);
    }
  }, []);

  const fetchHandoverTasks = useCallback(async () => {
    setIsHandoverLoading(true);
    try {
      const data = await api.getHandoverQueue();
      // Filter for QA stage
      const filtered = data.filter((t: any) => t.current_stage === "QA");

      const processedTasks = filtered.map((item: any) => ({
        id: item.task_id,
        taskId: item.task_id,
        title: item.task_name || "No Project Name",
        description: item.client_instruction || "No description",
        status: "pending",
        priority: "medium",
        dueDate: item.delivery_date || "",
        assignedTo: "Handover Queue",
        projectId: item.project_id,
        projectName: item.task_name || "No Project Name",
        currentStage: "QA",
        statusFlag: null,
        iterationNumber: 1,
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
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    const isHandedOver = (task as any).latest_action === 'handover';

    return matchesSearch && matchesStatus && matchesPriority && !isHandedOver;
  });

  if (!mounted) {
    return <LoadingScreen message="Initializing QA dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">QA Dashboard</h1>
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
              <LoadingScreen variant="inline" message="Loading QA tasks..." />
            ) : (
              <div className="flex flex-col space-y-4">
                {/* Table Header */}
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border rounded-t-xl border-gray-200 dark:border-gray-700 -mb-4">
                  <div className="grid grid-cols-9 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="col-span-2">Task Details</div>
                    <div className="text-center">Page Count</div>
                    <div className="text-center">File Type</div>
                    <div className="text-center">File Format</div>
                    <div className="text-center col-span-2">Working On</div>
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
                      title={task.title}
                      description={task.description}
                      dueDate={projectNames[task.projectId]?.delivery_date || ""}
                      dueTime={projectNames[task.projectId]?.delivery_time || ""}
                      status={task.status}
                      priority={task.priority}
                      currentWorkers={workers[task.taskId]?.map(w => ({ name: w.name, email: w.email }))}
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
                    <div className="text-center col-span-2">Working On</div>
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
                      title={task.title}
                      description={task.description}
                      dueDate={projectNames[task.projectId]?.delivery_date || ""}
                      dueTime={projectNames[task.projectId]?.delivery_time || ""}
                      status={task.status}
                      priority={task.priority}
                      currentWorkers={[]}
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
