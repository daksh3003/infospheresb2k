import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

// GET - Fetch available users by role
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    if (!role) {
      return NextResponse.json(
        { error: "Role is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", role);

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



