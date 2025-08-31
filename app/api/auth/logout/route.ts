import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Update the most recent session with logout time
      const { error: sessionError } = await supabase
        .from("user_sessions")
        .update({
          logout_time: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .is("logout_time", null);

      if (sessionError) {
        console.error("Error updating logout time:", sessionError);
      }
    }

    // Sign out from Supabase auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'Logged out successfully'
    });

  } catch (error: unknown) {
    console.error('Logout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
