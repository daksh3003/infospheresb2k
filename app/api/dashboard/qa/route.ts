import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireRole } from '@/app/api/middleware/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Require QA team role (or project manager who can access all)
    const roleResult = await requireRole(request, ['qaTeam', 'projectManager']);
    if (roleResult instanceof NextResponse) {
      return roleResult;
    }
    const { data, error } = await supabase
      .from("task_iterations")
      .select(
        `
        id, 
        current_stage, 
        status, 
        task_id, 
        iteration_number, 
        tasks_test ( task_name, task_id, project_id )
      `
      )
      .eq("current_stage", "QA");

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch QA tasks' }, { status: 500 });
    }

    if (data && data.length > 0) {
      const processedTasks = data.map((item: { id: number; current_stage: string; status: string | null; task_id: string; iteration_number: number | null; tasks_test: { task_name: string; task_id: string; project_id: string }[] | null }) => ({
        id: item.id,
        title: item.tasks_test?.[0]?.task_name || "No Project Name",
        description: `Status: ${item.status || "N/A"}`,
        status: "pending",
        priority: "medium",
        dueDate: "",
        assignedTo: `Iteration: ${item.iteration_number || "N/A"}`,
        projectId: item.tasks_test?.[0]?.project_id || item.task_id || "unknown",
        projectName: item.tasks_test?.[0]?.task_name || "No Project Name",
        currentStage: item.current_stage,
        // status: item.status || null,
        iterationNumber: item.iteration_number || 1,
      }));

      return NextResponse.json({ tasks: processedTasks });
    } else {
      return NextResponse.json({ tasks: [] });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
