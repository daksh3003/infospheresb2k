import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Verify user is authenticated
 * Returns user object or NextResponse error
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  try {
    const supabase = await createClient();

    // Get authenticated user from session
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Enforce email verification
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email verification required. Please verify your email address.' },
        { status: 403 }
      );
    }

    // Fetch user profile and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    return {
      id: user.id,
      email: user.email!,
      role: profile.role
    };

  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

/**
 * Verify user has required role
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<AuthenticatedUser | NextResponse> {
  const authResult = await requireAuth(request);

  // If auth failed, return error response
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Check if user's role is allowed
  if (!allowedRoles.includes(authResult.role)) {
    return NextResponse.json(
      {
        error: 'Forbidden - Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: authResult.role
      },
      { status: 403 }
    );
  }

  return authResult;
}
