---
name: meridian-technical
description: Meridian Insurance technical support — portal access, claims status, document uploads, troubleshooting
triggers:
  - portal
  - login
  - password
  - upload
  - claim status
  - technical
  - error
---

# Meridian Technical Support Skill

## Data Sources

- **Claims data**: `demo-data/claims.json` — claim records with reference, status, adjuster, dates
- **Customer profiles**: `demo-data/customers.json`
- **FAQ**: `demo-data/faq.json` — technical FAQs (portal login, uploads)

## Claims Status Stages

| Stage | Description | Typical duration |
|-------|-------------|-----------------|
| Reported | Claim received, awaiting adjuster assignment | 0-48 hours |
| Under Review | Adjuster assigned, assessing damage | 1-2 weeks |
| Assessment | Site visit or documentation review in progress | 1-3 weeks |
| Settlement Offered | Amount confirmed, awaiting customer acceptance | 5 working days to respond |
| Approved | Settlement accepted, payment processing | 5 working days |
| Closed | Claim completed and paid | — |

## Portal Troubleshooting Checklist

Walk through these steps in order:
1. Confirm the customer is using their registered email address
2. Clear browser cache and cookies
3. Try a different browser or incognito/private mode
4. Check if account is locked (5 failed attempts = 30-minute lockout)
5. Use 'Forgot Password' for a reset link
6. If none work → flag for manual portal access reset

## Document Upload Specifications

- Accepted formats: PDF, JPG, PNG
- Maximum file size: 10MB per file
- Upload via: Customer portal → My Claims → [claim reference] → Upload Documents
- Email fallback: claims-docs@meridian-insurance.co.uk (quote claim reference)

## Password Reset Process

1. Customer clicks 'Forgot Password' on portal login page
2. Enters registered email address
3. Reset link sent (valid for 24 hours)
4. If email not received: check spam, verify email address, request manual reset
