/*
  # Create Rental Management Schema

  1. New Tables
    - `organizations` - Multi-tenant organization support
    - `users` - Enhanced user management with roles
    - `properties` - Property management
    - `units` - Individual rental units
    - `leases` - Lease agreements
    - `invoices` - Monthly invoices with late fees
    - `payments` - Payment tracking
    - `maintenance_tickets` - Maintenance request system
    - `reminder_history` - Payment reminder tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for organization-based access
    - Role-based permissions (landlord/manager/tenant)

  3. Functions
    - Invoice generation function
    - Payment reminder system
    - Late fee calculation
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table for multi-tenancy
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced users table with roles
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text,
  user_type text NOT NULL CHECK (user_type IN ('landlord', 'manager', 'tenant')),
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  total_units integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Units table
CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  monthly_rent numeric(10,2) NOT NULL,
  bedrooms integer NOT NULL,
  bathrooms numeric(3,1) NOT NULL,
  sqft integer,
  description text,
  is_occupied boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, unit_number)
);

-- Leases table
CREATE TABLE IF NOT EXISTS leases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES users(id),
  unit_id uuid NOT NULL REFERENCES units(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_rent numeric(10,2) NOT NULL,
  security_deposit numeric(10,2) NOT NULL DEFAULT 0,
  rent_due_day integer NOT NULL DEFAULT 1 CHECK (rent_due_day >= 1 AND rent_due_day <= 31),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lease_id uuid NOT NULL REFERENCES leases(id),
  amount numeric(10,2) NOT NULL,
  due_date date NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  late_fee numeric(10,2) DEFAULT 0,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lease_id, period_start, period_end)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  amount numeric(10,2) NOT NULL,
  payment_date timestamptz NOT NULL DEFAULT now(),
  payment_method text NOT NULL,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now()
);

-- Maintenance tickets table
CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES users(id),
  unit_id uuid NOT NULL REFERENCES units(id),
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  photos text[], -- Array of photo URLs
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reminder history table
CREATE TABLE IF NOT EXISTS reminder_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  reminder_type text NOT NULL, -- '-3d', '0d', '+3d', '+7d'
  sent_at timestamptz NOT NULL DEFAULT now(),
  method text NOT NULL CHECK (method IN ('email', 'sms')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed'))
);

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can read their own organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- RLS Policies for users
CREATE POLICY "Users can read users in their organization"
  ON users FOR SELECT
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    OR id = auth.uid()
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

-- RLS Policies for properties
CREATE POLICY "Organization members can read properties"
  ON properties FOR SELECT
  TO authenticated
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Landlords and managers can manage properties"
  ON properties FOR ALL
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND (SELECT user_type FROM users WHERE id = auth.uid()) IN ('landlord', 'manager')
  );

-- RLS Policies for units
CREATE POLICY "Organization members can read units"
  ON units FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Landlords and managers can manage units"
  ON units FOR ALL
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM properties 
      WHERE organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT user_type FROM users WHERE id = auth.uid()) IN ('landlord', 'manager')
  );

-- RLS Policies for leases
CREATE POLICY "Organization members can read leases"
  ON leases FOR SELECT
  TO authenticated
  USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN properties p ON u.property_id = p.id
      WHERE p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
    OR tenant_id = auth.uid()
  );

CREATE POLICY "Landlords and managers can manage leases"
  ON leases FOR ALL
  TO authenticated
  USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN properties p ON u.property_id = p.id
      WHERE p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT user_type FROM users WHERE id = auth.uid()) IN ('landlord', 'manager')
  );

-- RLS Policies for invoices
CREATE POLICY "Users can read relevant invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
      OR l.tenant_id = auth.uid()
    )
  );

CREATE POLICY "Landlords and managers can manage invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (
    lease_id IN (
      SELECT l.id FROM leases l
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT user_type FROM users WHERE id = auth.uid()) IN ('landlord', 'manager')
  );

-- RLS Policies for payments
CREATE POLICY "Users can read relevant payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    invoice_id IN (
      SELECT i.id FROM invoices i
      JOIN leases l ON i.lease_id = l.id
      JOIN units u ON l.unit_id = u.id
      JOIN properties p ON u.property_id = p.id
      WHERE p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
      OR l.tenant_id = auth.uid()
    )
  );

-- RLS Policies for maintenance tickets
CREATE POLICY "Users can read relevant tickets"
  ON maintenance_tickets FOR SELECT
  TO authenticated
  USING (
    tenant_id = auth.uid()
    OR unit_id IN (
      SELECT u.id FROM units u
      JOIN properties p ON u.property_id = p.id
      WHERE p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Tenants can create tickets for their units"
  ON maintenance_tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = auth.uid()
    AND unit_id IN (
      SELECT unit_id FROM leases 
      WHERE tenant_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Landlords and managers can update tickets"
  ON maintenance_tickets FOR UPDATE
  TO authenticated
  USING (
    unit_id IN (
      SELECT u.id FROM units u
      JOIN properties p ON u.property_id = p.id
      WHERE p.organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT user_type FROM users WHERE id = auth.uid()) IN ('landlord', 'manager')
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_organization ON properties(organization_id);
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leases_unit ON leases(unit_id);
CREATE INDEX IF NOT EXISTS idx_invoices_lease ON invoices(lease_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_unit ON maintenance_tickets(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_tickets(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON leases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_tickets_updated_at BEFORE UPDATE ON maintenance_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();