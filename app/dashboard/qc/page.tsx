// app/dashboard/qc/page.tsx
'use client';

import { useState } from 'react';
import { TaskCard } from '@/components/task-card';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
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
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  FileCheck2, 
  BarChart3, 
  Activity, 
  ClipboardCheck,
  BadgeCheck
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";

// Mock QC-specific tasks
const qcTasks = [
  {
    id: "task-2",
    title: "Test payment integration",
    description: "Verify that the payment gateway integration is working correctly with proper error handling and success flows.",
    dueDate: "2025-04-08",
    status: "in-progress",
    priority: "critical",
    assignedTo: "Alice Smith"
  },
  {
    id: "task-6",
    title: "Documentation review",
    description: "Review and update the API documentation to ensure it matches the current implementation.",
    dueDate: "2025-04-09",
    status: "completed",
    priority: "low",
    assignedTo: "Alice Smith"
  },
  {
    id: "task-12",
    title: "Database schema validation",
    description: "Validate the new database schema changes against the requirements document.",
    dueDate: "2025-04-10",
    status: "pending",
    priority: "medium",
    assignedTo: "Tom Richards"
  },
  {
    id: "task-13",
    title: "UI component library testing",
    description: "Test all components in the new UI component library for consistency and accessibility compliance.",
    dueDate: "2025-04-15",
    status: "pending",
    priority: "high",
    assignedTo: "Alice Smith"
  },
  {
    id: "task-14",
    title: "API integration tests",
    description: "Write and execute integration tests for the newly developed APIs to ensure they meet specifications.",
    dueDate: "2025-04-07",
    status: "overdue",
    priority: "high",
    assignedTo: "Michael Brown"
  },
  {
    id: "task-15",
    title: "Code review for frontend modules",
    description: "Perform a detailed code review of the frontend modules developed in the last sprint.",
    dueDate: "2025-04-11",
    status: "in-progress",
    priority: "medium",
    assignedTo: "Tom Richards"
  }
];

// Mock test case data
const testCases = {
  total: 128,
  passed: 96,
  failed: 18,
  pending: 14,
  passRate: 75
};

// Mock QC metrics
const qcMetrics = [
  { name: "Code Coverage", value: 87, target: 90 },
  { name: "Documentation Coverage", value: 92, target: 90 },
  { name: "Test Case Success Rate", value: 75, target: 85 },
  { name: "Issues Resolution Rate", value: 82, target: 80 }
];

// Mock critical issues
const criticalIssues = [
  { id: 1, title: "Payment gateway timeout", module: "Checkout", priority: "critical", status: "open" },
  { id: 2, title: "User authentication failing", module: "Auth", priority: "critical", status: "investigating" },
  { id: 3, title: "Data inconsistency in reports", module: "Reporting", priority: "high", status: "open" }
];

export default function QCDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Filter tasks based on search and filters
  const filteredTasks = qcTasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Stats
  const totalTasks = qcTasks.length;
  const pendingTasks = qcTasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = qcTasks.filter(task => task.status === 'in-progress').length;
  const completedTasks = qcTasks.filter(task => task.status === 'completed').length;
  const overdueTasks = qcTasks.filter(task => task.status === 'overdue').length;
  const completionRate = Math.round((completedTasks / totalTasks) * 100);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quality Control Dashboard</h1>
          <p className="text-gray-500">Monitor, test, and ensure code quality</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-800 hover:bg-blue-900">
            <FileCheck2 className="h-4 w-4 mr-2" />
            New Test Case
          </Button>
          <Button variant="outline" className="border-blue-800 text-blue-800 hover:bg-blue-50">
            <BadgeCheck className="h-4 w-4 mr-2" />
            Submit Test Report
          </Button>
        </div>
      </div>
      
      {/* QC Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Pass Rate</p>
                <p className="text-3xl font-bold">{testCases.passRate}%</p>
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
                <p className="text-sm font-medium text-gray-500">Total Tests</p>
                <p className="text-3xl font-bold">{testCases.total}</p>
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
                <p className="text-sm font-medium text-gray-500">Passed</p>
                <p className="text-3xl font-bold">{testCases.passed}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <FileCheck className="h-6 w-6 text-green-800" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-3xl font-bold">{testCases.failed}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-800" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* QC Metrics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-800" />
            Quality Metrics
          </CardTitle>
          <CardDescription>Key performance indicators for quality control</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-5">
            {qcMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <span className="text-sm font-medium">
                    {metric.value}% <span className="text-gray-500">/ {metric.target}%</span>
                  </span>
                </div>
                <div className="relative">
                  <Progress value={metric.value} className="h-2" />
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-300"
                    style={{ left: `${metric.target}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>Target: {metric.target}%</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Critical Issues */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-800" />
            Critical Issues
          </CardTitle>
          <CardDescription>High-priority issues requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {criticalIssues.map(issue => (
              <Card key={issue.id} className="border-red-100">
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-medium">{issue.title}</h3>
                      <p className="text-sm text-gray-500">Module: {issue.module}</p>
                    </div>
                    <Badge 
                      className={`${
                        issue.priority === 'critical' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {issue.priority}
                    </Badge>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <Badge 
                      className={`${
                        issue.status === 'open' 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}
                      variant="outline"
                    >
                      {issue.status}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-blue-800 h-8">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Test Case Performance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-800" />
            Test Case Performance
          </CardTitle>
          <CardDescription>Test case pass/fail statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center mb-4">
            <div className="relative w-40 h-40">
              {/* Simplified donut chart */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#e5e7eb"
                  strokeWidth="15"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10b981"
                  strokeWidth="15"
                  strokeDasharray={`${testCases.passRate * 2.51} ${251 - testCases.passRate * 2.51}`}
                  strokeDashoffset="62.75"
                  transform="rotate(-90 50 50)"
                />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-xl font-bold" fill="#111827">
                  {testCases.passRate}%
                </text>
              </svg>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500">Passed</div>
              <div className="text-xl font-bold text-green-600">{testCases.passed}</div>
              <div className="text-xs text-gray-500">{Math.round(testCases.passed/testCases.total*100)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Failed</div>
              <div className="text-xl font-bold text-red-600">{testCases.failed}</div>
              <div className="text-xs text-gray-500">{Math.round(testCases.failed/testCases.total*100)}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Pending</div>
              <div className="text-xl font-bold text-yellow-600">{testCases.pending}</div>
              <div className="text-xs text-gray-500">{Math.round(testCases.pending/testCases.total*100)}%</div>
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
              <TabsTrigger value="tests">Test Cases</TabsTrigger>
              <TabsTrigger value="reviews">Code Reviews</TabsTrigger>
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
          
          <TabsContent value="tests" className="mt-0">
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
          
          <TabsContent value="reviews" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks
                .filter(task => task.title.toLowerCase().includes('review') || task.description.toLowerCase().includes('review'))
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