import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { projectIds } = await request.json();

    if (!projectIds || !Array.isArray(projectIds)) {
      return NextResponse.json({ error: 'Project IDs array is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("projects_test")
      .select("project_id, project_name, delivery_date, delivery_time")
      .in("project_id", projectIds);

    if (error) {
      console.error("Error fetching project names:", error);
      return NextResponse.json({ error: 'Failed to fetch project names' }, { status: 500 });
    }

    const projectNameMap = data.reduce(
      (
        acc: {
          [key: string]: {
            name: string;
            delivery_date: string;
            delivery_time: string;
          };
        },
        project
      ) => {
        acc[project.project_id] = {
          name: project.project_name,
          delivery_date: project.delivery_date,
          delivery_time: project.delivery_time,
        };
        return acc;
      },
      {}
    );

    return NextResponse.json({ projectNames: projectNameMap });
  } catch (error) {
    console.error('Error in getProjectNames:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
