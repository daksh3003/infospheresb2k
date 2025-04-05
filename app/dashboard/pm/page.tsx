// app/dashboard/pm/page.tsx
'use client';

import { useState } from 'react';
import { TaskCard } from '@/components/task-card';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search } from 'lucide-react';

// Mock PM-specific tasks
const pmTasks = [
  {
    id: "task-3",
    title: "Update project timeline",
    description: "Update the project timeline based on the latest sprint review and adjust resource allocation accordingly.",
    dueDate: "2025-04-12",
    status: "pending",
    priority: "medium",
    assignedTo: "Robert Johnson"
  },
  {
    id: "task-4",
    title: "Prepare customer demo",
    description: "Create a demo for the upcoming client meeting showcasing the new features implemented in the latest sprint.",
    dueDate: "2025-04-05",
    status: "overdue",
    priority: "high",
    assignedTo: "John Doe"
  },
  {
    id: "task-7",
    title: "Sprint planning",
    description: "Prepare for the upcoming sprint planning meeting by organizing backlog items and setting priorities.",
    dueDate: "2025-04-07",
    status: "completed",
    priority: "high",
    assignedTo: "Robert Johnson"
  },
  {
    id: "task-9",
    title: "Resource allocation review",
    description: "Review the current resource allocation and make adjustments to optimize team productivity.",
    dueDate: "2025-04-14",
    status: "pending",
    priority: "medium",
    assignedTo: "Sarah Wilson"
  },
  {
    id: "task-10",
    title: "Client progress report",
    description: "Prepare a detailed progress report for the client highlighting achievements and upcoming milestones.",
    dueDate: "2025-04-11",
    status: "in-progress",
    priority: "high",
    assignedTo: "Robert Johnson"
  },
  {
    id: "task-11",
    title: "Budget review",
    description: "Review the project budget and update forecasts based on current spending patterns.",
    dueDate: "2025-04-19",
    status: "pending",
    priority: "medium",
    assignedTo: "John Doe"
  }
];

export default function PMDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Filter tasks based on search and filters
  const filteredTasks = pmTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Project Manager Dashboard</h1>
        <p className="text-gray-500">Manage projects, teams, and tasks efficiently</p>
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