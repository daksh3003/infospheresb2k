import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function GET() {
  try {
    const supabase = await createClient();
    // Try to get any row from comments table to see the structure
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .limit(1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch comments data' },
        { status: 400 }
      );
    }

    const columns = data && data.length > 0 ? Object.keys(data[0]) : [];
    
    return NextResponse.json({ 
      message: "Comments table structure",
      columns: columns,
      sampleData: data
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
