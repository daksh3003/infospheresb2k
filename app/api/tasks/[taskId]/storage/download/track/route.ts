import { NextRequest, NextResponse } from 'next/server';
import { supabase } from "@/utils/supabase";

export async function POST(request: NextRequest) {
    const body = await request.json();

    const {action} = body;

    if (action === "insert") {
        
    const {task_id, file_id, file_name, storage_name, folder_path, downloaded_details} = body;

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
            console.error("Error creating download record:", error);
            return;
        }

        return NextResponse.json({ data });
    }

    else if (action === "update") {

        const {updated_details, existing_record_id} = body;

        const { data, error } = await supabase
            .from("track_downloads")
            .update({ downloaded_details: updated_details })
            .eq("id", existing_record_id);

        if (error) {
            console.error("Error updating download record:", error);
            return;
        }

        return NextResponse.json({ data });
    }

    else if (action === "check") {
        const {taskId, fileId} = body;

        if (!taskId || !fileId) {
            return NextResponse.json({ error: "Task ID and file ID are required" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from("track_downloads")
            .select("id, downloaded_details")
            .eq("file_id", fileId)
            .eq("task_id", taskId)
            .single();

        if (error) {
            console.error("Error checking download record:", error);
            return;
        }

        return NextResponse.json({ data });
    }
}
