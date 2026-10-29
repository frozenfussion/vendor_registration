// Registration form contract. Used by BOTH the client form (react) and the
// server route (POST /api/register). Do not fork a second copy.
import { z } from "zod";

export const SUPPLY_CATEGORIES = [
  "EQUIPMENT",
  "RAW_MATERIALS",
  "MRO",
  "SERVICES",
  "CONTRACTOR",
  "OTHER",
] as const;

export const SUPPLY_CATEGORY_LABELS: Record<(typeof SUPPLY_CATEGORIES)[number], string> = {
  EQUIPMENT: "Equipment",
  RAW_MATERIALS: "Raw materials",
  MRO: "MRO (maintenance, repair, operations)",
  SERVICES: "Services",
  CONTRACTOR: "Contractor",
  OTHER: "Other",
};

export const BUSINESS_TYPES = [
  "Sdn Bhd",
  "Berhad",
  "Enterprise / Sole proprietor",
  "Partnership / PLT",
] as const;

export const MALAYSIAN_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Kuala Lumpur",
  "Labuan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Putrajaya",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
] as const;

export const MALAYSIAN_BANKS = [
  "Maybank",
  "CIMB",
  "Public Bank",
  "RHB",
  "Hong Leong Bank",
  "AmBank",
  "Bank Islam",
  "Affin Bank",
  "Alliance Bank",
  "Bank Rakyat",
  "OCBC",
  "UOB",
  "HSBC",
  "Standard Chartered",
  "Other",
] as const;

const trimmed = (max: number, label: string) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

// Malaysian mobile/landline; lenient on spacing and dashes.
const phoneRegex = /^(\+?6?0)[0-9\s-]{8,14}$/;
const postcodeRegex = /^\d{5}$/;

export const vendorRegistrationSchema = z.object({
  // Company
  companyName: trimmed(200, "Company name"),
  registrationNo: trimmed(50, "SSM registration number"),
  taxId: trimmed(50, "Tax identification number"),
  businessType: z.enum(BUSINESS_TYPES, { error: "Select a business type" }),
  yearsInOperation: z.coerce
    .number({ error: "Years in operation must be a number" })
    .int("Years in operation must be a whole number")
    .min(0, "Years in operation cannot be negative")
    .max(200, "Years in operation looks wrong"),
  address: trimmed(300, "Address"),
  city: trimmed(100, "City"),
  state: z.enum(MALAYSIAN_STATES, { error: "Select a state" }),
  postcode: z.string().trim().regex(postcodeRegex, "Postcode must be 5 digits"),

  // Supply
  category: z.enum(SUPPLY_CATEGORIES, { error: "Select a supply category" }),
  description: trimmed(2000, "Description"),

  // Contact
  contactName: trimmed(120, "Contact name"),
  contactPosition: trimmed(120, "Position"),
  contactEmail: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  contactPhone: z.string().trim().regex(phoneRegex, "Enter a valid Malaysian phone number"),

  // Bank
  bankName: z.enum(MALAYSIAN_BANKS, { error: "Select a bank" }),
  bankAccountNo: z
    .string()
    .trim()
    .regex(/^[0-9\s-]{6,30}$/, "Enter a valid account number"),
  bankAccountName: trimmed(200, "Account holder name"),

  // Declaration
  declarationAccepted: z.literal(true, {
    error: "You must confirm the declaration",
  }),
});

export type VendorRegistrationInput = z.input<typeof vendorRegistrationSchema>;
export type VendorRegistration = z.output<typeof vendorRegistrationSchema>;

/** Public status lookup. */
export const referenceNoSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^VR-\d{4}-\d{4,}$/, "Reference number looks like VR-2026-0001");
