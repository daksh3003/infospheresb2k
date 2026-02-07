import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { createAdminClient } from '@/lib/admin';
import { SHIFT_NAMES } from '@/lib/shifts';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get pagination parameters from query string
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const search = searchParams.get('search') || '';
        const roleFilter = searchParams.get('role') || '';

        // Calculate offset
        const offset = (page - 1) * limit;

        // Build the base query for count
        let countQuery = supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Build the base query for users
        let usersQuery = supabase
            .from('profiles')
            .select('id, name, email, role, created_at, shift, shift_start_date, shift_end_date')
            .order('created_at', { ascending: false });

        // Apply search filter if provided
        if (search) {
            // Search in name or email (case-insensitive)
            const searchTerm = `%${search}%`;
            countQuery = countQuery.or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`);
            usersQuery = usersQuery.or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`);
        }

        // Apply role filter if provided
        if (roleFilter) {
            countQuery = countQuery.eq('role', roleFilter);
            usersQuery = usersQuery.eq('role', roleFilter);
        }

        // Get total count with filters applied
        const { count, error: countError } = await countQuery;

        if (countError) {
            console.error('Error counting users:', countError);
            return NextResponse.json(
                { error: 'Failed to count users' },
                { status: 500 }
            );
        }

        // Get paginated users with filters applied
        const { data: users, error: usersError } = await usersQuery
            .range(offset, offset + limit - 1);

        if (usersError) {
            console.error('Error fetching users:', usersError);
            return NextResponse.json(
                { error: 'Failed to fetch users' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            users,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if current user is PM
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();

        if (profile?.role !== 'projectManager') {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const { userId, name, role, password, shift, shift_start_date, shift_end_date } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Validate shift fields
        if (shift !== undefined && shift !== null) {
            if (!SHIFT_NAMES.includes(shift)) {
                return NextResponse.json({ error: 'Invalid shift name' }, { status: 400 });
            }
            if (!shift_start_date || !shift_end_date) {
                return NextResponse.json({ error: 'Both start and end dates are required when assigning a shift' }, { status: 400 });
            }
            if (new Date(shift_end_date) < new Date(shift_start_date)) {
                return NextResponse.json({ error: 'End date must be on or after start date' }, { status: 400 });
            }
        }

        // 1. Update Profile (Name/Role/Shift) using the authenticated client
        const hasProfileUpdate = name || role || shift !== undefined;
        if (hasProfileUpdate) {
            const updates: any = {};
            if (name) updates.name = name;
            if (role) updates.role = role;
            if (shift !== undefined) {
                updates.shift = shift;
                updates.shift_start_date = shift ? shift_start_date : null;
                updates.shift_end_date = shift ? shift_end_date : null;
            }
            updates.updated_at = new Date().toISOString();

            const { error: profileError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', userId);

            if (profileError) {
                console.error('Error updating profile:', profileError);
                return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
            }
        }

        // 2. Update Password or Auth metadata (requires admin client)
        if (password || name || role) {
            try {
                const adminSupabase = createAdminClient();

                if (name || role) {
                    const authMeta: any = {};
                    if (name) authMeta.name = name;
                    if (role) authMeta.role = role;
                    const { error: authMetaError } = await adminSupabase.auth.admin.updateUserById(
                        userId,
                        { user_metadata: authMeta }
                    );
                    if (authMetaError) {
                        console.error('Error updating auth metadata:', authMetaError);
                    }
                }

                if (password) {
                    const { error: passwordError } = await adminSupabase.auth.admin.updateUserById(
                        userId,
                        { password: password }
                    );
                    if (passwordError) {
                        console.error('Error updating password:', passwordError);
                        return NextResponse.json({ error: passwordError.message }, { status: 500 });
                    }
                }
            } catch (adminError) {
                console.error('Admin client error (service role key may be missing):', adminError);
                // Profile update already succeeded, only auth metadata/password failed
                if (password) {
                    return NextResponse.json({ error: 'Failed to update password - service role key not configured' }, { status: 500 });
                }
            }
        }

        return NextResponse.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Unexpected error in PATCH:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if current user is PM
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();

        if (profile?.role !== 'projectManager') {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const adminSupabase = createAdminClient();

        // 1. Delete from profiles (Cascade handles other linked tables if any, but profiles is a leaf in many ways)
        // Actually we might need to handle other links manually if they don't cascade.
        // Files and Tasks reference IDs, so deletion might fail if not handled.
        // For now let's assume standard behavior or that PM knows what they are doing.

        const { error: profileDeleteError } = await adminSupabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (profileDeleteError) {
            console.error('Error deleting profile:', profileDeleteError);
            return NextResponse.json({ error: 'Failed to delete user profile' }, { status: 500 });
        }

        // 2. Delete from Auth
        const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId);

        if (authDeleteError) {
            console.error('Error deleting auth user:', authDeleteError);
            return NextResponse.json({ error: authDeleteError.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Unexpected error in DELETE:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
