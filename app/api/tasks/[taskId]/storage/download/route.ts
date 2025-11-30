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

    const { storage_name, folder_path, fileName } = await request.json();

    if (!storage_name || !folder_path || !fileName) {
      return NextResponse.json(
        { error: 'Storage name, folder path, and file name are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(storage_name)
      .download(`${folder_path}/${fileName}`);

    if (error) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}   