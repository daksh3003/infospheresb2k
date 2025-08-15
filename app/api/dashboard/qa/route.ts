import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("task_iterations")
      .select(
        `
        id, 
        current_stage, 
        status_flag, 
        task_id, 
        iteration_number, 
        tasks_test ( task_name, task_id, project_id )
      `
      )
      .eq("current_stage", "QA");

    if (error) {
      console.error("Error fetching QA tasks:", error);
      return NextResponse.json({ error: 'Failed to fetch QA tasks' }, { status: 500 });
    }

    if (data && data.length > 0) {
      const processedTasks = data.map((item: any) => ({
        id: item.id,
        title: item.tasks_test?.task_name || "No Project Name",
        description: `Status Flag: ${item.status_flag || "N/A"}`,
        status: "pending",
        priority: "medium",
        dueDate: "",
        assignedTo: `Iteration: ${item.iteration_number || "N/A"}`,
        projectId: item.tasks_test?.project_id || item.task_id || "unknown",
        projectName: item.tasks_test?.task_name || "No Project Name",
        currentStage: item.current_stage,
        statusFlag: item.status_flag || null,
        iterationNumber: item.iteration_number || 1,
      }));

      return NextResponse.json({ tasks: processedTasks });
    } else {
      return NextResponse.json({ tasks: [] });
    }
  } catch (error) {
    console.error('Error in getQADashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
