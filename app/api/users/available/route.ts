import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');

    if (!stage) {
      return NextResponse.json({ error: 'Stage parameter is required' }, { status: 400 });
    }

    // Get all users first
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Filter users based on current stage
    const filteredUsers = users?.filter((user) => {
      switch (stage) {
        case 'Processor':
          return user.role === 'processor';
        case 'QC':
          return user.role === 'qcTeam';
        case 'QA':
          return user.role === 'qaTeam';
        default:
          return true;
      }
    });

    return NextResponse.json({ users: filteredUsers || [] });
  } catch (error) {
    console.error('Error in getAvailableUsers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
