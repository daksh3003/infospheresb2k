import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { requireAuth } from '@/app/api/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');

    if (!stage || stage.trim() === '') {
      return NextResponse.json({ error: 'Stage parameter is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get all users first
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
