// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
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
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskModal from "@/components/taskModal";
import { supabase } from "@/utils/supabase";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

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
  const [projectNames, setProjectNames] = useState<{ [key: string]: string }>(
    {}
  );

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetchTasks();
  }, []);

  const fetchProjectNames = async (projectIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from("projects_test")
        .select("project_id, project_name")
        .in("project_id", projectIds);

      if (error) throw error;

      const projectNameMap = data.reduce(
        (acc: { [key: string]: string }, project) => {
          acc[project.project_id] = project.project_name;
          return acc;
        },
        {}
      );

      setProjectNames(projectNameMap);
    } catch (error) {
      console.error("Error fetching project names:", error);
    }
  };

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      // First get all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("tasks_test")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Then get the current stage for each project
      const { data: iterationsData, error: iterationsError } = await supabase
        .from("task_iterations")
        .select("task_id, current_stage");

      if (iterationsError) throw iterationsError;

      // Create a map of project_id to current_stage
      const stageMap = iterationsData.reduce((acc: any, curr) => {
        acc[curr.task_id] = curr.current_stage;
        return acc;
      }, {});

      console.log("stageMap", stageMap);

      if (projectsData) {
        const processedTasks = projectsData.map((task) => {
          return {
            ...task,
            status: calculateStatus(task.delivery_date, task.completion_status),
            priority: calculatePriority(task.delivery_date, task.po_hours),
            type: getTaskType(task.process_type),
            current_stage: stageMap[task.task_id] || "Processor", // Default to Processor if no stage found
          };
        });
        console.log("processedTasks", processedTasks);
        setTasks(processedTasks);

        // Get unique project IDs and fetch their names
        const uniqueProjectIds = [
          ...new Set(processedTasks.map((task) => task.project_id)),
        ];
        await fetchProjectNames(uniqueProjectIds);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const calculatePriority = (deliveryDate: string, poHours: number) => {
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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleTaskAdded = () => {
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
          projectName: projectNames[projectId] || "Unnamed Project",
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

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Dashboard Header with Add Task Button */}
      <div className="flex items-center justify-between w-full mb-6">
        <div>
          <h1 className="text-2xl font-bold">Project Manager Dashboard</h1>
          <p className="text-gray-500">
            Manage projects, teams, and tasks efficiently
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={openModal}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add Task
          </Button>
        </div>
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onTaskAdded={handleTaskAdded}
      />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-2/5">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by Project, Task ID, Instruction..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-1/5">
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
              <SelectTrigger className="w-full md:w-1/5">
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
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(projectGroups).map((group, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader
                    className="cursor-pointer bg-gray-50 dark:bg-gray-800"
                    onClick={() => toggleProjectExpansion(group.projectId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {expandedProjects.has(group.projectId) ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {group.projectName}
                            <span className="text-sm text-gray-500">
                              {/* ({group.projectId}) */}
                            </span>
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            {group.completedCount} of {group.totalCount} tasks
                            completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-48">
                          <Progress
                            value={group.completionPercentage}
                            className="h-2"
                          />
                        </div>
                        <Badge
                          className={
                            group.completionPercentage === 100
                              ? "bg-green-500 text-white"
                              : "bg-blue-500 text-white"
                          }
                        >
                          {group.completionPercentage}%
                          {group.completionPercentage === 100 && (
                            <CheckCircle2 className="h-4 w-4 ml-1" />
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  {expandedProjects.has(group.projectId) && (
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 gap-4">
                        {group.tasks.map((task, index) => (
                          <TaskCard
                            key={index}
                            id={task.task_id}
                            title={task.task_name || "Untitled Task"}
                            description={
                              task.client_instruction ||
                              "No description available"
                            }
                            dueDate={task.delivery_date}
                            status={task.status || "pending"}
                            priority={task.priority || "medium"}
                          />
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {["Processor", "QC", "QA"].map((type, index) => (
          <TabsContent key={index} value={type} className="mt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTasks.map((task, index) => (
                  <TaskCard
                    key={index}
                    id={task.task_id}
                    title={task.task_name || "Untitled Project"}
                    description={
                      task.client_instruction || "No description available"
                    }
                    dueDate={task.delivery_date}
                    status={task.status || "pending"}
                    priority={task.priority || "medium"}
                  />
                ))}
                {filteredTasks.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    No tasks found matching your filters
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {isLoading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!isLoading && filteredTasks.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No tasks found</p>
        </div>
      )}
    </div>
  );
}
