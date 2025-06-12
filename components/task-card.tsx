// // components/task-card.tsx
// "use client";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { 
//   Card, 
//   CardContent, 
//   CardDescription, 
//   CardFooter, 
//   CardHeader, 
//   CardTitle 
// } from "@/components/ui/card";
// import { 
//   Clock, 
//   Calendar, 
//   ArrowRight, 
//   AlertCircle, 
//   CheckCircle2, 
//   CircleDashed,
//   AlertTriangle,
//   Send 
// } from "lucide-react";
// import { useRouter } from "next/navigation"; 

// type TaskStatus = "pending" | "in-progress" | "completed" | "overdue" | "returned";
// type TaskPriority = "low" | "medium" | "high" | "critical";

// interface TaskCardProps {
//   id: string; 
//   title: string;
//   description: string;
//   dueDate: string;
//   status: TaskStatus; 
//   priority: TaskPriority;
//   assignedTo?: string;
//   assignedAvatar?: string;
//   onClick?: () => void; 
//   onSendToQC?: (taskIterationId: string) => void; 
//   isActionableByPM?: boolean; 
// }

// export function TaskCard({
//   id,
//   title,
//   description,
//   dueDate,
//   status,
//   priority,
//   assignedTo,
//   assignedAvatar,
//   onClick,
//   onSendToQC,         
//   isActionableByPM    
// }: TaskCardProps) {
//   const router = useRouter(); 

//   const statusIcon = {
//     "pending": <CircleDashed className="h-4 w-4" />,
//     "in-progress": <Clock className="h-4 w-4" />,
//     "completed": <CheckCircle2 className="h-4 w-4" />,
//     "overdue": <AlertCircle className="h-4 w-4 text-red-600" />,
//     "returned": <AlertTriangle className="h-4 w-4 text-yellow-600" /> 
//   };

//   const statusColor = {
//     "pending": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
//     "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100",
//     "completed": "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100",
//     "overdue": "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100",
//     "returned": "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-50"
//   };

//   const priorityColor = {
//     "low": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
//     "medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-50",
//     "high": "bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-orange-50",
//     "critical": "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
//   };

//   const handleViewDetails = () => {
//     if (onClick) {
//       onClick();
//     } else {
//       router.push(`/tasks/${id}`); 
//     }
//   };

//   const handleSendToQCClick = () => {
//     if (onSendToQC) {
//       onSendToQC(id); 
//     }
//   };

//   return (
//     <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
//       <CardHeader className="pb-3">
//         <div className="flex justify-between items-center">
//           <Badge className={priorityColor[priority]}>
//             {priority.charAt(0).toUpperCase() + priority.slice(1)}
//           </Badge>
//           <Badge className={`${statusColor[status] || statusColor["pending"]}`} variant="outline">
//             <span className="flex items-center">
//               {statusIcon[status] || statusIcon["pending"]}
//               <span className="ml-1.5 capitalize">{status}</span>
//             </span>
//           </Badge>
//         </div>
//         <CardTitle className="mt-2 text-lg dark:text-gray-100">{title}</CardTitle>
//         <CardDescription className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{description}</CardDescription>
//       </CardHeader>
//       <CardContent className="text-sm pb-2 flex-grow">
//         <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
//           <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
//           <span>Due: {new Date(dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
//         </div>
//         {assignedTo && (
//           <div className="flex items-center justify-between mt-3">
//             <span className="text-gray-500 dark:text-gray-400 text-xs">Info:</span> 
//             <div className="flex items-center">
//               {assignedAvatar && (
//                 <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center text-xs mr-2 overflow-hidden">
//                     <img src={assignedAvatar} alt={assignedTo.substring(0, 15)} className="w-full h-full object-cover" />
//                 </div>
//               )}
//               {!assignedAvatar && assignedTo.length <=2 && (
//                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2 overflow-hidden">
//                     {assignedTo.charAt(0).toUpperCase()}
//                  </div>
//               )}
//               <span className="text-sm font-medium dark:text-gray-300 truncate" title={assignedTo}>{assignedTo}</span>
//             </div>
//           </div>
//         )}
//       </CardContent>
//       {/* MODIFIED CardFooter to be a flex column with a gap */}
//       <CardFooter className="pt-2 border-t dark:border-gray-700 flex flex-col space-y-2"> {}
//         <Button 
//           variant="ghost" 
//           className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-gray-700"
//           onClick={handleViewDetails}
//         >
//           <span>View Details</span>
//           <ArrowRight className="h-4 w-4" />
//         </Button>

