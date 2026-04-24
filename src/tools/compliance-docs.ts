import * as fs from "fs";
import * as path from "path";

/**
 * Search Meridian's compliance documentation library.
 * Reads markdown files from demo-data/compliance-docs/ and performs
 * simple text search, returning matching sections with document references.
 */
export function searchComplianceDocs(query: string): object {
  const docsDir = path.resolve(__dirname, "../../demo-data/compliance-docs");

  let files: string[];
  try {
    files = fs.readdirSync(docsDir).filter((f) => f.endsWith(".md"));
  } catch {
    return {
      error: "Compliance documentation library is currently unavailable.",
    };
  }

  if (files.length === 0) {
    return {
      error: "No compliance documents found in the library.",
    };
  }

  const queryWords = query
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);

  if (queryWords.length === 0) {
    return { error: "Query is too short or contains no searchable terms." };
  }

  const results: Array<{
    document: string;
    section: string;
    content: string;
    relevance_score: number;
  }> = [];

  for (const file of files) {
    const filePath = path.join(docsDir, file);
    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      continue;
    }

    // Split into sections by markdown headings
    const sections = content.split(/^(?=#{1,3}\s)/m);

    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed) continue;

      const sectionLower = trimmed.toLowerCase();
      let score = 0;

      for (const word of queryWords) {
        if (sectionLower.includes(word)) {
          score += 1;
        }
      }

      if (score > 0) {
        // Extract section heading
        const headingMatch = trimmed.match(/^#{1,3}\s+(.+)/);
        const heading = headingMatch ? headingMatch[1].trim() : "Introduction";

        results.push({
          document: file.replace(".md", ""),
          section: heading,
          content:
            trimmed.length > 500 ? trimmed.substring(0, 500) + "..." : trimmed,
          relevance_score: score,
        });
      }
    }
  }

  results.sort((a, b) => b.relevance_score - a.relevance_score);

  const topResults = results.slice(0, 5);

  if (topResults.length === 0) {
    return {
      results: [],
      message:
        "No matching compliance documents found. Consider broadening your search terms or escalating to the legal team.",
    };
  }

  return { results: topResults };
}

/**
 * Retrieve the data handling policy for a specific category of personal data.
 * Returns the lawful basis, retention period, sharing arrangements, and
 * customer rights relevant to that data type.
 */
