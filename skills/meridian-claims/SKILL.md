---
name: meridian-claims
description: Meridian Insurance claims analysis — claim investigation, status tracking, settlement queries, adjuster coordination
triggers:
  - claim
  - settlement
  - adjuster
  - investigation
  - claim dispute
---

# Meridian Claims Skill

## Data Sources

- **Claims data**: `demo-data/claims.json` — full claim records
- **Customer profiles**: `demo-data/customers.json`

## Claims Process (5 Steps)

1. **Report** — via phone (0800 123 4567), portal, or chat
2. **Assign adjuster** — within 48 hours of report
3. **Assess damage** — adjuster reviews evidence, may require site visit
4. **Confirm settlement** — amount calculated and offered to customer
5. **Payment** — issued within 5 working days of acceptance

## Claim Record Fields

When looking up a claim, present these fields clearly:
- `claimRef` — the claim reference number
- `customerId` — link to customer profile
- `type` — home, motor, life, commercial
- `status` — current stage (see process above)
- `dateReported` — when claim was filed
- `adjuster` — assigned adjuster name
- `estimatedValue` — current estimated settlement
- `description` — what happened
- `nextAction` — what happens next and when

## Settlement Dispute Process

1. Customer disagrees with offered amount
2. Internal review by senior claims handler (10 working days)
3. If still unresolved: Financial Ombudsman Service (FOS) referral
4. FOS contact: complaint.info@financial-ombudsman.org.uk
5. FOS referral must be within 6 months of final response

## Fraud Awareness

If indicators suggest potential fraud, note them professionally:
- Inconsistent timelines or descriptions
- Claims shortly after policy inception
- Previous similar claims across different insurers
- Never accuse — flag for investigation team review
