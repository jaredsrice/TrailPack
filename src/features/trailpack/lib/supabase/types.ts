export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      saved_results: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          trail_summary: Json;
          trip_inputs: Json;
          recommendation: Json;
          source_labels: string[];
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          trail_summary: Json;
          trip_inputs: Json;
          recommendation: Json;
          source_labels?: string[];
        };
        Update: never;
        Relationships: [];
      };
      ai_review_quotas: {
        Row: {
          user_id: string;
          window_started_at: string;
          review_count: number;
        };
        Insert: {
          user_id: string;
          window_started_at?: string;
          review_count?: number;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_ai_review_quota: {
        Args: Record<string, never>;
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_at: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
