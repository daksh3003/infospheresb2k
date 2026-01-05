import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function GET() {
//   const { projectIds } = await request.json();
  const supabase = await createClient();
  const { data, error } = await supabase
  .from("tasks_test")
  .select("*")
  .order("created_at", { ascending: false });

  if (error) throw error;

  return NextResponse.json(data);
}