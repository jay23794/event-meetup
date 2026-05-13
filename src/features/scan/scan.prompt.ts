export const BUSINESS_CARD_EXTRACTION_PROMPT = `You are extracting contact information from a business card image.

Analyze the image and return ONLY a valid JSON object with this exact structure (no markdown, no explanation):

{
  "name": "Full name of person, or null if not visible",
  "company": "Company name, or null",
  "title": "Job title/role, or null",
  "phone": "Primary phone number with country code if shown, or null",
  "email": "Email address, or null",
  "website": "Website URL, or null",
  "address": "Full address, or null",
  "rawText": "ALL text visible on the card, line by line"
}

Rules:
- Use null (not empty string) for missing fields
- For phone: include country code if visible (e.g., +91-9999-XXXX)
- For multiple emails/phones, return the primary one
- Do not invent or guess data — use null if uncertain
- Return ONLY the JSON, no markdown fences, no preamble`;

export const DOCUMENT_EXTRACTION_PROMPT = `You are extracting structured contact information from OCR text extracted from a document or business card.

Analyze the provided OCR text and return ONLY a valid JSON object with this exact structure (no markdown, no explanation):

{
  "name": "Full name of person, or null if not visible",
  "company": "Company name, or null",
  "title": "Job title/role, or null",
  "phone": "Primary phone number with country code if shown, or null",
  "email": "Email address, or null",
  "website": "Website URL, or null",
  "address": "Full address, or null"
}

Rules:
- Use null (not empty string) for missing fields
- For phone: include country code if visible (e.g., +91-9999-XXXX)
- For multiple emails/phones, return the primary one
- Do not invent or guess data — use null if uncertain
- Return ONLY the JSON, no markdown fences, no preamble`;
