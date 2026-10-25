from app.schemas.receipt import ALLOWED_CATEGORIES

EXTRACTION_SYSTEM_PROMPT = """You are ReceiptWise, a high-precision financial document extraction AI powered by Gemma/Gemini.
Rules:
1. Return ONLY valid JSON matching the requested schema. No conversational prose, markdown intros, or explanation outside JSON.
2. Accuracy is paramount: extract exact amounts, currency, dates, vendor names, and itemized charges.
3. For UPI and payment app screenshots (PhonePe, Google Pay, Paytm, BHIM, CRED):
   - Set document_type to "payment_screenshot".
   - Vendor: Extract the recipient / merchant ("Paid to", "Transfer to", merchant name e.g. Swiggy, Uber, Zomato, Reliance, etc.).
   - Invoice / Reference: Extract the Transaction ID / UTR / Reference number into invoice_number.
   - Payment method: Identify as "UPI / PhonePe", "UPI / Google Pay", "UPI / Paytm", or "UPI".
   - Payment status: Set to "paid".
   - Charges division: If the screenshot displays itemized charges (e.g. Order amount, Platform fee, Convenience fee, Delivery charges, GST, Tip), divide them into individual line_items with accurate descriptions and amounts.
   - If only a total amount is shown without sub-charges, create a single line item with description "Payment to <Vendor>" and the exact amount.
4. Dates must be formatted as YYYY-MM-DD.
5. All monetary amounts must be plain floating-point numbers without currency symbols (₹, $, Rs) or commas.
6. Preferred currency is INR unless clearly stated otherwise (e.g., USD, EUR).
7. Assign exactly one category from the allowed categories list.
8. If the receipt is blurry, values are missing, or arithmetic does not sum up, set needs_review to true with a concise review_reason."""

EXTRACTION_USER_TEMPLATE = """Analyze this document / payment screenshot image and extract all financial data accurately.

User note: {note}
Country context: India. Preferred currency: INR.
Allowed categories: {categories}
{corrections}

Return a JSON object with this exact structure:
{{
  "document_type": "receipt" | "invoice" | "bill" | "payment_screenshot" | "unknown",
  "vendor": "string or null",
  "invoice_number": "string or null",
  "date": "YYYY-MM-DD or null",
  "currency": "INR",
  "subtotal": number or null,
  "tax_type": "string or null (e.g. GST, CGST+SGST, IGST, etc.)",
  "tax_rate": number or null,
  "tax_amount": number or null,
  "total": number or null,
  "payment_method": "string or null",
  "payment_status": "paid" | "unpaid" | "partial" | "unknown",
  "category": "one of the allowed categories",
  "business_expense": true | false,
  "line_items": [
    {{ "description": "Accurate item or charge description", "quantity": number or null, "amount": number or null }}
  ],
  "confidence": 0.0 to 1.0,
  "needs_review": true | false,
  "review_reason": "string or null"
}}"""


def build_extraction_prompt(note: str = "", corrections: list[dict] = None) -> str:
    corrections_text = ""
    if corrections:
        pairs = [f'  - "{c["vendor"]}" → {c["category"]}' for c in corrections[:3]]
        corrections_text = "Known vendor corrections:\n" + "\n".join(pairs)

    return EXTRACTION_USER_TEMPLATE.format(
        note=note or "None",
        categories=", ".join(ALLOWED_CATEGORIES),
        corrections=corrections_text
    )
