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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
