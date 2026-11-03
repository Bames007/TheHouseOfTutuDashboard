// app/dashboard/panels/PaymentsPanel.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Receipt,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronRight,
  BookOpen,
  Package,
  Wrench,
  Printer,
  Banknote,
  Globe,
  ArrowRight,
  Trash2,
  ShoppingCart,
  Info,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import {
  Payment,
  Student,
  UserRole,
  PaymentMethod,
  DeliveryFormat,
} from "@/app/type/database";
import { triggerPaystack } from "@/app/lib/paystack";

// ─────────────────────────────────────────────────────────────
// STATIC CATALOG
// ─────────────────────────────────────────────────────────────
type Category = "books" | "kits" | "tools";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  icon: React.ElementType;
  badge?: string;
}

const PRODUCTS: Product[] = [
  {
    id: "book-perfumers-workbook",
    name: "The Perfumer's Workbook",
    description:
      "200-page guided journal with blend logs, note charts, and formulation tables.",
    price: 25000,
    category: "books",
    icon: BookOpen,
    badge: "Bestseller",
  },
  {
    id: "book-fragrance-families",
    name: "Fragrance Families Handbook",
    description:
      "The complete 8-family reference with 300+ materials annotated by nose.",
    price: 18000,
    category: "books",
    icon: BookOpen,
  },
  {
    id: "book-raw-materials",
    name: "Raw Materials Guide",
    description:
      "Sourcing directory, IFRA restrictions, and dilution cheat sheets.",
    price: 22000,
    category: "books",
    icon: BookOpen,
  },
  {
    id: "kit-starter",
    name: "Starter Blending Kit",
    description:
      "12 essential oils, 6 base notes, 10 bottles, pipettes, and a bench mat.",
    price: 85000,
    category: "kits",
    icon: Package,
    badge: "Popular",
  },
  {
    id: "kit-advanced",
    name: "Advanced Formulation Kit",
    description:
      "24 materials including absolutes, 20 bottles, scale-ready accessories.",
    price: 150000,
    category: "kits",
    icon: Package,
  },
  {
    id: "kit-travel",
    name: "Perfumer's Travel Case",
    description:
      "Padded case for 20× 5ml vials, notebook pouch, and bench tools.",
    price: 32000,
    category: "kits",
    icon: Package,
  },
  {
    id: "tool-scale",
    name: "Precision Perfumer's Scale",
    description:
      "0.001g accuracy, 500g capacity, tare function. Essential for blending.",
    price: 45000,
    category: "tools",
    icon: Wrench,
  },
  {
    id: "tool-glassware",
    name: "Glassware Set",
    description:
      "Beakers, pipettes, funnel, glass rod, and 6 amber storage bottles.",
    price: 35000,
    category: "tools",
    icon: Wrench,
  },
  {
    id: "tool-pipettes",
    name: "Pipette Starter Pack",
    description: "50× disposable transfer pipettes with fine tips.",
    price: 8500,
    category: "tools",
    icon: Wrench,
  },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function fmtNaira(n?: number) {
  if (!n && n !== 0) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const STATUS_STYLES: Record<string, string> = {
  successful: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-slate-100 text-slate-700",
};

const METHOD_LABELS: Record<string, string> = {
  "bank-transfer": "Bank Transfer",
  "pos-payment": "POS Payment",
  "online-payment": "Online Payment",
  cash: "Cash",
};

// ─────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────
function StatTile({
  label,
  value,
  hint,
  tone = "burgundy",
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "burgundy" | "emerald" | "amber" | "blue";
  icon: React.ElementType;
}) {
  const tones = {
    burgundy: "bg-[#691C33]/5 border-[#691C33]/15 text-[#691C33]",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    blue: "bg-blue-50 border-blue-100 text-blue-800",
  };
  return (
    <div className={`rounded-2xl p-4 border ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] md:text-[11px] uppercase tracking-wider font-bold opacity-80">
            {label}
          </p>
          <p className="text-lg md:text-xl font-bold mt-1 truncate">{value}</p>
          {hint && (
            <p className="text-[10px] md:text-xs opacity-70 mt-0.5 truncate">
              {hint}
            </p>
          )}
        </div>
        <Icon className="w-4 h-4 md:w-5 md:h-5 opacity-60 shrink-0" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
        STATUS_STYLES[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// RECEIPT MODAL
// ─────────────────────────────────────────────────────────────
function ReceiptModal({
  payment,
  student,
  onClose,
}: {
  payment: Payment;
  student: Student;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto [color-scheme:light]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            Payment Receipt
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 receipt-print">
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#691C33] font-bold">
              House of Tutu
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Perfumery Academy</p>
            <div
              className={`inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                STATUS_STYLES[payment.status] || "bg-slate-100 text-slate-700"
              }`}
            >
              {payment.status}
            </div>
          </div>

          <div className="text-center py-5">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Amount
            </p>
            <p className="text-3xl font-bold text-[#691C33] mt-1">
              {fmtNaira(payment.amount)}
            </p>
          </div>

          <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-2">
            {[
              {
                label: "Reference",
                value: payment.reference || "—",
                mono: true,
              },
              {
                label: "Method",
                value: METHOD_LABELS[payment.method] || payment.method || "—",
              },
              { label: "Date", value: fmtDateTime(payment.recordedAt) },
              { label: "Receipt #", value: payment.id || "—", mono: true },
              { label: "Purpose", value: payment.note || "School fees" },
              { label: "Student", value: student.fullName },
              { label: "Student ID", value: student.id || "—", mono: true },
              { label: "Email", value: student.email },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-3"
              >
                <p className="text-xs text-slate-500 shrink-0">{row.label}</p>
                <p
                  className={`text-xs font-semibold text-slate-900 text-right break-all ${
                    row.mono ? "font-mono" : ""
                  }`}
                >
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          {payment.verifiedAt && (
            <div className="mt-3 text-center text-[10px] text-emerald-700 font-medium">
              Verified on {fmtDateTime(payment.verifiedAt)}
            </div>
          )}

          <p className="text-center text-[10px] text-slate-400 mt-4 leading-relaxed">
            Thank you for your payment. For questions, contact
            <br />
            admissions@thehouseoftutuacademy.com
          </p>
        </div>

        <div className="px-5 pb-5 pt-2 flex gap-2 no-print">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-[#691C33] hover:bg-[#8A2B4A] text-white py-3 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────
type Tab = "fees" | "shop" | "history";

interface CartItem {
  productId: string;
  quantity: number;
}

export default function PaymentsPanel() {
  const { user } = useDashboard();
  const student = user?.role === UserRole.STUDENT ? (user as Student) : null;

  const [tab, setTab] = useState<Tab>("fees");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showPayModal, setShowPayModal] = useState<null | "fees" | "shop">(
    null,
  );
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const studentId = student?.studentId ?? student?.id ?? null;

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    setLoadingPayments(true);
    fetch(`/api/students/${studentId}/payments`, {
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((body) => {
        if (!cancelled && body.success) {
          const sorted = (body.data as Payment[]).sort(
            (a, b) =>
              new Date(b.recordedAt).getTime() -
              new Date(a.recordedAt).getTime(),
          );
          setPayments(sorted);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingPayments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const courseFee = useMemo(() => {
    const map: Record<DeliveryFormat, number> = {
      "offline-6weeks": 600000,
      "offline-3months": 800000,
      "intensive-1day": 120000,
    };
    return student?.deliveryFormat
      ? map[student.deliveryFormat] || 0
      : (student as any)?.courseFee || 0;
  }, [student]);

  const feesPaid = useMemo(
    () =>
      payments
        .filter(
          (p) =>
            p.status === "successful" &&
            (!p.note || p.note.toLowerCase().includes("school fee")),
        )
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments],
  );

  const amountDue = Math.max(0, courseFee - feesPaid);
  const isFeesPaid = amountDue <= 0;
  const hasPendingFee = payments.some(
    (p) =>
      p.status === "pending" &&
      (!p.note || p.note.toLowerCase().includes("school fee")),
  );

  const cartItems = useMemo(
    () =>
      cart
        .map((c) => {
          const product = PRODUCTS.find((p) => p.id === c.productId);
          return product ? { ...c, product } : null;
        })
        .filter(Boolean) as Array<CartItem & { product: Product }>,
    [cart],
  );

  const cartTotal = cartItems.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0,
  );
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  const filteredProducts = useMemo(
    () =>
      categoryFilter === "all"
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === categoryFilter),
    [categoryFilter],
  );

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const found = prev.find((c) => c.productId === productId);
      if (found) {
        return prev.map((c) =>
          c.productId === productId ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const setQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.productId !== productId));
    } else {
      setCart((prev) =>
        prev.map((c) =>
          c.productId === productId ? { ...c, quantity: qty } : c,
        ),
      );
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const recordPayment = async (
    amount: number,
    reference: string,
    note: string,
    method: PaymentMethod,
  ) => {
    if (!studentId) throw new Error("No student ID");
    const res = await fetch(`/api/students/${studentId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ amount, reference, note, method }),
    });
    const body = await res.json();
    if (!body.success)
      throw new Error(body.error || "Failed to record payment");
    return body.data as Payment;
  };

  const refreshPayments = () => {
    if (!studentId) return;
    fetch(`/api/students/${studentId}/payments`, {
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((body) => {
        if (body.success) {
          const sorted = (body.data as Payment[]).sort(
            (a, b) =>
              new Date(b.recordedAt).getTime() -
              new Date(a.recordedAt).getTime(),
          );
          setPayments(sorted);
        }
      })
      .catch(() => {});
  };

  const handlePayFees = async (method: PaymentMethod) => {
    if (!student) return;
    setProcessing(true);
    setPayError(null);

    try {
      const amountToPay = amountDue;

      if (method === "bank-transfer") {
        const reference = `TUTU-BT-${Date.now()}`;
        await recordPayment(
          amountToPay,
          reference,
          "School fees — bank transfer",
          method,
        );
        setSuccessBanner(
          "Payment recorded. Send the transfer slip to admissions for verification.",
        );
        setShowPayModal(null);
        refreshPayments();
        return;
      }

      const result = await triggerPaystack({
        email: student.email,
        amount: amountToPay,
        metadata: {
          studentId: student.id,
          purpose: "School fees",
          name: student.fullName,
        },
      });

      if (result.status !== "success" || !result.reference) {
        setPayError(result.message || "Payment was not completed");
        return;
      }

      await recordPayment(
        amountToPay,
        result.reference,
        "School fees — Paystack",
        "online-payment",
      );
      setSuccessBanner("Payment received. We'll verify it within 24 hours.");
      setShowPayModal(null);
      refreshPayments();
    } catch (err: any) {
      setPayError(err?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleCheckoutBooks = async () => {
    if (!student || cartItems.length === 0) return;
    setProcessing(true);
    setPayError(null);

    try {
      const result = await triggerPaystack({
        email: student.email,
        amount: cartTotal,
        metadata: {
          studentId: student.id,
          purpose: "Book order",
          items: cartItems.map((i) => ({
            id: i.product.id,
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.price,
          })),
        },
      });

      if (result.status !== "success" || !result.reference) {
        setPayError(result.message || "Payment was not completed");
        return;
      }

      const orderSummary = cartItems
        .map((i) => `${i.product.name} × ${i.quantity}`)
        .join(", ");

      await recordPayment(
        cartTotal,
        result.reference,
        `Book order: ${orderSummary}`,
        "online-payment",
      );

      setCart([]);
      setShowCart(false);
      setSuccessBanner(
        "Order confirmed. Your materials will be ready for pickup within 48 hours.",
      );
      refreshPayments();
    } catch (err: any) {
      setPayError(err?.message || "Checkout failed");
    } finally {
      setProcessing(false);
    }
  };

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-[#691C33]/5 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-7 h-7 text-[#691C33]/60" />
          </div>
          <p className="text-sm text-slate-600">
            Payments are available for enrolled students only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* SUCCESS BANNER */}
      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl p-4 bg-emerald-50 border-2 border-emerald-300 flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-950 flex-1 font-medium">
              {successBanner}
            </p>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-700 hover:text-emerald-900 shrink-0"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile
          label="Course Fee"
          value={fmtNaira(courseFee)}
          hint="School fees"
          icon={CreditCard}
          tone="burgundy"
        />
        <StatTile
          label="Total Paid"
          value={fmtNaira(feesPaid)}
          hint={isFeesPaid ? "Fully paid" : "Toward school fees"}
          icon={CheckCircle}
          tone="emerald"
        />
        <StatTile
          label="Amount Due"
          value={isFeesPaid ? "₦0" : fmtNaira(amountDue)}
          hint={
            isFeesPaid
              ? "Complete"
              : hasPendingFee
                ? "Pending verification"
                : "Pay to unlock modules"
          }
          icon={isFeesPaid ? CheckCircle : AlertCircle}
          tone={isFeesPaid ? "emerald" : "amber"}
        />
      </div>

      {/* TABS */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-1.5 flex gap-1">
        {[
          { id: "fees" as Tab, label: "School Fees", icon: CreditCard },
          { id: "shop" as Tab, label: "Books & Kits", icon: ShoppingBag },
          { id: "history" as Tab, label: "History", icon: Receipt },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#691C33] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: SCHOOL FEES */}
      {tab === "fees" && (
        <motion.div
          key="fees"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {isFeesPaid ? (
            <div className="rounded-2xl p-5 bg-emerald-50 border-2 border-emerald-200 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-emerald-950 text-sm md:text-base">
                  School fees fully paid
                </h3>
                <p className="text-sm text-emerald-900 mt-1">
                  Your enrollment is active. All modules are unlocked.
                </p>
              </div>
            </div>
          ) : hasPendingFee ? (
            <div className="rounded-2xl p-5 bg-amber-50 border-2 border-amber-300 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-amber-950 text-sm md:text-base">
                  Payment pending verification
                </h3>
                <p className="text-sm text-amber-900 mt-1">
                  We've received your payment and our team is verifying it. This
                  usually takes less than 24 hours.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5 bg-amber-50 border-2 border-amber-300 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-amber-950 text-sm md:text-base">
                  Complete your school fees
                </h3>
                <p className="text-sm text-amber-900 mt-1">
                  Pay {fmtNaira(amountDue)} to unlock your modules, materials,
                  and instructor support.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6">
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-4">
              Fee Breakdown
            </h2>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#691C33]" />
                  <span className="text-sm text-slate-700">
                    Registration Fee
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-700">FREE</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#691C33]" />
                  <span className="text-sm text-slate-700">Course Fee</span>
                </div>
                <span className="text-sm font-bold text-slate-900">
                  {fmtNaira(courseFee)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-slate-700">Already Paid</span>
                </div>
                <span className="text-sm font-bold text-emerald-700">
                  -{fmtNaira(feesPaid)}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 bg-[#691C33]/5 rounded-xl px-3 mt-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#691C33]" />
                  <span className="text-sm font-bold text-[#691C33]">
                    Amount Due
                  </span>
                </div>
                <span className="text-lg font-bold text-[#691C33]">
                  {fmtNaira(amountDue)}
                </span>
              </div>
            </div>

            {!isFeesPaid && !hasPendingFee && (
              <button
                onClick={() => setShowPayModal("fees")}
                className="w-full mt-5 bg-[#691C33] hover:bg-[#8A2B4A] text-white py-3.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <CreditCard className="w-4 h-4" />
                Pay {fmtNaira(amountDue)} Now
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* TAB: SHOP */}
      {tab === "shop" && (
        <motion.div
          key="shop"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: "all" as const, label: "All", icon: ShoppingBag },
              { id: "books" as const, label: "Books", icon: BookOpen },
              { id: "kits" as const, label: "Kits", icon: Package },
              { id: "tools" as const, label: "Tools", icon: Wrench },
            ].map((c) => {
              const Icon = c.icon;
              const isActive = categoryFilter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#691C33] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-[#691C33]/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProducts.map((p) => {
              const Icon = p.icon;
              const inCart =
                cart.find((c) => c.productId === p.id)?.quantity || 0;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4 flex flex-col"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-11 h-11 rounded-xl bg-[#691C33]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#691C33]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5">
                        <h3 className="font-semibold text-sm text-slate-900 leading-tight flex-1">
                          {p.name}
                        </h3>
                        {p.badge && (
                          <span className="shrink-0 text-[9px] uppercase tracking-wider font-bold text-[#691C33] bg-[#691C33]/10 px-1.5 py-0.5 rounded">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                        {p.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-100">
                    <p className="text-base font-bold text-[#691C33]">
                      {fmtNaira(p.price)}
                    </p>
                    {inCart === 0 ? (
                      <button
                        onClick={() => addToCart(p.id)}
                        className="bg-[#691C33] hover:bg-[#8A2B4A] text-white px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 bg-[#691C33] text-white rounded-lg overflow-hidden">
                        <button
                          onClick={() => setQty(p.id, inCart - 1)}
                          className="px-2 py-1.5 hover:bg-white/10 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-bold px-1 min-w-[16px] text-center">
                          {inCart}
                        </span>
                        <button
                          onClick={() => setQty(p.id, inCart + 1)}
                          className="px-2 py-1.5 hover:bg-white/10 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* TAB: HISTORY */}
      {tab === "history" && (
        <motion.div
          key="history"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              Payment History
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {payments.length} {payments.length === 1 ? "record" : "records"}
            </span>
          </div>

          {loadingPayments ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#691C33] animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 font-medium">
                No payments recorded yet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Your transaction history will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setReceipt(p)}
                  className="w-full text-left p-3.5 border border-slate-100 rounded-xl hover:border-[#691C33]/40 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">
                          {fmtNaira(p.amount)}
                        </p>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-xs text-slate-600 mt-1 truncate">
                        {p.note || "School fees"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono truncate">
                        {METHOD_LABELS[p.method] || p.method} · {p.reference}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-500">
                        {fmtDate(p.recordedAt)}
                      </p>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#691C33] mt-1 ml-auto transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* FLOATING CART BUTTON */}
      {tab === "shop" && cartCount > 0 && (
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-20 lg:bottom-6 right-4 z-30 bg-[#691C33] text-white rounded-full pl-5 pr-4 py-3 shadow-xl shadow-[#691C33]/40 flex items-center gap-2 hover:bg-[#8A2B4A] active:scale-95 transition-all"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-bold text-sm">{cartCount}</span>
          <span className="h-4 w-px bg-white/30" />
          <span className="font-bold text-sm">{fmtNaira(cartTotal)}</span>
        </motion.button>
      )}

      {/* CART DRAWER — SYNTAX FIXED */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto [color-scheme:light]"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#691C33]" />
                    Cart ({cartCount})
                  </h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                    aria-label="Close cart"
                  >
                    <X size={18} />
                  </button>
                </div>

                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-4">
                      {cartItems.map(({ product, quantity }) => {
                        const Icon = product.icon;
                        return (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl"
                          >
                            <div className="w-10 h-10 rounded-lg bg-[#691C33]/10 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-[#691C33]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {fmtNaira(product.price)} each
                              </p>
                            </div>
                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                              <button
                                onClick={() => setQty(product.id, quantity - 1)}
                                className="p-1.5 hover:bg-slate-200 transition-colors"
                                aria-label="Decrease"
                              >
                                <Minus className="w-3.5 h-3.5 text-slate-600" />
                              </button>
                              <span className="text-xs font-bold px-1 min-w-[20px] text-center text-slate-900">
                                {quantity}
                              </span>
                              <button
                                onClick={() => setQty(product.id, quantity + 1)}
                                className="p-1.5 hover:bg-slate-200 transition-colors"
                                aria-label="Increase"
                              >
                                <Plus className="w-3.5 h-3.5 text-slate-600" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(product.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                              aria-label="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-slate-200 pt-4 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700">
                          Subtotal
                        </span>
                        <span className="text-base font-bold text-[#691C33]">
                          {fmtNaira(cartTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-slate-500">
                          Pickup at academy
                        </span>
                        <span className="text-xs text-emerald-700 font-semibold">
                          FREE
                        </span>
                      </div>
                    </div>

                    {payError && (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3 text-sm text-red-800">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {payError}
                      </div>
                    )}

                    <button
                      onClick={handleCheckoutBooks}
                      disabled={processing}
                      className="w-full bg-[#691C33] hover:bg-[#8A2B4A] text-white py-3.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing…
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Pay {fmtNaira(cartTotal)}
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PAY FEES MODAL */}
      <AnimatePresence>
        {showPayModal === "fees" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => !processing && setShowPayModal(null)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl [color-scheme:light]"
              style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">
                    Pay School Fees
                  </h2>
                  <button
                    onClick={() => !processing && setShowPayModal(null)}
                    disabled={processing}
                    className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-50"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="text-center py-4 mb-4 bg-[#691C33]/5 rounded-xl">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Amount Due
                  </p>
                  <p className="text-3xl font-bold text-[#691C33] mt-1">
                    {fmtNaira(amountDue)}
                  </p>
                </div>

                <p className="text-xs text-slate-600 mb-3 font-medium">
                  Choose payment method
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => handlePayFees("online-payment")}
                    disabled={processing}
                    className="w-full flex items-center gap-3 p-3.5 border-2 border-[#691C33]/20 hover:border-[#691C33] rounded-xl transition-colors disabled:opacity-60 text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#691C33] flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        Pay Online
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Card, bank, USSD — via Paystack
                      </p>
                    </div>
                    {processing ? (
                      <Loader2 className="w-4 h-4 text-[#691C33] animate-spin shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#691C33] shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => handlePayFees("bank-transfer")}
                    disabled={processing}
                    className="w-full flex items-center gap-3 p-3.5 border-2 border-slate-200 hover:border-[#691C33]/40 rounded-xl transition-colors disabled:opacity-60 text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#691C33]/10 flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5 text-[#691C33]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        Bank Transfer
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Transfer directly and send your slip
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#691C33] shrink-0" />
                  </button>
                </div>

                {payError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 mt-3 text-sm text-red-800">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {payError}
                  </div>
                )}

                {!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY && (
                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2.5 mt-3 text-xs text-blue-900">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Demo mode — payments simulate success after 1.5 seconds.
                      Set{" "}
                      <code className="font-mono">
                        NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
                      </code>{" "}
                      for real checkout.
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RECEIPT MODAL */}
      <AnimatePresence>
        {receipt && (
          <ReceiptModal
            payment={receipt}
            student={student}
            onClose={() => setReceipt(null)}
          />
        )}
      </AnimatePresence>

      {/* Print-only global styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print,
          .receipt-print * {
            visibility: visible;
          }
          .receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm;
          }
          .no-print {
            display: none !important;
          }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
