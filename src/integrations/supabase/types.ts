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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      interviewees: {
        Row: {
          bio: string | null
          created_at: string
          current_position: string | null
          experience: string | null
          github_url: string | null
          id: string
          linkedin_url: string | null
          notice_period: string | null
          resume_url: string | null
          target_role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          current_position?: string | null
          experience?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          notice_period?: string | null
          resume_url?: string | null
          target_role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          current_position?: string | null
          experience?: string | null
          github_url?: string | null
          id?: string
          linkedin_url?: string | null
          notice_period?: string | null
          resume_url?: string | null
          target_role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interviewer_financial_data: {
        Row: {
          account_holder_name: string | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bank_name: string | null
          created_at: string
          data_hash: string | null
          id: string
          interviewer_id: string
          payout_details_locked: boolean | null
          payout_details_submitted_at: string | null
          payout_details_verified: boolean | null
          payout_method: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          account_holder_name?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          created_at?: string
          data_hash?: string | null
          id?: string
          interviewer_id: string
          payout_details_locked?: boolean | null
          payout_details_submitted_at?: string | null
          payout_details_verified?: boolean | null
          payout_method?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          account_holder_name?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          created_at?: string
          data_hash?: string | null
          id?: string
          interviewer_id?: string
          payout_details_locked?: boolean | null
          payout_details_submitted_at?: string | null
          payout_details_verified?: boolean | null
          payout_method?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviewer_financial_data_interviewer_id_fkey"
            columns: ["interviewer_id"]
            isOneToOne: true
            referencedRelation: "interviewers"
            referencedColumns: ["id"]
          },
        ]
      }
      interviewer_time_blocks: {
        Row: {
          block_reason: string
          blocked_date: string
          created_at: string
          end_time: string
          id: string
          interview_id: string | null
          interviewer_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          block_reason?: string
          blocked_date: string
          created_at?: string
          end_time: string
          id?: string
          interview_id?: string | null
          interviewer_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          block_reason?: string
          blocked_date?: string
          created_at?: string
          end_time?: string
          id?: string
          interview_id?: string | null
          interviewer_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_interviewer_time_blocks_interview_id"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "interviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_interviewer_time_blocks_interviewer_id"
            columns: ["interviewer_id"]
            isOneToOne: false
            referencedRelation: "interviewers"
            referencedColumns: ["id"]
          },
        ]
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
          id: string
          is_eligible: boolean
          linkedin_url: string | null
          payout_details_locked: boolean | null
          payout_details_submitted_at: string | null
          payout_details_verified: boolean | null
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
          id?: string
          is_eligible?: boolean
          linkedin_url?: string | null
          payout_details_locked?: boolean | null
          payout_details_submitted_at?: string | null
          payout_details_verified?: boolean | null
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
          id?: string
          is_eligible?: boolean
          linkedin_url?: string | null
          payout_details_locked?: boolean | null
          payout_details_submitted_at?: string | null
          payout_details_verified?: boolean | null
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
          feedback_submitted: boolean
          google_calendar_event_id: string | null
          google_meet_link: string | null
          id: string
          interviewer_email: string
          interviewer_id: string
          interviewer_name: string | null
          reminder_emails_sent: Json | null
          resume_url: string | null
          scheduled_time: string
          specific_skills: string[] | null
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
          feedback_submitted?: boolean
          google_calendar_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          interviewer_email: string
          interviewer_id: string
          interviewer_name?: string | null
          reminder_emails_sent?: Json | null
          resume_url?: string | null
          scheduled_time: string
          specific_skills?: string[] | null
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
          feedback_submitted?: boolean
          google_calendar_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          interviewer_email?: string
          interviewer_id?: string
          interviewer_name?: string | null
          reminder_emails_sent?: Json | null
          resume_url?: string | null
          scheduled_time?: string
          specific_skills?: string[] | null
          status?: string
          target_role?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_sessions: {
        Row: {
          amount: number
          candidate_data: Json
          cashfree_order_id: string | null
          cashfree_payment_id: string | null
          created_at: string
          currency: string
          id: string
          interview_matched: boolean
          payment_status: string
          updated_at: string
          user_id: string
          selected_plan: string | null
          interview_duration: number | null
          plan_details: Json | null
          matched_interviewer: Json | null,
      interviewer_id: string | null,
      selected_time_slot: string | null,
      selected_date: string | null,
      plan_duration: number | null,
      match_score: number | null
        }
        Insert: {
          amount: number
          candidate_data: Json
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          interview_matched?: boolean
          payment_status?: string
          updated_at?: string
          user_id: string
          selected_plan?: string | null
          interview_duration?: number | null
          plan_details?: Json | null
          matched_interviewer?: Json | null
        }
        Update: {
          amount?: number
          candidate_data?: Json
          cashfree_order_id?: string | null
          cashfree_payment_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          interview_matched?: boolean
          payment_status?: string
          updated_at?: string
          user_id?: string
          selected_plan?: string | null
          interview_duration?: number | null
          plan_details?: Json | null
          matched_interviewer?: Json | null
          interviewer_id?: string | null
          selected_time_slot?: string | null
          selected_date?: string | null
          plan_duration?: number | null
          match_score?: number | null
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
      decrypt_financial_data: {
        Args: { encrypted_data: string; encryption_key?: string }
        Returns: string
      }
      encrypt_financial_data: {
        Args: { data_text: string; encryption_key?: string }
        Returns: string
      }
      get_my_payout_details: {
        Args: Record<PropertyKey, never>
        Returns: {
          account_holder_name: string
          bank_account_number: string
          bank_ifsc_code: string
          bank_name: string
          payout_details_locked: boolean
          payout_details_submitted_at: string
          payout_details_verified: boolean
          payout_method: string
          upi_id: string
        }[]
      }
      get_safe_interviewer_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          availability_days: string[]
          bio: string
          company: string
          created_at: string
          current_available_date: string
          current_time_slots: Json
          experience_years: number
          github_url: string
          id: string
          is_eligible: boolean
          job_position: string
          linkedin_url: string
          schedule_last_updated: string
          skills: string[]
          technologies: string[]
          time_slots: Json
          updated_at: string
          user_id: string
        }[]
      }
      get_safe_profile_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }[]
      }
      update_my_payout_details: {
        Args: {
          p_account_holder_name?: string
          p_bank_account_number?: string
          p_bank_ifsc_code?: string
          p_bank_name?: string
          p_payout_method: string
          p_upi_id?: string
        }
        Returns: boolean
      }
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
