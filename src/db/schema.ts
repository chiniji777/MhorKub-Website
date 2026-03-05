import { pgTable, serial, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

// ─── Customer / Licensing ───────────────────────────────────────

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  googleId: text("google_id"),
  name: text("name").notNull(),
  phone: text("phone"),
  referralCode: text("referral_code").unique().notNull(),
  referredBy: integer("referred_by"),
  creditBalance: integer("credit_balance").default(0).notNull(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  durationDays: integer("duration_days").notNull(),
  priceThb: integer("price_thb").notNull(),
  active: boolean("active").default(true).notNull(),
  stripePriceId: text("stripe_price_id"),
});

export const licenses = pgTable("licenses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  planId: integer("plan_id").notNull(),
  orderId: integer("order_id"),
  startsAt: timestamp("starts_at").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status").default("active").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  autoRenew: boolean("auto_renew").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const deviceActivations = pgTable("device_activations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  macAddress: text("mac_address").notNull(),
  deviceName: text("device_name"),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  planId: integer("plan_id").notNull(),
  amountThb: integer("amount_thb").notNull(),
  originalAmount: integer("original_amount").notNull(),
  referralCode: text("referral_code"),
  discountPercent: integer("discount_percent").default(0).notNull(),
  promptpayRef: text("promptpay_ref"),          // nullable — null for Stripe orders
  slipUrl: text("slip_url"),
  slipImage: text("slip_image"),               // base64 slip for admin review
  slipVerified: boolean("slip_verified").default(false).notNull(),
  slipRef: text("slip_ref"),
  paymentMethod: text("payment_method").default("promptpay").notNull(), // "promptpay" | "stripe"
  stripeCheckoutSessionId: text("stripe_checkout_session_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeInvoiceId: text("stripe_invoice_id"),
  status: text("status").default("pending").notNull(), // pending | pending_review | paid | failed
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referralTransactions = pgTable("referral_transactions", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull(),
  orderId: integer("order_id").notNull(),
  amountThb: integer("amount_thb").notNull(),
  credited: boolean("credited").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  amountThb: integer("amount_thb").notNull(),
  bankAccount: text("bank_account").notNull(),
  bankName: text("bank_name").notNull(),
  status: text("status").default("pending").notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  promptTokens: integer("prompt_tokens").notNull(),
  completionTokens: integer("completion_tokens").notNull(),
  costSatang: integer("cost_satang").notNull(),
  chargedSatang: integer("charged_satang").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiCreditTopups = pgTable("ai_credit_topups", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  amountThb: integer("amount_thb").notNull(),
  promptpayRef: text("promptpay_ref").notNull(),
  slipImage: text("slip_image"),               // base64 slip for admin review
  slipVerified: boolean("slip_verified").default(false).notNull(),
  slipRef: text("slip_ref"),
  status: text("status").default("pending").notNull(), // pending | pending_review | paid | failed
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usedSlipRefs = pgTable("used_slip_refs", {
  id: serial("id").primaryKey(),
  transRef: text("trans_ref").unique().notNull(),
  orderId: integer("order_id"),       // nullable — for subscription orders
  topupId: integer("topup_id"),       // nullable — for AI credit topups
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Notifications ──────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  type: text("type").notNull(), // referral_signup | referral_purchase | withdrawal_approved | withdrawal_rejected
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Marketing Website ──────────────────────────────────────────

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  clinicName: text("clinic_name"),
  message: text("message").notNull(),
  status: text("status").default("new").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: text("cover_image"),
  author: text("author").default("MhorKub Team"),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  googleId: text("google_id"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