export function getDataHandlingPolicy(dataType: string): object {
  const policies: Record<
    string,
    {
      data_type: string;
      description: string;
      lawful_basis: string;
      retention_period: string;
      shared_with: string[];
      customer_rights: string[];
      special_category: boolean;
    }
  > = {
    identity: {
      data_type: "Identity Data",
      description:
        "Full name, date of birth, gender, national insurance number, driving licence number, passport details.",
      lawful_basis:
        "Contract performance (Art. 6(1)(b) UK GDPR) and legal obligation (Art. 6(1)(c) UK GDPR).",
      retention_period:
        "Duration of policy plus 7 years after policy termination or last claim settlement.",
      shared_with: [
        "Underwriters",
        "Reinsurers",
        "Fraud prevention services (CIFAS)",
        "Regulatory bodies (FCA, ICO) upon lawful request",
      ],
      customer_rights: [
        "Right of access (SAR)",
        "Right to rectification",
        "Right to erasure (subject to legal retention obligations)",
        "Right to data portability",
      ],
      special_category: false,
    },
    contact: {
      data_type: "Contact Data",
      description:
        "Residential address, email addresses, telephone numbers, correspondence preferences.",
      lawful_basis:
        "Contract performance (Art. 6(1)(b) UK GDPR) and legitimate interests (Art. 6(1)(f) UK GDPR) for service communications.",
      retention_period:
        "Duration of policy plus 3 years, or until consent for marketing is withdrawn.",
      shared_with: [
        "Appointed loss adjusters",
        "Approved repair network partners",
        "Postal and communication service providers",
      ],
      customer_rights: [
        "Right of access (SAR)",
        "Right to rectification",
        "Right to erasure",
        "Right to restrict processing",
        "Right to object to direct marketing",
      ],
      special_category: false,
    },
    financial: {
      data_type: "Financial Data",
      description:
        "Bank account details, payment card information, direct debit mandates, credit history, payment records.",
      lawful_basis:
        "Contract performance (Art. 6(1)(b) UK GDPR) and legal obligation for financial record-keeping.",
      retention_period:
        "Duration of policy plus 7 years (in accordance with HMRC requirements).",
      shared_with: [
        "Payment processors (PCI-DSS compliant)",
        "Credit reference agencies",
        "HMRC upon lawful request",
        "Fraud prevention services",
      ],
      customer_rights: [
        "Right of access (SAR)",
        "Right to rectification",
        "Right to data portability",
      ],
      special_category: false,
    },
    claims: {
      data_type: "Claims Data",
      description:
        "Incident details, damage descriptions, witness statements, photographs, third-party information, settlement records.",
      lawful_basis:
        "Contract performance (Art. 6(1)(b) UK GDPR) and legitimate interests for fraud prevention.",
      retention_period:
        "Duration of policy plus 7 years after final claim settlement. Litigated claims retained for 15 years.",
      shared_with: [
        "Loss adjusters",
        "Claims investigators",
        "Repair and restoration contractors",
        "Legal representatives",
        "Other insurers (via CUE database)",
        "Fraud prevention services",
      ],
      customer_rights: [
        "Right of access (SAR)",
        "Right to rectification of factual inaccuracies",
        "Right to object to automated decision-making",
      ],
      special_category: false,
    },
    technical: {
      data_type: "Technical Data",
      description:
        "IP addresses, browser type, portal usage logs, cookie identifiers, device information.",
      lawful_basis:
        "Legitimate interests (Art. 6(1)(f) UK GDPR) for security and service improvement. Consent for non-essential cookies.",
      retention_period:
        "Session data: 30 days. Analytics data: 26 months. Security logs: 12 months.",
      shared_with: [
        "Cloud infrastructure providers (UK/EEA data centres only)",
        "Security monitoring services",
        "Analytics providers (anonymised data only)",
      ],
      customer_rights: [
        "Right of access (SAR)",
        "Right to erasure",
        "Right to withdraw cookie consent",
        "Right to object to profiling",
      ],
      special_category: false,
    },
    health: {
      data_type: "Health Data (Special Category)",
      description:
        "Medical reports, GP records, injury assessments, rehabilitation records — collected only in relation to specific claim types.",
      lawful_basis:
        "Explicit consent (Art. 9(2)(a) UK GDPR) or substantial public interest (Schedule 1, DPA 2018) for insurance purposes.",
      retention_period:
        "Duration of relevant claim plus 7 years. Deleted promptly if consent is withdrawn and no overriding legal obligation exists.",
      shared_with: [
        "Medical experts and assessors",
        "Rehabilitation providers",
        "Legal representatives (in disputed claims)",
      ],
      customer_rights: [
        "Right of access (SAR)",
        "Right to withdraw consent",
        "Right to rectification",
        "Right to erasure (subject to legal obligations)",
        "Right to restrict processing",
      ],
      special_category: true,
    },
    criminal_convictions: {
      data_type: "Criminal Convictions Data",
      description:
        "Unspent criminal convictions, motoring offences — collected for underwriting risk assessment.",
      lawful_basis:
        "Substantial public interest (Schedule 1, Part 2, DPA 2018) — insurance purposes.",
      retention_period:
        "Duration of policy plus 7 years, or until conviction is spent under the Rehabilitation of Offenders Act 1974.",
      shared_with: [
        "Underwriters",
        "Fraud prevention services",
        "Regulatory bodies upon lawful request",
      ],
      customer_rights: [
        "Right of access (SAR)",
        "Right to rectification",
        "Right to object to automated decision-making in underwriting",
      ],
      special_category: true,
    },
  };

  const policy = policies[dataType];

  if (!policy) {
    return {
      error: `Unknown data type '${dataType}'. Valid types are: ${Object.keys(policies).join(", ")}.`,
    };
  }

  return {
    ...policy,
    regulatory_framework: "UK GDPR and Data Protection Act 2018",
    data_protection_officer: "dpo@meridianinsurance.co.uk",
    last_updated: "2025-11-01",
  };
}
