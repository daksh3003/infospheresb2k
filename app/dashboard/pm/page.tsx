// app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { TaskCard } from "@/components/task-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { fetchBatchTaskAssignments } from "@/utils/taskAssignments";
import { toast } from "react-toastify";
import { api } from "@/utils/api";
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
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  CircleDashed,
  Loader2,
  Save,
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
  file_type?: string;
  file_format?: string;
  custom_file_format?: string;
  page_count?: number | null;
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
      po_hours?: number;
    };
  }>({});
  const [editingPoHours, setEditingPoHours] = useState<{ [key: string]: string }>({});
  const [isUpdatingPo, setIsUpdatingPo] = useState<string | null>(null);


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
              po_hours?: number;
            };
          },
          project: {
            project_id: string;
            project_name: string;
            delivery_date: string;
            delivery_time: string;
            po_hours: number;
          }
        ) => {
          acc[project.project_id] = {
            name: project.project_name,
            delivery_date: project.delivery_date,
            delivery_time: project.delivery_time,
            po_hours: project.po_hours,
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

      // Fetch page counts from API
      const pageCountResponse = await fetch("/api/tasks/page-counts");
      const pageCountData = await pageCountResponse.json();

      // Create a map of task_id to page_count
      const pageCountMap = pageCountData.reduce(
        (acc: Record<string, number>, item: { task_id: string; total_pages: number }) => {
          acc[item.task_id] = item.total_pages;
          return acc;
        },
        {}
      );

      if (projectsData) {
        const processedTasks = projectsData.map(
          (task: {
            task_id: string;
            delivery_date: string;
            completion_status: boolean;
            po_hours: number;
            process_type: string;
            project_id: string;
            id: number;
            task_name?: string;
            client_instruction?: string;
            created_at?: string;
            file_type?: string;
            file_format?: string;
            custom_file_format?: string;
          }) => {
            return {
              ...task,
              id: (task.id || task.task_id).toString(),
              status: calculateStatus(
                task.delivery_date,
                task.completion_status
              ),
              priority: calculatePriority(task.delivery_date, task.po_hours),
              type: getTaskType(task.process_type),
              current_stage: stageMap[task.task_id] || "Processor", // Default to Processor if no stage found
              page_count: pageCountMap[task.task_id] || null, // Add page count
            };
          }
        );

        // Set tasks immediately to render the UI
        setTasks(processedTasks);
        setIsLoading(false);

        // Get unique project IDs and fetch their names (non-blocking)
        const uniqueProjectIds = [
          ...new Set(
            processedTasks.map(
              (task: { project_id: string }) => task.project_id
            )
          ),
        ];

        // Fetch project names without blocking
        fetchProjectNames(uniqueProjectIds as string[]);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
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

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPriority &&
      matchesStage
    );
  });

  // Base tasks for tabs (ignores status filter for RFD)
  const getBaseFilteredTasks = (includeCompleted = true) => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.task_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.task_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.client_instruction
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      const matchesStage =
        stageFilter === "all" || task.current_stage === stageFilter;

      const isCompleted = task.completion_status || task.status === "completed";
      const matchesCompletion = includeCompleted ? true : !isCompleted;

      return matchesSearch && matchesPriority && matchesStage && matchesCompletion;
    });
  };



  const _openModal = () => setIsModalOpen(true);
  const _closeModal = () => setIsModalOpen(false);

  const _handleTaskAdded = () => {
    fetchTasks();
  };

  const handleUpdatePoHours = async (projectId: string) => {
    const hours = editingPoHours[projectId];
    if (hours === undefined || hours === "") return;

    try {
      setIsUpdatingPo(projectId);
      await api.updateProject(projectId, { po_hours: parseFloat(hours) });

      // Update local state
      setProjectNames(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          po_hours: parseFloat(hours)
        }
      }));

      const newEditing = { ...editingPoHours };
      delete newEditing[projectId];
      setEditingPoHours(newEditing);

      toast.success("PO Hours updated successfully");
    } catch (error) {
      console.error("Error updating PO Hours:", error);
      toast.error("Failed to update PO Hours");
    } finally {
      setIsUpdatingPo(null);
    }
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

  // Helper function to check if a date is today
  const isDateToday = (dateString: string) => {
    if (!dateString || dateString === "null" || dateString === "undefined") return false;
    try {
      const today = new Date();
      const checkDate = new Date(dateString);

      today.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);

      return today.getTime() === checkDate.getTime();
    } catch {
      return false;
    }
  };

  // Helper function to check if a date is overdue
  const isDateOverdue = (dateString: string) => {
    if (!dateString || dateString === "null" || dateString === "undefined") return false;
    try {
      const today = new Date();
      const checkDate = new Date(dateString);

      today.setHours(0, 0, 0, 0);
      checkDate.setHours(0, 0, 0, 0);

      return checkDate.getTime() < today.getTime();
    } catch {
      return false;
    }
  };

  // Function to render grouped tasks
  const renderGroupedTasks = (tasksToGroup: ProjectTask[]) => {
    // Local grouping within the function to handle filtered subsets
    const localProjectGroups = tasksToGroup.reduce(
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

    return Object.values(localProjectGroups).map((group, index) => {
      const deliveryDate = projectNames[group.projectId]?.delivery_date;
      const deliveryTime = projectNames[group.projectId]?.delivery_time;
      const isOverdue = isDateOverdue(deliveryDate);
      const isToday = isDateToday(deliveryDate);

      return (
        <div
          key={index}
          className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          {/* Project Header */}
          <div
            className="px-6 py-4 cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-all duration-200 border-b border-gray-100 dark:border-gray-700"
            onClick={() => toggleProjectExpansion(group.projectId)}
          >
            <div className="grid grid-cols-9 gap-4 items-center w-full">
              {/* Col 1-2: Info & Meta */}
              <div className="col-span-2 flex flex-col gap-1.5 min-w-0">
                <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 leading-none pl-[40px]">
                  Project
                </span>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex-shrink-0 border border-slate-100 dark:border-slate-700">
                    {expandedProjects.has(group.projectId) ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate text-[15px] leading-tight tracking-tight">
                      {group.projectName}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 flex items-center gap-1 uppercase tracking-tight"
                      >
                        <CheckCircle2 className="h-3 w-3 text-slate-400" />
                        {group.completedCount}/{group.totalCount} Tasks
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata Columns (3, 4, 5, 6) */}
              {group.tasks.length === 1 && group.tasks[0] ? (
                <>
                  {/* Page Count Column (Col 3) */}
                  <div className="flex flex-col gap-1.5 items-center">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 leading-none">
                      Page Count
                    </span>
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold text-gray-900 dark:text-gray-100 leading-none border-gray-200 dark:border-gray-700 rounded-full">
                      {group.tasks[0].page_count ?? '-'}
                    </Badge>
                  </div>

                  {/* File Type Column (Col 4) */}
                  <div className="flex flex-col gap-1.5 items-center">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 leading-none">
                      File Type
                    </span>
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold text-gray-900 dark:text-gray-100 leading-none capitalize border-gray-200 dark:border-gray-700 rounded-full">
                      {group.tasks[0].file_type || '-'}
                    </Badge>
                  </div>

                  {/* File Format Column (Col 5) */}
                  <div className="flex flex-col gap-1.5 items-center">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 leading-none">
                      File Format
                    </span>
                    <Badge variant="outline" className="px-2 py-0.5 text-[10px] font-bold text-gray-900 dark:text-gray-100 leading-none border-gray-200 dark:border-gray-700 rounded-full">
                      {group.tasks[0].file_format ? (
                        group.tasks[0].file_format === 'ms_excel' ? 'MS Excel' :
                          group.tasks[0].file_format === 'ms_word' ? 'MS Word' :
                            group.tasks[0].file_format === 'indesign' ? 'InDesign' :
                              group.tasks[0].file_format === 'photoshop' ? 'Photoshop' :
                                group.tasks[0].file_format === 'powerpoint' ? 'PowerPoint' :
                                  group.tasks[0].file_format === 'illustrator' ? 'Illustrator' :
                                    group.tasks[0].file_format === 'others' ? (group.tasks[0].custom_file_format || 'Others') :
                                      group.tasks[0].file_format
                      ) : '-'}
                    </Badge>
                  </div>

                  {/* Due Date Column (Col 6) */}
                  <div className="flex flex-col gap-1.5 items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 leading-none">
                        Due Date
                      </span>
                      {isToday && group.completionPercentage < 100 && (
                        <div className="h-3 w-3 rounded-full bg-orange-500 animate-pulse" title="Due Today" />
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100 leading-none whitespace-nowrap">
                        {deliveryDate && deliveryDate !== "null" && deliveryDate !== "undefined"
                          ? new Date(deliveryDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : '-'}
                      </span>
                      {deliveryTime && deliveryTime !== "null" && deliveryTime !== "undefined" && (
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium leading-tight mt-0.5">
                          {deliveryTime}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="col-span-4" />
              )}

              {/* Status Column (Col 7) */}
              <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400 dark:text-gray-500 leading-none">
                  Status
                </span>
                <Badge
                  variant="outline"
                  className={`px-3 py-0.5 text-[9px] font-bold w-[100px] justify-center rounded-full uppercase tracking-wider transition-colors ${group.completionPercentage === 100
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                    : isOverdue
                      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"
                      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                    }`}
                >
                  {group.completionPercentage === 100 ? "Completed" : isOverdue ? "Overdue" : "In Progress"}
                </Badge>
              </div>

              {/* PO Hours Column (Col 8) */}
              <div className="flex items-center justify-center gap-3 min-w-[120px]">

                {/* PO Hours Section */}
                {activeTab === "RFD" && tasks.filter(t => t.project_id === group.projectId && (!(t.completion_status || t.status === "completed"))).length === 0 && (
                  <div className="flex items-center gap-1.5 border-l border-gray-200 dark:border-gray-700 pl-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 leading-none">PO Hours</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="Hrs"
                          className="h-6 w-12 text-[10px] px-1.5"
                          value={editingPoHours[group.projectId] ?? projectNames[group.projectId]?.po_hours ?? ""}
                          onChange={(e) => setEditingPoHours(prev => ({ ...prev, [group.projectId]: e.target.value }))}
                        />
                        <Button
                          size="sm"
                          className="h-6 w-6 p-0"
                          disabled={isUpdatingPo === group.projectId || editingPoHours[group.projectId] === undefined}
                          onClick={() => handleUpdatePoHours(group.projectId)}
                        >
                          {isUpdatingPo === group.projectId ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Column (Col 9) */}
              <div className="flex items-center justify-center">
                {group.tasks.length === 1 && group.tasks[0] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-3 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-full flex items-center gap-1 group transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      const taskId = group.tasks[0].task_id;
                      const pathParts = window.location.pathname.split("/");
                      const source = pathParts[2] || "global";
                      // @ts-ignore - _router exists in the component scope but is named with underscore
                      _router.push(`/tasks/${taskId}?source=${source}`);
                    }}
                  >
                    View
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          {expandedProjects.has(group.projectId) && (
            <div>
              {/* Table Header */}
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
              {/* Task Rows */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {group.tasks.map((task, taskIndex) => (
                  <TaskCard
                    taskId={task.task_id}
                    key={taskIndex}
                    title={task.task_name || "Untitled Task"}
                    description={
                      task.client_instruction || "No description available"
                    }
                    dueDate={projectNames[task.project_id]?.delivery_date || ""}
                    dueTime={projectNames[task.project_id]?.delivery_time || ""}
                    status={task.status || "pending"}
                    priority={task.priority || "medium"}
                    fileType={task.file_type}
                    fileFormat={task.file_format}
                    customFileFormat={task.custom_file_format}
                    pageCount={task.page_count}
                    showFileMetadata={group.tasks.length > 1}
                    hideViewButton={group.tasks.length === 1}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    });
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(filteredTasks.map((t) => t.project_id)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTasks.filter((task) => task.completion_status).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTasks.filter((task) => !task.completion_status).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredTasks.length > 0
                ? `${Math.round((filteredTasks.filter((task) => task.completion_status).length / filteredTasks.length) * 100)}%`
                : "0%"
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
          <TabsTrigger value="RFD">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            RFD (Ready for Delivery)
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
                (task) => task.current_stage === "Processor" && !(task.completion_status || task.status === "completed")
              ).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No active processor tasks found.</p>
                </div>
              ) : (
                renderGroupedTasks(
                  filteredTasks.filter(
                    (task) => task.current_stage === "Processor" && !(task.completion_status || task.status === "completed")
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
              {filteredTasks.filter((task) => task.current_stage === "QC" && !(task.completion_status || task.status === "completed"))
                .length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No active QC tasks found.</p>
                </div>
              ) : (
                renderGroupedTasks(
                  filteredTasks.filter((task) => task.current_stage === "QC" && !(task.completion_status || task.status === "completed"))
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
              {filteredTasks.filter((task) => task.current_stage === "QA" && !(task.completion_status || task.status === "completed"))
                .length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No active QA tasks found.</p>
                </div>
              ) : (
                renderGroupedTasks(
                  filteredTasks.filter((task) => task.current_stage === "QA" && !(task.completion_status || task.status === "completed"))
                )
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="RFD" className="mt-6">
          {isLoading ? (
            <LoadingScreen variant="inline" message="Loading completed tasks..." />
          ) : (
            <div className="space-y-4">
              {getBaseFilteredTasks(true).filter((task) => task.completion_status || task.status === "completed")
                .length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tasks ready for delivery found.</p>
                </div>
              ) : (
                renderGroupedTasks(
                  getBaseFilteredTasks(true).filter((task) => task.completion_status || task.status === "completed")
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
