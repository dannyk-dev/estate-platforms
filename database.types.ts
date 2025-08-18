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
    PostgrestVersion: "13.0.4"
  }
  app: {
    Tables: {
      admin_allowlist: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          active: boolean
          created_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string | null
          phone: string | null
          property_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          property_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          property_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          role: Database["app"]["Enums"]["role"]
          status: Database["app"]["Enums"]["membership_status"]
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["app"]["Enums"]["role"]
          status?: Database["app"]["Enums"]["membership_status"]
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["app"]["Enums"]["role"]
          status?: Database["app"]["Enums"]["membership_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_assets: {
        Row: {
          created_at: string
          description: string | null
          external_url: string | null
          id: string
          kind: Database["app"]["Enums"]["asset_kind"]
          meta: Json
          position: number
          project_id: string
          storage_path: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          kind: Database["app"]["Enums"]["asset_kind"]
          meta?: Json
          position?: number
          project_id: string
          storage_path?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          id?: string
          kind?: Database["app"]["Enums"]["asset_kind"]
          meta?: Json
          position?: number
          project_id?: string
          storage_path?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_domains: {
        Row: {
          created_at: string
          hostname: string
          id: string
          is_primary: boolean
          project_id: string
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          is_primary?: boolean
          project_id: string
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          is_primary?: boolean
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_domains_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_image_tags: {
        Row: {
          created_at: string
          id: string
          image_id: string
          project_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_id: string
          project_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          image_id?: string
          project_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_image_tags_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "project_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_image_tags_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "public_project_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_image_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_images: {
        Row: {
          alt: string | null
          caption: string | null
          created_at: string
          exif: Json
          height: number | null
          id: string
          is_primary: boolean
          pinned_rank: number | null
          position: number
          project_id: string
          storage_path: string
          width: number | null
        }
        Insert: {
          alt?: string | null
          caption?: string | null
          created_at?: string
          exif?: Json
          height?: number | null
          id?: string
          is_primary?: boolean
          pinned_rank?: number | null
          position?: number
          project_id: string
          storage_path: string
          width?: number | null
        }
        Update: {
          alt?: string | null
          caption?: string | null
          created_at?: string
          exif?: Json
          height?: number | null
          id?: string
          is_primary?: boolean
          pinned_rank?: number | null
          position?: number
          project_id?: string
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          headline: string | null
          hero_url: string | null
          id: string
          name: string
          published: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          description?: string | null
          headline?: string | null
          hero_url?: string | null
          id?: string
          name: string
          published?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          headline?: string | null
          hero_url?: string | null
          id?: string
          name?: string
          published?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          location_city: string | null
          location_country: string | null
          location_state: string | null
          meta: Json
          price: number | null
          published: boolean
          slug: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          meta?: Json
          price?: number | null
          published?: boolean
          slug: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          meta?: Json
          price?: number | null
          published?: boolean
          slug?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_primary: boolean
          position: number
          property_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          property_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          property_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "public_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_domains: {
        Row: {
          created_at: string
          hostname: string
          id: string
          is_primary: boolean
          tenant_id: string
        }
        Insert: {
          created_at?: string
          hostname: string
          id?: string
          is_primary?: boolean
          tenant_id: string
        }
        Update: {
          created_at?: string
          hostname?: string
          id?: string
          is_primary?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_domains_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          is_admin: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          is_admin?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          is_admin?: boolean
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_project_images: {
        Row: {
          alt: string | null
          caption: string | null
          created_at: string | null
          exif: Json | null
          height: number | null
          id: string | null
          is_primary: boolean | null
          position: number | null
          project_id: string | null
          storage_path: string | null
          width: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      public_properties: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          id: string | null
          location_city: string | null
          location_country: string | null
          location_state: string | null
          meta: Json | null
          price: number | null
          published: boolean | null
          slug: string | null
          tenant_id: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          meta?: Json | null
          price?: number | null
          published?: boolean | null
          slug?: string | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string | null
          location_city?: string | null
          location_country?: string | null
          location_state?: string | null
          meta?: Json | null
          price?: number | null
          published?: boolean | null
          slug?: string | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_all_subdomains: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          emoji: string
          slug: string
        }[]
      }
      get_project_by_host: {
        Args: { p_host: string }
        Returns: {
          config: Json
          created_at: string
          description: string | null
          headline: string | null
          hero_url: string | null
          id: string
          name: string
          published: boolean
          slug: string
          updated_at: string
        }
      }
      get_public_project: {
        Args: { p_host: string }
        Returns: {
          description: string
          headline: string
          hero_url: string
          id: string
          name: string
          published: boolean
          slug: string
        }[]
      }
      get_subdomain_data: {
        Args: { p_slug: string }
        Returns: {
          created_at: string
          emoji: string
          slug: string
        }[]
      }
      get_tenant_by_host: {
        Args: { p_host: string }
        Returns: {
          active: boolean
          config: Json
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
      }
      grant_admin_if_eligible: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_member: {
        Args: { min_role?: Database["app"]["Enums"]["role"]; p_tenant: string }
        Returns: boolean
      }
      list_public_assets_by_host: {
        Args: { p_host: string }
        Returns: {
          created_at: string
          description: string
          external_url: string
          id: string
          kind: Database["app"]["Enums"]["asset_kind"]
          meta: Json
          position: number
          storage_path: string
          title: string
        }[]
      }
      list_public_image_tags_by_host: {
        Args: { p_host: string }
        Returns: {
          count: number
          tag: string
        }[]
      }
      list_public_images_by_host: {
        Args: { p_host: string }
        Returns: {
          alt: string
          caption: string
          created_at: string
          height: number
          id: string
          img_position: number
          is_primary: boolean
          storage_path: string
          width: number
        }[]
      }
      list_public_images_by_host_tag: {
        Args: { p_host: string; p_tag?: string }
        Returns: {
          alt: string
          caption: string
          created_at: string
          id: string
          is_primary: boolean
          pinned_rank: number
          position: number
          storage_path: string
        }[]
      }
      role_weight: {
        Args: { r: Database["app"]["Enums"]["role"] }
        Returns: number
      }
      tenant_of_property: {
        Args: { p_property: string }
        Returns: string
      }
      uuid_prefix: {
        Args: { p_name: string }
        Returns: string
      }
    }
    Enums: {
      asset_kind: "video" | "pdf" | "floorplan" | "tour"
      membership_status: "active" | "invited" | "suspended"
      role: "owner" | "admin" | "editor" | "viewer"
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
  app: {
    Enums: {
      asset_kind: ["video", "pdf", "floorplan", "tour"],
      membership_status: ["active", "invited", "suspended"],
      role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
