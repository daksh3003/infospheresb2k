import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";

// GET - Fetch user profile by ID
export async function GET(
  request: NextRequest,
  { params: _params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("id", userId)
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



