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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart, 
  PieChart, 
  Users, 
  FilePlus, 
  UserPlus,
  Calendar,
  Search
} from 'lucide-react';

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

// Mock team members
const teamMembers = [
  { id: 1, name: "Robert Johnson", role: "Senior Project Manager", tasks: 3, avatar: "/avatars/robert.jpg" },
  { id: 2, name: "John Doe", role: "Project Manager", tasks: 2, avatar: "/avatars/john.jpg" },
  { id: 3, name: "Sarah Wilson", role: "Assistant Project Manager", tasks: 1, avatar: "/avatars/sarah.jpg" },
];

// Mock projects data
const projects = [
  { id: 1, name: "Infosphere Enterprise", progress: 75, tasks: 12, team: 8 },
  { id: 2, name: "Client Portal Revamp", progress: 40, tasks: 8, team: 5 },
  { id: 3, name: "Mobile App Development", progress: 60, tasks: 10, team: 6 },
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

  // Stats
  const totalTasks = pmTasks.length;
  const pendingTasks = pmTasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = pmTasks.filter(task => task.status === 'in-progress').length;
  const completedTasks = pmTasks.filter(task => task.status === 'completed').length;
  const overdueTasks = pmTasks.filter(task => task.status === 'overdue').length;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Project Manager Dashboard</h1>
          <p className="text-gray-500">Manage projects, teams, and tasks efficiently</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-800 hover:bg-blue-900">
            <FilePlus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          <Button variant="outline" className="border-blue-800 text-blue-800 hover:bg-blue-50">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>
      </div>
      
      {/* Projects Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-blue-800" />
              Projects Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects.map(project => (
                <div key={project.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{project.name}</span>
                      <div className="flex text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {project.team} members
                        </span>
                        <span>
                          {project.tasks} tasks
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {project.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-800 h-2 rounded-full" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-blue-800" />
              Task Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-center h-40">
                <div className="relative h-32 w-32">
                  {/* This is a simplified pie chart representation */}
                  <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-transparent border-t-blue-800 border-r-blue-800" 
                    style={{ transform: `rotate(${completedTasks/totalTasks * 360}deg)` }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{Math.round(completedTasks/totalTasks * 100)}%</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-xl font-bold text-blue-800">{pendingTasks}</p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-xl font-bold text-blue-800">{inProgressTasks}</p>
                  <p className="text-xs text-gray-600">In Progress</p>
                </div>
                <div className="bg-blue-50 p-2 rounded">
                  <p className="text-xl font-bold text-blue-800">{completedTasks}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-xl font-bold text-red-800">{overdueTasks}</p>
                  <p className="text-xs text-gray-600">Overdue</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Team Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-800" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamMembers.map(member => (
              <Card key={member.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 overflow-hidden">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-blue-800 text-white text-lg font-medium">
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-gray-500">{member.role}</p>
                      <p className="text-xs text-blue-800">{member.tasks} tasks assigned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Tasks Section */}
      <div>
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="upcoming">
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
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
          
          <TabsContent value="upcoming" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks
                .filter(task => task.status !== 'completed' && task.status !== 'overdue')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 6)
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
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="overdue" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks
                .filter(task => task.status === 'overdue')
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
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}