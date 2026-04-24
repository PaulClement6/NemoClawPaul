/**
 * NemoClaw Demo — Shared Type Definitions
 * Meridian Insurance Group multi-agent customer support system
 */

// ── Data model interfaces (matching demo-data JSON files) ──────────

export interface Customer {
  customer_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    county: string;
    postcode: string;
  };
  policy_number: string;
  policy_type: string;
  policy_start_date: string;
  policy_renewal_date: string;
  premium_monthly: number;
  status: "active" | "lapsed" | "cancelled" | "pending";
  created_at: string;
}

export interface BillingRecord {
  record_id: string;
  customer_id: string;
  date: string;
  amount: number;
  type: "premium" | "adjustment" | "refund" | "fee" | "payment";
  description: string;
  status: "completed" | "pending" | "failed" | "reversed";
  reference: string;
}

export interface Claim {
  claim_id: string;
  customer_id: string;
  policy_number: string;
  date_filed: string;
  date_of_incident: string;
  type: string;
  description: string;
  status: "open" | "under_review" | "approved" | "denied" | "settled" | "closed";
  amount_claimed: number;
  amount_approved?: number;
  adjuster?: string;
  documents: string[];
  notes: string[];
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

// ── Agent system types ─────────────────────────────────────────────

export type AgentRole =
  | "triage"
  | "billing"
  | "compliance"
  | "technical"
  | "pricing"
  | "claims_analyst";

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required: string[];
    };
  };
}

export interface AgentConfig {
  role: AgentRole;
  name: string;
  systemPrompt: string;
  tools: ToolDefinition[];
}

// ── Inter-agent communication ──────────────────────────────────────

export interface EscalationRequest {
  targetAgent: AgentRole;
  context: string;
  customerId: string;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
}
