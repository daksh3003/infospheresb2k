// app/dashboard/qa/page.tsx
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

// Mock QA-specific tasks
const qaTasks = [
  {
    id: "task-1",
    title: "Review latest code changes",
    description: "Perform a code review for the new frontend features implemented by the development team.",
    dueDate: "2025-04-10",
    status: "pending",
    priority: "high",
    assignedTo: "John Doe"
  },
  {
    id: "task-5",
    title: "Performance testing",
    description: "Run performance tests on the application to identify bottlenecks and optimize resource usage.",
    dueDate: "2025-04-15",
    status: "pending",
    priority: "medium",
    assignedTo: "Emily Chen"
  },
  {
    id: "task-8",
    title: "Security audit",
    description: "Conduct a security audit of the application to identify and address potential vulnerabilities.",
    dueDate: "2025-04-18",
    status: "pending",
    priority: "critical",
    assignedTo: "Emily Chen"
  },
  {
    id: "task-16",
    title: "User acceptance testing",
    description: "Coordinate UAT with stakeholders to ensure the application meets business requirements.",
    dueDate: "2025-04-22",
    status: "pending",
    priority: "high",
    assignedTo: "John Doe"
  },
  {
    id: "task-17",
    title: "Regression testing",
    description: "Perform regression testing to ensure new changes don't negatively impact existing functionality.",
    dueDate: "2025-04-09",
    status: "in-progress",
    priority: "medium",
    assignedTo: "Emily Chen"
  },
  {
    id: "task-18",
    title: "Bug verification",
    description: "Verify fixed bugs to ensure they have been properly resolved before release.",
    dueDate: "2025-04-07",
    status: "completed",
    priority: "high",
    assignedTo: "David Lee"
  }
];

export default function QADashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Filter tasks based on search and filters
  const filteredTasks = qaTasks.filter(task => {
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
        <h1 className="text-2xl font-bold">Quality Assurance Dashboard</h1>
        <p className="text-gray-500">Track bugs, monitor quality, and ensure application readiness</p>
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