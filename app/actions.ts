"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const emailValue = z.union([z.literal(""), z.email()]).transform((value) => value || null);
const dateValue = z.union([z.literal(""), z.iso.date()]).transform((value) => value || null);
const uuidValue = z.union([z.literal(""), z.uuid()]).transform((value) => value || null);
const requiredText = (label: string, max = 180) => z.string().trim().min(1, `${label} is required.`).max(max, `${label} is too long.`);
const optionalText = (max = 4000) => z.string().trim().max(max, `Text must be ${max} characters or fewer.`);

async function workspace(path: string) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect(`/login?error=${encodeURIComponent("Please sign in to continue.")}`);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Could not verify workspace membership.", profileError);
    fail(path, "Workspace access could not be verified.");
  }
  if (!profile?.is_active) redirect("/dashboard");
  return { supabase, user, profile };
}

function formValues(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function parseForm<T>(schema: z.ZodType<T>, formData: FormData, path: string): T {
  const result = schema.safeParse(formValues(formData));
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Check the form and try again.";
    redirect(`${path}?error=${encodeURIComponent(message)}`);
  }
  return result.data;
}

function finish(path: string, message: string, paths: string[] = []): never {
  for (const revalidate of paths) revalidatePath(revalidate);
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function reportDatabaseError(path: string, context: string, error: { message: string }): never {
  console.error(`${context}:`, error);
  fail(path, `${context} Please check your access and try again.`);
}

function requireUpdatedRow(
  path: string,
  context: string,
  result: { data: { id: string } | null; error: { message: string } | null },
) {
  if (result.error) reportDatabaseError(path, context, result.error);
  if (!result.data) fail(path, `${context} The record was not found or access was denied.`);
}

const authSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function signIn(formData: FormData) {
  const credentials = parseForm(authSchema, formData, "/login");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) fail("/login", error.message);
  finish("/dashboard", "Welcome back.");
}

