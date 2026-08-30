export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bug_report_events: {
        Row: {
          bug_report_id: string | null
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          meta: Json
          page_url: string | null
          severity: string | null
          user_id: string | null
        }
        Insert: {
          bug_report_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          meta?: Json
          page_url?: string | null
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          bug_report_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          meta?: Json
          page_url?: string | null
          severity?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bug_report_events_bug_report_id_fkey"
            columns: ["bug_report_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          browser: Json
          created_at: string
          description: string
          id: string
          page_url: string | null
          severity: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          browser?: Json
          created_at?: string
          description: string
          id?: string
          page_url?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          browser?: Json
          created_at?: string
          description?: string
          id?: string
          page_url?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_sheet_problems: {
        Row: {
          contest_id: number | null
          created_at: string
          id: string
          key: string
          name: string
          position: number
          problem_index: string
          rating: number | null
          sheet_id: string
          tags: string[]
          url: string
        }
        Insert: {
          contest_id?: number | null
          created_at?: string
          id?: string
          key: string
          name: string
          position: number
          problem_index: string
          rating?: number | null
          sheet_id: string
          tags?: string[]
          url: string
        }
        Update: {
          contest_id?: number | null
          created_at?: string
          id?: string
          key?: string
          name?: string
          position?: number
          problem_index?: string
          rating?: number | null
          sheet_id?: string
          tags?: string[]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_sheet_problems_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "custom_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_sheets: {
        Row: {
          archived_at: string | null
          contest: string | null
          created_at: string
          id: string
          is_favorite: boolean
          legacy_id: string | null
          max_rating: number
          min_rating: number
          name: string
          problem_count: number
          progress: Json
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          contest?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          legacy_id?: string | null
          max_rating: number
          min_rating: number
          name: string
          problem_count?: number
          progress?: Json
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          contest?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          legacy_id?: string | null
          max_rating?: number
          min_rating?: number
          name?: string
          problem_count?: number
          progress?: Json
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_plans: {
        Row: {
          ai_summary: string | null
          coach_note: string | null
          completed_at: string | null
          created_at: string
          id: string
          plan_date: string
          problem_ids: string[]
          started_at: string | null
          status: string
          task_count: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          ai_summary?: string | null
          coach_note?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          plan_date?: string
          problem_ids?: string[]
          started_at?: string | null
          status?: string
          task_count?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          ai_summary?: string | null
          coach_note?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          plan_date?: string
          problem_ids?: string[]
          started_at?: string | null
          status?: string
          task_count?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      mentor_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      problems: {
        Row: {
          cf_contest_id: number
          cf_index: string
          id: string
          name: string
          rating: number | null
          synced_at: string
          tags: string[]
          url: string
        }
        Insert: {
          cf_contest_id: number
          cf_index: string
          id?: string
          name: string
          rating?: number | null
          synced_at?: string
          tags?: string[]
          url: string
        }
        Update: {
          cf_contest_id?: number
          cf_index?: string
          id?: string
          name?: string
          rating?: number | null
          synced_at?: string
          tags?: string[]
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cf_city: string | null
          cf_country: string | null
          cf_first_name: string | null
          cf_last_name: string | null
          cf_max_rating: number | null
          cf_organization: string | null
          cf_rank: string | null
          cf_rating: number | null
          cf_registered_at: string | null
          cf_synced_at: string | null
          cf_title_photo: string | null
          codeforces_handle: string | null
          created_at: string
          current_streak: number
          display_name: string | null
          id: string
          last_active_date: string | null
          onboarded: boolean
          public_badges: string[]
          target_rating: number
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cf_city?: string | null
          cf_country?: string | null
          cf_first_name?: string | null
          cf_last_name?: string | null
          cf_max_rating?: number | null
          cf_organization?: string | null
          cf_rank?: string | null
          cf_rating?: number | null
          cf_registered_at?: string | null
          cf_synced_at?: string | null
          cf_title_photo?: string | null
          codeforces_handle?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id: string
          last_active_date?: string | null
          onboarded?: boolean
          public_badges?: string[]
          target_rating?: number
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cf_city?: string | null
          cf_country?: string | null
          cf_first_name?: string | null
          cf_last_name?: string | null
          cf_max_rating?: number | null
          cf_organization?: string | null
          cf_rank?: string | null
          cf_rating?: number | null
          cf_registered_at?: string | null
          cf_synced_at?: string | null
          cf_title_photo?: string | null
          codeforces_handle?: string | null
          created_at?: string
          current_streak?: number
          display_name?: string | null
          id?: string
          last_active_date?: string | null
          onboarded?: boolean
          public_badges?: string[]
          target_rating?: number
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          ai_feedback: string | null
          created_at: string
          est_minutes: number | null
          focus_topic: string | null
          id: string
          kind: string
          plan_id: string | null
          position: number
          problem_id: string
          rationale: string | null
          resolved_at: string | null
          reviewed_at: string | null
          status: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          ai_feedback?: string | null
          created_at?: string
          est_minutes?: number | null
          focus_topic?: string | null
          id?: string
          kind?: string
          plan_id?: string | null
          position?: number
          problem_id: string
          rationale?: string | null
          resolved_at?: string | null
          reviewed_at?: string | null
          status?: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          ai_feedback?: string | null
          created_at?: string
          est_minutes?: number | null
          focus_topic?: string | null
          id?: string
          kind?: string
          plan_id?: string | null
          position?: number
          problem_id?: string
          rationale?: string | null
          resolved_at?: string | null
          reviewed_at?: string | null
          status?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          attempts: number
          cf_contest_id: number | null
          cf_index: string | null
          created_at: string
          id: string
          problem_id: string | null
          solved_at: string
          source: string
          user_id: string
          verdict: string
        }
        Insert: {
          attempts?: number
          cf_contest_id?: number | null
          cf_index?: string | null
          created_at?: string
          id?: string
          problem_id?: string | null
          solved_at?: string
          source?: string
          user_id: string
          verdict: string
        }
        Update: {
          attempts?: number
          cf_contest_id?: number | null
          cf_index?: string | null
          created_at?: string
          id?: string
          problem_id?: string | null
          solved_at?: string
          source?: string
          user_id?: string
          verdict?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_mastery: {
        Row: {
          confidence: number
          id: string
          score: number
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence?: number
          id?: string
          score?: number
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence?: number
          id?: string
          score?: number
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
