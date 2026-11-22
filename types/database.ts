export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Profile = {
  id: string;
  full_name: string;
  role: "admin" | "client_relations" | "creative" | "finance" | "member";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  full_name: string;
  organization: string;
  email: string | null;
  phone: string | null;
  location: string;
  preferred_contact: string;
  notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Lead = {
  id: string;
  full_name: string;
  organization: string;
  email: string | null;
  phone: string | null;
  location: string;
  requested_service: string;
  source: string;
  status: string;
  owner_id: string | null;
  follow_up_on: string | null;
  notes: string;
  converted_client_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CatalogItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  is_physical: boolean;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CrmOrder = {
  id: string;
  client_id: string;
  source_lead_id: string | null;
  catalog_item_id: string | null;
  title: string;
  status: string;
  priority: string;
  owner_id: string | null;
  due_date: string | null;
  brief: string;
  deliverables: string;
  internal_notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  title: string;
  order_id: string | null;
  lead_id: string | null;
  assignee_id: string | null;
  due_on: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Quotation = {
  id: string;
  quote_number: number;
  client_id: string;
  order_id: string | null;
  service_summary: string;
  amount_php: number;
  status: string;
  valid_until: string | null;
  assumptions: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Partner = {
  id: string;
  name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  location: string;
  capabilities: string;
  notes: string;
  active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ProductionHandoff = {
  id: string;
  order_id: string;
  partner_id: string;
  status: string;
  specifications: string;
  quantity: number;
  promised_date: string | null;
  tracking_reference: string;
  quality_notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Proof = {
  id: string;
  order_id: string;
  version: number;
  file_path: string;
  file_name: string;
  status: string;
  client_feedback: string;
  submitted_at: string;
  reviewed_at: string | null;
  created_by: string;
};

export type PartnerRisk = {
  id: string;
  partner_id: string;
  order_id: string | null;
  category: string;
  summary: string;
  severity: string;
  status: string;
  created_by: string;
  created_at: string;
  resolved_at: string | null;
};

export type B2BOpportunity = {
  id: string;
  organization: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  location: string;
  work_type: string;
  backlog_volume: string;
  status: string;
  owner_id: string | null;
  next_action: string;
  notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ActivityEvent = {
  id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  summary: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      clients: Table<Client>;
      leads: Table<Lead>;
      catalog_items: Table<CatalogItem>;
      orders: Table<CrmOrder>;
      tasks: Table<Task>;
      quotations: Table<Quotation>;
      partners: Table<Partner>;
      production_handoffs: Table<ProductionHandoff>;
      proofs: Table<Proof>;
      partner_risks: Table<PartnerRisk>;
      b2b_opportunities: Table<B2BOpportunity>;
      activity_log: Table<ActivityEvent>;
    };
    Views: Record<string, never>;
    Functions: {
      is_active_member: { Args: Record<string, never>; Returns: boolean };
      has_role: { Args: { allowed_roles: string[] }; Returns: boolean };
      convert_lead_to_client: { Args: { lead_uuid: string }; Returns: string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
