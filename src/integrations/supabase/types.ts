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
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          gst_percentage: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          gst_percentage?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          gst_percentage?: number | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          used_count?: number | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      home_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          sort_order: number | null
          subtitle: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
      home_sections: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          section_type: string
          sort_order: number | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          section_type: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          section_type?: string
          sort_order?: number | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity: number
          variant_info: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          product_price: number
          quantity?: number
          variant_info?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          product_price?: number
          quantity?: number
          variant_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          order_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          order_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_address: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          order_id: string
          status: string
          total: number
          updated_at: string
          payment_method: string | null
        }
        Insert: {
          created_at?: string
          customer_address: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          order_id: string
          status?: string
          total: number
          updated_at?: string
          payment_method?: string | null
        }
        Update: {
          created_at?: string
          customer_address?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          order_id?: string
          status?: string
          total?: number
          updated_at?: string
          payment_method?: string | null
        }
        Relationships: []
      }
      popup_offers: {
        Row: {
          button_link: string | null
          button_text: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          show_once_per_session: boolean | null
          title: string
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          show_once_per_session?: boolean | null
          title: string
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          show_once_per_session?: boolean | null
          title?: string
        }
        Relationships: []
      }
      product_attribute_values: {
        Row: {
          attribute_id: string
          created_at: string
          id: string
          sort_order: number | null
          value: string
        }
        Insert: {
          attribute_id: string
          created_at?: string
          id?: string
          sort_order?: number | null
          value: string
        }
        Update: {
          attribute_id?: string
          created_at?: string
          id?: string
          sort_order?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_attribute_id_fkey"
            columns: ["attribute_id"]
            isOneToOne: false
            referencedRelation: "product_attributes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_values: {
        Row: {
          variant_id: string
          attribute_value_id: string
        }
        Insert: {
          variant_id: string
          attribute_value_id: string
        }
        Update: {
          variant_id?: string
          attribute_value_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_values_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_values_attribute_value_id_fkey"
            columns: ["attribute_value_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_values"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          created_at: string
          icon_url: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon_url?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon_url?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          attribute_value_id: string | null
          created_at: string
          id: string
          is_available: boolean | null
          price: number
          product_id: string
          stock_quantity: number | null
          image_urls: Json | null
        }
        Insert: {
          attribute_value_id?: string | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          price: number
          product_id: string
          stock_quantity?: number | null
          image_urls?: Json | null
        }
        Update: {
          attribute_value_id?: string | null
          created_at?: string
          id?: string
          is_available?: boolean | null
          price?: number
          product_id?: string
          stock_quantity?: number | null
          image_urls?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_attribute_value_id_fkey"
            columns: ["attribute_value_id"]
            isOneToOne: false
            referencedRelation: "product_attribute_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          image_url: string | null
          images: string[] | null
          name: string
          price: number
          stock_quantity: number | null
          stock_status: string
          updated_at: string
          // Add new fields
          features: Json | null
          detailed_description: string | null
          dimensions: string | null
          cash_on_delivery: boolean | null
          // Add branding and seller fields
          brand: string | null
          brand_logo_url: string | null
          seller_name: string | null
          seller_description: string | null
          // Add GST field
          gst_percentage: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          name: string
          price: number
          stock_quantity?: number | null
          stock_status?: string
          updated_at?: string
          // Add new fields
          features?: Json | null
          detailed_description?: string | null
          dimensions?: string | null
          cash_on_delivery?: boolean | null
          // Add branding and seller fields
          brand?: string | null
          brand_logo_url?: string | null
          seller_name?: string | null
          seller_description?: string | null
          // Add GST field
          gst_percentage?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          name?: string
          price?: number
          stock_quantity?: number | null
          stock_status?: string
          updated_at?: string
          // Add new fields
          features?: Json | null
          detailed_description?: string | null
          dimensions?: string | null
          cash_on_delivery?: boolean | null
          // Add branding and seller fields
          brand?: string | null
          brand_logo_url?: string | null
          seller_name?: string | null
          seller_description?: string | null
          // Add GST field
          gst_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
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
      // Add banned_users table definition
      banned_users: {
        Row: {
          id: string
          phone: string | null
          email: string | null
          reason: string | null
          banned_by: string | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          phone?: string | null
          email?: string | null
          reason?: string | null
          banned_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          phone?: string | null
          email?: string | null
          reason?: string | null
          banned_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "banned_users_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add contact_submissions table definition
      contact_submissions: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          subject: string
          description: string
          is_banned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          subject: string
          description: string
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          subject?: string
          description?: string
          is_banned?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Add COD restrictions table definition
      cod_restrictions: {
        Row: {
          id: string
          phone_order_limit: number
          ip_daily_order_limit: number
          online_phone_order_limit: number
          online_ip_daily_order_limit: number
          is_active: boolean
          cod_restrictions_enabled: boolean
          online_restrictions_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone_order_limit?: number
          ip_daily_order_limit?: number
          online_phone_order_limit?: number
          online_ip_daily_order_limit?: number
          is_active?: boolean
          cod_restrictions_enabled?: boolean
          online_restrictions_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone_order_limit?: number
          ip_daily_order_limit?: number
          online_phone_order_limit?: number
          online_ip_daily_order_limit?: number
          is_active?: boolean
          cod_restrictions_enabled?: boolean
          online_restrictions_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Add phone order counts table definition
      phone_order_counts: {
        Row: {
          id: string
          phone: string
          order_count: number
          last_order_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          order_count?: number
          last_order_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          order_count?: number
          last_order_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Add IP order counts table definition
      ip_order_counts: {
        Row: {
          id: string
          ip_address: string
          order_count: number
          last_order_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ip_address: string
          order_count?: number
          last_order_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ip_address?: string
          order_count?: number
          last_order_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Add online phone order counts table definition
      online_phone_order_counts: {
        Row: {
          id: string
          phone: string
          order_count: number
          last_order_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          order_count?: number
          last_order_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          order_count?: number
          last_order_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Add online IP order counts table definition
      online_ip_order_counts: {
        Row: {
          id: string
          ip_address: string
          order_count: number
          last_order_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ip_address: string
          order_count?: number
          last_order_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ip_address?: string
          order_count?: number
          last_order_date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Add individual phone restrictions table definition
      individual_phone_restrictions: {
        Row: {
          id: string
          phone: string
          cod_daily_limit: number
          online_daily_limit: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          cod_daily_limit?: number
          online_daily_limit?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          cod_daily_limit?: number
          online_daily_limit?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      // Add individual phone order counts table definition
      individual_phone_order_counts: {
        Row: {
          id: string
          phone: string
          payment_method: string
          order_count: number
          last_order_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone: string
          payment_method: string
          order_count?: number
          last_order_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string
          payment_method?: string
          order_count?: number
          last_order_date?: string
          created_at?: string
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
