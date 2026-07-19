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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          created_at: string
          feature_type: string
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_type?: string
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature_type?: string
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alert_preferences: {
        Row: {
          created_at: string
          digest_time: string | null
          email_daily_digest: boolean | null
          email_instant_alerts: boolean | null
          id: string
          notify_content_changes: boolean | null
          notify_feature_updates: boolean | null
          notify_price_changes: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          digest_time?: string | null
          email_daily_digest?: boolean | null
          email_instant_alerts?: boolean | null
          id?: string
          notify_content_changes?: boolean | null
          notify_feature_updates?: boolean | null
          notify_price_changes?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          digest_time?: string | null
          email_daily_digest?: boolean | null
          email_instant_alerts?: boolean | null
          id?: string
          notify_content_changes?: boolean | null
          notify_feature_updates?: boolean | null
          notify_price_changes?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_connections: {
        Row: {
          config: Json | null
          created_at: string
          credentials: Json | null
          display_name: string
          error_message: string | null
          id: string
          is_active: boolean
          last_synced_at: string | null
          provider: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          credentials?: Json | null
          display_name?: string
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          provider: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          credentials?: Json | null
          display_name?: string
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_jobs: {
        Row: {
          compression_ratio: number | null
          connection_id: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          output_format: string | null
          processed_file_path: string | null
          processed_file_size: number | null
          source_file_name: string
          source_file_path: string | null
          source_file_size: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          compression_ratio?: number | null
          connection_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          output_format?: string | null
          processed_file_path?: string | null
          processed_file_size?: number | null
          source_file_name: string
          source_file_path?: string | null
          source_file_size?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          compression_ratio?: number | null
          connection_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          output_format?: string | null
          processed_file_path?: string | null
          processed_file_size?: number | null
          source_file_name?: string
          source_file_path?: string | null
          source_file_size?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_jobs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "automation_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          processed_files: number
          settings: Json | null
          status: string
          total_files: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          processed_files?: number
          settings?: Json | null
          status?: string
          total_files?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          processed_files?: number
          settings?: Json | null
          status?: string
          total_files?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      batch_processing_stats: {
        Row: {
          avg_compression_ratio: number
          created_at: string
          failed_count: number
          id: string
          image_count: number
          preset_name: string | null
          processed_at: string
          processing_time_ms: number
          settings: Json | null
          success_count: number
          total_optimized_size: number
          total_original_size: number
          total_saved: number
          user_id: string
        }
        Insert: {
          avg_compression_ratio?: number
          created_at?: string
          failed_count?: number
          id?: string
          image_count?: number
          preset_name?: string | null
          processed_at?: string
          processing_time_ms?: number
          settings?: Json | null
          success_count?: number
          total_optimized_size?: number
          total_original_size?: number
          total_saved?: number
          user_id: string
        }
        Update: {
          avg_compression_ratio?: number
          created_at?: string
          failed_count?: number
          id?: string
          image_count?: number
          preset_name?: string | null
          processed_at?: string
          processing_time_ms?: number
          settings?: Json | null
          success_count?: number
          total_optimized_size?: number
          total_original_size?: number
          total_saved?: number
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          faqs: Json
          featured_image_url: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time: number | null
          related_slugs: string[]
          slug: string
          tags: string[] | null
          title: string
          topic: string | null
          updated_at: string
          word_count: number
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          faqs?: Json
          featured_image_url?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          related_slugs?: string[]
          slug: string
          tags?: string[] | null
          title: string
          topic?: string | null
          updated_at?: string
          word_count?: number
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          faqs?: Json
          featured_image_url?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          related_slugs?: string[]
          slug?: string
          tags?: string[] | null
          title?: string
          topic?: string | null
          updated_at?: string
          word_count?: number
        }
        Relationships: []
      }
      campaign_triggers: {
        Row: {
          auto_generate: boolean | null
          content_template: string | null
          created_at: string
          days_before: number | null
          hashtags: string[] | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          metadata: Json | null
          name: string
          platforms: string[]
          posts_count: number | null
          tone: string | null
          trigger_date: string | null
          trigger_recurring: boolean | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_generate?: boolean | null
          content_template?: string | null
          created_at?: string
          days_before?: number | null
          hashtags?: string[] | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          metadata?: Json | null
          name: string
          platforms?: string[]
          posts_count?: number | null
          tone?: string | null
          trigger_date?: string | null
          trigger_recurring?: boolean | null
          trigger_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_generate?: boolean | null
          content_template?: string | null
          created_at?: string
          days_before?: number | null
          hashtags?: string[] | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          metadata?: Json | null
          name?: string
          platforms?: string[]
          posts_count?: number | null
          tone?: string | null
          trigger_date?: string | null
          trigger_recurring?: boolean | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      competitor_alerts: {
        Row: {
          alert_type: string
          competitor_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          priority: string | null
          snapshot_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          competitor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          priority?: string | null
          snapshot_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          competitor_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          priority?: string | null
          snapshot_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_alerts_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "tracked_competitors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitor_alerts_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "competitor_snapshots"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_snapshots: {
        Row: {
          captured_at: string
          change_detected: boolean | null
          competitor_id: string
          created_at: string
          data: Json | null
          description: string | null
          id: string
          snapshot_type: string
          title: string
          user_id: string
        }
        Insert: {
          captured_at?: string
          change_detected?: boolean | null
          competitor_id: string
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          snapshot_type: string
          title: string
          user_id: string
        }
        Update: {
          captured_at?: string
          change_detected?: boolean | null
          competitor_id?: string
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          snapshot_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitor_snapshots_competitor_id_fkey"
            columns: ["competitor_id"]
            isOneToOne: false
            referencedRelation: "tracked_competitors"
            referencedColumns: ["id"]
          },
        ]
      }
      email_subscribers: {
        Row: {
          consent: boolean
          consent_at: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          profession: string | null
          source: string | null
          tags: string[]
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          consent?: boolean
          consent_at?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          profession?: string | null
          source?: string | null
          tags?: string[]
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          consent?: boolean
          consent_at?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          profession?: string | null
          source?: string | null
          tags?: string[]
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      file_jobs: {
        Row: {
          batch_job_id: string
          compression_ratio: number | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          original_path: string
          original_size: number | null
          processed_path: string | null
          processed_size: number | null
          status: string
          updated_at: string
        }
        Insert: {
          batch_job_id: string
          compression_ratio?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          original_path: string
          original_size?: number | null
          processed_path?: string | null
          processed_size?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          batch_job_id?: string
          compression_ratio?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          original_path?: string
          original_size?: number | null
          processed_path?: string | null
          processed_size?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_jobs_batch_job_id_fkey"
            columns: ["batch_job_id"]
            isOneToOne: false
            referencedRelation: "batch_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      posting_workflows: {
        Row: {
          content_pool_ids: string[] | null
          created_at: string
          id: string
          is_active: boolean
          last_run_at: string | null
          metadata: Json | null
          name: string
          next_run_at: string | null
          platforms: string[]
          posts_per_week: number
          preferred_days: string[] | null
          preferred_times: string[] | null
          recycle_after_days: number | null
          recycle_min_engagement: number | null
          updated_at: string
          user_id: string
          workflow_type: string
        }
        Insert: {
          content_pool_ids?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          metadata?: Json | null
          name: string
          next_run_at?: string | null
          platforms?: string[]
          posts_per_week?: number
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          recycle_after_days?: number | null
          recycle_min_engagement?: number | null
          updated_at?: string
          user_id: string
          workflow_type?: string
        }
        Update: {
          content_pool_ids?: string[] | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          metadata?: Json | null
          name?: string
          next_run_at?: string | null
          platforms?: string[]
          posts_per_week?: number
          preferred_days?: string[] | null
          preferred_times?: string[] | null
          recycle_after_days?: number | null
          recycle_min_engagement?: number | null
          updated_at?: string
          user_id?: string
          workflow_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          blog_category: string | null
          blog_excerpt: string | null
          blog_slug: string | null
          campaign_id: string | null
          content: string
          created_at: string
          engagement_score: number | null
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          metadata: Json | null
          platform_results: Json | null
          platforms: string[]
          post_type: string
          published_at: string | null
          recycled_from: string | null
          scheduled_at: string | null
          seo_description: string | null
          seo_title: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          blog_category?: string | null
          blog_excerpt?: string | null
          blog_slug?: string | null
          campaign_id?: string | null
          content: string
          created_at?: string
          engagement_score?: number | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          platform_results?: Json | null
          platforms?: string[]
          post_type?: string
          published_at?: string | null
          recycled_from?: string | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          blog_category?: string | null
          blog_excerpt?: string | null
          blog_slug?: string | null
          campaign_id?: string | null
          content?: string
          created_at?: string
          engagement_score?: number | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          metadata?: Json | null
          platform_results?: Json | null
          platforms?: string[]
          post_type?: string
          published_at?: string | null
          recycled_from?: string | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaign_triggers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_recycled_from_fkey"
            columns: ["recycled_from"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_posts_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "posting_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_files: {
        Row: {
          collection_id: string | null
          created_at: string | null
          deleted_at: string | null
          download_count: number | null
          expires_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          folder_id: string | null
          id: string
          is_archived: boolean
          is_favorite: boolean
          is_pinned: boolean
          last_viewed_at: string | null
          share_code: string
          tags: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          download_count?: number | null
          expires_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          is_pinned?: boolean
          last_viewed_at?: string | null
          share_code?: string
          tags?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          deleted_at?: string | null
          download_count?: number | null
          expires_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          folder_id?: string | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          is_pinned?: boolean
          last_viewed_at?: string | null
          share_code?: string
          tags?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_files_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "user_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "user_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriber_audit_log: {
        Row: {
          accessed_at: string
          action: string
          details: Json | null
          id: string
          ip_address: unknown
          risk_level: string | null
          session_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          risk_level?: string | null
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          risk_level?: string | null
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          access_count: number | null
          created_at: string
          data_classification: string | null
          email: string
          free_compressions_used: number
          id: string
          last_accessed: string | null
          obfuscated_email: string | null
          obfuscated_stripe_customer_id: string | null
          security_level: string | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string
          data_classification?: string | null
          email: string
          free_compressions_used?: number
          id?: string
          last_accessed?: string | null
          obfuscated_email?: string | null
          obfuscated_stripe_customer_id?: string | null
          security_level?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_count?: number | null
          created_at?: string
          data_classification?: string | null
          email?: string
          free_compressions_used?: number
          id?: string
          last_accessed?: string | null
          obfuscated_email?: string | null
          obfuscated_stripe_customer_id?: string | null
          security_level?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tracked_competitors: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          name: string
          tracking_frequency: string | null
          updated_at: string
          user_id: string
          website_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          name: string
          tracking_frequency?: string | null
          updated_at?: string
          user_id: string
          website_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          name?: string
          tracking_frequency?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string
        }
        Relationships: []
      }
      user_collections: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_folders: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      add_user_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      count_daily_ai_usage: {
        Args: { feature?: string; target_user_id: string }
        Returns: number
      }
      count_subscriber_access_last_hour: {
        Args: { target_user_id?: string }
        Returns: number
      }
      get_all_user_roles: {
        Args: never
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
      get_all_users_for_admin: {
        Args: never
        Returns: {
          created_at: string
          email: string
          first_name: string
          last_name: string
          user_id: string
        }[]
      }
      get_my_subscription_status: { Args: never; Returns: Json }
      get_safe_subscriber_status: {
        Args: never
        Returns: {
          access_count: number
          created_at: string
          data_classification: string
          email_status: string
          id: string
          last_accessed: string
          security_level: string
          stripe_status: string
          subscribed: boolean
          subscription_end: string
          subscription_tier: string
          updated_at: string
          user_id: string
        }[]
      }
      get_safe_subscription_status: {
        Args: never
        Returns: {
          access_count: number
          created_at: string
          data_classification: string
          email_status: string
          id: string
          last_accessed: string
          security_level: string
          stripe_status: string
          subscribed: boolean
          subscription_end: string
          subscription_tier: string
          updated_at: string
          user_id: string
        }[]
      }
      get_shared_file_by_code: {
        Args: { _code: string }
        Returns: {
          created_at: string
          download_count: number
          expires_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
        }[]
      }
      get_subscriber_data_for_service: {
        Args: { user_uuid: string }
        Returns: Json
      }
      get_subscriber_encryption_status: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_shared_file_download: {
        Args: { _code: string }
        Returns: undefined
      }
      log_service_access: {
        Args: { operation: string; table_name: string; target_user_id?: string }
        Returns: boolean
      }
      remove_user_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: boolean
      }
      safe_deobfuscate_data: {
        Args: { obfuscated_data: string; salt?: string }
        Returns: string
      }
      safe_obfuscate_data: {
        Args: { data_text: string; salt?: string }
        Returns: string
      }
      update_subscription_safely: {
        Args: {
          new_stripe_customer_id?: string
          new_subscribed?: boolean
          new_subscription_end?: string
          new_subscription_tier?: string
          target_user_id: string
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
