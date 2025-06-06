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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase";

interface ProjectTask {
  id: string;
  project_name: string;
  task_id: string;
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
  //addition of the type to ensure proper bucketing.
  type: "pm" | "qc" | "qa";
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const processedTasks = data.map((task) => {
          return {
            ...task,
            status: calculateStatus(task.delivery_date, task.completion_status),
            priority: calculatePriority(task.delivery_date, task.po_hours),
            type: getTaskType(task.process_type),
          };
        });
        setTasks(processedTasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions (same as in PM dashboard)
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
      task.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.task_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.client_instruction
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      {/* ... (keep your existing header and filter UI) ... */}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="pm">
            <Users className="h-4 w-4 mr-2" />
            PM Tasks
          </TabsTrigger>
          <TabsTrigger value="qc">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            QC Tasks
          </TabsTrigger>
          <TabsTrigger value="qa">
            <ShieldCheck className="h-4 w-4 mr-2" />
            QA Tasks
          </TabsTrigger>
        </TabsList>

        {/* All Tasks Tab */}
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.project_name || "Untitled Project"}
                description={
                  task.client_instruction || "No description available"
                }
                dueDate={task.delivery_date}
                status={task.status || "pending"}
                priority={task.priority || "medium"}
                assignedTo={`Task ID: ${task.task_id || "N/A"}`}
              />
            ))}
          </div>
        </TabsContent>

        {/* PM Tasks Tab */}
        <TabsContent value="pm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.project_name || "Untitled Project"}
                description={
                  task.client_instruction || "No description available"
                }
                dueDate={task.delivery_date}
                status={task.status || "pending"}
                priority={task.priority || "medium"}
                assignedTo={`Task ID: ${task.task_id || "N/A"}`}
              />
            ))}
          </div>
        </TabsContent>

        {/* QC Tasks Tab  as of now set to PM , but will be shifted as soon as we include the flow concept.*/}
        <TabsContent value="qc">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks
              .filter((task) => task.type === "qc")
              .map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.project_name || "Untitled Project"}
                  description={
                    task.client_instruction || "No description available"
                  }
                  dueDate={task.delivery_date}
                  status={task.status || "pending"}
                  priority={task.priority || "medium"}
                  assignedTo={`Task ID: ${task.task_id || "N/A"}`}
                />
              ))}
          </div>
        </TabsContent>

        {/* QA Tasks Tab */}
        <TabsContent value="qa">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks
              .filter((task) => task.type === "qa")
              .map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.project_name || "Untitled Project"}
                  description={
                    task.client_instruction || "No description available"
                  }
                  dueDate={task.delivery_date}
                  status={task.status || "pending"}
                  priority={task.priority || "medium"}
                  assignedTo={`Task ID: ${task.task_id || "N/A"}`}
                />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
