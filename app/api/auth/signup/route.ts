import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
          role,
        },
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      );
    }

    // Create profile entry with selected role
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: data.user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      created_at: new Date().toISOString(),
    });

    if (profileError) {
      return NextResponse.json(
        {
          error: 'Failed to create user profile'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: data.user,
      session: data.session,
    });

  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
