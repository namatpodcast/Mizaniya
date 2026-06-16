export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          icon?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          created_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category_id: string | null
          date: string
          merchant: string | null
          note: string | null
          payment_method: 'cash' | 'card' | 'bank_transfer' | 'other' | null
          is_recurring: boolean
          attachment_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category_id?: string | null
          date: string
          merchant?: string | null
          note?: string | null
          payment_method?: 'cash' | 'card' | 'bank_transfer' | 'other' | null
          is_recurring?: boolean
          attachment_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'income' | 'expense'
          category_id?: string | null
          date?: string
          merchant?: string | null
          note?: string | null
          payment_method?: 'cash' | 'card' | 'bank_transfer' | 'other' | null
          is_recurring?: boolean
          attachment_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type TransactionWithCategory = Transaction & {
  categories: Pick<Category, 'id' | 'name' | 'color' | 'icon'> | null
}
