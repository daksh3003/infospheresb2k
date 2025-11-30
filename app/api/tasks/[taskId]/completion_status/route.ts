import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { requireAuth } from '@/app/api/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { taskId, projectId } = await request.json();

    if (!taskId || !projectId) {
      return NextResponse.json(
        { error: 'Task ID and Project ID are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
          .from("tasks_test")
          .update({
            completion_status: true,
          })
          .eq("task_id", taskId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update task completion status' },
        { status: 500 }
      );
    }

    // check all the tasks mapped to the same project are completed or not
    const { data: projectTasks, error: projectTasksError } = await supabase
          .from("tasks_test")
          .select("completion_status")
          .eq("project_id", projectId);

    if (projectTasksError) {
      return NextResponse.json(
        { error: 'Failed to fetch project tasks' },
        { status: 500 }
      );
    }

    const isAllTasksCompleted = projectTasks.every(
      (task) => task.completion_status
    );

    if (isAllTasksCompleted) {
      const { error: projectError } = await supabase
        .from("projects_test")
        .update({ completion_status: true })
        .eq("project_id", projectId);

      if (projectError) {
        return NextResponse.json(
          { error: 'Failed to update project completion status' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}   