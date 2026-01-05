import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

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
            .select('id, name, email, role, created_at')
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

