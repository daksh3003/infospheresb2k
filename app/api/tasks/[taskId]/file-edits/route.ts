import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    // Fetch all file_replaced actions for this task
    const { data: fileActions, error } = await supabase
      .from("task_actions")
      .select("*")
      .eq("task_id", taskId)
      .eq("action_type", "file_replaced")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching file actions:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    interface FileEditInfo {
      edited_at: string;
      edited_by: {
        name: string;
        email: string;
        role: string;
      };
      old_file_name: string;
    }

    // Create a map of file names to their latest replacement action
    const fileEditsMap: Record<string, FileEditInfo> = {};

    for (const action of fileActions) {
      const metadata = action.metadata as {
        new_file_name?: string;
        replaced_at?: string;
        replaced_by?: string;
        replaced_by_email?: string;
        replaced_by_role?: string;
        old_file_name?: string;
      };
      const newFileName = metadata?.new_file_name;

      if (newFileName && !fileEditsMap[newFileName]) {
        fileEditsMap[newFileName] = {
          edited_at: metadata.replaced_at || "",
          edited_by: {
            name: metadata.replaced_by || "",
            email: metadata.replaced_by_email || "",
            role: metadata.replaced_by_role || "",
          },
          old_file_name: metadata.old_file_name || "",
        };
      }
    }

    return NextResponse.json({ fileEdits: fileEditsMap });
  } catch (error) {
    console.error("Error in file-edits route:", error);
    return NextResponse.json(
      { error: "Failed to fetch file edits" },
      { status: 500 }
    );
  }
}
