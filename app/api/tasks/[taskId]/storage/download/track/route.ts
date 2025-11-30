import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';
import { requireAuth } from '@/app/api/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = await createClient();
    const body = await request.json();
    const { action } = body;

    if (action === "insert") {
      const { task_id, file_id, file_name, storage_name, folder_path, downloaded_details } = body;

      if (!task_id || !file_id || !file_name || !storage_name || !folder_path || !downloaded_details) {
        return NextResponse.json(
          { error: 'All fields are required for insert action' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("track_downloads")
        .insert({
            task_id: task_id,
            file_id: file_id,
            file_name: file_name,
            storage_name: storage_name,
            folder_path: folder_path,
            downloaded_details: [downloaded_details],
        });

      if (error) {
        return NextResponse.json(
          { error: 'Failed to create download record' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data });
    } else if (action === "update") {
      const { updated_details, existing_record_id } = body;

      if (!updated_details || !existing_record_id) {
        return NextResponse.json(
          { error: 'Updated details and existing record ID are required' },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("track_downloads")
        .update({ downloaded_details: updated_details })
        .eq("id", existing_record_id);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update download record' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data });
    } else if (action === "check") {
      const { taskId, fileId } = body;

      if (!taskId || !fileId) {
        return NextResponse.json(
          { error: "Task ID and file ID are required" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("track_downloads")
        .select("id, downloaded_details")
        .eq("file_id", fileId)
        .eq("task_id", taskId)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Failed to check download record' },
          { status: 500 }
        );
      }

      return NextResponse.json({ data });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
