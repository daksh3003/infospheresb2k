import { NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch all files with their page counts
        const { data: filesData, error } = await supabase
            .from('files_test')
            .select('task_id, page_count');

        if (error) {
            console.error('Error fetching page counts:', error);
            return NextResponse.json({ error: 'Failed to fetch page counts' }, { status: 500 });
        }

        // Group by task_id and sum page counts
        const pageCountMap: { [key: string]: number } = {};

        (filesData || []).forEach((file: { task_id: string; page_count: number | null }) => {
            if (file.page_count !== null) {
                pageCountMap[file.task_id] = (pageCountMap[file.task_id] || 0) + file.page_count;
            }
        });

        // Convert to array format
        const result = Object.entries(pageCountMap).map(([task_id, total_pages]) => ({
            task_id,
            total_pages
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error in page-counts API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
