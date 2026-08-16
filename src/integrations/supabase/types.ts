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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action_type: string
          created_at: string
          details: string
          id: string
          owner_id: string
          partner_name: string
          partner_nid: string
          seq: number
        }
        Insert: {
          action_type: string
          created_at?: string
          details: string
          id?: string
          owner_id: string
          partner_name: string
          partner_nid: string
          seq: number
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: string
          id?: string
          owner_id?: string
          partner_name?: string
          partner_nid?: string
          seq?: number
        }
        Relationships: []
      }
      medical_bookings: {
        Row: {
          branch_id: string
          client_id: string | null
          created_at: string
          customer_name: string
          customer_phone: string | null
          date_iso: string
          id: string
          owner_id: string
          paid: boolean
          price: number
          provider_id: string
          service: string
          updated_at: string
        }
        Insert: {
          branch_id: string
          client_id?: string | null
          created_at?: string
          customer_name: string
          customer_phone?: string | null
          date_iso: string
          id?: string
          owner_id: string
          paid?: boolean
          price?: number
          provider_id: string
          service: string
          updated_at?: string
        }
        Update: {
          branch_id?: string
          client_id?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string | null
          date_iso?: string
          id?: string
          owner_id?: string
          paid?: boolean
          price?: number
          provider_id?: string
          service?: string
          updated_at?: string
        }
        Relationships: []
      }
      monthly_closures: {
        Row: {
          cash_collected: number
          created_at: string
          debts_deducted: number
          digital: number
          gross_commission: number
          id: string
          month: string
          net_settlement: number
          owner_id: string
          paid: boolean
          paid_at: string | null
          partner_name: string
          partner_nid: string
          updated_at: string
        }
        Insert: {
          cash_collected?: number
          created_at?: string
          debts_deducted?: number
          digital?: number
          gross_commission?: number
          id?: string
          month: string
          net_settlement?: number
          owner_id: string
          paid?: boolean
          paid_at?: string | null
          partner_name: string
          partner_nid: string
          updated_at?: string
        }
        Update: {
          cash_collected?: number
          created_at?: string
          debts_deducted?: number
          digital?: number
          gross_commission?: number
          id?: string
          month?: string
          net_settlement?: number
          owner_id?: string
          paid?: boolean
          paid_at?: string | null
          partner_name?: string
          partner_nid?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          client_id: string | null
          country_code: string | null
          created_at: string
          customer: string
          dest_zone: string | null
          distance_km: number
          driver_id: string | null
          dropoff: string
          extra: Json
          fare_egp: number
          id: string
          merchant_id: string | null
          owner_id: string
          pickup: string
          service: string
          status: string
          stops: Json
          updated_at: string
          vehicle: string
          zone: string | null
        }
        Insert: {
          client_id?: string | null
          country_code?: string | null
          created_at?: string
          customer: string
          dest_zone?: string | null
          distance_km?: number
          driver_id?: string | null
          dropoff: string
          extra?: Json
          fare_egp?: number
          id?: string
          merchant_id?: string | null
          owner_id: string
          pickup: string
          service: string
          status?: string
          stops?: Json
          updated_at?: string
          vehicle: string
          zone?: string | null
        }
        Update: {
          client_id?: string | null
          country_code?: string | null
          created_at?: string
          customer?: string
          dest_zone?: string | null
          distance_km?: number
          driver_id?: string | null
          dropoff?: string
          extra?: Json
          fare_egp?: number
          id?: string
          merchant_id?: string | null
          owner_id?: string
          pickup?: string
          service?: string
          status?: string
          stops?: Json
          updated_at?: string
          vehicle?: string
          zone?: string | null
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          center: string | null
          client_id: string | null
          created_at: string
          governorate: string | null
          id: string
          kind: string
          name: string
          owner_id: string
          partner_nid: string
          payload: Json
          phone: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          center?: string | null
          client_id?: string | null
          created_at?: string
          governorate?: string | null
          id?: string
          kind: string
          name: string
          owner_id: string
          partner_nid: string
          payload?: Json
          phone?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          center?: string | null
          client_id?: string | null
          created_at?: string
          governorate?: string | null
          id?: string
          kind?: string
          name?: string
          owner_id?: string
          partner_nid?: string
          payload?: Json
          phone?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_inbox: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          kind: string
          owner_id: string
          partner_nid: string
          password: string | null
          reason: string | null
          target_name: string
          target_role: string
          username: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          kind: string
          owner_id: string
          partner_nid: string
          password?: string | null
          reason?: string | null
          target_name: string
          target_role: string
          username?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          owner_id?: string
          partner_nid?: string
          password?: string | null
          reason?: string | null
          target_name?: string
          target_role?: string
          username?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          actor_id: string
          actor_kind: string
          balance: number
          currency: string
          id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          actor_id: string
          actor_kind: string
          balance?: number
          currency?: string
          id?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          actor_id?: string
          actor_kind?: string
          balance?: number
          currency?: string
          id?: string
          owner_id?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
