# API Migration: Client to Server-Side Database Operations

This document outlines the migration of database operations from client-side to server-side API routes in the InfoSpheres application.

## Overview

All direct Supabase database calls have been moved from the client side to server-side API routes. This improves security, performance, and maintainability by:

- **Security**: Database credentials are no longer exposed to the client
- **Performance**: Server-side operations can be optimized and cached
- **Maintainability**: Centralized database logic in API routes
- **Scalability**: Better resource management and error handling

## New API Structure

### Authentication Routes

- `POST /api/auth/login` - User login with session creation
- `POST /api/auth/signup` - User registration with profile creation

### Dashboard Routes

- `GET /api/dashboard/pm` - PM dashboard data
- `GET /api/dashboard/processor` - Processor dashboard data
- `GET /api/dashboard/qc` - QC dashboard data

### Task Routes

- `GET /api/tasks/[taskId]` - Get task details
- `POST /api/tasks/[taskId]` - Task actions (assign, pickup)

### Project Routes

- `POST /api/projects` - Create new projects with tasks and files

### File Routes

- `GET /api/files` - Get files for a task/stage
- `POST /api/files` - Upload files

### Download History Routes

- `GET /api/downloads/history` - Get download history
- `POST /api/downloads/history` - Track downloads

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# New required variable for server-side operations
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Getting the Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the "service_role" key (not the anon key)
4. Add it to your `.env.local` file

**Important**: The service role key has full database access. Keep it secure and never expose it to the client.

## Updated Components

The following components have been updated to use the new API:

### Authentication

- `app/auth/login/page.tsx` - Now uses `/api/auth/login`
- `app/auth/signup/page.tsx` - Now uses `/api/auth/signup`

### Dashboards

- `app/dashboard/pm/page.tsx` - Now uses `/api/dashboard/pm`
- `app/dashboard/processor/page.tsx` - Now uses `/api/dashboard/processor`
- `app/dashboard/qc/page.tsx` - Now uses `/api/dashboard/qc`

### Task Management

- `app/tasks/[taskId]/page.tsx` - Now uses `/api/tasks/[taskId]`
- `components/FooterButtons.tsx` - Updated for API calls
- `components/taskModal.tsx` - Updated for project creation

### File Operations

- `components/DownloadHistory.tsx` - Now uses `/api/downloads/history`

## API Utility

A new utility file `utils/api.ts` provides a clean interface for all API calls:

```typescript
import { api } from "@/utils/api";

// Example usage
const result = await api.getPMDashboard();
const loginResult = await api.login(email, password);
```

## Migration Benefits

### Security Improvements

- Database credentials are server-side only
- Row Level Security (RLS) can be properly enforced
- Input validation happens on the server
- No direct database access from client

### Performance Improvements

- Reduced client-side bundle size
- Server-side query optimization
- Better caching strategies
- Reduced network overhead

### Maintainability

- Centralized database logic
- Consistent error handling
- Easier to implement new features
- Better debugging capabilities

## Testing the Migration

1. **Start the development server**:

   ```bash
   npm run dev
   ```

2. **Test authentication**:

   - Try logging in with existing credentials
   - Verify session creation works
   - Test role-based redirects

3. **Test dashboards**:

   - Navigate to different role dashboards
   - Verify data loading works
   - Check filtering and search functionality

4. **Test task operations**:
   - Create new projects
   - Assign tasks to users
   - Upload and download files
   - Check download history

## Troubleshooting

### Common Issues

1. **Service Role Key Missing**

   - Error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"
   - Solution: Add the service role key to your environment variables

2. **CORS Issues**

   - Error: "CORS policy violation"
   - Solution: Ensure API routes are properly configured

3. **Authentication Errors**
   - Error: "Authentication failed"
   - Solution: Check that the service role key has proper permissions

### Debug Mode

Enable debug logging by adding to your environment:

```env
DEBUG_API=true
```

This will log all API requests and responses to the console.

## Next Steps

1. **Monitor Performance**: Track API response times and optimize as needed
2. **Add Caching**: Implement Redis or similar for frequently accessed data
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **API Documentation**: Generate OpenAPI/Swagger documentation
5. **Testing**: Add comprehensive unit and integration tests

## Rollback Plan

If issues arise, you can temporarily revert to client-side operations by:

1. Restoring the original Supabase client imports
2. Commenting out the API utility imports
3. Restoring the original database call functions

However, this is not recommended for production use due to security concerns.
