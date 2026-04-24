import { Claim } from "../types";
import { loadData } from "./data-loader";

/**
 * Look up the current status and details of an insurance claim by claim ID.
 */
export function checkClaimStatus(claimId: string): object {
  let claims: Claim[];
  try {
    claims = loadData<Claim[]>("claims.json");
  } catch {
    return { error: "Claims system is currently unavailable." };
  }

  const claim = claims.find((c) => c.claim_id === claimId);

  if (!claim) {
    return {
      error: `No claim found with ID '${claimId}'. Please verify the claim reference and try again.`,
    };
  }

  const statusDescriptions: Record<string, string> = {
    open: "Your claim has been filed and is awaiting initial review by our claims team.",
    under_review:
      "An adjuster has been assigned to your claim and is currently investigating.",
    approved:
      "Your claim has been approved. Settlement payment is being processed.",
    denied:
      "Your claim has been denied. You may request a detailed explanation and have the right to appeal within 30 days.",
    settled:
      "Your claim settlement payment has been issued. Please allow 3-5 business days for the funds to reach your account.",
    closed:
      "This claim has been fully resolved and closed. No further action is required.",
  };

  return {
    claim_id: claim.claim_id,
    customer_id: claim.customer_id,
    policy_number: claim.policy_number,
    type: claim.type,
    status: claim.status,
    status_description:
      statusDescriptions[claim.status] || "Status information unavailable.",
    date_filed: claim.date_filed,
    date_of_incident: claim.date_of_incident,
    description: claim.description,
    amount_claimed: claim.amount_claimed,
    amount_approved: claim.amount_approved ?? null,
    adjuster: claim.adjuster ?? "Not yet assigned",
    documents_on_file: claim.documents.length,
    latest_note:
      claim.notes.length > 0 ? claim.notes[claim.notes.length - 1] : null,
  };
}

/**
 * Initiate a portal access reset for a customer.
 * Returns a success message with a reset token reference (the actual
 * reset link is sent to the customer's registered email).
 */
export function resetPortalAccess(customerId: string): object {
  // In a real system this would trigger an email. For the demo we
  // generate a deterministic-looking token.
  const resetToken = `RST-${customerId}-${Date.now().toString(36).toUpperCase()}`;

  return {
    status: "success",
    customer_id: customerId,
    reset_token: resetToken,
    message: `A secure password reset link has been sent to the email address registered to account ${customerId}. The link will expire in 24 hours.`,
    next_steps: [
      "Check your registered email inbox (and spam/junk folder).",
      "Click the reset link within 24 hours.",
      "Create a new password meeting the security requirements (minimum 12 characters, at least one uppercase letter, one number, and one special character).",
      "If you do not receive the email within 15 minutes, contact us again for further assistance.",
    ],
  };
}

/**
 * Get step-by-step document upload instructions for a specific document type.
 */
