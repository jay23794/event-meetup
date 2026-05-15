export const BUSINESS_CARD_EXTRACTION_PROMPT = `You are extracting contact information from a business card image.

Analyze the image and return ONLY a valid JSON object with this exact structure (no markdown, no explanation):

{
  "name": "Full name of person, or null if not visible",
  "company": "Company name, or null",
  "title": "Job title/role, or null",
  "phone": "Primary phone number with country code if shown, or null",
  "email": "Email address, or null",
  "website": "Primary website URL (company homepage), or null",
  "linkedin": "LinkedIn profile or company URL (e.g., https://linkedin.com/in/...), or null",
  "socialMedia": ["Array of other social media URLs found on the card — twitter/x, facebook, instagram, youtube, github, etc. Empty array if none."],
  "address": "Full address, or null",
  "rawText": "ALL text visible on the card, line by line"
}

Rules:
- Use null (not empty string) for missing string fields; empty array [] for socialMedia if no links
- For phone: include country code if visible (e.g., +91-9999-XXXX)
- For multiple emails/phones, return the primary one
- For URLs: include the full URL (prefix with https:// if a bare domain is shown). LinkedIn always goes in "linkedin", company homepage in "website", everything else (twitter/x, facebook, instagram, youtube, github, etc.) in "socialMedia"
- A bare handle like "@acme" is not a URL — only return resolvable URLs
- Do not invent or guess data — use null/[] if uncertain
- Return ONLY the JSON, no markdown fences, no preamble`;

export const DOCUMENT_EXTRACTION_PROMPT = `You are extracting structured contact information from OCR text extracted from a document or business card.

Analyze the provided OCR text and return ONLY a valid JSON object with this exact structure (no markdown, no explanation):

{
  "name": "Full name of person, or null if not visible",
  "company": "Company name, or null",
  "title": "Job title/role, or null",
  "phone": "Primary phone number with country code if shown, or null",
  "email": "Email address, or null",
  "website": "Primary website URL (company homepage), or null",
  "linkedin": "LinkedIn profile or company URL, or null",
  "socialMedia": ["Array of other social media URLs — twitter/x, facebook, instagram, youtube, github, etc. Empty array if none."],
  "address": "Full address, or null"
}

Rules:
- Use null (not empty string) for missing string fields; empty array [] for socialMedia if no links
- For phone: include country code if visible (e.g., +91-9999-XXXX)
- For multiple emails/phones, return the primary one
- For URLs: include the full URL (prefix with https:// if a bare domain). LinkedIn always goes in "linkedin", company homepage in "website", other socials (twitter/x, facebook, instagram, youtube, github, etc.) in "socialMedia"
- A bare handle like "@acme" is not a URL — only return resolvable URLs
- Do not invent or guess data — use null/[] if uncertain
- Return ONLY the JSON, no markdown fences, no preamble`;
