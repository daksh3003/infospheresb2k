// app/tasks/[taskId]/page.tsx
"use client";
import { TaskDetailBackButton } from "@/components/task-detail-back-button";
import { createClient } from "@supabase/supabase-js";
import React, { useState, Fragment, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  DownloadCloud, 
  Paperclip, 
  Pause, 
  Play, 
  ArrowLeft, 
  Share2, 
  Upload,
  CheckCircle2,
  X,
  ArrowBigUpDashIcon
} from 'lucide-react';

// Initialize Supabase client (add near top of file)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define types for our task data
interface Attachment {
  id: number;
  name: string;
  size: string;
}

interface Comment {
  id: number;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
}

interface Person {
  name: string;
  avatar: string;
  department: string;
}

interface TaskData {
  id: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  assignedTo: Person;
  createdBy: Person;
  attachments: Attachment[];
  comments: Comment[];
  createdDate: string;
  estimatedHours: number;
  tags: string[];
}

interface UploadedFile {
  name: string;
  size: string;
  type?: string;
}

// Mock task data - in a real app, you would fetch this based on the taskId parameter
const getTaskData = (taskId: string) => {
  // This would be replaced with an API call in a real application
  return {
    id: taskId,
    title: 'Quarterly Financial Report Analysis',
    description: 'Complete the in-depth analysis of Q1 financial performance and prepare insights for stakeholder presentation.',
    priority: 'high',
    dueDate: '2025-04-25',
    assignedTo: {
      name: 'Alex Morgan',
      avatar: '/api/placeholder/32/32',
      department: 'Finance'
    },
    createdBy: {
      name: 'Jamie Rodriguez',
      avatar: '/api/placeholder/32/32',
      department: 'Operations'
    },
    attachments: [
      { id: 1, name: 'Q1_Financial_Data.xlsx', size: '2.3 MB' },
      { id: 2, name: 'Analysis_Template.docx', size: '1.1 MB' }
    ],
    comments: [
      { 
        id: 1, 
        user: 'Jamie Rodriguez', 
        avatar: '/api/placeholder/32/32',
        text: 'Please ensure you use the updated template for this analysis.',
        timestamp: '2025-04-14 10:23 AM' 
      },
      { 
        id: 2, 
        user: 'Alex Morgan', 
        avatar: '/api/placeholder/32/32',
        text: 'I\'ll review the requirements and get started today.',
        timestamp: '2025-04-14 11:05 AM' 
      }
    ],
    createdDate: '2025-04-14',
    estimatedHours: 8,
    tags: ['finance', 'quarterly', 'analysis']
  };
};

