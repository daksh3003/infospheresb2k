import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/server';
import { requireAuth } from '@/app/api/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { storage_name, taskId, action } = body;

    if (!storage_name || !taskId || !action) {
      return NextResponse.json(
        { error: 'Storage name, task ID, and action are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // // const supabase = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    // // Grab JWT from headers
    // const authHeader = request.headers.get("authorization");
    // const token = authHeader?.replace("Bearer ", "");

    // // Create a Supabase client with user’s access token
    // const supabase = createClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    //   { global: { headers: { Authorization: `Bearer ${token}` } } } 
    // );

    if (action === "list") {
      const { data, error } = await supabase.storage.from(storage_name).list(`${taskId}/`);

      if (error) {
        return NextResponse.json({ error: 'Failed to list files' }, { status: 400 });
      }
      return NextResponse.json({ data });
    } else if (action === "upload") {
      const { file, file_path } = body;

      if (!file || !file_path) {
        return NextResponse.json(
          { error: 'File and file path are required' },
          { status: 400 }
        );
      }

      const { error } = await supabase.storage
        .from(storage_name)
        .upload(file_path, file, {
          contentType: file.type,
          upsert: true,
        });

      if (error) {
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 400 });
      }

      return NextResponse.json({ data: "File uploaded successfully" });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}