//         {isActionableByPM && onSendToQC && ( 
//           <Button
//             variant="default" 
//             size="sm"
//             className="w-full bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700" 
//             onClick={handleSendToQCClick}
//           >
//             <Send className="h-4 w-4 mr-2" />
//             Send to QC
//           </Button>
//         )}
//       </CardFooter>
//     </Card>
//   );
// }
// components/task-card.tsx
"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Ensure this is your UI library's Button
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Clock, 
  Calendar, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  CircleDashed,
  AlertTriangle,
  Send,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation"; 

type TaskStatus = "pending" | "in-progress" | "completed" | "overdue" | "returned";
type TaskPriority = "low" | "medium" | "high" | "critical";

interface TaskCardProps {
  id: string; 
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus; 
  priority: TaskPriority;
  assignedTo?: string;
  assignedAvatar?: string;
  onClick?: () => void; 
  onSendToQC?: (taskIterationId: string) => void; 
  isActionableByPM?: boolean; 
  isLoadingAction?: boolean; // Optional: For individual card action loading state
}

export function TaskCard({
  id,
  title,
  description,
  dueDate,
  status,
  priority,
  assignedTo,
  assignedAvatar,
  onClick,
  onSendToQC,         
  isActionableByPM,
  isLoadingAction // Optional
}: TaskCardProps) {
  const router = useRouter(); 

  const statusIcon = {
    "pending": <CircleDashed className="h-4 w-4" />,
    "in-progress": <Clock className="h-4 w-4" />,
    "completed": <CheckCircle2 className="h-4 w-4" />,
    "overdue": <AlertCircle className="h-4 w-4 text-red-600" />,
    "returned": <AlertTriangle className="h-4 w-4 text-yellow-600" /> 
  };

  const statusColor = {
    "pending": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100",
    "completed": "bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100",
    "overdue": "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100",
    "returned": "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-50"
  };

  const priorityColor = {
    "low": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    "medium": "bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-50",
    "high": "bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-orange-50",
    "critical": "bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100"
  };

  const handleViewDetails = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/tasks/${id}`); 
    }
  };

  const handleSendToQCClick = () => {
    if (onSendToQC && !isLoadingAction) { // Check isLoadingAction here
      onSendToQC(id); 
    }
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Badge className={priorityColor[priority] || priorityColor["medium"]}> {/* Fallback for priority */}
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Badge>
          <Badge className={`${statusColor[status] || statusColor["pending"]}`} variant="outline">
            <span className="flex items-center">
              {statusIcon[status] || statusIcon["pending"]}
              <span className="ml-1.5 capitalize">{status}</span>
            </span>
          </Badge>
        </div>
        <CardTitle className="mt-2 text-lg dark:text-gray-100">{title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm pb-2 flex-grow">
        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
          <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Due: {new Date(dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        </div>
        {assignedTo && (
          <div className="flex items-center justify-between mt-3">
            <span className="text-gray-500 dark:text-gray-400 text-xs">Info:</span> 
            <div className="flex items-center">
              {assignedAvatar && (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center text-xs mr-2 overflow-hidden">
                    <img src={assignedAvatar} alt={assignedTo.substring(0, 15)} className="w-full h-full object-cover" />
                </div>
              )}
              {!assignedAvatar && assignedTo.length <=2 && ( // Show initials only if short and no avatar
                 <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2 overflow-hidden">
                    {assignedTo.charAt(0).toUpperCase()}
                 </div>
              )}
              <span className="text-sm font-medium dark:text-gray-300 truncate" title={assignedTo}>{assignedTo}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 border-t dark:border-gray-700 flex flex-col space-y-2">
        <Button 
          variant="ghost" 
          className="w-full justify-between text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-gray-700"
          onClick={handleViewDetails}
        >
          <span>View Details</span>
          <ArrowRight className="h-4 w-4" />
        </Button>

        {isActionableByPM && onSendToQC && ( 
          <Button
            variant="default" 
            size="sm"
            className="w-full bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700 disabled:opacity-50" 
            onClick={handleSendToQCClick}
            disabled={isLoadingAction} // Disable button if action is loading
          >
            {isLoadingAction ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {isLoadingAction ? "Sending..." : "Send to QC"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}