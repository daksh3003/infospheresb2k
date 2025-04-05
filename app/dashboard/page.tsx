// app/dashboard/page.tsx
'use client';

import { useState } from 'react';
import { TaskCard } from '@/components/task-card';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Users, 
  ClipboardCheck, 
  ShieldCheck 
} from "lucide-react";

// Mock tasks data
const allTasks = [
  {
    id: "task-1",
    title: "Review latest code changes",
    description: "Perform a code review for the new frontend features implemented by the development team.",
    dueDate: "2025-04-10",
    status: "pending",
    priority: "high",
    assignedTo: "John Doe",
    type: "qa"
  },
  {
    id: "task-2",
    title: "Test payment integration",
    description: "Verify that the payment gateway integration is working correctly with proper error handling and success flows.",
    dueDate: "2025-04-08",
    status: "in-progress",
    priority: "critical",
    assignedTo: "Alice Smith",
    type: "qc"
  },
  {
    id: "task-3",
    title: "Update project timeline",
    description: "Update the project timeline based on the latest sprint review and adjust resource allocation accordingly.",
    dueDate: "2025-04-12",
    status: "pending",
    priority: "medium",
    assignedTo: "Robert Johnson",
    type: "pm"
  },
  {
    id: "task-4",
    title: "Prepare customer demo",
    description: "Create a demo for the upcoming client meeting showcasing the new features implemented in the latest sprint.",
    dueDate: "2025-04-05",
    status: "overdue",
    priority: "high",
    assignedTo: "John Doe",
    type: "pm"
  },
  {
    id: "task-5",
    title: "Performance testing",
    description: "Run performance tests on the application to identify bottlenecks and optimize resource usage.",
    dueDate: "2025-04-15",
    status: "pending",
    priority: "medium",
    assignedTo: "Emily Chen",
    type: "qa"
  },
  {
    id: "task-6",
    title: "Documentation review",
    description: "Review and update the API documentation to ensure it matches the current implementation.",
    dueDate: "2025-04-09",
    status: "completed",
    priority: "low",
    assignedTo: "Alice Smith",
    type: "qc"
  },
  {
    id: "task-7",
    title: "Sprint planning",
    description: "Prepare for the upcoming sprint planning meeting by organizing backlog items and setting priorities.",
    dueDate: "2025-04-07",
    status: "completed",
    priority: "high",
    assignedTo: "Robert Johnson",
    type: "pm"
  },
  {
    id: "task-8",
    title: "Security audit",
    description: "Conduct a security audit of the application to identify and address potential vulnerabilities.",
    dueDate: "2025-04-18",
    status: "pending",
    priority: "critical",
    assignedTo: "Emily Chen",
    type: "qa"
  }
];

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Filter tasks based on search and filters
  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Summary counters
  const totalTasks = allTasks.length;
  const pendingTasks = allTasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = allTasks.filter(task => task.status === 'in-progress').length;
  const completedTasks = allTasks.filter(task => task.status === 'completed').length;
  const overdueTasks = allTasks.filter(task => task.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome to your Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                <p className="text-3xl font-bold">{totalTasks}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6 text-blue-800" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="text-3xl font-bold">{inProgressTasks}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-800" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-3xl font-bold">{completedTasks}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-800" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-3xl font-bold">{overdueTasks}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-800" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
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
          
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search tasks..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
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
              <SelectTrigger className="w-full md:w-40">
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
        </div>

        <TabsContent value="all" className="mt-0">
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
        </TabsContent>
        
        <TabsContent value="pm" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.filter(task => task.type === 'pm').length > 0 ? (
              filteredTasks
                .filter(task => task.type === 'pm')
                .map((task) => (
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
                <p>No Project Manager tasks found matching your filters.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="qc" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.filter(task => task.type === 'qc').length > 0 ? (
              filteredTasks
                .filter(task => task.type === 'qc')
                .map((task) => (
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
                <p>No QC Team tasks found matching your filters.</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="qa" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.filter(task => task.type === 'qa').length > 0 ? (
              filteredTasks
                .filter(task => task.type === 'qa')
                .map((task) => (
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
                <p>No QA Team tasks found matching your filters.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}