// Simple dialog component
const Dialog = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  confirmText = "Confirm", 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  description: string; 
  confirmText?: string; 
  onConfirm: () => void; 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TaskDetailPage({ params }: { params: Promise<{ taskId: string }>}) {
  const { taskId } = use(params); 

  const router = useRouter();
  const task: TaskData = getTaskData(taskId);
  
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'paused' | 'completed'>('pending');
  const [progress, setProgress] = useState<number>(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'files' | 'comments'>('files');
  const [newComment, setNewComment] = useState<string>('');
  
  // Dialog states
  const [showHandoverDialog, setShowHandoverDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type
      }));
      
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      
      // Reset file input
      e.target.value = '';
    }
  };

  //handling the remove file case.
  const handleRemoveFile = (index: number) => {
    const newFiles = [...uploadedFiles];
    newFiles.splice(index, 1);
    setUploadedFiles(newFiles);
  };

  const handleSubmitComment = () => {
    if (newComment.trim() === '') return;

    const now = new Date();
    const formattedTime = now.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    //to add new comment in the given task.
    const newCommentObj : Comment = {
      id: task.comments.length + 1,
      user: task.assignedTo.name,
      avatar: task.assignedTo.avatar,
      text: newComment,
      timestamp: formattedTime,
    };

    //to add a table called as tasks to handle the comments.
    //tasks.comments.push(newCommentObj);

    setNewComment('');
  };
  
  // Handle task actions
  const handleStartTask = () => {
    setStatus('in-progress');
    setProgress(5);
  };
  
  const handlePauseResumeTask = () => {
    if (status === 'in-progress') {
      setStatus('paused');
    } else if (status === 'paused') {
      setStatus('in-progress');
    }
  };
  
  const handleCompleteTask = async () => {
    try {
      // Update the task in Supabase
      const { error } = await supabase
        .from('projects')
        .update({ completion_status: true })
        .eq('id', taskId);
        
      if (error) {
        console.error('Error updating task:', error);
        return;
      }
      
      // Update local state
      setStatus('completed');
      setProgress(100);
      setShowCompleteDialog(false);
      
      // Navigate back to dashboard after brief delay
      setTimeout(() => {
        router.push('/dashboard/pm');
      }, 1500);
      
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  // Status UI helpers
  const getStatusBadge = () => {
    switch (status) {
      case 'in-progress':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">In Progress</span>;
      case 'paused':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">Paused</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Completed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Pending</span>;
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 text-xs font-medium rounded-full border border-red-200 text-red-700">High Priority</span>;
      case 'medium':
        return <span className="px-2 py-1 text-xs font-medium rounded-full border border-amber-200 text-amber-700">Medium Priority</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full border border-green-200 text-green-700">Low Priority</span>;
    }
  };
  
  const getPauseResumeButton = () => {
    if (status === 'in-progress') {
      return (
        <button 
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          onClick={handlePauseResumeTask}
        >
          <Pause className="h-4 w-4" /> Pause
        </button>
      );
    } else if (status === 'paused') {
      return (
        <button 
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          onClick={handlePauseResumeTask}
        >
          <Play className="h-4 w-4" /> Resume
        </button>
      );
    }
    return (
      <button 
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md opacity-50 cursor-not-allowed"
        disabled
      >
        <Pause className="h-4 w-4" /> Pause
      </button>
    );
  };



  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Back button and task ID */}
      <div className="flex items-center justify-between mb-6">
        {/* <button 
          className="flex items-center gap-2 px-3 py-1 text-gray-600 hover:text-gray-900"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button> */}
        <TaskDetailBackButton/>
        <div className="text-sm text-gray-500">Task ID: {task.id}</div>
      </div>
      
      {/* Main task card */}
      <div className="mb-6 border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
              <p className="mt-1 text-gray-500">Created on {task.createdDate}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {getPriorityBadge(task.priority)}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 pb-6">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500">Progress</span>
              <span className="text-sm font-medium text-gray-900">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {/* Task metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-gray-900">{task.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                      <img src={task.assignedTo.avatar} alt={task.assignedTo.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-gray-900">{task.assignedTo.name}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Created By</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200">
                      <img src={task.createdBy.avatar} alt={task.createdBy.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-gray-900">{task.createdBy.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{task.dueDate}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Estimated Hours</h3>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-900">{task.estimatedHours} hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer with buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-between gap-4">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {status === 'pending' && (
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleStartTask}
              >
                <Play className="h-4 w-4" /> Start Task
              </button>
            )}
            
            {getPauseResumeButton()}
            
            <button 
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => setShowHandoverDialog(true)}
            >
              <Share2 className="h-4 w-4" /> Handover
            </button>
            
            {status !== 'completed' && (
              <button 
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowCompleteDialog(true)}
              >
                <CheckCircle2 className="h-4 w-4" /> Mark Complete
              </button>
            )}
            <button 
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                
              >
                <ArrowBigUpDashIcon className="h-4 w-4" /> Send To QC
              </button>
          </div>
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'files'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('files')}
          >
            Files & Attachments
          </button>
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'comments'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('comments')}
          >
            Comments
          </button>
        </nav>
      </div>
      
      {/* Tab content */}
      {activeTab === 'files' && (
        <div className="space-y-6">
          {/* Downloadable task files */}
          <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-medium">Task Attachments</h2>
              <p className="text-sm text-gray-500">Files attached to this task by the creator</p>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {task.attachments.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.size}</p>
                      </div>
                    </div>
                    <button className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                      <DownloadCloud className="h-4 w-4" /> Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* File upload section */}
          <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-medium">Upload Files</h2>
              <p className="text-sm text-gray-500">Add your completed work or relevant documents</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                    <p className="mb-1 text-sm text-gray-500">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, DOCX, XLSX, JPG, PNG (MAX. 10MB)</p>
                  </div>
                  <input 
                    id="dropzone-file" 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload}
                    multiple
                  />
                </label>
              </div>
              
              {/* Uploaded files list */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h3 className="text-sm font-medium mb-2">Uploaded Files</h3>
                  {uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{file.size}</p>
                        </div>
                      </div>
                      <button 
                        className="text-red-500 hover:text-red-700 p-1"
                        onClick={() => handleRemoveFile(idx)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 w-full sm:w-auto">
                Submit Files
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'comments' && (
        <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
          <div className="p-6 pb-2">
            <h2 className="text-lg font-medium">Discussion</h2>
            <p className="text-sm text-gray-500">Communicate with team members about this task</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {task.comments.map(comment => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-md bg-gray-50">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                    <img src={comment.avatar} alt={comment.user} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">

                    <div className="flex justify-between">
                      <span className="font-medium">{comment.user}</span>
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    <p className="text-sm mt-1">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add comment form */}
            <div className="mt-6">
              <textarea 
                className="w-full p-3 border border-gray-200 rounded-md" 
                placeholder="Add a comment..."
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <button 
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  onClick={handleSubmitComment}
                >
                  Post Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Handover Dialog */}
      <Dialog
        isOpen={showHandoverDialog}
        onClose={() => setShowHandoverDialog(false)}
        title="Hand over this task?"
        description="This will transfer ownership of the task to another team member."
        confirmText="Continue"
        onConfirm={() => console.log("Handover task")}
      />
      
      {/* Complete Task Dialog */}
      <Dialog
        isOpen={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        title="Mark task as completed?"
        description="This will update the task status and notify all stakeholders. Make sure all deliverables have been uploaded."
        confirmText="Complete Task"
        onConfirm={handleCompleteTask}
      />
    </div>
  );
}