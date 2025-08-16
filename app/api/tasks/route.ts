import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
//   const { projectIds } = await request.json();

  const { data, error } = await supabase
  .from("tasks_test")
  .select("*")
  .order("created_at", { ascending: false });

  if (error) throw error;

  return NextResponse.json(data);
}