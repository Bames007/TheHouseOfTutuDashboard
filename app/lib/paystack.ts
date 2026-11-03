// app/lib/paystack.ts
"use client";

declare global {
  interface Window {
    PaystackPop?: any;
  }
}

export interface PaystackResult {
  status: "success" | "cancelled" | "error";
  reference: string | null;
  message?: string;
}

const SCRIPT_ID = "paystack-inline-script";
const SCRIPT_SRC = "https://js.paystack.co/v1/inline.js";

function loadScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Paystack requires the browser"));
      return;
    }
    if (window.PaystackPop) {
      resolve();
      return;
    }
    if (document.getElementById(SCRIPT_ID)) {
      // Script is loading — poll for it
      const poll = setInterval(() => {
        if (window.PaystackPop) {
          clearInterval(poll);
          resolve();
        }
      }, 200);
      setTimeout(() => {
        clearInterval(poll);
        reject(new Error("Paystack script timeout"));
      }, 10000);
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack"));
    document.head.appendChild(script);
  });
}

export interface PaystackParams {
  email: string;
  amount: number; // NGN, not kobo
  metadata?: Record<string, any>;
  reference?: string;
}

/**
 * Opens the Paystack inline checkout.
 * Falls back to a simulated success if NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is unset.
 */
export async function triggerPaystack(
  params: PaystackParams,
): Promise<PaystackResult> {
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  // ── Demo mode — no key configured ────────────────────────
  if (!publicKey) {
    console.info(
      "[paystack] Demo mode — no NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY. Simulating success.",
    );
    await new Promise((r) => setTimeout(r, 1500));
    return {
      status: "success",
      reference: `DEMO_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      message: "Demo payment (no Paystack key configured)",
    };
  }

  // ── Real Paystack ────────────────────────────────────────
  try {
    await loadScript();
  } catch (e: any) {
    return {
      status: "error",
      reference: null,
      message: e?.message || "Could not load Paystack",
    };
  }

  return new Promise((resolve) => {
    try {
      const handler = window.PaystackPop.setup({
        key: publicKey,
        email: params.email,
        amount: Math.round(params.amount * 100), // kobo
        currency: "NGN",
        ref: params.reference || undefined,
        metadata: params.metadata || {},
        callback: (response: { reference: string }) => {
          resolve({ status: "success", reference: response.reference });
        },
        onClose: () => {
          resolve({
            status: "cancelled",
            reference: null,
            message: "Payment window closed",
          });
        },
      });
      handler.openIframe();
    } catch (e: any) {
      resolve({
        status: "error",
        reference: null,
        message: e?.message || "Paystack error",
      });
    }
  });
}
