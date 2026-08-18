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
      chat_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_role: string
          sender_user_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_role: string
          sender_user_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_role?: string
          sender_user_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          captain_user_id: string | null
          created_at: string
          customer_user_id: string | null
          id: string
          kind: string
          order_id: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          captain_user_id?: string | null
          created_at?: string
          customer_user_id?: string | null
          id?: string
          kind: string
          order_id?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          captain_user_id?: string | null
          created_at?: string
          customer_user_id?: string | null
          id?: string
          kind?: string
          order_id?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_blocks: {
        Row: {
          blocked_until: string | null
          created_at: string
          customer_user_id: string
          ghost_cancel_count: number
          reason: string
          updated_at: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          customer_user_id: string
          ghost_cancel_count?: number
          reason: string
          updated_at?: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          customer_user_id?: string
          ghost_cancel_count?: number
          reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_cancellations: {
        Row: {
          after_seconds: number | null
          captain_was_enroute: boolean
          created_at: string
          customer_user_id: string
          id: string
          order_id: string | null
          reason: string | null
        }
        Insert: {
          after_seconds?: number | null
          captain_was_enroute?: boolean
          created_at?: string
          customer_user_id: string
          id?: string
          order_id?: string | null
          reason?: string | null
        }
        Update: {
          after_seconds?: number | null
          captain_was_enroute?: boolean
          created_at?: string
          customer_user_id?: string
          id?: string
          order_id?: string | null
          reason?: string | null
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
      order_verifications: {
        Row: {
          bypass_reason: string | null
          captain_role: string | null
          captain_user_id: string | null
          cargo_only: boolean
          created_at: string
          delivered_at: string | null
          delivery_photo_url: string | null
          id: string
          meta: Json
          order_id: string
          otp_attempts: number
          otp_code_hash: string | null
          otp_verified_at: string | null
          pickup_at: string | null
          pickup_photo_url: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          bypass_reason?: string | null
          captain_role?: string | null
          captain_user_id?: string | null
          cargo_only?: boolean
          created_at?: string
          delivered_at?: string | null
          delivery_photo_url?: string | null
          id?: string
          meta?: Json
          order_id: string
          otp_attempts?: number
          otp_code_hash?: string | null
          otp_verified_at?: string | null
          pickup_at?: string | null
          pickup_photo_url?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          bypass_reason?: string | null
          captain_role?: string | null
          captain_user_id?: string | null
          cargo_only?: boolean
          created_at?: string
          delivered_at?: string | null
          delivery_photo_url?: string | null
          id?: string
          meta?: Json
          order_id?: string
          otp_attempts?: number
          otp_code_hash?: string | null
          otp_verified_at?: string | null
          pickup_at?: string | null
          pickup_photo_url?: string | null
          updated_at?: string
          weight_kg?: number | null
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
      settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      shift_bookings: {
        Row: {
          captain_user_id: string
          created_at: string
          id: string
          shift_id: string
          status: string
          updated_at: string
        }
        Insert: {
          captain_user_id: string
          created_at?: string
          id?: string
          shift_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          captain_user_id?: string
          created_at?: string
          id?: string
          shift_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_bookings_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          booked_count: number
          capacity: number
          center: string | null
          created_at: string
          ends_at: string
          fleet: string
          governorate: string | null
          id: string
          notes: string | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          booked_count?: number
          capacity?: number
          center?: string | null
          created_at?: string
          ends_at: string
          fleet: string
          governorate?: string | null
          id?: string
          notes?: string | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          booked_count?: number
          capacity?: number
          center?: string | null
          created_at?: string
          ends_at?: string
          fleet?: string
          governorate?: string | null
          id?: string
          notes?: string | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          categories: Json
          created_at: string
          first_seen: string
          last_greeted: string | null
          updated_at: string
          user_id: string
          visits: number
        }
        Insert: {
          categories?: Json
          created_at?: string
          first_seen?: string
          last_greeted?: string | null
          updated_at?: string
          user_id: string
          visits?: number
        }
        Update: {
          categories?: Json
          created_at?: string
          first_seen?: string
          last_greeted?: string | null
          updated_at?: string
          user_id?: string
          visits?: number
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
      wallets: {
        Row: {
          actor_id: string
          actor_kind: string
          balance: number
          cash_in_hand: number
          credit_limit: number
          currency: string
          id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          actor_id: string
          actor_kind: string
          balance?: number
          cash_in_hand?: number
          credit_limit?: number
          currency?: string
          id?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          actor_id?: string
          actor_kind?: string
          balance?: number
          cash_in_hand?: number
          credit_limit?: number
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
