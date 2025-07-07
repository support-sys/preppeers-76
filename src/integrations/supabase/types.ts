export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      interviewees: {
        Row: {
          bio: string | null
          created_at: string
          experience: string | null
          experience_level: string | null
          github_url: string | null
          id: string
          interview_types: string[] | null
          linkedin_url: string | null
          notice_period: string | null
          preferred_interview_length: number | null
          resume_url: string | null
          skills_to_practice: string[] | null
          target_companies: string[] | null
          target_role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          experience?: string | null
          experience_level?: string | null
          github_url?: string | null
          id?: string
          interview_types?: string[] | null
          linkedin_url?: string | null
          notice_period?: string | null
          preferred_interview_length?: number | null
          resume_url?: string | null
          skills_to_practice?: string[] | null
          target_companies?: string[] | null
          target_role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          experience?: string | null
          experience_level?: string | null
          github_url?: string | null
          id?: string
          interview_types?: string[] | null
          linkedin_url?: string | null
          notice_period?: string | null
          preferred_interview_length?: number | null
          resume_url?: string | null
          skills_to_practice?: string[] | null
          target_companies?: string[] | null
          target_role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interviewers: {
        Row: {
          availability_days: string[] | null
          bio: string | null
          company: string | null
          created_at: string
          current_available_date: string | null
          current_time_slots: Json | null
          experience_years: number | null
          github_url: string | null
          hourly_rate: number | null
          id: string
          linkedin_url: string | null
          position: string | null
          schedule_last_updated: string | null
          skills: string[] | null
          technologies: string[] | null
          time_slots: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_days?: string[] | null
          bio?: string | null
          company?: string | null
          created_at?: string
          current_available_date?: string | null
          current_time_slots?: Json | null
          experience_years?: number | null
          github_url?: string | null
          hourly_rate?: number | null
          id?: string
          linkedin_url?: string | null
          position?: string | null
          schedule_last_updated?: string | null
          skills?: string[] | null
          technologies?: string[] | null
          time_slots?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_days?: string[] | null
          bio?: string | null
          company?: string | null
          created_at?: string
          current_available_date?: string | null
          current_time_slots?: Json | null
          experience_years?: number | null
          github_url?: string | null
          hourly_rate?: number | null
          id?: string
          linkedin_url?: string | null
          position?: string | null
          schedule_last_updated?: string | null
          skills?: string[] | null
          technologies?: string[] | null
          time_slots?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interviews: {
        Row: {
          candidate_email: string
          candidate_id: string
          candidate_name: string
          created_at: string
          email_confirmation_sent: boolean | null
          experience: string | null
          google_calendar_event_id: string | null
          google_meet_link: string | null
          id: string
          interviewer_email: string
          interviewer_id: string
          reminder_emails_sent: Json | null
          resume_url: string | null
          scheduled_time: string
          status: string
          target_role: string
          updated_at: string
        }
        Insert: {
          candidate_email: string
          candidate_id: string
          candidate_name: string
          created_at?: string
          email_confirmation_sent?: boolean | null
          experience?: string | null
          google_calendar_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          interviewer_email: string
          interviewer_id: string
          reminder_emails_sent?: Json | null
          resume_url?: string | null
          scheduled_time: string
          status?: string
          target_role: string
          updated_at?: string
        }
        Update: {
          candidate_email?: string
          candidate_id?: string
          candidate_name?: string
          created_at?: string
          email_confirmation_sent?: boolean | null
          experience?: string | null
          google_calendar_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          interviewer_email?: string
          interviewer_id?: string
          reminder_emails_sent?: Json | null
          resume_url?: string | null
          scheduled_time?: string
          status?: string
          target_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          mobile_number: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          mobile_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          mobile_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: "interviewer" | "interviewee"
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
      user_role: ["interviewer", "interviewee"],
    },
  },
} as const
