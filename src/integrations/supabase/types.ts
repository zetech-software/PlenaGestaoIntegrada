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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      anamneses: {
        Row: {
          created_at: string
          development: string
          expectations: string
          family: string
          gestation: string
          health: string
          id: string
          main_complaint: string
          referral: string
          school: string
          specialty: string
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          development?: string
          expectations?: string
          family?: string
          gestation?: string
          health?: string
          id?: string
          main_complaint: string
          referral?: string
          school?: string
          specialty: string
          student_id: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          development?: string
          expectations?: string
          family?: string
          gestation?: string
          health?: string
          id?: string
          main_complaint?: string
          referral?: string
          school?: string
          specialty?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamneses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamneses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          at: string
          detail: string
          id: string
          resource: string
          role: string
          student_id: string | null
          tenant_id: string
          user_email: string
          user_id: string
        }
        Insert: {
          action: string
          at?: string
          detail?: string
          id?: string
          resource: string
          role?: string
          student_id?: string | null
          tenant_id?: string
          user_email?: string
          user_id?: string
        }
        Update: {
          action?: string
          at?: string
          detail?: string
          id?: string
          resource?: string
          role?: string
          student_id?: string | null
          tenant_id?: string
          user_email?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          active: boolean
          created_at: string
          duration_days: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_days: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_days?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      charges: {
        Row: {
          amount_cents: number
          created_at: string
          description: string
          due_date: string
          id: string
          method: string | null
          paid_on: string | null
          status: string
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description: string
          due_date: string
          id?: string
          method?: string | null
          paid_on?: string | null
          status?: string
          student_id: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          method?: string | null
          paid_on?: string | null
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "charges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "charges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          created_at: string
          granted_on: string
          guardian: string
          id: string
          purpose: string
          revoked_on: string | null
          student_id: string
          tenant_id: string
          term_version: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          granted_on?: string
          guardian: string
          id?: string
          purpose: string
          revoked_on?: string | null
          student_id: string
          tenant_id?: string
          term_version?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          granted_on?: string
          guardian?: string
          id?: string
          purpose?: string
          revoked_on?: string | null
          student_id?: string
          tenant_id?: string
          term_version?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      intervention_plans: {
        Row: {
          created_at: string
          id: string
          kind: string
          review_date: string
          specialty: string
          start_date: string
          status: string
          student_id: string
          summary: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          review_date: string
          specialty: string
          start_date: string
          status?: string
          student_id: string
          summary?: string
          tenant_id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          review_date?: string
          specialty?: string
          start_date?: string
          status?: string
          student_id?: string
          summary?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intervention_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_goals: {
        Row: {
          created_at: string
          deadline: string
          description: string
          id: string
          plan_id: string
          position: number
          progress: number
          strategy: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline: string
          description: string
          id?: string
          plan_id: string
          position?: number
          progress?: number
          strategy?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string
          description?: string
          id?: string
          plan_id?: string
          position?: number
          progress?: number
          strategy?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_goals_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "intervention_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      record_entries: {
        Row: {
          activities: string
          created_at: string
          date: string
          evolution: string
          id: string
          next_steps: string
          objectives: string
          observations: string
          specialty: string
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          activities?: string
          created_at?: string
          date: string
          evolution: string
          id?: string
          next_steps?: string
          objectives: string
          observations: string
          specialty: string
          student_id: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          activities?: string
          created_at?: string
          date?: string
          evolution?: string
          id?: string
          next_steps?: string
          objectives?: string
          observations?: string
          specialty?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          date: string
          duration: number
          id: string
          start: string
          status: string
          student_id: string
          tenant_id: string
          therapist_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          duration: number
          id?: string
          start: string
          status?: string
          student_id: string
          tenant_id?: string
          therapist_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          duration?: number
          id?: string
          start?: string
          status?: string
          student_id?: string
          tenant_id?: string
          therapist_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_assignments: {
        Row: {
          created_at: string
          student_id: string
          student_ref: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          student_id?: string
          student_ref?: string | null
          tenant_id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          student_id?: string
          student_ref?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_assignments_student_ref_fkey"
            columns: ["student_ref"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          birth_date: string
          created_at: string
          email: string
          grade: string
          guardian: string
          id: string
          name: string
          notes: string
          phone: string
          relationship: string
          school: string
          start_date: string
          status: string
          tenant_id: string
          tone: string
          updated_at: string
        }
        Insert: {
          birth_date: string
          created_at?: string
          email?: string
          grade?: string
          guardian?: string
          id?: string
          name: string
          notes?: string
          phone?: string
          relationship?: string
          school?: string
          start_date?: string
          status?: string
          tenant_id?: string
          tone?: string
          updated_at?: string
        }
        Update: {
          birth_date?: string
          created_at?: string
          email?: string
          grade?: string
          guardian?: string
          id?: string
          name?: string
          notes?: string
          phone?: string
          relationship?: string
          school?: string
          start_date?: string
          status?: string
          tenant_id?: string
          tone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          created_on: string
          document: string
          id: string
          kind: string
          name: string
          owner_email: string
          owner_name: string
          phone: string
          plan_id: string | null
          registration: string
          seats: number
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_on?: string
          document: string
          id?: string
          kind: string
          name: string
          owner_email: string
          owner_name?: string
          phone?: string
          plan_id?: string | null
          registration?: string
          seats?: number
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_on?: string
          document?: string
          id?: string
          kind?: string
          name?: string
          owner_email?: string
          owner_name?: string
          phone?: string
          plan_id?: string | null
          registration?: string
          seats?: number
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          created_at: string
          created_on: string
          id: string
          notes: string
          period: string
          specialty: string
          status: string
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_on?: string
          id?: string
          notes?: string
          period?: string
          specialty: string
          status?: string
          student_id: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_on?: string
          id?: string
          notes?: string
          period?: string
          specialty?: string
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_see_student: { Args: { _student_id: string }; Returns: boolean }
      create_session_series: {
        Args: { _sessions: Json }
        Returns: {
          created_at: string
          date: string
          duration: number
          id: string
          start: string
          status: string
          student_id: string
          tenant_id: string
          therapist_id: string
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "sessions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      current_tenant_id: { Args: never; Returns: string }
      current_term_version: { Args: never; Returns: string }
      has_active_consent: {
        Args: { _purpose: string; _student_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      in_my_tenant: { Args: { _user_id: string }; Returns: boolean }
      is_platform_operator: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_tenant_admin: { Args: never; Returns: boolean }
      list_therapists: {
        Args: never
        Returns: {
          full_name: string
          id: string
        }[]
      }
      staff_sees_member: { Args: { _user_id: string }; Returns: boolean }
      tenant_is_active: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "terapeuta" | "clinica" | "plataforma"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "terapeuta", "clinica", "plataforma"],
    },
  },
} as const
