# Download History Feature Setup

This feature adds a download tracking system to the task detail page that displays when files were downloaded and by whom.

## Database Setup

1. **Run the SQL script** in your Supabase SQL editor:

```sql
-- Copy and paste the contents of database/file_downloads_table.sql
```

This will create:

- A `track_downloads` table to track downloads
- Appropriate indexes for performance
- Row Level Security (RLS) policies for data protection
- Permissions for authenticated users

## Features Added

### 1. Download History Component (`components/DownloadHistory.tsx`)

- Displays a list of all file downloads for a specific task
- Shows file name, storage location, downloader details, and timestamp
- Groups downloads by file (all downloads of the same file are shown together)
- Automatically refreshes when new downloads occur
- Handles loading and empty states

### 2. Enhanced Download Functions

- Modified `handleDownload` and `handleDownloadOffilesToBeUploaded` functions
- Now logs each download to the database with:
  - Task ID and File ID
  - File name, storage name, and folder path
  - Downloader details (name, email, role, time) in JSONB array
  - Groups multiple downloads of the same file together

### 3. Real-time Updates

- Download history automatically refreshes when new files are downloaded
- Uses a refresh trigger mechanism to update the UI

## Database Schema

The `track_downloads` table has the following structure:

```sql
CREATE TABLE track_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL,
    file_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_name TEXT NOT NULL,
    folder_path TEXT NOT NULL,
    downloaded_details JSONB DEFAULT '[]'::jsonb
);
```

### JSONB Structure

The `downloaded_details` field contains an array of download records:

```json
[
  {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "processor",
    "time": "2024-01-15T10:30:00.000Z"
  },
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "qa",
    "time": "2024-01-15T14:20:00.000Z"
  }
]
```

## Security

- Row Level Security (RLS) is enabled
- Users can only view download history for tasks they have access to
- Users can insert and update download records
- Proper indexing ensures good performance

## Usage

The download history box appears at the bottom of the "Files & Attachments" tab in the task detail page. It will show:

- **File name** and storage location
- **All downloaders** who have downloaded this file
- **Downloader details**: name, email, role, and timestamp
- **Grouped by file**: multiple downloads of the same file are shown together

The history is automatically updated whenever someone downloads a file from the task.

## How It Works

1. **First Download**: Creates a new record with the file details and first downloader
2. **Subsequent Downloads**: Updates the existing record by appending to the `downloaded_details` array
3. **File ID**: Generated as `${storage_name}_${folder_path}_${fileName}` to ensure uniqueness
4. **Real-time Updates**: UI refreshes automatically when new downloads are logged
