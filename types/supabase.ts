// types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: string
          full_name: string | null
          email: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          role?: string
          full_name?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          role?: string
          full_name?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}