export async function signUp(formData: FormData) {
  const request = parseForm(
    z.object({
      full_name: requiredText("Name", 100),
      email: z.email().transform((value) => value.trim().toLowerCase()),
      password: z.string().min(8, "Password must be at least 8 characters."),
    }),
    formData,
    "/signup",
  );
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: request.email,
    password: request.password,
    options: {
      data: { full_name: request.full_name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/dashboard`,
    },
  });
  if (error) fail("/signup", error.message);
  finish("/login", "Request received. Confirm your email if prompted, then wait for a workspace admin to approve access.");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Could not sign out.", error);
    fail("/dashboard", "Sign out failed. Try again.");
  }
  finish("/login", "You have been signed out.");
}

export async function createClientRecord(formData: FormData) {
  const { supabase, user } = await workspace("/clients/new");
  const value = parseForm(z.object({
    full_name: requiredText("Contact name", 100),
    organization: optionalText(160),
    email: emailValue,
    phone: optionalText(50),
    location: requiredText("Location", 100),
    preferred_contact: requiredText("Preferred contact", 40),
    notes: optionalText(2000),
  }), formData, "/clients/new");

  const { data, error } = await supabase.from("clients").insert({ ...value, created_by: user.id }).select("id").single();
  if (error) reportDatabaseError("/clients/new", "Client could not be created.", error);
  finish(`/clients/${data.id}`, "Client added.", ["/clients", "/dashboard"]);
}

export async function updateClientRecord(formData: FormData) {
  const { supabase } = await workspace("/clients");
  const value = parseForm(z.object({
    id: z.uuid(),
    full_name: requiredText("Contact name", 100),
    organization: optionalText(160),
    email: emailValue,
    phone: optionalText(50),
    location: requiredText("Location", 100),
    preferred_contact: requiredText("Preferred contact", 40),
    notes: optionalText(2000),
  }), formData, "/clients");
  const result = await supabase.from("clients").update({
    full_name: value.full_name,
    organization: value.organization,
    email: value.email,
    phone: value.phone,
    location: value.location,
    preferred_contact: value.preferred_contact,
    notes: value.notes,
  }).eq("id", value.id).select("id").maybeSingle();
  requireUpdatedRow(`/clients/${value.id}`, "Client details could not be saved.", result);
  finish(`/clients/${value.id}`, "Client details saved.", ["/clients", `/clients/${value.id}`]);
}

export async function createLead(formData: FormData) {
  const { supabase, user } = await workspace("/leads/new");
  const value = parseForm(z.object({
    full_name: requiredText("Contact name", 100),
    organization: optionalText(160),
    email: emailValue,
    phone: optionalText(50),
    location: requiredText("Location", 100),
    requested_service: requiredText("Requested service", 120),
    source: requiredText("Source", 80),
    owner_id: uuidValue,
    follow_up_on: dateValue,
    notes: optionalText(2000),
  }), formData, "/leads/new");

  const { data, error } = await supabase.from("leads").insert({ ...value, created_by: user.id }).select("id").single();
  if (error) reportDatabaseError("/leads/new", "Lead could not be created.", error);
  finish(`/leads?focus=${data.id}`, "Lead added.", ["/leads", "/dashboard"]);
}

export async function updateLeadStatus(formData: FormData) {
  const { supabase } = await workspace("/leads");
  const value = parseForm(z.object({
    id: z.uuid(),
    status: z.enum(["New inquiry", "Contacted", "Quoted", "Won", "Not proceeding"]),
  }), formData, "/leads");
  const result = await supabase.from("leads").update({ status: value.status }).eq("id", value.id).select("id").maybeSingle();
  requireUpdatedRow("/leads", "Lead stage could not be updated.", result);
  finish("/leads", "Lead stage updated.", ["/leads", "/dashboard"]);
}

export async function convertLead(formData: FormData) {
  const { supabase } = await workspace("/leads");
  const id = parseForm(z.object({ id: z.uuid() }), formData, "/leads").id;
  const { error } = await supabase.rpc("convert_lead_to_client", { lead_uuid: id });
  if (error) reportDatabaseError("/leads", "Lead conversion failed.", error);
  finish("/clients", "Won lead converted to a client.", ["/clients", "/leads", "/dashboard"]);
}

export async function createCatalogItem(formData: FormData) {
  const { supabase, user } = await workspace("/catalog/new");
  const value = parseForm(z.object({
    name: requiredText("Service name", 100),
    category: requiredText("Category", 80),
    description: optionalText(2000),
    is_physical: z.enum(["yes", "no"]),
  }), formData, "/catalog/new");
  const slug = value.name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { error } = await supabase.from("catalog_items").insert({
    slug: `${slug}-${crypto.randomUUID().slice(0, 8)}`,
    name: value.name,
    category: value.category,
    description: value.description,
    is_physical: value.is_physical === "yes",
    created_by: user.id,
  });
  if (error) reportDatabaseError("/catalog/new", "Service could not be added.", error);
  finish("/catalog", "Service added to the catalog.", ["/catalog", "/orders/new"]);
}

export async function updateCatalogItem(formData: FormData) {
  const { supabase } = await workspace("/catalog");
  const value = parseForm(z.object({ id: z.uuid(), active: z.enum(["true", "false"]) }), formData, "/catalog");
  const result = await supabase.from("catalog_items").update({ active: value.active === "true" }).eq("id", value.id).select("id").maybeSingle();
  requireUpdatedRow("/catalog", "Service availability could not be changed.", result);
  finish("/catalog", "Catalog updated.", ["/catalog", "/orders/new"]);
}

export async function createOrder(formData: FormData) {
  const { supabase, user } = await workspace("/orders/new");
  const value = parseForm(z.object({
    client_id: z.uuid(),
    source_lead_id: uuidValue,
    catalog_item_id: uuidValue,
    title: requiredText("Project title", 160),
    status: z.enum(["Confirmed", "Briefing", "In design", "Client review", "Revision", "Approved", "With print partner", "Ready for delivery", "Completed", "On hold", "Cancelled"]),
    priority: z.enum(["Low", "Normal", "High", "Urgent"]),
    owner_id: uuidValue,
    due_date: dateValue,
    brief: optionalText(4000),
    deliverables: optionalText(2000),
    internal_notes: optionalText(2000),
  }), formData, "/orders/new");
  const { data, error } = await supabase.from("orders").insert({ ...value, created_by: user.id }).select("id").single();
  if (error) reportDatabaseError("/orders/new", "Project could not be created.", error);
  finish(`/orders/${data.id}`, "Project created.", ["/orders", "/dashboard"]);
}

export async function updateOrderStatus(formData: FormData) {
  const { supabase } = await workspace("/orders");
  const value = parseForm(z.object({
    id: z.uuid(),
    status: z.enum(["Inquiry", "Quoted", "Confirmed", "Briefing", "In design", "Client review", "Revision", "Approved", "With print partner", "Ready for delivery", "Completed", "On hold", "Cancelled"]),
  }), formData, "/orders");
  const result = await supabase.from("orders").update({ status: value.status }).eq("id", value.id).select("id").maybeSingle();
  requireUpdatedRow(`/orders/${value.id}`, "Project status could not be updated.", result);
  finish(`/orders/${value.id}`, "Project status updated.", ["/orders", `/orders/${value.id}`, "/dashboard"]);
}

export async function createTask(formData: FormData) {
  const { supabase, user } = await workspace("/tasks");
  const value = parseForm(z.object({
    title: requiredText("Task", 180),
    order_id: uuidValue,
    lead_id: uuidValue,
    assignee_id: uuidValue,
    due_on: dateValue,
  }), formData, "/tasks");
  if (!value.order_id && !value.lead_id) fail("/tasks", "Link the task to a project or a lead.");
  const { error } = await supabase.from("tasks").insert({ ...value, created_by: user.id });
  if (error) reportDatabaseError("/tasks", "Task could not be created.", error);
  finish("/tasks", "Task added.", ["/tasks", "/dashboard"]);
}

export async function updateTaskCompletion(formData: FormData) {
  const { supabase } = await workspace("/tasks");
  const value = parseForm(z.object({ id: z.uuid(), completed: z.enum(["yes", "no"]) }), formData, "/tasks");
  const result = await supabase.from("tasks").update({
    completed_at: value.completed === "yes" ? new Date().toISOString() : null,
  }).eq("id", value.id).select("id").maybeSingle();
  requireUpdatedRow("/tasks", "Task status could not be updated.", result);
  finish("/tasks", "Task status updated.", ["/tasks", "/dashboard"]);
}

export async function createQuotation(formData: FormData) {
  const { supabase, user } = await workspace("/quotations/new");
  const value = parseForm(z.object({
    client_id: z.uuid(),
    order_id: uuidValue,
    service_summary: requiredText("Scope of work", 300),
    amount_php: z.coerce.number().min(0, "Amount cannot be negative."),
    valid_until: dateValue,
    assumptions: optionalText(2000),
  }), formData, "/quotations/new");
  const { error } = await supabase.from("quotations").insert({
    ...value,
    status: "Draft",
    created_by: user.id,
  });
  if (error) reportDatabaseError("/quotations/new", "Quotation could not be created.", error);
  finish("/quotations", "Quotation draft created.", ["/quotations"]);
}

export async function updateQuotationStatus(formData: FormData) {
  const { supabase } = await workspace("/quotations");
  const value = parseForm(z.object({
    id: z.uuid(),
    status: z.enum(["Draft", "Sent", "Accepted", "Declined", "Expired"]),
  }), formData, "/quotations");
  const result = await supabase.from("quotations").update({ status: value.status }).eq("id", value.id).select("id").maybeSingle();
  requireUpdatedRow("/quotations", "Quotation status could not be updated.", result);
  finish("/quotations", "Quotation status updated.", ["/quotations"]);
}

export async function createPartner(formData: FormData) {
  const { supabase, user } = await workspace("/partners/new");
  const value = parseForm(z.object({
    name: requiredText("Partner name", 140),
    contact_name: optionalText(100),
    email: emailValue,
    phone: optionalText(50),
    location: optionalText(120),
    capabilities: optionalText(1000),
    notes: optionalText(2000),
  }), formData, "/partners/new");
  const { error } = await supabase.from("partners").insert({ ...value, created_by: user.id });
  if (error) reportDatabaseError("/partners/new", "Print partner could not be added.", error);
  finish("/partners", "Print partner added.", ["/partners"]);
}

export async function createProductionHandoff(formData: FormData) {
  const { supabase, user } = await workspace("/partners");
  const value = parseForm(z.object({
    order_id: z.uuid(),
    partner_id: z.uuid(),
    specifications: requiredText("Production specifications", 2000),
    quantity: z.coerce.number().int().min(1).max(100000),
    promised_date: dateValue,
  }), formData, "/partners");
  const { error } = await supabase.from("production_handoffs").insert({
    ...value,
    status: "Preparing files",
    created_by: user.id,
  });
  if (error) reportDatabaseError("/partners", "Production handoff could not be created.", error);
  finish("/partners", "Production handoff created.", ["/partners", "/orders"]);
}

export async function updateProductionStatus(formData: FormData) {
  const { supabase } = await workspace("/partners");
  const value = parseForm(z.object({
    id: z.uuid(),
    status: z.enum(["Preparing files", "Sent to partner", "Awaiting proof", "In production", "Quality check", "Ready", "Delivered", "Issue reported"]),
    tracking_reference: optionalText(120),
    quality_notes: optionalText(2000),
  }), formData, "/partners");
  const result = await supabase.from("production_handoffs").update({
    status: value.status,
    tracking_reference: value.tracking_reference,
    quality_notes: value.quality_notes,
  }).eq("id", value.id).select("id").maybeSingle();
  requireUpdatedRow("/partners", "Production handoff could not be updated.", result);
  finish("/partners", "Production handoff updated.", ["/partners", "/orders"]);
}

export async function createProof(formData: FormData) {
  const { supabase, user } = await workspace("/proofs");
  const orderIdResult = z.uuid().safeParse(formData.get("order_id"));
  const fileEntry = formData.get("proof_file");
  if (!orderIdResult.success) fail("/proofs", "Select a valid project.");
  if (!(fileEntry instanceof File) || fileEntry.size === 0) fail(`/proofs/${orderIdResult.data}`, "Choose a proof file to upload.");
  const file = fileEntry;
  const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!acceptedTypes.includes(file.type)) fail(`/proofs/${orderIdResult.data}`, "Proof files must be JPEG, PNG, WebP, or PDF.");
  if (file.size > 20 * 1024 * 1024) fail(`/proofs/${orderIdResult.data}`, "Proof files must be 20 MB or smaller.");

  const orderId = orderIdResult.data;
  const { data: versions, error: versionError } = await supabase.from("proofs").select("version").eq("order_id", orderId);
  if (versionError) reportDatabaseError(`/proofs/${orderId}`, "Proof history could not be checked.", versionError);
  const version = Math.max(0, ...versions.map((proof) => proof.version)) + 1;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "proof";
  const filePath = `${user.id}/${orderId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("proof-files").upload(filePath, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) reportDatabaseError(`/proofs/${orderId}`, "Proof file could not be uploaded.", uploadError);

  const { error: insertError } = await supabase.from("proofs").insert({
    order_id: orderId,
    version,
    file_path: filePath,
    file_name: file.name,
    status: "Shared for review",
    created_by: user.id,
  });
  if (insertError) {
    const { error: cleanupError } = await supabase.storage.from("proof-files").remove([filePath]);
    if (cleanupError) console.error("Uploaded proof could not be cleaned up after its record failed.", cleanupError);
    reportDatabaseError(`/proofs/${orderId}`, "Proof record could not be saved.", insertError);
  }
  finish(`/proofs/${orderId}`, `Proof version ${version} uploaded.`, ["/proofs", `/proofs/${orderId}`]);
}

export async function updateProofReview(formData: FormData) {
  const { supabase } = await workspace("/proofs");
  const value = parseForm(z.object({
    id: z.uuid(),
    order_id: z.uuid(),
    status: z.enum(["Shared for review", "Revision requested", "Approved"]),
    client_feedback: optionalText(2000),
  }), formData, "/proofs");
  const result = await supabase.from("proofs").update({
    status: value.status,
    client_feedback: value.client_feedback,
    reviewed_at: value.status === "Shared for review" ? null : new Date().toISOString(),
  }).eq("id", value.id).select("id").maybeSingle();
  requireUpdatedRow(`/proofs/${value.order_id}`, "Proof review could not be saved.", result);
  finish(`/proofs/${value.order_id}`, "Proof review saved.", ["/proofs", `/proofs/${value.order_id}`]);
}

export async function createPartnerRisk(formData: FormData) {
  const { supabase, user } = await workspace("/partners");
  const value = parseForm(z.object({
    partner_id: z.uuid(),
    order_id: uuidValue,
    category: z.enum(["Schedule delay", "Print quality", "Color variance", "Communication", "Cost change", "Other"]),
    summary: requiredText("Risk summary", 500),
    severity: z.enum(["Low", "Medium", "High"]),
  }), formData, "/partners");
  const { error } = await supabase.from("partner_risks").insert({ ...value, created_by: user.id });
  if (error) reportDatabaseError("/partners", "Partner risk could not be logged.", error);
  finish("/partners", "Partner risk logged.", ["/partners"]);
}

export async function updatePartnerRisk(formData: FormData) {
  const { supabase } = await workspace("/partners");
  const value = parseForm(z.object({
    id: z.uuid(),
    status: z.enum(["Open", "Monitoring", "Resolved"]),
  }), formData, "/partners");
  const result = await supabase.from("partner_risks").update({
    status: value.status,
    resolved_at: value.status === "Resolved" ? new Date().toISOString() : null,
  }).eq("id", value.id).select("id").maybeSingle();
  requireUpdatedRow("/partners", "Partner risk could not be updated.", result);
  finish("/partners", "Partner risk updated.", ["/partners"]);
}

export async function createB2BOpportunity(formData: FormData) {
  const { supabase, user } = await workspace("/b2b");
  const value = parseForm(z.object({
    organization: requiredText("Organization", 160),
    contact_name: requiredText("Contact name", 100),
    email: emailValue,
    phone: optionalText(50),
    location: optionalText(120),
    work_type: requiredText("Work type", 140),
    backlog_volume: optionalText(200),
    status: z.enum(["Prospecting", "Contacted", "Scoping", "Trial project", "Ongoing", "Closed"]),
    owner_id: uuidValue,
    next_action: optionalText(500).default(""),
    notes: optionalText(2000),
  }), formData, "/b2b");
  const { error } = await supabase.from("b2b_opportunities").insert({ ...value, created_by: user.id });
  if (error) reportDatabaseError("/b2b", "B2B opportunity could not be saved.", error);
  finish("/b2b", "B2B opportunity added.", ["/b2b"]);
}

export async function updateB2BStatus(formData: FormData) {
  const { supabase } = await workspace("/b2b");
  const value = parseForm(z.object({
    id: z.uuid(),
    status: z.enum(["Prospecting", "Contacted", "Scoping", "Trial project", "Ongoing", "Closed"]),
    next_action: optionalText(500),
  }), formData, "/b2b");
  const result = await supabase.from("b2b_opportunities").update({
    status: value.status,
    next_action: value.next_action,
  }).eq("id", value.id).select("id").maybeSingle();
  requireUpdatedRow("/b2b", "B2B opportunity could not be updated.", result);
  finish("/b2b", "B2B opportunity updated.", ["/b2b"]);
}

export async function updateMemberAccess(formData: FormData) {
  const { supabase, profile } = await workspace("/settings");
  if (profile.role !== "admin") fail("/settings", "Only an admin can manage team access.");
  const value = parseForm(z.object({
    id: z.uuid(),
    role: z.enum(["admin", "client_relations", "creative", "finance", "member"]),
    is_active: z.enum(["yes", "no"]),
  }), formData, "/settings");
  if (value.id === profile.id && value.is_active === "no") {
    fail("/settings", "You cannot deactivate your own account. Ask another admin to do that.");
  }
  const { data: target, error: targetError } = await supabase.from("profiles").select("id,role,is_active").eq("id", value.id).maybeSingle();
  if (targetError) reportDatabaseError("/settings", "Team access could not be verified.", targetError);
  if (!target) fail("/settings", "The team member was not found.");
  if (target.is_active && target.role === "admin" && (value.role !== "admin" || value.is_active === "no")) {
    const { count, error: adminCountError } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "admin").eq("is_active", true);
    if (adminCountError) reportDatabaseError("/settings", "Active administrators could not be verified.", adminCountError);
    if ((count ?? 0) <= 1) fail("/settings", "Keep at least one active administrator in the workspace.");
  }
  const result = await supabase.from("profiles").update({
    role: value.role,
    is_active: value.is_active === "yes",
  }).eq("id", value.id).select("id").maybeSingle();
  requireUpdatedRow("/settings", "Team access could not be updated.", result);
  finish("/settings", "Team access updated.", ["/settings"]);
}
