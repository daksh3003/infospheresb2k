# InfoSpheres System Architecture Diagram

## System Overview Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[Browser/React App]
        B[Mobile React]
        C[Tablet React]
        D[Desktop React]
    end

    subgraph "Presentation Layer"
        E[Next.js App Router]
        F[Layout Components]
        G[UI Components]
        H[Page Components]
    end

    subgraph "Business Logic Layer"
        I[Custom Hooks]
        J[Utility Functions]
        K[State Management]
        L[Form Validation]
    end

    subgraph "Data Access Layer"
        M[Supabase Client]
        N[Authentication]
        O[Database Queries]
        P[File Storage]
    end

    subgraph "Infrastructure Layer"
        Q[Vercel Hosting]
        R[Supabase Backend]
        S[PostgreSQL DB]
        T[CDN/Storage]
    end

    A --> E
    B --> E
    C --> E
    D --> E

    E --> F
    E --> G
    E --> H

    F --> I
    G --> I
    H --> I

    I --> M
    J --> M
    K --> M
    L --> M

    M --> N
    M --> O
    M --> P

    N --> R
    O --> S
    P --> T

    R --> Q
    S --> R
    T --> R
```

## User Role Flow Diagram

```mermaid
flowchart TD
    A[User Login] --> B{Check Role}

    B -->|PM| C[Project Manager Dashboard]
    B -->|Processor| D[Processor Dashboard]
    B -->|QC| E[QC Dashboard]
    B -->|QA| F[QA Dashboard]
    B -->|Admin| G[Admin Dashboard]

    C --> H[Create Projects]
    C --> I[Assign Tasks]
    C --> J[Monitor Progress]

    D --> K[View Assigned Tasks]
    D --> L[Process Documents]
    D --> M[Upload Results]

    E --> N[Review Processed Work]
    E --> O[Quality Check]
    E --> P[Send to QA or Return]

    F --> Q[Final Quality Assurance]
    F --> R[Approve or Reject]
    F --> S[Mark Complete]

    G --> T[User Management]
    G --> U[System Settings]
    G --> V[Analytics]
```

## Task Workflow Diagram

```mermaid
stateDiagram-v2
    [*] --> ProjectCreation
    ProjectCreation --> TaskCreation
    TaskCreation --> FileAssignment
    FileAssignment --> Processing

    Processing --> QCReview
    QCReview --> QAAssessment

    QAAssessment --> Completed
    QAAssessment --> ReturnedToProcessor

    ReturnedToProcessor --> Processing

    QCReview --> ReturnedToProcessor

    Completed --> [*]
```

## Database Schema Diagram

```mermaid
erDiagram
    users {
        uuid id PK
        string email
        string role
        string name
        timestamp created_at
    }

    projects {
        uuid id PK
        string project_name
        integer po_hours
        text mail_instruction
        text list_of_files
        string reference_file
        date delivery_date
        time delivery_time
        boolean completion_status
        uuid created_by FK
    }

    tasks_test {
        uuid task_id PK
        string task_name
        text client_instruction
        string processor_type
        integer estimated_hours_ocr
        integer estimated_hours_qc
        integer estimated_hours_qa
        boolean completion_status
        uuid project_id FK
        uuid created_by FK
    }

    task_iterations {
        uuid id PK
        uuid task_id FK
        integer iteration_number
        string current_stage
        text iteration_notes
        uuid sent_by FK
        uuid assigned_to_processor_user_id FK
        uuid assigned_to_qc_user_id FK
        uuid assigned_to_qa_user_id FK
        uuid current_file_version_id FK
    }

    track_downloads {
        uuid id PK
        uuid task_id FK
        string file_id
        string file_name
        string storage_name
        string folder_path
        jsonb downloaded_details
    }

    user_sessions {
        uuid id PK
        uuid user_id FK
        timestamp login_time
        timestamp logout_time
        jsonb session_data
    }

    users ||--o{ projects : creates
    users ||--o{ tasks_test : creates
    users ||--o{ task_iterations : manages
    users ||--o{ user_sessions : has
    projects ||--o{ tasks_test : contains
    tasks_test ||--o{ task_iterations : has
    tasks_test ||--o{ track_downloads : tracks
```

## Component Architecture Diagram

```mermaid
graph TD
    subgraph "App Structure"
        A[app/layout.tsx]
        B[app/page.tsx]
        C[app/dashboard/]
        D[app/tasks/]
        E[app/auth/]
    end

    subgraph "Core Components"
        F[taskModal.tsx]
        G[MainTaskCard.tsx]
        H[FileUpload.tsx]
        I[DownloadHistory.tsx]
        J[Comments.tsx]
    end

    subgraph "UI Components"
        K[ui/button.tsx]
        L[ui/card.tsx]
        M[ui/dialog.tsx]
        N[ui/input.tsx]
    end

    subgraph "Role Dashboards"
        O[PM Dashboard]
        P[Processor Dashboard]
        Q[QC Dashboard]
        R[QA Dashboard]
    end

    A --> B
    A --> C
    A --> D
    A --> E

    C --> O
    C --> P
    C --> Q
    C --> R

    D --> F
    D --> G
    D --> H
    D --> I
    D --> J

    F --> K
    G --> L
    H --> M
    I --> N
```

## File Management Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as FileUpload
    participant S as Supabase Storage
    participant D as Database
    participant H as DownloadHistory

    U->>F: Select Files
    F->>F: Validate Files
    F->>S: Upload to Storage
    S->>F: Return Storage Path
    F->>D: Save File Metadata
    F->>U: Confirm Upload

    U->>H: Download File
    H->>S: Request File
    S->>H: Return File
    H->>D: Log Download
    H->>U: Provide File
```

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        A[Supabase Auth]
        B[JWT Tokens]
        C[Session Management]
    end

    subgraph "Authorization Layer"
        D[Role-Based Access Control]
        E[Permission Matrix]
        F[Route Protection]
    end

    subgraph "Data Protection"
        G[Row Level Security]
        H[Input Validation]
        I[SQL Injection Prevention]
        J[XSS Protection]
    end

    subgraph "Infrastructure Security"
        K[HTTPS/TLS]
        L[Environment Variables]
        M[Secure Headers]
        N[CSRF Protection]
    end

    A --> D
    B --> E
    C --> F

    D --> G
    E --> H
    F --> I

    G --> K
    H --> L
    I --> M
    J --> N
```

## Performance & Scalability

```mermaid
graph LR
    subgraph "Frontend Optimization"
        A[Next.js 15]
        B[Turbopack]
        C[Code Splitting]
        D[Image Optimization]
    end

    subgraph "Backend Optimization"
        E[Database Indexing]
        F[Connection Pooling]
        G[Query Caching]
        H[CDN Distribution]
    end

    subgraph "Scalability Features"
        I[Horizontal Scaling]
        J[Load Balancing]
        K[Microservices Ready]
        L[Auto-scaling]
    end

    A --> E
    B --> F
    C --> G
    D --> H

    E --> I
    F --> J
    G --> K
    H --> L
```

These diagrams provide a comprehensive visual representation of the InfoSpheres system architecture, showing the relationships between different components, data flow, user roles, and system design patterns.
