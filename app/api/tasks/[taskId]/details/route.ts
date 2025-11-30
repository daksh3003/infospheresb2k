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

    const supabase = await createClient();
    const { taskId, action } = await request.json();

    if (!taskId || !action) {
      return NextResponse.json(
        { error: 'Task ID and action are required' },
        { status: 400 }
      );
    }

    if (action === "sent_by") {
      const { data, error } = await supabase
    .from("task_iterations")
    .select("sent_by")
    .eq("task_id", taskId)
    .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch sent_by' }, { status: 400 });
      }

      return NextResponse.json({ data });
    } else if (action === "stages") {
      const { data, error } = await supabase
        .from("task_iterations")
        .select("stages")
        .eq("task_id", taskId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch stages' }, { status: 400 });
      }

      return NextResponse.json({ data });
    } else if (action === "current_stage_and_sent_by") {
      const { data, error } = await supabase
        .from("task_iterations")
        .select("current_stage, sent_by")
        .eq("task_id", taskId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch current stage and sent_by' }, { status: 400 });
      }

      return NextResponse.json({ data });
    } else if (action === "assigned_to_processor_user_id") {
      const { data, error } = await supabase
        .from("task_iterations")
        .select("sent_by, current_stage, assigned_to_processor_user_id")
        .eq("task_id", taskId)
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch assigned_to_processor_user_id' }, { status: 400 });
      }

      return NextResponse.json({ data });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = await createClient();
    const { taskId, next_current_stage, next_sent_by, updatedStages } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("task_iterations")
      .update({
        current_stage: next_current_stage,
        sent_by: next_sent_by,
        stages: updatedStages,
      })
      .eq("task_id", taskId);

    if (error) {
      return NextResponse.json({ error: 'Failed to update task iteration' }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}