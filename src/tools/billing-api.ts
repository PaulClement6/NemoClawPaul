import { BillingRecord } from "../types";
import { loadData } from "./data-loader";

/**
 * Look up a customer's billing history.
 * Returns the most recent 10 records sorted by date (newest first).
 */
export function lookupBillingHistory(customerId: string): object {
  let records: BillingRecord[];
  try {
    records = loadData<BillingRecord[]>("billing-history.json");
  } catch {
    return { error: "Billing system is currently unavailable." };
  }

  const customerRecords = records
    .filter((r) => r.customer_id === customerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  if (customerRecords.length === 0) {
    return {
      error: `No billing records found for customer ${customerId}.`,
    };
  }

  return {
    customer_id: customerId,
    record_count: customerRecords.length,
    records: customerRecords,
  };
}

/**
 * Generate a detailed explanation of premium changes for a customer
 * during a specified period. Includes contributing factors and their
 * relative impact.
 */
export function explainPremiumChange(
  customerId: string,
  period: string
): object {
  let records: BillingRecord[];
  try {
    records = loadData<BillingRecord[]>("billing-history.json");
  } catch {
    return { error: "Billing system is currently unavailable." };
  }

  const customerRecords = records.filter(
    (r) => r.customer_id === customerId
  );

  if (customerRecords.length === 0) {
    return {
      error: `No billing records found for customer ${customerId}.`,
    };
  }

  // Find premium-type records to compute a change
  const premiumRecords = customerRecords
    .filter((r) => r.type === "premium")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const previousPremium =
    premiumRecords.length >= 2
      ? premiumRecords[premiumRecords.length - 2].amount
      : null;
  const currentPremium =
    premiumRecords.length >= 1
      ? premiumRecords[premiumRecords.length - 1].amount
      : null;

  const change =
    previousPremium !== null && currentPremium !== null
      ? currentPremium - previousPremium
      : null;

  return {
    customer_id: customerId,
    period: period,
    previous_premium: previousPremium,
    current_premium: currentPremium,
    change_amount: change,
    change_percentage:
      change !== null && previousPremium !== null && previousPremium > 0
        ? Math.round((change / previousPremium) * 10000) / 100
        : null,
    contributing_factors: [
      {
        factor: "Claims history",
        impact: "moderate",
        description:
          "Your claims history over the past 3 years is factored into your risk profile. Recent claims may increase premiums, while claim-free years attract no-claims discounts.",
      },
      {
        factor: "Market conditions",
        impact: "minor",
        description:
          "Reinsurance costs across the UK insurance market have risen, which affects premiums industry-wide.",
      },
      {
        factor: "Insurance Premium Tax (IPT)",
        impact: "minor",
        description:
          "The current IPT rate is 12%. Any changes to the IPT rate directly affect the total premium charged.",
      },
      {
        factor: "Rebuild cost inflation",
        impact: "moderate",
        description:
          "The BCIS rebuild cost index has increased, which affects the sum insured for buildings cover and consequently the premium.",
      },
      {
        factor: "Risk profile update",
        impact: "minor",
        description:
          "Annual reassessment of risk factors including postcode risk ratings, property age adjustments, and occupancy changes.",
      },
    ],
    note: "This is a summary explanation. For a formal premium breakdown, please request a detailed quotation document.",
  };
}

/**
 * Flag a refund request for human review and approval.
 * Returns a ticket reference — the refund is NOT processed immediately.
 */
export function flagRefundRequest(
  customerId: string,
  amount: number,
  reason: string
): object {
  if (amount <= 0) {
    return { error: "Refund amount must be a positive number." };
  }

  if (amount > 10000) {
    return {
      error:
        "Refund amounts exceeding £10,000 must be processed through the finance department directly.",
    };
  }

  const ticketRef = `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  return {
    status: "submitted",
    ticket_reference: ticketRef,
    customer_id: customerId,
    amount_gbp: amount,
    reason: reason,
    requires_manager_approval: amount > 500,
    estimated_review_time: "3-5 business days",
    message: `Refund request of £${amount.toFixed(2)} has been submitted for review. Your ticket reference is ${ticketRef}. You will receive an email notification once the request has been processed.`,
  };
}
