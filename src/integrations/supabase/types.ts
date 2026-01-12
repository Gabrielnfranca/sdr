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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          active: boolean | null
          contacts_sent: number | null
          created_at: string
          description: string | null
          follow_up_1_delay: number | null
          follow_up_1_template: string | null
          follow_up_2_delay: number | null
          follow_up_2_template: string | null
          id: string
          initial_email_template: string | null
          interests_detected: number | null
          leads_count: number | null
          name: string
          responses_received: number | null
          target_city: string | null
          target_segment: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          contacts_sent?: number | null
          created_at?: string
          description?: string | null
          follow_up_1_delay?: number | null
          follow_up_1_template?: string | null
          follow_up_2_delay?: number | null
          follow_up_2_template?: string | null
          id?: string
          initial_email_template?: string | null
          interests_detected?: number | null
          leads_count?: number | null
          name: string
          responses_received?: number | null
          target_city?: string | null
          target_segment?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          contacts_sent?: number | null
          created_at?: string
          description?: string | null
          follow_up_1_delay?: number | null
          follow_up_1_template?: string | null
          follow_up_2_delay?: number | null
          follow_up_2_template?: string | null
          id?: string
          initial_email_template?: string | null
          interests_detected?: number | null
          leads_count?: number | null
          name?: string
          responses_received?: number | null
          target_city?: string | null
          target_segment?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_logs: {
        Row: {
          channel: string
          content: string | null
          created_at: string
          delivered_at: string | null
          direction: string
          id: string
          interest_detected: boolean | null
          interest_keywords: string[] | null
          lead_id: string
          message_type: string
          opened_at: string | null
          responded_at: string | null
          response_content: string | null
          sent_at: string | null
          subject: string | null
          tenant_id: string
        }
        Insert: {
          channel: string
          content?: string | null
          created_at?: string
          delivered_at?: string | null
          direction: string
          id?: string
          interest_detected?: boolean | null
          interest_keywords?: string[] | null
          lead_id: string
          message_type: string
          opened_at?: string | null
          responded_at?: string | null
          response_content?: string | null
          sent_at?: string | null
          subject?: string | null
          tenant_id: string
        }
        Update: {
          channel?: string
          content?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          id?: string
          interest_detected?: boolean | null
          interest_keywords?: string[] | null
          lead_id?: string
          message_type?: string
          opened_at?: string | null
          responded_at?: string | null
          response_content?: string | null
          sent_at?: string | null
          subject?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_default: boolean | null
          message_type: string
          name: string
          site_classification:
            | Database["public"]["Enums"]["site_classification"]
            | null
          subject: string
          tenant_id: string
          updated_at: string
          variables: Json | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          message_type: string
          name: string
          site_classification?:
            | Database["public"]["Enums"]["site_classification"]
            | null
          subject: string
          tenant_id: string
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          message_type?: string
          name?: string
          site_classification?:
            | Database["public"]["Enums"]["site_classification"]
            | null
          subject?: string
          tenant_id?: string
          updated_at?: string
          variables?: Json | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          automation_paused: boolean | null
          city: string | null
          company_name: string
          contact_attempts: number | null
          created_at: string
          email: string | null
          id: string
          last_contact_date: string | null
          notes: string | null
          opted_out: boolean | null
          opted_out_date: string | null
          phone: string | null
          score: number | null
          segment: string | null
          site_active: boolean | null
          site_analysis_date: string | null
          site_classification:
            | Database["public"]["Enums"]["site_classification"]
            | null
          site_indexed: boolean | null
          site_performance_score: number | null
          source: Database["public"]["Enums"]["lead_source"]
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[] | null
          tenant_id: string
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          automation_paused?: boolean | null
          city?: string | null
          company_name: string
          contact_attempts?: number | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          opted_out?: boolean | null
          opted_out_date?: string | null
          phone?: string | null
          score?: number | null
          segment?: string | null
          site_active?: boolean | null
          site_analysis_date?: string | null
          site_classification?:
            | Database["public"]["Enums"]["site_classification"]
            | null
          site_indexed?: boolean | null
          site_performance_score?: number | null
          source?: Database["public"]["Enums"]["lead_source"]
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          tenant_id: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          automation_paused?: boolean | null
          city?: string | null
          company_name?: string
          contact_attempts?: number | null
          created_at?: string
          email?: string | null
          id?: string
          last_contact_date?: string | null
          notes?: string | null
          opted_out?: boolean | null
          opted_out_date?: string | null
          phone?: string | null
          score?: number | null
          segment?: string | null
          site_active?: boolean | null
          site_analysis_date?: string | null
          site_classification?:
            | Database["public"]["Enums"]["site_classification"]
            | null
          site_indexed?: boolean | null
          site_performance_score?: number | null
          source?: Database["public"]["Enums"]["lead_source"]
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: string | null
          status: string | null
          task_type: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          status?: string | null
          task_type: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string | null
          status?: string | null
          task_type?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      lead_source: "google_maps" | "csv_import" | "manual"
      lead_status:
        | "lead_novo"
        | "contato_automatico_enviado"
        | "follow_up_1"
        | "follow_up_2"
        | "lead_engajado"
        | "lead_com_interesse"
        | "atendimento_humano"
        | "perdido"
      site_classification:
        | "sem_site"
        | "site_fraco"
        | "site_sem_seo"
        | "site_ok"
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
      lead_source: ["google_maps", "csv_import", "manual"],
      lead_status: [
        "lead_novo",
        "contato_automatico_enviado",
        "follow_up_1",
        "follow_up_2",
        "lead_engajado",
        "lead_com_interesse",
        "atendimento_humano",
        "perdido",
      ],
      site_classification: [
        "sem_site",
        "site_fraco",
        "site_sem_seo",
        "site_ok",
      ],
    },
  },
} as const
