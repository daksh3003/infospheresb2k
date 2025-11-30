import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the user is authenticated by checking session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create session record
    const { error: sessionError } = await supabase
      .from("user_sessions")
      .insert({
        user_id: userId,
        login_time: new Date().toISOString(),
        session_date: new Date().toISOString().split("T")[0],
      });

    if (sessionError) {
      return NextResponse.json(
        { error: 'Failed to track session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
