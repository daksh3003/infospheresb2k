import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Update the most recent session with logout time
      const { error: sessionError } = await supabase
        .from("user_sessions")
        .update({ logout_time: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("logout_time", null)
        .order("login_time", { ascending: false })
        .limit(1);

      if (sessionError) {
        // Log error server-side but continue with logout
      }
    }

    // Sign out from Supabase auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to log out. Please try again.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Logged out successfully'
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'An error occurred during logout. Please try again.' },
      { status: 500 }
    );
  }
}
