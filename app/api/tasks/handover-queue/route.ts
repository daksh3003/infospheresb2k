import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Optimized query: Get all incomplete tasks
        const { data: tasks, error: tasksError } = await supabase
            .from("tasks_test")
            .select(`
                *,
                task_iterations (
                    current_stage
                )
            `)
            .eq("completion_status", false)
            .order("created_at", { ascending: false });

        if (tasksError) throw tasksError;

        if (!tasks || tasks.length === 0) {
            return NextResponse.json([]);
        }

        // Get task IDs to filter actions
        const taskIds = tasks.map((t: any) => t.task_id);

        // Get ONLY actions for these tasks (much more efficient than all actions)
        const { data: latestActions, error: actionsError } = await supabase
            .from('task_actions')
            .select('task_id, action_type, created_at')
            .in('task_id', taskIds)
            .order('created_at', { ascending: false });

        if (actionsError) throw actionsError;

        // Create a map of task_id to its latest action_type
        const latestActionMap = new Map();
        latestActions?.forEach((action: any) => {
            if (!latestActionMap.has(action.task_id)) {
                latestActionMap.set(action.task_id, action.action_type);
            }
        });

        // Filter tasks whose latest action is 'handover'
        const handoverTasks = tasks.filter((task: any) => {
            return latestActionMap.get(task.task_id) === 'handover';
        }).map((task: any) => {
            // Flatten the current_stage from iterations
            const iterations = task.task_iterations as any[];
            const currentStage = iterations && iterations.length > 0 ? iterations[0].current_stage : null;

            // Delete the iterations array to keep the response clean
            const flattenedTask = { ...task, current_stage: currentStage };
            delete (flattenedTask as any).task_iterations;
            return flattenedTask;
        });

        return NextResponse.json(handoverTasks);

    } catch (error: any) {
        console.error('Error fetching handover queue:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
