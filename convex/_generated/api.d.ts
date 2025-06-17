/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as attendance from "../attendance.js";
import type * as auditLogs from "../auditLogs.js";
import type * as auth from "../auth.js";
import type * as auth_actions from "../auth_actions.js";
import type * as batches from "../batches.js";
import type * as content from "../content.js";
import type * as enrollments from "../enrollments.js";
import type * as http from "../http.js";
import type * as invoices from "../invoices.js";
import type * as messages from "../messages.js";
import type * as otp from "../otp.js";
import type * as otp_actions from "../otp_actions.js";
import type * as payments from "../payments.js";
import type * as pdf from "../pdf.js";
import type * as products from "../products.js";
import type * as profiles from "../profiles.js";
import type * as razorpay from "../razorpay.js";
import type * as razorpay_actions from "../razorpay_actions.js";
import type * as razorpay_internal from "../razorpay_internal.js";
import type * as razorpay_mutations from "../razorpay_mutations.js";
import type * as rewards from "../rewards.js";
import type * as router from "../router.js";
import type * as sampleData from "../sampleData.js";
import type * as settings from "../settings.js";
import type * as sports from "../sports.js";
import type * as storage from "../storage.js";
import type * as students from "../students.js";
import type * as systemHealth from "../systemHealth.js";
import type * as systemHealth_actions from "../systemHealth_actions.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  attendance: typeof attendance;
  auditLogs: typeof auditLogs;
  auth: typeof auth;
  auth_actions: typeof auth_actions;
  batches: typeof batches;
  content: typeof content;
  enrollments: typeof enrollments;
  http: typeof http;
  invoices: typeof invoices;
  messages: typeof messages;
  otp: typeof otp;
  otp_actions: typeof otp_actions;
  payments: typeof payments;
  pdf: typeof pdf;
  products: typeof products;
  profiles: typeof profiles;
  razorpay: typeof razorpay;
  razorpay_actions: typeof razorpay_actions;
  razorpay_internal: typeof razorpay_internal;
  razorpay_mutations: typeof razorpay_mutations;
  rewards: typeof rewards;
  router: typeof router;
  sampleData: typeof sampleData;
  settings: typeof settings;
  sports: typeof sports;
  storage: typeof storage;
  students: typeof students;
  systemHealth: typeof systemHealth;
  systemHealth_actions: typeof systemHealth_actions;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
