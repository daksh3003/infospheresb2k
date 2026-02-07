import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function GET() {
  //   const { projectIds } = await request.json();
  const supabase = await createClient();
  const { data: tasks, error: tasksError } = await supabase
    .from("tasks_test")
    .select("*")
    .order("created_at", { ascending: false });

  if (tasksError) throw tasksError;

  // Fetch all actions to find latest per task
  const { data: actions, error: actionsError } = await supabase
    .from("task_actions")
    .select("task_id, action_type")
    .order("created_at", { ascending: false });

  if (actionsError) throw actionsError;

  const latestActionMap = new Map();
  actions?.forEach(a => {
    if (!latestActionMap.has(a.task_id)) {
      latestActionMap.set(a.task_id, a.action_type);
    }
  });

  const tasksWithActions = tasks.map(task => ({
    ...task,
    latest_action: latestActionMap.get(task.task_id) || null
  }));

  return NextResponse.json(tasksWithActions);
}