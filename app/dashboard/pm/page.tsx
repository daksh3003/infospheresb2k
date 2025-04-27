// app/dashboard/pm/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TaskModal from '@/components/taskModal';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define interface for Task data from Supabase
interface Task {
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
  // Additional fields for status and priority calculation
  status?: "pending" | "in-progress" | "completed" | "overdue";
  priority?: "low" | "medium" | "high" | "critical";
}

export default function PMDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tasks from Supabase
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
  
      // Only show completed tasks when that filter is explicitly selected
      if (statusFilter === 'completed') {
        query = query.eq('completion_status', true);
      } else {
        // For all other status filters, only show incomplete tasks
        query = query.eq('completion_status', false);
      }
  
      const { data, error } = await query;
  
      if (error) {
        console.error('Error fetching tasks:', error);
        return;
      }
  
      if (data) {
        const processedTasks = data.map(task => ({
          ...task,
          // Force status to "completed" if completion_status is true
          status: task.completion_status ? 'completed' : calculateStatus(task.delivery_date),
          priority: calculatePriority(task.delivery_date, task.po_hours)
        }));
        
        setTasks(processedTasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to calculate status based on delivery date
  const calculateStatus = (deliveryDate: string) => {
    if (!deliveryDate) return "pending";
    
    const today = new Date();
    const dueDate = new Date(deliveryDate);
    
    // Check if the delivery date has passed
    if (dueDate < today) {
      return "overdue";
    }
    
    // Calculate days until delivery
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 2) {
      return "in-progress";
    } else if (diffDays > 2) {
      return "pending";
    }
    
    return "pending";
  };

  // Helper function to calculate priority based on delivery date and po_hours
  const calculatePriority = (deliveryDate: string, poHours: number) => {
    if (!deliveryDate) return "medium";
    
    const today = new Date();
    const dueDate = new Date(deliveryDate);
    
    // Check if the delivery date has passed
    if (dueDate < today) {
      return "critical";
    }
    
    // Calculate days until delivery
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      return "critical";
    } else if (diffDays <= 3) {
      return "high";
    } else if (diffDays <= 7) {
      return "medium";
    } else {
      return "low";
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      task.task_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.client_instruction?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  // Function to handle task added event
  const handleTaskAdded = () => {
    fetchTasks(); // Refresh the task list
  };
  
  return (
    <div className="space-y-6">
      <div className='flex items-center justify-between w-full mb-6'>
        <div>
          <h1 className="text-2xl font-bold">Project Manager Dashboard</h1>
          <p className="text-gray-500">Manage projects, teams, and tasks efficiently</p>
        </div>
        <div>
          <Button 
            variant={'default'} 
            className='bg-blue-600 hover:bg-blue-300 cursor-pointer' 
            onClick={openModal}
          >
            Add Task
          </Button>
        </div>
        <TaskModal 
          isOpen={isModalOpen} 
          onClose={closeModal} 
          onTaskAdded={handleTaskAdded} 
        />
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
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg text-gray-700">Loading tasks...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.project_name || 'Untitled Project'}
                description={task.client_instruction || 'No description available'}
                dueDate={task.delivery_date || new Date().toISOString().split('T')[0]}
                status={task.status as any}
                priority={task.priority as any}
                assignedTo={`Task ID: ${task.task_id}`}
              />
            ))
          ) : (
            <div className="col-span-3 py-8 text-center text-gray-500">
              <p>No tasks found matching your filters.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Refresh button */}
      <div className="flex justify-center mt-6">
        <Button
          variant="outline"
          onClick={fetchTasks}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Refresh Tasks'
          )}
        </Button>
      </div>
    </div>
  );
}



