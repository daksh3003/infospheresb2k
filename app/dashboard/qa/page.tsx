// app/dashboard/qa/page.tsx
'use client';

import { useState } from 'react';
import { TaskCard } from '@/components/task-card';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  BugPlay, 
  ShieldCheck, 
  ListChecks, 
  Calendar, 
  PlusCircle, 
  BugOff,
  FileWarning,
  CheckCircle,
  CircleAlert
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";

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

// Mock bugs data
const bugs = [
  { id: "bug-1", title: "Login fails on slow connections", severity: "high", status: "open", assignedTo: "David Lee", reported: "2025-04-01" },
  { id: "bug-2", title: "Data export missing certain fields", severity: "medium", status: "in-progress", assignedTo: "Emily Chen", reported: "2025-04-02" },
  { id: "bug-3", title: "Mobile UI breaks on small screens", severity: "high", status: "open", assignedTo: "John Doe", reported: "2025-04-03" },
  { id: "bug-4", title: "Session timeout not working correctly", severity: "critical", status: "open", assignedTo: "Emily Chen", reported: "2025-04-04" },
  { id: "bug-5", title: "PDF generation failing for large reports", severity: "medium", status: "in-progress", assignedTo: "David Lee", reported: "2025-04-05" }
];

// Bug statistics
const bugStats = {
  total: 28,
  open: 12,
  inProgress: 8,
  resolved: 8,
  newThisWeek: 5,
  resolvedThisWeek: 7
};

// Test coverage data
const testCoverage = {
  functional: 95,
  ui: 88,
  api: 92,
  security: 80,
  performance: 75
};

export default function QADashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [bugFilter, setBugFilter] = useState('all');

  // Filter tasks based on search and filters
  const filteredTasks = qaTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Filter bugs based on filter
  const filteredBugs = bugs.filter(bug => {
    return bugFilter === 'all' || bug.status === bugFilter;
  });

  // Stats
  const totalTasks = qaTasks.length;
  const pendingTasks = qaTasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = qaTasks.filter(task => task.status === 'in-progress').length;
  const completedTasks = qaTasks.filter(task => task.status === 'completed').length;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quality Assurance Dashboard</h1>
          <p className="text-gray-500">Track bugs, monitor quality, and ensure application readiness</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-800 hover:bg-blue-900">
            <BugPlay className="h-4 w-4 mr-2" />
            Report Bug
          </Button>
          <Button variant="outline" className="border-blue-800 text-blue-800 hover:bg-blue-50">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Test Plan
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bugs</p>
                <p className="text-3xl font-bold">{bugStats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <BugPlay className="h-6 w-6 text-red-800" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Open Bugs</p>
                <p className="text-3xl font-bold">{bugStats.open}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                <CircleAlert className="h-6 w-6 text-orange-800" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Resolved This Week</p>
                <p className="text-3xl font-bold">{bugStats.resolvedThisWeek}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-800" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">New This Week</p>
                <p className="text-3xl font-bold">{bugStats.newThisWeek}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileWarning className="h-6 w-6 text-blue-800" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Bug Tracker */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-lg flex items-center">
                <BugPlay className="h-5 w-5 mr-2 text-red-800" />
                Bug Tracker
              </CardTitle>
              <CardDescription>Track and manage reported issues</CardDescription>
            </div>
            <Select value={bugFilter} onValueChange={setBugFilter}>
              <SelectTrigger className="w-full md:w-40 h-8">
                <SelectValue placeholder="Filter bugs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bugs</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 font-medium text-gray-500">Bug</th>
                  <th className="py-2 font-medium text-gray-500">Severity</th>
                  <th className="py-2 font-medium text-gray-500">Status</th>
                  <th className="py-2 font-medium text-gray-500">Assigned To</th>
                  <th className="py-2 font-medium text-gray-500">Reported</th>
                  <th className="py-2 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBugs.map((bug) => (
                  <tr key={bug.id} className="border-b">
                    <td className="py-3 pr-4">{bug.title}</td>
                    <td className="py-3">
                      <Badge 
                        className={`${
                          bug.severity === 'critical' 
                            ? 'bg-red-100 text-red-800' 
                            : bug.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {bug.severity}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Badge 
                        className={`${
                          bug.status === 'open' 
                            ? 'bg-blue-100 text-blue-800' 
                            : bug.status === 'in-progress'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                        variant="outline"
                      >
                        {bug.status}
                      </Badge>
                    </td>
                    <td className="py-3">{bug.assignedTo}</td>
                    <td className="py-3 text-gray-500 text-sm">{new Date(bug.reported).toLocaleDateString()}</td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm" className="h-8 text-blue-800">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4 flex justify-between">
          <div className="text-sm text-gray-500">Showing {filteredBugs.length} of {bugs.length} bugs</div>
          <Button variant="outline" size="sm" className="h-8">
            <BugOff className="h-4 w-4 mr-2" />
            View All Bugs
          </Button>
        </CardFooter>
      </Card>
      
      {/* Test Coverage */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2 text-blue-800" />
            Test Coverage
          </CardTitle>
          <CardDescription>Application test coverage by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Functional</span>
                <span className="font-medium">{testCoverage.functional}%</span>
              </div>
              <Progress value={testCoverage.functional} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>UI/UX</span>
                <span className="font-medium">{testCoverage.ui}%</span>
              </div>
              <Progress value={testCoverage.ui} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>API</span>
                <span className="font-medium">{testCoverage.api}%</span>
              </div>
              <Progress value={testCoverage.api} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Security</span>
                <span className="font-medium">{testCoverage.security}%</span>
              </div>
              <Progress value={testCoverage.security} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Performance</span>
                <span className="font-medium">{testCoverage.performance}%</span>
              </div>
              <Progress value={testCoverage.performance} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tasks Section */}
      <div>
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <TabsList>
              <TabsTrigger value="all">All Tasks</TabsTrigger>
              <TabsTrigger value="testing">
                <ListChecks className="h-4 w-4 mr-2" />
                Testing
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming
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
          
          <TabsContent value="testing" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks
                .filter(task => task.title.toLowerCase().includes('test') || task.description.toLowerCase().includes('test'))
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
          
          <TabsContent value="upcoming" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks
                .filter(task => task.status === 'pending')
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
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