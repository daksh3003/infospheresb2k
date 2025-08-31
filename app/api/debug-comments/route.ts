import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Try to get any row from comments table to see the structure
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .limit(1);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: error.message, code: error.code },
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
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
