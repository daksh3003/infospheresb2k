import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function GET() {
    const supabase = await createClient();
    const { data: iterations, error: iterationsError } = await supabase
        .from("task_iterations")
        .select(
            `
          id, 
          current_stage, 
          status, 
          task_id, 
          iteration_number, 
          tasks_test ( task_name, task_id, project_id, file_type, file_format, custom_file_format )
        `
        )
        .eq("current_stage", "QA");

    if (iterationsError) {
        return NextResponse.json(
            { error: iterationsError.message },
            { status: 400 }
        );
    }

    const taskIds = iterations.map(i => i.task_id);
    const { data: actions, error: actionsError } = await supabase
        .from("task_actions")
        .select("task_id, action_type")
        .in("task_id", taskIds)
        .order("created_at", { ascending: false });

    if (actionsError) throw actionsError;

    const latestActionMap = new Map();
    actions?.forEach(a => {
        if (!latestActionMap.has(a.task_id)) {
            latestActionMap.set(a.task_id, a.action_type);
        }
    });

    const dataWithActions = iterations.map(item => ({
        ...item,
        latest_action: latestActionMap.get(item.task_id) || null
    }));

    return NextResponse.json(dataWithActions);
}   