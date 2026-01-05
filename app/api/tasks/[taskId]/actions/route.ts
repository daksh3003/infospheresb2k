import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { taskId, action } = await request.json();

    if (action === "start") {
        const { error } = await supabase
            .from("process_logs_test")
            .update({
                started_at: new Date(),
            })
            .eq("task_id", taskId);

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
    }
    else if (action === "pause") {
        const { error } = await supabase
            .from("process_logs_test")
            .update({
                paused_at: new Date(),
            })
            .eq("task_id", taskId);

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
    }
    else if (action === "resume") {
        const { error } = await supabase
            .from("process_logs_test")
            .update({
                resumed_at: new Date(),
            })
            .eq("task_id", taskId);

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
    }
    else if (action === "complete") {
        const { error } = await supabase
            .from("process_logs_test")
            .update({
                ended_at: new Date(),
            })
            .eq("task_id", taskId);

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }
    }

    return NextResponse.json({ message: "Task action completed" });
}   