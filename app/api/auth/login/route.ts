import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionOnly } = await request.json();

    // Handle session tracking only (called from client after successful auth)
    if (sessionOnly && userId) {
      const { error: sessionError } = await supabase
        .from("user_sessions")
        .insert({
          user_id: userId,
          login_time: new Date().toISOString(),
          session_date: new Date().toISOString().split("T")[0],
        });

      if (sessionError) {
        console.error("Error creating session record:", sessionError);
        return NextResponse.json(
          { error: 'Failed to track session' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid request. Only session tracking is supported.' },
      { status: 400 }
    );

  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
