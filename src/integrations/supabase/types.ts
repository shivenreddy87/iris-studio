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
      achievement_definitions: {
        Row: {
          code: string
          created_at: string
          description: string
          icon: string | null
          sort_order: number
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          icon?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          icon?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      activity_feed: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          summary: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          summary: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          summary?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          previous_values: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          previous_values?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          previous_values?: Json | null
          user_agent?: string | null
        }
        Relationships: []
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
      campaign_request_events: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          internal: boolean
          kind: string
          note: string | null
          request_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          internal?: boolean
          kind: string
          note?: string | null
          request_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          internal?: boolean
          kind?: string
          note?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "campaign_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_requests: {
        Row: {
          approval_reference: string | null
          attachment_url: string | null
          budget: number | null
          business_category: string | null
          business_id: string
          campaign_description: string | null
          campaign_goal: string | null
          created_at: string
          duration_days: number | null
          id: string
          maximum_followers: number | null
          minimum_followers: number | null
          preferred_creator_category: string | null
          required_views: number | null
          review_notes: string | null
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["campaign_request_status"]
          submitted_at: string | null
          target_audience: string | null
          target_location: string | null
          target_platform: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approval_reference?: string | null
          attachment_url?: string | null
          budget?: number | null
          business_category?: string | null
          business_id: string
          campaign_description?: string | null
          campaign_goal?: string | null
          created_at?: string
          duration_days?: number | null
          id?: string
          maximum_followers?: number | null
          minimum_followers?: number | null
          preferred_creator_category?: string | null
          required_views?: number | null
          review_notes?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["campaign_request_status"]
          submitted_at?: string | null
          target_audience?: string | null
          target_location?: string | null
          target_platform?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          approval_reference?: string | null
          attachment_url?: string | null
          budget?: number | null
          business_category?: string | null
          business_id?: string
          campaign_description?: string | null
          campaign_goal?: string | null
          created_at?: string
          duration_days?: number | null
          id?: string
          maximum_followers?: number | null
          minimum_followers?: number | null
          preferred_creator_category?: string | null
          required_views?: number | null
          review_notes?: string | null
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["campaign_request_status"]
          submitted_at?: string | null
          target_audience?: string | null
          target_location?: string | null
          target_platform?: string | null
          title?: string
          updated_at?: string
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
          connection_status: string
          created_at: string
          engagement_rate: number | null
          followers: number | null
          handle: string | null
          id: string
          is_primary: boolean
          last_synced_at: string | null
          metadata: Json
          platform: string
          profile_url: string | null
          provider_user_id: string | null
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
          verification_code: string | null
          verification_requested_at: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          connection_status?: string
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          handle?: string | null
          id?: string
          is_primary?: boolean
          last_synced_at?: string | null
          metadata?: Json
          platform: string
          profile_url?: string | null
          provider_user_id?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verification_code?: string | null
          verification_requested_at?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          connection_status?: string
          created_at?: string
          engagement_rate?: number | null
          followers?: number | null
          handle?: string | null
          id?: string
          is_primary?: boolean
          last_synced_at?: string | null
          metadata?: Json
          platform?: string
          profile_url?: string | null
          provider_user_id?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_code?: string | null
          verification_requested_at?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      contest_application_events: {
        Row: {
          actor_id: string | null
          application_id: string
          created_at: string
          event_type: string
          id: string
          note: string | null
        }
        Insert: {
          actor_id?: string | null
          application_id: string
          created_at?: string
          event_type: string
          id?: string
          note?: string | null
        }
        Update: {
          actor_id?: string | null
          application_id?: string
          created_at?: string
          event_type?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_application_events_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contest_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_applications: {
        Row: {
          content_idea: string
          contest_id: string
          created_at: string
          id: string
          influencer_id: string
          notes: string | null
          portfolio_url: string
          status: Database["public"]["Enums"]["contest_application_status"]
          submitted_at: string
          updated_at: string
          withdrawn_at: string | null
        }
        Insert: {
          content_idea: string
          contest_id: string
          created_at?: string
          id?: string
          influencer_id: string
          notes?: string | null
          portfolio_url: string
          status?: Database["public"]["Enums"]["contest_application_status"]
          submitted_at?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Update: {
          content_idea?: string
          contest_id?: string
          created_at?: string
          id?: string
          influencer_id?: string
          notes?: string | null
          portfolio_url?: string
          status?: Database["public"]["Enums"]["contest_application_status"]
          submitted_at?: string
          updated_at?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_applications_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contest_statistics"
            referencedColumns: ["contest_id"]
          },
          {
            foreignKeyName: "contest_applications_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_events: {
        Row: {
          actor_id: string | null
          contest_id: string
          created_at: string
          event_type: string
          id: string
          note: string | null
        }
        Insert: {
          actor_id?: string | null
          contest_id: string
          created_at?: string
          event_type: string
          id?: string
          note?: string | null
        }
        Update: {
          actor_id?: string | null
          contest_id?: string
          created_at?: string
          event_type?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_events_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contest_statistics"
            referencedColumns: ["contest_id"]
          },
          {
            foreignKeyName: "contest_events_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_participants: {
        Row: {
          activated_at: string | null
          application_id: string
          contest_id: string
          created_at: string
          id: string
          influencer_id: string
          participation_status: Database["public"]["Enums"]["participation_status"]
          selected_at: string
        }
        Insert: {
          activated_at?: string | null
          application_id: string
          contest_id: string
          created_at?: string
          id?: string
          influencer_id: string
          participation_status?: Database["public"]["Enums"]["participation_status"]
          selected_at?: string
        }
        Update: {
          activated_at?: string | null
          application_id?: string
          contest_id?: string
          created_at?: string
          id?: string
          influencer_id?: string
          participation_status?: Database["public"]["Enums"]["participation_status"]
          selected_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_participants_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "contest_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_participants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contest_statistics"
            referencedColumns: ["contest_id"]
          },
          {
            foreignKeyName: "contest_participants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_result_events: {
        Row: {
          actor_id: string | null
          contest_id: string
          created_at: string
          event_type: string
          id: string
          note: string | null
        }
        Insert: {
          actor_id?: string | null
          contest_id: string
          created_at?: string
          event_type: string
          id?: string
          note?: string | null
        }
        Update: {
          actor_id?: string | null
          contest_id?: string
          created_at?: string
          event_type?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_result_events_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contest_statistics"
            referencedColumns: ["contest_id"]
          },
          {
            foreignKeyName: "contest_result_events_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_reward_tiers: {
        Row: {
          contest_id: string
          created_at: string
          currency: string
          id: string
          maximum_views: number | null
          minimum_views: number
          reward_amount: number
          updated_at: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          currency?: string
          id?: string
          maximum_views?: number | null
          minimum_views: number
          reward_amount: number
          updated_at?: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          currency?: string
          id?: string
          maximum_views?: number | null
          minimum_views?: number
          reward_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_reward_tiers_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contest_statistics"
            referencedColumns: ["contest_id"]
          },
          {
            foreignKeyName: "contest_reward_tiers_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_submission_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          note: string | null
          submission_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          note?: string | null
          submission_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          note?: string | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_submission_events_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "contest_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_submissions: {
        Row: {
          caption: string | null
          comments: number
          content_url: string
          contest_id: string
          created_at: string
          engagement_rate: number
          id: string
          influencer_id: string
          likes: number
          metrics_last_synced_at: string | null
          metrics_source: string
          metrics_status: string
          notes: string | null
          participant_id: string
          platform: string
          reach: number | null
          review_notes: string | null
          review_score: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          shares: number
          submission_status: Database["public"]["Enums"]["contest_submission_status"]
          submitted_at: string
          updated_at: string
          views: number
        }
        Insert: {
          caption?: string | null
          comments?: number
          content_url: string
          contest_id: string
          created_at?: string
          engagement_rate?: number
          id?: string
          influencer_id: string
          likes?: number
          metrics_last_synced_at?: string | null
          metrics_source?: string
          metrics_status?: string
          notes?: string | null
          participant_id: string
          platform: string
          reach?: number | null
          review_notes?: string | null
          review_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shares?: number
          submission_status?: Database["public"]["Enums"]["contest_submission_status"]
          submitted_at?: string
          updated_at?: string
          views?: number
        }
        Update: {
          caption?: string | null
          comments?: number
          content_url?: string
          contest_id?: string
          created_at?: string
          engagement_rate?: number
          id?: string
          influencer_id?: string
          likes?: number
          metrics_last_synced_at?: string | null
          metrics_source?: string
          metrics_status?: string
          notes?: string | null
          participant_id?: string
          platform?: string
          reach?: number | null
          review_notes?: string | null
          review_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          shares?: number
          submission_status?: Database["public"]["Enums"]["contest_submission_status"]
          submitted_at?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "contest_submissions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contest_statistics"
            referencedColumns: ["contest_id"]
          },
          {
            foreignKeyName: "contest_submissions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_submissions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "contest_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_templates: {
        Row: {
          contest_brief: string | null
          contest_rules: string | null
          created_at: string
          created_by: string | null
          description: string | null
          eligibility: Json
          id: string
          is_active: boolean
          name: string
          participant_limit: number | null
          preferred_creator_category: string | null
          reward_pool: number | null
          target_platform: string | null
          updated_at: string
          winner_count: number | null
        }
        Insert: {
          contest_brief?: string | null
          contest_rules?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility?: Json
          id?: string
          is_active?: boolean
          name: string
          participant_limit?: number | null
          preferred_creator_category?: string | null
          reward_pool?: number | null
          target_platform?: string | null
          updated_at?: string
          winner_count?: number | null
        }
        Update: {
          contest_brief?: string | null
          contest_rules?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          eligibility?: Json
          id?: string
          is_active?: boolean
          name?: string
          participant_limit?: number | null
          preferred_creator_category?: string | null
          reward_pool?: number | null
          target_platform?: string | null
          updated_at?: string
          winner_count?: number | null
        }
        Relationships: []
      }
      contest_winners: {
        Row: {
          contest_id: string
          created_at: string
          final_score: number
          id: string
          influencer_id: string
          manual_score: number | null
          participant_id: string
          performance_score: number
          rank: number
          reward_amount: number | null
          reward_tier_id: string | null
          selected_at: string
          selected_by: string | null
          submission_id: string
          updated_at: string
          verified_views: number | null
          winner_notes: string | null
        }
        Insert: {
          contest_id: string
          created_at?: string
          final_score?: number
          id?: string
          influencer_id: string
          manual_score?: number | null
          participant_id: string
          performance_score?: number
          rank: number
          reward_amount?: number | null
          reward_tier_id?: string | null
          selected_at?: string
          selected_by?: string | null
          submission_id: string
          updated_at?: string
          verified_views?: number | null
          winner_notes?: string | null
        }
        Update: {
          contest_id?: string
          created_at?: string
          final_score?: number
          id?: string
          influencer_id?: string
          manual_score?: number | null
          participant_id?: string
          performance_score?: number
          rank?: number
          reward_amount?: number | null
          reward_tier_id?: string | null
          selected_at?: string
          selected_by?: string | null
          submission_id?: string
          updated_at?: string
          verified_views?: number | null
          winner_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_winners_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contest_statistics"
            referencedColumns: ["contest_id"]
          },
          {
            foreignKeyName: "contest_winners_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_winners_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "contest_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_winners_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "contest_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          application_deadline: string | null
          application_start_date: string | null
          archived_at: string | null
          attachment_url: string | null
          business_category: string | null
          business_id: string
          campaign_goal: string | null
          campaign_request_id: string
          contest_brief: string | null
          contest_end_date: string | null
          contest_rules: string | null
          contest_start_date: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          maximum_followers: number | null
          minimum_followers: number | null
          participant_limit: number | null
          preferred_creator_category: string | null
          published_at: string | null
          required_views: number | null
          reward_pool: number | null
          status: Database["public"]["Enums"]["contest_status"]
          target_location: string | null
          target_platform: string | null
          title: string
          updated_at: string
          winner_count: number | null
        }
        Insert: {
          application_deadline?: string | null
          application_start_date?: string | null
          archived_at?: string | null
          attachment_url?: string | null
          business_category?: string | null
          business_id: string
          campaign_goal?: string | null
          campaign_request_id: string
          contest_brief?: string | null
          contest_end_date?: string | null
          contest_rules?: string | null
          contest_start_date?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          maximum_followers?: number | null
          minimum_followers?: number | null
          participant_limit?: number | null
          preferred_creator_category?: string | null
          published_at?: string | null
          required_views?: number | null
          reward_pool?: number | null
          status?: Database["public"]["Enums"]["contest_status"]
          target_location?: string | null
          target_platform?: string | null
          title: string
          updated_at?: string
          winner_count?: number | null
        }
        Update: {
          application_deadline?: string | null
          application_start_date?: string | null
          archived_at?: string | null
          attachment_url?: string | null
          business_category?: string | null
          business_id?: string
          campaign_goal?: string | null
          campaign_request_id?: string
          contest_brief?: string | null
          contest_end_date?: string | null
          contest_rules?: string | null
          contest_start_date?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          maximum_followers?: number | null
          minimum_followers?: number | null
          participant_limit?: number | null
          preferred_creator_category?: string | null
          published_at?: string | null
          required_views?: number | null
          reward_pool?: number | null
          status?: Database["public"]["Enums"]["contest_status"]
          target_location?: string | null
          target_platform?: string | null
          title?: string
          updated_at?: string
          winner_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contests_campaign_request_id_fkey"
            columns: ["campaign_request_id"]
            isOneToOne: true
            referencedRelation: "campaign_requests"
            referencedColumns: ["id"]
          },
        ]
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
      moderation_records: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          note: string | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          campaign_updates: boolean
          contest_updates: boolean
          created_at: string
          email_enabled: boolean
          in_app_enabled: boolean
          marketing: boolean
          payout_updates: boolean
          system: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_updates?: boolean
          contest_updates?: boolean
          created_at?: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          marketing?: boolean
          payout_updates?: boolean
          system?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_updates?: boolean
          contest_updates?: boolean
          created_at?: string
          email_enabled?: boolean
          in_app_enabled?: boolean
          marketing?: boolean
          payout_updates?: boolean
          system?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          archived_at: string | null
          body: string | null
          created_at: string
          deleted_at: string | null
          id: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link: string | null
          metadata: Json
          priority: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          kind: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          metadata?: Json
          priority?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          archived_at?: string | null
          body?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["notification_kind"]
          link?: string | null
          metadata?: Json
          priority?: string
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
      payout_details: {
        Row: {
          account_number: string
          bank_holder_name: string
          bank_name: string
          country: string
          created_at: string
          declaration_accepted: boolean
          email: string
          full_name: string
          government_id_url: string | null
          id: string
          ifsc: string | null
          influencer_id: string
          paypal_email: string | null
          phone: string
          submitted_at: string
          swift: string | null
          tax_id: string | null
          updated_at: string
          upi_id: string | null
          verified_at: string | null
          verified_by: string | null
          winner_id: string
        }
        Insert: {
          account_number: string
          bank_holder_name: string
          bank_name: string
          country: string
          created_at?: string
          declaration_accepted?: boolean
          email: string
          full_name: string
          government_id_url?: string | null
          id?: string
          ifsc?: string | null
          influencer_id: string
          paypal_email?: string | null
          phone: string
          submitted_at?: string
          swift?: string | null
          tax_id?: string | null
          updated_at?: string
          upi_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
          winner_id: string
        }
        Update: {
          account_number?: string
          bank_holder_name?: string
          bank_name?: string
          country?: string
          created_at?: string
          declaration_accepted?: boolean
          email?: string
          full_name?: string
          government_id_url?: string | null
          id?: string
          ifsc?: string | null
          influencer_id?: string
          paypal_email?: string | null
          phone?: string
          submitted_at?: string
          swift?: string | null
          tax_id?: string | null
          updated_at?: string
          upi_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_details_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: true
            referencedRelation: "contest_winners"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: string
          internal: boolean
          note: string | null
          payout_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          internal?: boolean
          note?: string | null
          payout_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          internal?: boolean
          note?: string | null
          payout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_events_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          business_id: string
          cancelled_at: string | null
          contest_id: string
          created_at: string
          currency: string
          failed_at: string | null
          failure_reason: string | null
          id: string
          influencer_id: string
          internal_notes: string | null
          paid_at: string | null
          payment_method: string | null
          payment_provider: string
          payment_reference: string | null
          processing_at: string | null
          provider_response: Json | null
          provider_status: string | null
          provider_transaction_id: string | null
          requested_at: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
          winner_id: string
        }
        Insert: {
          amount?: number
          business_id: string
          cancelled_at?: string | null
          contest_id: string
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          influencer_id: string
          internal_notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_provider?: string
          payment_reference?: string | null
          processing_at?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          provider_transaction_id?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          winner_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          cancelled_at?: string | null
          contest_id?: string
          created_at?: string
          currency?: string
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          influencer_id?: string
          internal_notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_provider?: string
          payment_reference?: string | null
          processing_at?: string | null
          provider_response?: Json | null
          provider_status?: string | null
          provider_transaction_id?: string | null
          requested_at?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contest_statistics"
            referencedColumns: ["contest_id"]
          },
          {
            foreignKeyName: "payouts_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: true
            referencedRelation: "contest_winners"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          kind: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_channels: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          settings: Json
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          settings?: Json
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          settings?: Json
          version?: number
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
      saved_contests: {
        Row: {
          contest_id: string
          created_at: string
          id: string
          influencer_id: string
        }
        Insert: {
          contest_id: string
          created_at?: string
          id?: string
          influencer_id: string
        }
        Update: {
          contest_id?: string
          created_at?: string
          id?: string
          influencer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_contests_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contest_statistics"
            referencedColumns: ["contest_id"]
          },
          {
            foreignKeyName: "saved_contests_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          awarded_at: string
          code: string
          created_at: string
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          awarded_at?: string
          code: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          awarded_at?: string
          code?: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_code_fkey"
            columns: ["code"]
            isOneToOne: false
            referencedRelation: "achievement_definitions"
            referencedColumns: ["code"]
          },
        ]
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
      user_suspensions: {
        Row: {
          created_at: string
          id: string
          lifted_at: string | null
          lifted_by: string | null
          reason: string
          role: string | null
          suspended_at: string
          suspended_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason: string
          role?: string | null
          suspended_at?: string
          suspended_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          reason?: string
          role?: string | null
          suspended_at?: string
          suspended_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      business_statistics: {
        Row: {
          application_count: number | null
          approved_request_count: number | null
          avg_engagement: number | null
          business_id: string | null
          completed_contest_count: number | null
          contest_count: number | null
          participant_count: number | null
          request_count: number | null
          reward_distributed: number | null
          submission_count: number | null
          verified_submission_count: number | null
        }
        Insert: {
          application_count?: never
          approved_request_count?: never
          avg_engagement?: never
          business_id?: string | null
          completed_contest_count?: never
          contest_count?: never
          participant_count?: never
          request_count?: never
          reward_distributed?: never
          submission_count?: never
          verified_submission_count?: never
        }
        Update: {
          application_count?: never
          approved_request_count?: never
          avg_engagement?: never
          business_id?: string | null
          completed_contest_count?: never
          contest_count?: never
          participant_count?: never
          request_count?: never
          reward_distributed?: never
          submission_count?: never
          verified_submission_count?: never
        }
        Relationships: []
      }
      contest_statistics: {
        Row: {
          application_count: number | null
          avg_engagement: number | null
          business_id: string | null
          contest_end_date: string | null
          contest_id: string | null
          created_at: string | null
          participant_count: number | null
          participant_limit: number | null
          reward_awarded: number | null
          reward_paid: number | null
          reward_pool: number | null
          shortlisted_count: number | null
          status: Database["public"]["Enums"]["contest_status"] | null
          submission_count: number | null
          title: string | null
          verified_count: number | null
          winner_count: number | null
          winner_count_actual: number | null
        }
        Insert: {
          application_count?: never
          avg_engagement?: never
          business_id?: string | null
          contest_end_date?: string | null
          contest_id?: string | null
          created_at?: string | null
          participant_count?: never
          participant_limit?: number | null
          reward_awarded?: never
          reward_paid?: never
          reward_pool?: number | null
          shortlisted_count?: never
          status?: Database["public"]["Enums"]["contest_status"] | null
          submission_count?: never
          title?: string | null
          verified_count?: never
          winner_count?: number | null
          winner_count_actual?: never
        }
        Update: {
          application_count?: never
          avg_engagement?: never
          business_id?: string | null
          contest_end_date?: string | null
          contest_id?: string | null
          created_at?: string | null
          participant_count?: never
          participant_limit?: number | null
          reward_awarded?: never
          reward_paid?: never
          reward_pool?: number | null
          shortlisted_count?: never
          status?: Database["public"]["Enums"]["contest_status"] | null
          submission_count?: never
          title?: string | null
          verified_count?: never
          winner_count?: number | null
          winner_count_actual?: never
        }
        Relationships: []
      }
      influencer_statistics: {
        Row: {
          accepted_count: number | null
          application_count: number | null
          avg_engagement: number | null
          first_place_count: number | null
          influencer_id: string | null
          reward_paid: number | null
          reward_won: number | null
          selected_count: number | null
          submission_count: number | null
          verified_count: number | null
          win_count: number | null
        }
        Insert: {
          accepted_count?: never
          application_count?: never
          avg_engagement?: never
          first_place_count?: never
          influencer_id?: string | null
          reward_paid?: never
          reward_won?: never
          selected_count?: never
          submission_count?: never
          verified_count?: never
          win_count?: never
        }
        Update: {
          accepted_count?: never
          application_count?: never
          avg_engagement?: never
          first_place_count?: never
          influencer_id?: string | null
          reward_paid?: never
          reward_won?: never
          selected_count?: never
          submission_count?: never
          verified_count?: never
          win_count?: never
        }
        Relationships: []
      }
      platform_statistics: {
        Row: {
          active_suspension_count: number | null
          application_count: number | null
          business_count: number | null
          completed_contest_count: number | null
          contest_count: number | null
          influencer_count: number | null
          live_contest_count: number | null
          participant_count: number | null
          pending_request_count: number | null
          request_count: number | null
          reward_awarded: number | null
          reward_paid: number | null
          reward_pending: number | null
          submission_count: number | null
          user_count: number | null
          verified_submission_count: number | null
          winner_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      next_approval_reference: { Args: never; Returns: string }
      refresh_all_analytics_rollups: { Args: never; Returns: number }
      refresh_analytics_rollups: {
        Args: { _org_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "brand" | "creator" | "admin"
      campaign_request_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "rejected"
        | "cancelled"
        | "changes_requested"
      campaign_status: "draft" | "live" | "review" | "completed" | "archived"
      contest_application_status:
        | "submitted"
        | "withdrawn"
        | "shortlisted"
        | "selected"
        | "rejected"
      contest_status:
        | "draft"
        | "published"
        | "applications_open"
        | "applications_closed"
        | "participant_selection"
        | "live"
        | "completed"
        | "archived"
      contest_submission_status:
        | "pending"
        | "submitted"
        | "verified"
        | "flagged"
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
      participation_status: "active" | "removed" | "completed"
      payout_status:
        | "pending"
        | "details_requested"
        | "waiting_for_details"
        | "processing"
        | "paid"
        | "failed"
        | "cancelled"
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
      campaign_request_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "rejected",
        "cancelled",
        "changes_requested",
      ],
      campaign_status: ["draft", "live", "review", "completed", "archived"],
      contest_application_status: [
        "submitted",
        "withdrawn",
        "shortlisted",
        "selected",
        "rejected",
      ],
      contest_status: [
        "draft",
        "published",
        "applications_open",
        "applications_closed",
        "participant_selection",
        "live",
        "completed",
        "archived",
      ],
      contest_submission_status: [
        "pending",
        "submitted",
        "verified",
        "flagged",
      ],
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
      participation_status: ["active", "removed", "completed"],
      payout_status: [
        "pending",
        "details_requested",
        "waiting_for_details",
        "processing",
        "paid",
        "failed",
        "cancelled",
      ],
    },
  },
} as const
