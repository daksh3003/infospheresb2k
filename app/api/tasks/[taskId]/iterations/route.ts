import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

// GET - Fetch task iteration data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const { taskId } = await params;
    const { searchParams } = new URL(request.url);
    const fields = searchParams.get("fields") || "*";

    const { data, error } = await supabase
      .from("task_iterations")
      .select(fields)
      .eq("task_id", taskId)
      .single();

    if (error) {
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

// PATCH - Update task iteration
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const { taskId } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from("task_iterations")
      .update(body)
      .eq("task_id", taskId)
      .select()
      .single();

    if (error) {
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



