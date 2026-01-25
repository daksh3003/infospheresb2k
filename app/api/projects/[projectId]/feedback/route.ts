import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/server';
import { requireAuth } from '@/app/api/middleware/auth';

/**
 * GET - Retrieve project feedback
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { projectId } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('projects_test')
            .select('feedback')
            .eq('project_id', projectId)
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch feedback' },
                { status: 500 }
            );
        }

        return NextResponse.json({ feedback: data?.feedback || '' });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST - Save or update project feedback
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { projectId } = await params;
        const { feedback } = await request.json();

        if (typeof feedback !== 'string') {
            return NextResponse.json(
                { error: 'Feedback must be a string' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify project exists and get completion status
        const { data: project, error: projectError } = await supabase
            .from('projects_test')
            .select('project_id, completion_status')
            .eq('project_id', projectId)
            .single();

        if (projectError || !project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Update feedback
        const { error: updateError } = await supabase
            .from('projects_test')
            .update({ feedback: feedback.trim() })
            .eq('project_id', projectId);

        if (updateError) {
            console.error('Error updating feedback:', updateError);
            return NextResponse.json(
                { error: 'Failed to save feedback' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Feedback saved successfully'
        });
    } catch (error) {
        console.error('Error saving feedback:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
