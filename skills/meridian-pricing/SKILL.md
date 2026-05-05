---
name: meridian-pricing
description: Meridian Insurance pricing — quotes, premium calculations, discount eligibility, cover level comparisons
triggers:
  - quote
  - pricing
  - premium calculation
  - discount
  - cover level
  - how much
---

# Meridian Pricing Skill

## Data Sources

- **Customer profiles**: `demo-data/customers.json`
- **FAQ**: `demo-data/faq.json` — pricing and discount FAQs

## Discount Schedule

| Discount | Value | Eligibility |
|----------|-------|-------------|
| No-claims | Up to 30% | 5+ claim-free years |
| Multi-policy | 10% | Bundle home + motor |
| Security | 5% | Approved alarm system or smart locks |
| Annual payment | 3% | Pay annually vs monthly |

Discounts are applied automatically where eligible. They stack (multiplicative, not additive).

## Premium Calculation Factors

Explain these in plain language when customers ask "why does it cost this much":

1. **Location** — postcode-level flood, subsidence, and crime risk
2. **Property type** — detached, semi, terraced, flat; construction materials
3. **Cover level** — buildings only, contents only, or combined
4. **Excess chosen** — higher voluntary excess = lower premium
5. **Claims history** — recent claims increase risk loading
6. **Rebuild value** — BCIS-linked for buildings cover
7. **Occupancy** — owner-occupied vs let vs unoccupied periods
8. **Security** — locks, alarms, CCTV

## Cover Level Comparison

- **Basic**: buildings OR contents, standard perils, £100K buildings / £50K contents
- **Standard**: buildings + contents, standard perils + accidental damage, £300K / £75K
- **Premium**: buildings + contents, all perils + legal expenses + home emergency, £500K / £100K

## Quote Disclaimer

Always include: "This is an indicative guide. Your actual premium will be confirmed after full underwriting based on the details you provide."
