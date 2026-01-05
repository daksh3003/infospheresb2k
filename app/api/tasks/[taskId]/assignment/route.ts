import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

// GET - Fetch task assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const { taskId } = await params;

    const { data, error } = await supabase
      .from("files_test")
      .select("assigned_to")
      .eq("task_id", taskId)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create or update task assignment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const { taskId } = await params;
    const body = await request.json();

    // First, check if there's an existing record
    const { data: existingLog, error: fetchError } = await supabase
      .from("files_test")
      .select("assigned_to")
      .eq("task_id", taskId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    if (existingLog) {
      // Update existing record
      const { data, error } = await supabase
        .from("files_test")
        .update({ assigned_to: body.assigned_to })
        .eq("task_id", taskId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ data });
    } else {
      // Create new record
      const { data, error } = await supabase
        .from("files_test")
        .insert({
          task_id: taskId,
          assigned_to: body.assigned_to,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ data });
    }
  } catch (_error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



