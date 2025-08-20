import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          user_type: 'landlord' | 'manager' | 'tenant';
          organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string | null;
          user_type: 'landlord' | 'manager' | 'tenant';
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          user_type?: 'landlord' | 'manager' | 'tenant';
          organization_id?: string | null;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          zip: string;
          total_units: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          address: string;
          city: string;
          state: string;
          zip: string;
          total_units: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          address?: string;
          city?: string;
          state?: string;
          zip?: string;
          total_units?: number;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      units: {
        Row: {
          id: string;
          property_id: string;
          unit_number: string;
          monthly_rent: number;
          bedrooms: number;
          bathrooms: number;
          sqft: number | null;
          description: string | null;
          is_occupied: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          unit_number: string;
          monthly_rent: number;
          bedrooms: number;
          bathrooms: number;
          sqft?: number | null;
          description?: string | null;
          is_occupied?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          unit_number?: string;
          monthly_rent?: number;
          bedrooms?: number;
          bathrooms?: number;
          sqft?: number | null;
          description?: string | null;
          is_occupied?: boolean;
          updated_at?: string;
        };
      };
      leases: {
        Row: {
          id: string;
          tenant_id: string;
          unit_id: string;
          start_date: string;
          end_date: string;
          monthly_rent: number;
          security_deposit: number;
          rent_due_day: number;
          status: 'active' | 'expired' | 'terminated';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          unit_id: string;
          start_date: string;
          end_date: string;
          monthly_rent: number;
          security_deposit: number;
          rent_due_day: number;
          status?: 'active' | 'expired' | 'terminated';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          unit_id?: string;
          start_date?: string;
          end_date?: string;
          monthly_rent?: number;
          security_deposit?: number;
          rent_due_day?: number;
          status?: 'active' | 'expired' | 'terminated';
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          lease_id: string;
          amount: number;
          due_date: string;
          period_start: string;
          period_end: string;
          status: 'pending' | 'paid' | 'overdue' | 'cancelled';
          late_fee: number;
          stripe_payment_intent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lease_id: string;
          amount: number;
          due_date: string;
          period_start: string;
          period_end: string;
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
          late_fee?: number;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lease_id?: string;
          amount?: number;
          due_date?: string;
          period_start?: string;
          period_end?: string;
          status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
          late_fee?: number;
          stripe_payment_intent_id?: string | null;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string;
          amount: number;
          payment_date: string;
          payment_method: string;
          stripe_payment_intent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          amount: number;
          payment_date: string;
          payment_method: string;
          stripe_payment_intent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: string;
          stripe_payment_intent_id?: string | null;
        };
      };
      maintenance_tickets: {
        Row: {
          id: string;
          tenant_id: string;
          unit_id: string;
          title: string;
          description: string;
          priority: 'low' | 'medium' | 'high' | 'urgent';
          status: 'open' | 'in_progress' | 'resolved' | 'closed';
          photos: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          unit_id: string;
          title: string;
          description: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          photos?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          unit_id?: string;
          title?: string;
          description?: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          photos?: string[] | null;
          updated_at?: string;
        };
      };
      reminder_history: {
        Row: {
          id: string;
          invoice_id: string;
          reminder_type: string;
          sent_at: string;
          method: 'email' | 'sms';
          status: 'sent' | 'failed';
        };
        Insert: {
          id?: string;
          invoice_id: string;
          reminder_type: string;
          sent_at: string;
          method: 'email' | 'sms';
          status: 'sent' | 'failed';
        };
        Update: {
          id?: string;
          invoice_id?: string;
          reminder_type?: string;
          sent_at?: string;
          method?: 'email' | 'sms';
          status?: 'sent' | 'failed';
        };
      };
    };
  };
};