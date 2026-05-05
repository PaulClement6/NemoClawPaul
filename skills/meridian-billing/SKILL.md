---
name: meridian-billing
description: Meridian Insurance billing operations — payment history, premium explanations, refund flagging
triggers:
  - billing
  - payment
  - premium
  - invoice
  - refund
  - direct debit
---

# Meridian Billing Skill

## Data Sources

- **Billing history**: `demo-data/billing-history.json` — records with customerId, date, amount, type, status, description
- **Customer profiles**: `demo-data/customers.json` — customer details and policy info
- **FAQ**: `demo-data/faq.json` — general billing FAQs (payment methods, billing cycles)

## Premium Change Factors

When explaining premium changes, always check for these factors:

1. **Claims history** — recent claims increase risk profile
2. **Market conditions** — reinsurance cost changes affect all policyholders
3. **Insurance Premium Tax (IPT)** — currently 12% standard rate
4. **Rebuild cost inflation** — BCIS index affects buildings cover
5. **Risk reassessment** — postcode flood risk updates, subsidence data
6. **Cover level changes** — customer may have upgraded/downgraded

## Payment Methods Reference

- Direct debit (monthly): includes 4.5% APR credit charge
- Direct debit (annual): 3% saving vs monthly
- Debit card: one-off payments
- Credit card: one-off payments

## Refund Process

1. Flag the refund request (you cannot process directly)
2. Confirm the amount and reason with the customer
3. Note: cooling-off refunds (within 14 days) are full minus days used
4. Note: post-cooling-off cancellations may incur fees
5. Refunds are processed within 10 working days
