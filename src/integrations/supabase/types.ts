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
      meal_plans: {
        Row: {
          checked_keys: string[]
          id: string
          settings: Json | null
          slots: Json
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          checked_keys?: string[]
          id?: string
          settings?: Json | null
          slots?: Json
          updated_at?: string
          user_id?: string
          week_start: string
        }
        Update: {
          checked_keys?: string[]
          id?: string
          settings?: Json | null
          slots?: Json
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      pantry_items: {
        Row: {
          created_at: string
          id: string
          location: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          breakfast_time: string
          calendar_token: string
          created_at: string
          days: number
          diets: string[]
          dinner_time: string
          id: string
          lunch_time: string
          meals: string[]
          onboarded: boolean
          servings: number
          snack_time: string
          timezone: string
        }
        Insert: {
          breakfast_time?: string
          calendar_token?: string
          created_at?: string
          days?: number
          diets?: string[]
          dinner_time?: string
          id: string
          lunch_time?: string
          meals?: string[]
          onboarded?: boolean
          servings?: number
          snack_time?: string
          timezone?: string
        }
        Update: {
          breakfast_time?: string
          calendar_token?: string
          created_at?: string
          days?: number
          diets?: string[]
          dinner_time?: string
          id?: string
          lunch_time?: string
          meals?: string[]
          onboarded?: boolean
          servings?: number
          snack_time?: string
          timezone?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          cook_minutes: number
          created_at: string
          diet_tags: string[]
          id: string
          image_url: string | null
          ingredients: Json
          meal_types: string[]
          prep_minutes: number
          prep_tasks: Json
          servings: number
          source_url: string | null
          steps: Json
          title: string
          user_id: string
        }
        Insert: {
          cook_minutes?: number
          created_at?: string
          diet_tags?: string[]
          id?: string
          image_url?: string | null
          ingredients?: Json
          meal_types?: string[]
          prep_minutes?: number
          prep_tasks?: Json
          servings?: number
          source_url?: string | null
          steps?: Json
          title: string
          user_id?: string
        }
        Update: {
          cook_minutes?: number
          created_at?: string
          diet_tags?: string[]
          id?: string
          image_url?: string | null
          ingredients?: Json
          meal_types?: string[]
          prep_minutes?: number
          prep_tasks?: Json
          servings?: number
          source_url?: string | null
          steps?: Json
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          category: string
          checked: boolean
          created_at: string
          id: string
          name: string
          user_id: string
          week_start: string
        }
        Insert: {
          category?: string
          checked?: boolean
          created_at?: string
          id?: string
          name: string
          user_id?: string
          week_start: string
        }
        Update: {
          category?: string
          checked?: boolean
          created_at?: string
          id?: string
          name?: string
          user_id?: string
          week_start?: string
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
    Enums: {},
  },
} as const
