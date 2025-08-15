import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Timeout to handle login requests up to 2s
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Login request timed out. Please try again.")),
        2000
      );
    });

    const { data, error } = (await Promise.race([
      supabase.auth.signInWithPassword({
        email,
        password,
      }),
      timeoutPromise,
    ])) as any;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data || !data.user) {
      return NextResponse.json(
        { error: 'Authentication failed. Please try again.' },
        { status: 400 }
      );
    }

    // Create a new session entry when user logs in
    const { error: sessionError } = await supabase
      .from("user_sessions")
      .insert({
        user_id: data.user.id,
        login_time: new Date().toISOString(),
        session_date: new Date().toISOString().split("T")[0],
      });

    if (sessionError) {
      console.error("Error creating session record:", sessionError);
      // Continue login process even if session recording fails
    }

    // Try to get role from user metadata first (faster)
    let userRole = data.user.user_metadata?.role;

    // Only fetch profile if role isn't in metadata
    if (!userRole) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        return NextResponse.json(
          { error: profileError.message },
          { status: 400 }
        );
      }
      
      userRole = profileData?.role;

      // Update user metadata with the role for faster access next time
      await supabase.auth.updateUser({
        data: { role: userRole },
      });
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
      role: userRole,
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
