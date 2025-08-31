// app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { TaskCard } from "@/components/task-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Users,
  ClipboardCheck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskModal from "@/components/taskModal";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import LoadingScreen from "@/components/ui/loading-screen";

interface ProjectTask {
  id: string;
  task_name: string;
  task_id: string;
  project_id: string;
  client_instruction: string;
  delivery_date: string;
  process_type: string;
  serial_number: string;
  po_hours: number;
  created_at: string;
  updated_at: string;
  completion_status: boolean;
  status?: "pending" | "in-progress" | "completed" | "overdue";
  priority?: "low" | "medium" | "high" | "critical";
  current_stage?: "Processor" | "QC" | "QA";
  type: "pm" | "qc" | "qa";
  project_delivery_date?: string;
  project_delivery_time?: string;
}

interface ProjectGroup {
  projectId: string;
  projectName: string;
  tasks: ProjectTask[];
  completedCount: number;
  totalCount: number;
  completionPercentage: number;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );
  const [projectNames, setProjectNames] = useState<{
    [key: string]: {
      name: string;
      delivery_date: string;
      delivery_time: string;
    };
  }>({});

  const _router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjectNames = async (projectIds: string[]) => {
    try {
      const response = await fetch("/api/projects/names", {
        method: "POST",
        body: JSON.stringify({ projectIds }),
      });
      const data = await response.json();

      const projectNameMap = data.reduce(
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
      const response = await fetch("/api/tasks", {
        method: "GET",
      });

      const projectsData = await response.json();

      const iterationsResponse = await fetch("/api/tasks/current_stage", {
        method: "GET",
      });
      const iterationsData = await iterationsResponse.json();

      // Create a map of project_id to current_stage
      const stageMap = iterationsData.reduce(
        (
          acc: Record<string, string>,
          curr: { task_id: string; current_stage: string }
        ) => {
          acc[curr.task_id] = curr.current_stage;
          return acc;
        },
        {}
      );

      console.log("stageMap", stageMap);

      if (projectsData) {
        const processedTasks = projectsData.map(
          (task: {
            task_id: string;
            delivery_date: string;
            completion_status: boolean;
            po_hours: number;
            process_type: string;
            project_id: string;
            task_name?: string;
            client_instruction?: string;
            created_at?: string;
          }) => {
            return {
              ...task,
              status: calculateStatus(
                task.delivery_date,
                task.completion_status
              ),
              priority: calculatePriority(task.delivery_date, task.po_hours),
              type: getTaskType(task.process_type),
              current_stage: stageMap[task.task_id] || "Processor", // Default to Processor if no stage found
            };
          }
        );
        console.log("processedTasks : ", processedTasks);
        setTasks(processedTasks);

        // Get unique project IDs and fetch their names
        const uniqueProjectIds = [
          ...new Set(
            processedTasks.map(
              (task: { project_id: string }) => task.project_id
            )
          ),
        ];
        await fetchProjectNames(uniqueProjectIds as string[]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper functions (same as before)
  const calculateStatus = (deliveryDate: string, isCompleted: boolean) => {
    if (isCompleted) return "completed";
    if (!deliveryDate) return "pending";

    const today = new Date();
    const dueDate = new Date(deliveryDate);

    if (dueDate < today) return "overdue";

    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 2 ? "in-progress" : "pending";
  };

  const calculatePriority = (deliveryDate: string, _poHours: number) => {
    if (!deliveryDate) return "medium";

    const today = new Date();
    const dueDate = new Date(deliveryDate);

    if (dueDate < today) return "critical";

    const diffDays = Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 1) return "critical";
    if (diffDays <= 3) return "high";
    if (diffDays <= 7) return "medium";
    return "low";
  };

  const getTaskType = (processType: string): "pm" | "qc" | "qa" => {
    if (!processType) return "pm";
    const type = processType.toLowerCase();
    if (type.includes("qc")) return "qc";
    if (type.includes("qa")) return "qa";
    return "pm";
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.task_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.task_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.client_instruction
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;
    const matchesStage =
      stageFilter === "all" || task.current_stage === stageFilter;
    const matchesType = activeTab === "all" || task.current_stage === activeTab;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesStage &&
      matchesType
    );
  });

  // console.log("filteredTasks", filteredTasks);

  const _openModal = () => setIsModalOpen(true);
  const _closeModal = () => setIsModalOpen(false);

  const _handleTaskAdded = () => {
    fetchTasks();
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Group tasks by project and calculate completion metrics
  const projectGroups = filteredTasks.reduce(
    (groups: { [key: string]: ProjectGroup }, task) => {
      const projectId = task.project_id;

      if (!groups[projectId]) {
        groups[projectId] = {
          projectId,
          projectName: projectNames[projectId]?.name || "Unnamed Project",
          tasks: [],
          completedCount: 0,
          totalCount: 0,
          completionPercentage: 0,
        };
      }
      groups[projectId].tasks.push(task);
      groups[projectId].totalCount++;
      if (task.completion_status) {
        groups[projectId].completedCount++;
      }
      groups[projectId].completionPercentage = Math.round(
        (groups[projectId].completedCount / groups[projectId].totalCount) * 100
      );
      return groups;
    },
    {}
  );

  // Function to render grouped tasks
  const renderGroupedTasks = (_tasks: ProjectTask[]) => {
    return Object.values(projectGroups).map((group, index) => (
      <div
        key={index}
        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
      >
        {/* Project Header */}
        <div
          className="px-6 py-4 cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border-b border-gray-200 dark:border-gray-600"
          onClick={() => toggleProjectExpansion(group.projectId)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                {expandedProjects.has(group.projectId) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {group.projectName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {group.completedCount} of {group.totalCount} tasks completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end gap-2">
                <div className="w-48">
                  <Progress
                    value={group.completionPercentage}
                    className="h-2"
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Progress: {group.completionPercentage}%
                </span>
              </div>
              <Badge
                className={`px-3 py-1.5 text-sm font-medium ${
                  group.completionPercentage === 100
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-200 dark:border-green-700"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
                }`}
              >
                {group.completionPercentage === 100 ? (
                  <span className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Complete
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    In Progress
                  </span>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        {expandedProjects.has(group.projectId) && (
          <div>
            {/* Table Header */}
            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-5 gap-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-2">Task Details</div>
                <div className="text-center">Due Date</div>
                <div className="text-center">Status</div>
                <div className="text-center">Priority</div>
                <div className="text-center">Actions</div>
              </div>
            </div>
            {/* Task Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {group.tasks.map((task, index) => (
                <TaskCard
                  key={index}
                  id={task.task_id}
                  title={task.task_name || "Untitled Task"}
                  description={
                    task.client_instruction || "No description available"
                  }
                  dueDate={projectNames[task.project_id]?.delivery_date || ""}
                  dueTime={projectNames[task.project_id]?.delivery_time || ""}
                  status={task.status || "pending"}
                  priority={task.priority || "medium"}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    ));
  };

  // Function to handle task creation
  const handleCreateTask = () => {
    fetchTasks();
  };

  if (!mounted) {
    return <LoadingScreen message="Initializing dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Project Dashboard</h1>
        <Button onClick={() => setIsModalOpen(true)}>Create New Task</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter((task) => task.status === "in-progress").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter((task) => task.completion_status).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.filter((task) => task.status === "overdue").length}
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

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="Processor">Processor</SelectItem>
            <SelectItem value="QC">QC</SelectItem>
            <SelectItem value="QA">QA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="Processor">
            <Users className="h-4 w-4 mr-2" />
            Processor Tasks
          </TabsTrigger>
          <TabsTrigger value="QC">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            QC Tasks
          </TabsTrigger>
          <TabsTrigger value="QA">
            <ShieldCheck className="h-4 w-4 mr-2" />
            QA Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <LoadingScreen variant="inline" message="Loading tasks..." />
          ) : (
            <div className="space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No tasks found matching your criteria.
                  </p>
                </div>
              ) : (
                renderGroupedTasks(filteredTasks)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="Processor" className="mt-6">
          {isLoading ? (
            <LoadingScreen
              variant="inline"
              message="Loading processor tasks..."
            />
          ) : (
            <div className="space-y-4">
              {filteredTasks.filter(
                (task) => task.current_stage === "Processor"
              ).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No processor tasks found.</p>
                </div>
              ) : (
                renderGroupedTasks(
                  filteredTasks.filter(
                    (task) => task.current_stage === "Processor"
                  )
                )
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="QC" className="mt-6">
          {isLoading ? (
            <LoadingScreen variant="inline" message="Loading QC tasks..." />
          ) : (
            <div className="space-y-4">
              {filteredTasks.filter((task) => task.current_stage === "QC")
                .length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No QC tasks found.</p>
                </div>
              ) : (
                renderGroupedTasks(
                  filteredTasks.filter((task) => task.current_stage === "QC")
                )
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="QA" className="mt-6">
          {isLoading ? (
            <LoadingScreen variant="inline" message="Loading QA tasks..." />
          ) : (
            <div className="space-y-4">
              {filteredTasks.filter((task) => task.current_stage === "QA")
                .length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No QA tasks found.</p>
                </div>
              ) : (
                renderGroupedTasks(
                  filteredTasks.filter((task) => task.current_stage === "QA")
                )
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskAdded={handleCreateTask}
      />
    </div>
  );
}
