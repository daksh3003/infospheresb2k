import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
    const { data: iterationsData, error: iterationsError } = await supabase
    .from("task_iterations")
    .select("task_id, current_stage");

    if (iterationsError) throw iterationsError;

    return NextResponse.json(iterationsData);
}