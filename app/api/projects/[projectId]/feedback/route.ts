import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/server';
import { requireAuth } from '@/app/api/middleware/auth';
import { generateSafeStorageFileName } from '@/lib/file-utils';

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
            .select('feedback, rca_required, rca_details, feedback_file_path, feedback_file_name')
            .eq('project_id', projectId)
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch feedback' },
                { status: 500 }
            );
        }

        // Generate signed URL for file if it exists
        let fileUrl = null;
        if (data?.feedback_file_path) {
            const { data: urlData } = await supabase.storage
                .from('feedback-files')
                .createSignedUrl(data.feedback_file_path, 3600); // 1 hour expiry

            fileUrl = urlData?.signedUrl || null;
        }

        return NextResponse.json({
            feedback: data?.feedback || '',
            rca_required: data?.rca_required || false,
            rca_details: data?.rca_details || '',
            feedback_file_path: data?.feedback_file_path || null,
            feedback_file_name: data?.feedback_file_name || null,
            feedback_file_url: fileUrl
        });
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
        const formData = await request.formData();

        const feedback = formData.get('feedback') as string;
        const rcaRequired = formData.get('rca_required') === 'true';
        const rcaDetails = formData.get('rca_details') as string || '';
        const file = formData.get('file') as File | null;

        if (typeof feedback !== 'string') {
            return NextResponse.json(
                { error: 'Feedback must be a string' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Verify project exists and get current feedback file path
        const { data: project, error: projectError } = await supabase
            .from('projects_test')
            .select('project_id, completion_status, feedback_file_path')
            .eq('project_id', projectId)
            .single();

        if (projectError || !project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        let newFilePath = project.feedback_file_path;
        let newFileName = null;

        // Handle file upload if provided
        if (file && file.size > 0) {
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                return NextResponse.json(
                    { error: 'File size must be less than 10MB' },
                    { status: 400 }
                );
            }

            // Delete old file if it exists
            if (project.feedback_file_path) {
                await supabase.storage
                    .from('feedback-files')
                    .remove([project.feedback_file_path]);
            }

            // Upload new file
            const safeStorageFileName = generateSafeStorageFileName(file.name);
            const filePath = `${projectId}/${safeStorageFileName}`;

            const { error: uploadError } = await supabase.storage
                .from('feedback-files')
                .upload(filePath, file, {
                    contentType: file.type,
                    upsert: true
                });

            if (uploadError) {
                console.error('Error uploading file:', uploadError);
                return NextResponse.json(
                    { error: 'Failed to upload file' },
                    { status: 500 }
                );
            }

            newFilePath = filePath;
            newFileName = file.name; // Store original filename
        }

        // Update feedback, RCA, and file path
        const { error: updateError } = await supabase
            .from('projects_test')
            .update({
                feedback: feedback.trim(),
                rca_required: rcaRequired,
                rca_details: rcaDetails.trim(),
                feedback_file_path: newFilePath,
                feedback_file_name: newFileName
            })
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
