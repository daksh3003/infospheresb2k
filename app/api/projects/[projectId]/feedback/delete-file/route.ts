import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/server';
import { requireAuth } from '@/app/api/middleware/auth';

/**
 * DELETE - Delete feedback file
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    try {
        const { projectId } = await params;
        const supabase = await createClient();

        // Get current file path
        const { data: project, error: fetchError } = await supabase
            .from('projects_test')
            .select('feedback_file_path')
            .eq('project_id', projectId)
            .single();

        if (fetchError || !project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        // Delete file from storage if it exists
        if (project.feedback_file_path) {
            const { error: deleteError } = await supabase.storage
                .from('feedback-files')
                .remove([project.feedback_file_path]);

            if (deleteError) {
                console.error('Error deleting file from storage:', deleteError);
            }
        }

        // Clear file path and name in database
        const { error: updateError } = await supabase
            .from('projects_test')
            .update({
                feedback_file_path: null,
                feedback_file_name: null
            })
            .eq('project_id', projectId);

        if (updateError) {
            console.error('Error updating database:', updateError);
            return NextResponse.json(
                { error: 'Failed to delete file' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting feedback file:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
