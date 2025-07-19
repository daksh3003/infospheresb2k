-- Create track_downloads table to track file downloads
CREATE TABLE IF NOT EXISTS track_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    file_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_name TEXT NOT NULL,
    folder_path TEXT NOT NULL,
    downloaded_details JSONB DEFAULT '[]'::jsonb
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_track_downloads_task_id ON track_downloads(task_id);
CREATE INDEX IF NOT EXISTS idx_track_downloads_file_id ON track_downloads(file_id);
CREATE INDEX IF NOT EXISTS idx_track_downloads_file_name ON track_downloads(file_name);

-- Enable Row Level Security (RLS)
ALTER TABLE track_downloads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view download history for tasks they have access to
CREATE POLICY "Users can view download history for accessible tasks" ON track_downloads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks_test t
            WHERE t.task_id = track_downloads.task_id
            AND (
                t.assigned_to = auth.uid()::text
                OR t.created_by = auth.uid()::text
                OR EXISTS (
                    SELECT 1 FROM profiles p
                    WHERE p.id = auth.uid()
                    AND p.role IN ('admin', 'pm', 'qc', 'qa', 'processor')
                )
            )
        )
    );

-- Create policy to allow users to insert their own download records
CREATE POLICY "Users can insert their own download records" ON track_downloads
    FOR INSERT WITH CHECK (true);

-- Create policy to allow users to update download records
CREATE POLICY "Users can update download records" ON track_downloads
    FOR UPDATE USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON track_downloads TO authenticated; 