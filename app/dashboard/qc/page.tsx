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

// Mock QC-specific tasks
const qcTasks = [
  {
    id: "task-2",
    title: "Test payment integration",
    description:
      "Verify that the payment gateway integration is working correctly with proper error handling and success flows.",
    dueDate: "2025-04-08",
    status: "in-progress",
    priority: "critical",
    assignedTo: "Alice Smith",
  },
  {
    id: "task-6",
    title: "Documentation review",
    description:
      "Review and update the API documentation to ensure it matches the current implementation.",
    dueDate: "2025-04-09",
    status: "completed",
    priority: "low",
    assignedTo: "Alice Smith",
  },
  {
    id: "task-12",
    title: "Database schema validation",
    description:
      "Validate the new database schema changes against the requirements document.",
    dueDate: "2025-04-10",
    status: "pending",
    priority: "medium",
    assignedTo: "Tom Richards",
  },
  {
    id: "task-13",
    title: "UI component library testing",
    description:
      "Test all components in the new UI component library for consistency and accessibility compliance.",
    dueDate: "2025-04-15",
    status: "pending",
    priority: "high",
    assignedTo: "Alice Smith",
  },
  {
    id: "task-14",
    title: "API integration tests",
    description:
      "Write and execute integration tests for the newly developed APIs to ensure they meet specifications.",
    dueDate: "2025-04-07",
    status: "overdue",
    priority: "high",
    assignedTo: "Michael Brown",
  },
  {
    id: "task-15",
    title: "Code review for frontend modules",
    description:
      "Perform a detailed code review of the frontend modules developed in the last sprint.",
    dueDate: "2025-04-11",
    status: "in-progress",
    priority: "medium",
    assignedTo: "Tom Richards",
  },
];

export default function QCDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Ensure the component is mounted before rendering
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevents hydration mismatch
  }

  // Filter tasks based on search and filters
  const filteredTasks = qcTasks.filter((task) => {
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
        <h1 className="text-2xl font-bold">Quality Control Dashboard</h1>
        <p className="text-gray-500">Monitor, test, and ensure code quality</p>
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
              key={task.id}
              id={task.id}
              title={task.title}
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
