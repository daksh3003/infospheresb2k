import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireRole } from '@/app/api/middleware/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions
const calculateStatus = (deliveryDate: string, completionStatus: string) => {
  if (completionStatus === "Completed") return "completed";
  const today = new Date();
  const delivery = new Date(deliveryDate);
  const diffTime = delivery.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "overdue";
  if (diffDays <= 1) return "urgent";
  if (diffDays <= 3) return "due-soon";
  return "on-track";
};

const calculatePriority = (deliveryDate: string, poHours: number) => {
  const today = new Date();
  const delivery = new Date(deliveryDate);
  const diffTime = delivery.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0 || poHours >= 40) return "high";
  if (diffDays <= 2 || poHours >= 20) return "medium";
  return "low";
};

const getTaskType = (processType: string) => {
  const typeMap: { [key: string]: string } = {
    "Data Entry": "data-entry",
    "Data Processing": "data-processing",
    "Quality Check": "quality-check",
    "Formatting": "formatting",
    "Analysis": "analysis",
  };
  return typeMap[processType] || "other";
};

export async function GET(request: NextRequest) {
  try {
    // Require project manager role
    const roleResult = await requireRole(request, ['projectManager']);
    if (roleResult instanceof NextResponse) {
      return roleResult;
    }
    // First get all projects
    const { data: projectsData, error: projectsError } = await supabase
      .from("tasks_test")
      .select("*")
      .order("created_at", { ascending: false });

    if (projectsError) {
      return NextResponse.json(
        { error: projectsError.message },
        { status: 400 }
      );
    }

    // Then get the current stage for each project
    const { data: iterationsData, error: iterationsError } = await supabase
      .from("task_iterations")
      .select("task_id, current_stage");

    if (iterationsError) {
      return NextResponse.json(
        { error: iterationsError.message },
        { status: 400 }
      );
    }

    // Create a map of project_id to current_stage
    const stageMap = iterationsData.reduce((acc: Record<string, string>, curr) => {
      acc[curr.task_id] = curr.current_stage;
      return acc;
    }, {});

    if (projectsData) {
      const processedTasks = projectsData.map((task) => {
        return {
          ...task,
          status: calculateStatus(task.delivery_date, task.completion_status),
          priority: calculatePriority(task.delivery_date, task.po_hours),
          type: getTaskType(task.process_type),
          current_stage: stageMap[task.task_id] || "Processor", // Default to Processor if no stage found
        };
      });

      // Get unique project IDs and fetch their names
      const uniqueProjectIds = [
        ...new Set(processedTasks.map((task) => task.project_id)),
      ];

      const { data: projectNamesData, error: projectNamesError } = await supabase
        .from("projects_test")
        .select("project_id, project_name, delivery_date, delivery_time")
        .in("project_id", uniqueProjectIds);

      if (projectNamesError) {
        // Error fetching project names - non-critical
      }

      const projectNameMap = projectNamesData?.reduce(
        (
          acc: {
            [key: string]: {
              name: string;
              delivery_date: string;
              delivery_time: string;
            };
          },
          project
        ) => {
          acc[project.project_id] = {
            name: project.project_name,
            delivery_date: project.delivery_date,
            delivery_time: project.delivery_time,
          };
          return acc;
        },
        {}
      ) || {};

      return NextResponse.json({
        tasks: processedTasks,
        projectNames: projectNameMap,
      });
    }

    return NextResponse.json({
      tasks: [],
      projectNames: {},
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
