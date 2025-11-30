import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/api/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Require authentication - users can only query their own role
    const authResult = await requireAuth(request);
    
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    // Users can only see their own role
    // Admins would need a separate endpoint with requireRole(['admin'])
    return NextResponse.json({ role: authResult.role });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