export function getUploadInstructions(documentType: string): object {
  const instructions: Record<
    string,
    {
      document_type: string;
      accepted_formats: string[];
      max_file_size_mb: number;
      steps: string[];
      tips: string[];
    }
  > = {
    photo_evidence: {
      document_type: "Photo Evidence",
      accepted_formats: ["JPEG", "PNG", "HEIC", "WebP"],
      max_file_size_mb: 25,
      steps: [
        "Log in to the Meridian Customer Portal at portal.meridianinsurance.co.uk.",
        "Navigate to 'My Claims' from the main menu.",
        "Select the relevant claim by clicking on the claim reference number.",
        "Click the 'Upload Documents' button in the claim details panel.",
        "Select 'Photo Evidence' from the document type dropdown.",
        "Click 'Choose Files' or drag and drop your photos into the upload area.",
        "Add a brief description for each photo (e.g., 'Front of property showing damage').",
        "Click 'Upload' and wait for the confirmation message.",
      ],
      tips: [
        "Take photos in good lighting with the damage clearly visible.",
        "Include wide-angle shots for context as well as close-ups of specific damage.",
        "Include a date stamp if possible (most phone cameras do this automatically).",
        "You can upload up to 20 photos per claim.",
      ],
    },
    repair_estimate: {
      document_type: "Repair Estimate / Quote",
      accepted_formats: ["PDF", "JPEG", "PNG"],
      max_file_size_mb: 10,
      steps: [
        "Log in to the Meridian Customer Portal.",
        "Navigate to 'My Claims' and select the relevant claim.",
        "Click 'Upload Documents'.",
        "Select 'Repair Estimate' from the document type dropdown.",
        "Upload the estimate document (PDF preferred).",
        "Ensure the estimate includes: contractor name, itemised costs, VAT, and estimated timeline.",
        "Click 'Upload' to submit.",
      ],
      tips: [
        "We recommend obtaining at least two independent estimates for comparison.",
        "Ensure the estimate is on headed paper or clearly identifies the contractor.",
        "VAT-registered contractors should show VAT separately.",
      ],
    },
    police_report: {
      document_type: "Police Report / Crime Reference",
      accepted_formats: ["PDF"],
      max_file_size_mb: 10,
      steps: [
        "Log in to the Meridian Customer Portal.",
        "Navigate to 'My Claims' and select the relevant claim.",
        "Click 'Upload Documents'.",
        "Select 'Police Report' from the document type dropdown.",
        "Upload the PDF of the police report or crime reference confirmation.",
        "Enter the crime reference number in the reference field.",
        "Click 'Upload' to submit.",
      ],
      tips: [
        "If you only have a crime reference number (not a full report), enter it in the reference field and note this in the description.",
        "Reports from Action Fraud are also accepted for cyber/fraud-related claims.",
      ],
    },
    medical_report: {
      document_type: "Medical Report",
      accepted_formats: ["PDF"],
      max_file_size_mb: 10,
      steps: [
        "Log in to the Meridian Customer Portal.",
        "Navigate to 'My Claims' and select the relevant claim.",
        "Click 'Upload Documents'.",
        "Select 'Medical Report' from the document type dropdown.",
        "Upload the PDF of the medical report.",
        "Confirm consent for Meridian to process the health data contained in the report.",
        "Click 'Upload' to submit.",
      ],
      tips: [
        "Medical reports are classified as special category data under UK GDPR and are handled with enhanced security.",
        "Ensure the report is from a registered medical professional.",
        "You can withdraw consent for processing at any time by contacting our Data Protection Officer.",
      ],
    },
    signed_form: {
      document_type: "Signed Form / Declaration",
      accepted_formats: ["PDF", "JPEG", "PNG"],
      max_file_size_mb: 10,
      steps: [
        "Log in to the Meridian Customer Portal.",
        "Navigate to 'My Claims' or 'My Policy' as appropriate.",
        "Click 'Upload Documents'.",
        "Select 'Signed Form' from the document type dropdown.",
        "Upload a scan or clear photo of the signed form.",
        "Click 'Upload' to submit.",
      ],
      tips: [
        "Ensure the signature is clearly visible and the entire form is captured.",
        "Digital signatures (e.g., DocuSign, Adobe Sign) are accepted.",
        "If posting the original, use recorded delivery and retain your proof of posting.",
      ],
    },
    identity_document: {
      document_type: "Identity Document",
      accepted_formats: ["PDF", "JPEG", "PNG"],
      max_file_size_mb: 10,
      steps: [
        "Log in to the Meridian Customer Portal.",
        "Navigate to 'My Account' > 'Verify Identity'.",
        "Select the type of identity document (passport, driving licence, or utility bill).",
        "Upload a clear scan or photo of the document.",
        "Ensure all four corners of the document are visible.",
        "Click 'Upload' to submit for verification.",
      ],
      tips: [
        "Do not obscure any part of the document.",
        "For utility bills, ensure the document is dated within the last 3 months.",
        "Identity documents are encrypted at rest and automatically deleted after verification.",
      ],
    },
    proof_of_ownership: {
      document_type: "Proof of Ownership",
      accepted_formats: ["PDF", "JPEG", "PNG"],
      max_file_size_mb: 15,
      steps: [
        "Log in to the Meridian Customer Portal.",
        "Navigate to 'My Claims' and select the relevant claim.",
        "Click 'Upload Documents'.",
        "Select 'Proof of Ownership' from the document type dropdown.",
        "Upload receipts, invoices, warranty cards, or product registration confirmations.",
        "Click 'Upload' to submit.",
      ],
      tips: [
        "Original purchase receipts are ideal but bank/credit card statements showing the transaction are also accepted.",
        "For high-value items, professional valuations are recommended.",
        "Photos of the item (before loss/damage) are helpful supplementary evidence.",
      ],
    },
    invoice: {
      document_type: "Invoice",
      accepted_formats: ["PDF", "JPEG", "PNG"],
      max_file_size_mb: 10,
      steps: [
        "Log in to the Meridian Customer Portal.",
        "Navigate to 'My Claims' and select the relevant claim.",
        "Click 'Upload Documents'.",
        "Select 'Invoice' from the document type dropdown.",
        "Upload the invoice document.",
        "Click 'Upload' to submit.",
      ],
      tips: [
        "Ensure the invoice includes the provider's name, date, itemised charges, and total.",
        "VAT invoices should show the VAT registration number.",
      ],
    },
    other: {
      document_type: "Other Document",
      accepted_formats: ["PDF", "JPEG", "PNG", "DOCX"],
      max_file_size_mb: 25,
      steps: [
        "Log in to the Meridian Customer Portal.",
        "Navigate to the relevant section ('My Claims', 'My Policy', or 'My Account').",
        "Click 'Upload Documents'.",
        "Select 'Other' from the document type dropdown.",
        "Provide a clear description of the document in the description field.",
        "Upload the file.",
        "Click 'Upload' to submit.",
      ],
      tips: [
        "Please provide as much context as possible in the description field so our team can process the document efficiently.",
        "If you're unsure which document type to select, 'Other' is a safe choice — our team will categorise it appropriately.",
      ],
    },
  };

  const instruction = instructions[documentType];

  if (!instruction) {
    return {
      error: `Unknown document type '${documentType}'. Valid types are: ${Object.keys(instructions).join(", ")}.`,
    };
  }

  return {
    ...instruction,
    portal_url: "https://portal.meridianinsurance.co.uk",
    support_email: "documents@meridianinsurance.co.uk",
    support_phone: "0800 123 4567 (option 3)",
  };
}
