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
      analytics_rollups: {
        Row: {
          active_campaigns: number
          avg_engagement: number
          campaign_count: number
          org_id: string
          total_reach: number
          total_spend: number
          updated_at: string
        }
        Insert: {
          active_campaigns?: number
          avg_engagement?: number
          campaign_count?: number
          org_id: string
          total_reach?: number
          total_spend?: number
          updated_at?: string
        }
        Update: {
          active_campaigns?: number
          avg_engagement?: number
          campaign_count?: number
          org_id?: string
          total_reach?: number
          total_spend?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_rollups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          business_name: string | null
          category: string | null
          contact_email: string | null
          contact_person: string | null
          created_at: string
          description: string | null
          instagram: string | null
          location: string | null
          logo_url: string | null
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          business_name?: string | null
          category?: string | null
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          instagram?: string | null
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          business_name?: string | null
          category?: string | null
          contact_email?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          instagram?: string | null
          location?: string | null
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          brief: string
          budget: number
          created_at: string
          created_by: string
          currency: string
          ends_at: string | null
          engagement_rate: number
          goal: string | null
          id: string
          name: string
          org_id: string
          reach: number
          spend: number
          starts_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          updated_at: string
        }
        Insert: {
          brief?: string
          budget?: number
          created_at?: string
          created_by: string
          currency?: string
          ends_at?: string | null
          engagement_rate?: number
          goal?: string | null
          id?: string
          name: string
          org_id: string
          reach?: number
          spend?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Update: {
          brief?: string
          budget?: number
          created_at?: string
          created_by?: string
          currency?: string
          ends_at?: string | null
          engagement_rate?: number
          goal?: string | null
          id?: string
          name?: string
          org_id?: string
          reach?: number
          spend?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          avatar_url: string | null
          created_at: string
          engagement_rate: number | null
          followers: number | null
          handle: string | null
          id: string
          last_synced_at: string | null
          metadata: Json
          platform: string
          profile_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          handle?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          platform: string
          profile_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          handle?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          platform?: string
          profile_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          brand_last_read_at: string | null
          brand_user_id: string
          campaign_id: string | null
          created_at: string
          creator_last_read_at: string | null
          creator_user_id: string
          deal_id: string | null
          id: string
          last_message_at: string | null
        }
        Insert: {
          brand_last_read_at?: string | null
          brand_user_id: string
          campaign_id?: string | null
          created_at?: string
          creator_last_read_at?: string | null
          creator_user_id: string
          deal_id?: string | null
          id?: string
          last_message_at?: string | null
        }
        Update: {
          brand_last_read_at?: string | null
          brand_user_id?: string
          campaign_id?: string | null
          created_at?: string
          creator_last_read_at?: string | null
          creator_user_id?: string
          deal_id?: string | null
          id?: string
          last_message_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_collaborators: {
        Row: {
          collaborator_user_id: string
          created_at: string
          creator_user_id: string
          id: string
          role: string
        }
        Insert: {
          collaborator_user_id: string
          created_at?: string
          creator_user_id: string
          id?: string
          role?: string
        }
        Update: {
          collaborator_user_id?: string
          created_at?: string
          creator_user_id?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      creator_list_items: {
        Row: {
          added_at: string
          creator_user_id: string
          list_id: string
        }
        Insert: {
          added_at?: string
          creator_user_id: string
          list_id: string
        }
        Update: {
          added_at?: string
          creator_user_id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "creator_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_lists: {
        Row: {
          accent: Database["public"]["Enums"]["creator_accent"]
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          accent?: Database["public"]["Enums"]["creator_accent"]
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          accent?: Database["public"]["Enums"]["creator_accent"]
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_profiles: {
        Row: {
          accent: Database["public"]["Enums"]["creator_accent"]
          avatar_url: string | null
          avg_rate: number
          bio: string | null
          created_at: string
          display_name: string | null
          engagement_rate: number
          follower_range: string | null
          followers: number
          handle: string | null
          location: string | null
          match_score: number
          niche: string | null
          primary_platform: string | null
          socials: Json
          tags: string[]
          tiktok_handle: string | null
          updated_at: string
          user_id: string
          username: string | null
          youtube_channel: string | null
        }
        Insert: {
          accent?: Database["public"]["Enums"]["creator_accent"]
          avatar_url?: string | null
          avg_rate?: number
          bio?: string | null
          created_at?: string
          display_name?: string | null
          engagement_rate?: number
          follower_range?: string | null
          followers?: number
          handle?: string | null
          location?: string | null
          match_score?: number
          niche?: string | null
          primary_platform?: string | null
          socials?: Json
          tags?: string[]
          tiktok_handle?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          youtube_channel?: string | null
        }
        Update: {
          accent?: Database["public"]["Enums"]["creator_accent"]
          avatar_url?: string | null
          avg_rate?: number
          bio?: string | null
          created_at?: string
          display_name?: string | null
          engagement_rate?: number
          follower_range?: string | null
          followers?: number
          handle?: string | null
          location?: string | null
          match_score?: number
          niche?: string | null
          primary_platform?: string | null
          socials?: Json
          tags?: string[]
          tiktok_handle?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          youtube_channel?: string | null
        }
        Relationships: []
      }
      deal_events: {
        Row: {
          actor_id: string | null
          created_at: string
          deal_id: string
          id: string
          kind: string
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          deal_id: string
          id?: string
          kind: string
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          kind?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "deal_events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          campaign_id: string
          contract_status: Database["public"]["Enums"]["contract_status"]
          counter: number | null
          created_at: string
          creator_user_id: string
          deliverables: Json
          id: string
          offer: number
          stage: Database["public"]["Enums"]["deal_stage"]
          updated_at: string
        }
        Insert: {
          campaign_id: string
          contract_status?: Database["public"]["Enums"]["contract_status"]
          counter?: number | null
          created_at?: string
          creator_user_id: string
          deliverables?: Json
          id?: string
          offer?: number
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          contract_status?: Database["public"]["Enums"]["contract_status"]
          counter?: number | null
          created_at?: string
          creator_user_id?: string
          deliverables?: Json
          id?: string
          offer?: number
          stage?: Database["public"]["Enums"]["deal_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          creator_user_id: string | null
          expires_at: string
          id: string
          invited_by: string
          invited_email: string
          org_id: string | null
          role: string
          scope: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          creator_user_id?: string | null
          expires_at?: string
          id?: string
          invited_by: string
          invited_email: string
          org_id?: string | null
          role: string
          scope: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          creator_user_id?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          org_id?: string | null
          role?: string
          scope?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      iris_messages: {
        Row: {
          created_at: string
          id: string
          parts: Json
          role: string
          thread_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parts?: Json
          role: string
          thread_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parts?: Json
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "iris_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "iris_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      iris_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: Database["public"]["Enums"]["msg_sender_role"]
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role: Database["public"]["Enums"]["msg_sender_role"]
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["msg_sender_role"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_seen_at: string | null
          onboarding_completed_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_seen_at?: string | null
          onboarding_completed_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          onboarding_completed_at?: string | null
          updated_at?: string
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
      refresh_analytics_rollups: {
        Args: { _org_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "brand" | "creator" | "admin"
      campaign_status: "draft" | "live" | "review" | "completed" | "archived"
      contract_status: "none" | "draft" | "sent" | "signed"
      creator_accent: "violet" | "rose"
      deal_stage:
        | "invited"
        | "negotiating"
        | "agreed"
        | "in_production"
        | "delivered"
        | "cancelled"
      msg_sender_role: "brand" | "creator" | "iris"
      notification_kind: "message" | "deal_update" | "invitation" | "system"
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
      app_role: ["brand", "creator", "admin"],
      campaign_status: ["draft", "live", "review", "completed", "archived"],
      contract_status: ["none", "draft", "sent", "signed"],
      creator_accent: ["violet", "rose"],
      deal_stage: [
        "invited",
        "negotiating",
        "agreed",
        "in_production",
        "delivered",
        "cancelled",
      ],
      msg_sender_role: ["brand", "creator", "iris"],
      notification_kind: ["message", "deal_update", "invitation", "system"],
    },
  },
} as const
