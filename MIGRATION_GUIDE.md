# Supabase to API Routes Migration Guide

This document outlines how to migrate all Supabase database calls from `app/tasks/[taskId]/page.tsx` to the new API routes.

## Created API Routes

### 1. `/api/tasks/[taskId]/iterations` - Task Iterations

- **GET**: Fetch task iteration data
- **PATCH**: Update task iteration (stages, current_stage, sent_by)

### 2. `/api/tasks/[taskId]/details` - Task Details

- **GET**: Fetch task details from tasks_test table
- **PATCH**: Update task completion status

### 3. `/api/tasks/[taskId]/profile` - User Profile

- **GET**: Fetch user profile by ID (use query param `?userId=...`)

### 4. `/api/tasks/[taskId]/users` - Available Users

- **GET**: Fetch available users by role (use query param `?role=...`)

### 5. `/api/tasks/[taskId]/assignment` - Task Assignment

- **GET**: Fetch task assignment
- **POST**: Create or update task assignment

### 6. `/api/tasks/[taskId]/storage` - Storage Operations

- **GET**: List files from storage bucket (use query params `?bucket=...&path=...`)
- **POST**: Upload file to storage (use query params `?bucket=...&path=...`)

### 7. `/api/tasks/[taskId]/downloads` - Download Tracking

- **GET**: Fetch download tracking records
- **POST**: Create download tracking record
- **PATCH**: Update download tracking record

### 8. `/api/tasks/[taskId]/project` - Project Completion

- **GET**: Fetch project tasks completion status (use query param `?projectId=...`)
- **PATCH**: Update project completion status (use query param `?projectId=...`)

### 9. `/api/tasks/[taskId]/current-user` - Current User

- **GET**: Fetch current authenticated user profile

## Migration Examples

### Before (Supabase calls):

```typescript
// Fetch task iteration
const { data, error } = await supabase
  .from("task_iterations")
  .select("sent_by, current_stage, assigned_to_processor_user_id")
  .eq("task_id", taskId)
  .single();

// Update task iteration
const { data, error } = await supabase
  .from("task_iterations")
  .update({
    current_stage: next_current_stage,
    sent_by: next_sent_by,
    stages: updatedStages,
  })
  .eq("task_id", taskId);

// Fetch task details
const { data: simpleTaskData, error: simpleError } = await supabase
  .from("tasks_test")
  .select("*")
  .eq("task_id", taskId)
  .single();

// Fetch user profile
const { data: profile, error } = await supabase
  .from("profiles")
  .select("id, name, email, role")
  .eq("id", simpleTaskData.created_by)
  .single();

// Fetch available users
const { data: users, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("role", roleToFetch);

// List storage files
const { data: PMFiles, error: PMError } = await supabase.storage
  .from("task-files")
  .list(taskId);

// Upload file
const { data: StoreFiles, error } = await supabase.storage
  .from(storage_name)
  .upload(file_path, file, {
    contentType: file.type,
    upsert: true,
  });

// Insert download tracking
const { error: insertError } = await supabase.from("track_downloads").insert({
  task_id: taskId,
  file_id: file_id,
  file_name: fileName,
  storage_name: storage_name,
  folder_path: folder_path,
  downloaded_details: [downloadDetail],
});

// Update project completion
const { error: projectError } = await supabase
  .from("projects_test")
  .update({ completion_status: true })
  .eq("project_id", task.project_id);
```

### After (API calls):

```typescript
// Fetch task iteration
const response = await fetch(
  `/api/tasks/${taskId}/iterations?fields=sent_by,current_stage,assigned_to_processor_user_id`
);
const { data } = await response.json();

// Update task iteration
const response = await fetch(`/api/tasks/${taskId}/iterations`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    current_stage: next_current_stage,
    sent_by: next_sent_by,
    stages: updatedStages,
  }),
});
const { data } = await response.json();

// Fetch task details
const response = await fetch(`/api/tasks/${taskId}/details`);
const { data: simpleTaskData } = await response.json();

// Fetch user profile
const response = await fetch(
  `/api/tasks/${taskId}/profile?userId=${simpleTaskData.created_by}`
);
const { data: profile } = await response.json();

// Fetch available users
const response = await fetch(`/api/tasks/${taskId}/users?role=${roleToFetch}`);
const { data: users } = await response.json();

// List storage files
const response = await fetch(
  `/api/tasks/${taskId}/storage?bucket=task-files&path=${taskId}`
);
const { data: PMFiles } = await response.json();

// Upload file
const formData = new FormData();
formData.append("file", file);
const response = await fetch(
  `/api/tasks/${taskId}/storage?bucket=${storage_name}&path=${file_path}`,
  {
    method: "POST",
    body: formData,
  }
);
const { data: StoreFiles } = await response.json();

// Insert download tracking
const response = await fetch(`/api/tasks/${taskId}/downloads`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    task_id: taskId,
    file_id: file_id,
    file_name: fileName,
    storage_name: storage_name,
    folder_path: folder_path,
    downloaded_details: [downloadDetail],
  }),
});

// Update project completion
const response = await fetch(
  `/api/tasks/${taskId}/project?projectId=${task.project_id}`,
  {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completion_status: true }),
  }
);
```

## Authentication

For the current user API route, you'll need to pass the user's access token in the Authorization header:

```typescript
// Get current user
const {
  data: { session },
} = await supabase.auth.getSession();
const response = await fetch(`/api/tasks/${taskId}/current-user`, {
  headers: {
    Authorization: `Bearer ${session?.access_token}`,
  },
});
const { data: currentUser } = await response.json();
```

## Benefits of Migration

1. **Security**: Database credentials are kept server-side
2. **Performance**: Better caching and optimization opportunities
3. **Maintainability**: Centralized database logic
4. **Error Handling**: Consistent error responses
5. **Validation**: Server-side validation of requests
6. **Monitoring**: Better logging and analytics capabilities

## Next Steps

1. Replace all Supabase calls in the component with the corresponding API calls
2. Update error handling to work with the new API response format
3. Test all functionality to ensure the migration works correctly
4. Remove the Supabase import from the component
5. Update any TypeScript types if needed



