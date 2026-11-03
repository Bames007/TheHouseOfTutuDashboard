// app/lib/email/resend.ts
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "[email] RESEND_API_KEY is not set — outgoing emails will fail.",
  );
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? "re_missing");

// ── Sender identity ──────────────────────────────────────
// EMAIL_FROM's domain MUST be verified in Resend (resend.com/domains).
// You verified `admission.thehouseoftutuacademy.com` (subdomain).
export const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  "The House of Tutu <noreply@admission.thehouseoftutuacademy.com>";

// Reply-to and admin recipients don't need verification — any real inbox works.
export const EMAIL_REPLY_TO =
  process.env.EMAIL_REPLY_TO || "admissions@thehouseoftutuacademy.com";

export const ADMIN_EMAILS: string[] = (
  process.env.ADMIN_EMAILS ||
  "admissions@thehouseoftutuacademy.com,owner@thehouseoftutuacademy.com"
)
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);
