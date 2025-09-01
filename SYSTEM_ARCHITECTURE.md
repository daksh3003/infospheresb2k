# InfoSpheres System Architecture & Features

## System Overview

InfoSpheres is a comprehensive task management and workflow automation system designed for document processing teams. It's built as a modern web application using Next.js 15 with TypeScript, featuring role-based access control, real-time collaboration, and comprehensive file management capabilities.

## Core Features

### 1. **Role-Based Access Control (RBAC)**

- **Project Manager (PM)**: Full project oversight, task creation, and team management
- **Processor**: Document processing and task execution
- **QC Team**: Quality control and review processes
- **QA Team**: Final quality assurance and validation
- **Admin**: System administration and user management

### 2. **Project & Task Management**

- **Project Creation**: Define projects with PO hours, delivery dates, and client instructions
- **Task Assignment**: Create and assign tasks to team members
- **File Grouping**: Organize multiple files into logical groups for processing
- **Iteration Tracking**: Monitor task progress through multiple stages
- **Status Management**: Track completion status across all workflow stages

### 3. **File Management System**

- **Multi-format Support**: PDF, DOCX, XLSX, JPG, PNG (up to 10MB)
- **Version Control**: Track file versions and iterations
- **Upload/Download Tracking**: Comprehensive audit trail of file access
- **Storage Management**: Organized folder structure with Supabase storage
- **Download History**: Track who downloaded what and when

### 4. **Workflow Automation**

- **Stage Progression**: Automated workflow from Processor → QC → QA
- **Assignment Logic**: Intelligent task assignment based on team capacity
- **Notification System**: Real-time updates and alerts
- **Progress Tracking**: Visual progress indicators and status updates

### 5. **Collaboration Features**

- **Comments System**: Team communication on tasks
- **Real-time Updates**: Live status changes and notifications
- **Task Attachments**: Support for additional reference materials
- **Team Dashboard**: Role-specific views and task lists

## Technical Architecture

### Frontend Stack

```
Next.js 15 (App Router)
├── React 19
├── TypeScript 5
├── Tailwind CSS 4
├── Radix UI Components
├── Material-UI (MUI)
├── Framer Motion
└── Lucide React Icons
```

### Backend & Database

```
Supabase
├── PostgreSQL Database
├── Row Level Security (RLS)
├── Real-time Subscriptions
├── File Storage
├── Authentication
└── Edge Functions
```

### Key Dependencies

- **State Management**: React hooks and context
- **Styling**: Tailwind CSS with custom components
- **Forms**: React Hook Form with validation
- **Notifications**: React Toastify
- **File Handling**: Custom upload/download logic
- **Authentication**: Supabase Auth with session management

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Browser   │  │   Mobile    │  │   Tablet    │  │   Desktop   │      │
│  │   (React)   │  │   (React)   │  │   (React)   │  │   (React)   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Layout    │  │ Components  │  │    Pages    │  │     UI      │      │
│  │  (Shared)   │  │ (Reusable)  │  │ (Route-based)│  │ (Radix/MUI) │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BUSINESS LOGIC LAYER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Hooks     │  │   Utils     │  │  Services   │  │  Context    │      │
│  │ (Custom)    │  │ (Helpers)   │  │ (API calls) │  │ (State)     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA ACCESS LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  Supabase   │  │  Supabase   │  │  Supabase   │  │  Supabase   │      │
│  │   Client    │  │   Auth      │  │  Database   │  │   Storage   │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INFRASTRUCTURE LAYER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │   Vercel    │  │  Supabase   │  │ PostgreSQL  │  │   CDN       │      │
│  │ (Hosting)   │  │ (Backend)   │  │ (Database)  │  │ (Assets)    │      │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Core Tables

```
projects
├── id (UUID, PK)
├── project_name
├── po_hours
├── mail_instruction
├── list_of_files
├── reference_file
├── delivery_date
├── delivery_time
├── completion_status
└── created_by

tasks_test
├── task_id (UUID, PK)
├── task_name
├── client_instruction
├── processor_type
├── estimated_hours_ocr
├── estimated_hours_qc
├── estimated_hours_qa
├── completion_status
├── project_id (FK)
└── created_by

task_iterations
├── id (UUID, PK)
├── task_id (FK)
├── iteration_number
├── current_stage
├── iteration_notes
├── sent_by
├── assigned_to_processor_user_id
├── assigned_to_qc_user_id
├── assigned_to_qa_user_id
└── current_file_version_id

track_downloads
├── id (UUID, PK)
├── task_id (FK)
├── file_id
├── file_name
├── storage_name
├── folder_path
└── downloaded_details (JSONB)

user_sessions
├── id (UUID, PK)
├── user_id (FK)
├── login_time
├── logout_time
└── session_data
```

## Component Architecture

### Core Components

```
components/
├── ui/                    # Reusable UI components
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── task/                  # Task-specific components
│   ├── task-card.tsx
│   ├── task-detail-back-button.tsx
│   └── ...
├── Timeline/              # Timeline components
├── taskModal.tsx          # Main task creation modal
├── MainTaskCard.tsx       # Task display card
├── FileUpload.tsx         # File upload handling
├── TaskAttachments.tsx    # File attachment management
├── Comments.tsx           # Comment system
├── DownloadHistory.tsx    # Download tracking
└── FooterButtons.tsx      # Action buttons
```

### Page Structure

```
app/
├── layout.tsx             # Root layout
├── page.tsx               # Landing page
├── auth/                  # Authentication
│   ├── login/
│   ├── signup/
│   └── verify-email/
├── dashboard/             # Role-based dashboards
│   ├── pm/               # Project Manager
│   ├── processor/        # Processing Team
│   ├── qc/               # QC Team
│   └── qa/               # QA Team
└── tasks/                 # Task management
    └── [taskId]/         # Dynamic task routes
```

## Security Features

### Authentication & Authorization

- **Supabase Auth**: Secure user authentication
- **JWT Tokens**: Stateless authentication
- **Role-based Access**: Granular permissions per role
- **Session Management**: Track login/logout times
- **Row Level Security**: Database-level access control

### Data Protection

- **Input Validation**: Client and server-side validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: React's built-in protection
- **CSRF Protection**: Same-origin policy enforcement
- **File Upload Security**: Type and size validation

## Performance Optimizations

### Frontend

- **Next.js 15**: Latest performance features
- **Turbopack**: Fast development builds
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js image optimization
- **Lazy Loading**: Component-level lazy loading

### Backend

- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Supabase query caching
- **CDN**: Global asset distribution

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm/npm/yarn
- Supabase account
- Vercel account (optional)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd infospheres

# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env.local
# Configure Supabase credentials

# Run development server
pnpm dev
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

This architecture provides a robust, scalable foundation for the InfoSpheres task management system, with clear separation of concerns, security best practices, and modern development patterns.
