// ═══════════════════════════════════════════════════════════════
// LEOGRAPHY OS — Types TypeScript
// Générés depuis le schéma SQL v8.0
// Fichier : /types/database.ts
// ═══════════════════════════════════════════════════════════════

// ─── ENUMS ───

export type UserRole = 'admin' | 'manager' | 'member' | 'client';
export type ContactType = 'lead' | 'client' | 'partenaire';
export type InteractionType = 'email' | 'call' | 'meeting' | 'note' | 'audit' | 'webhook';
export type AuditStatus = 'pending' | 'processing' | 'completed' | 'error';
export type ProjectType = 'website' | 'seo' | 'ads' | 'system';
export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskSource = 'manual' | 'sop' | 'ai_dispatch';
export type AdPlatform = 'google_ads' | 'meta_ads';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type SubscriptionPack = 'presence' | 'performance' | 'systeme_total';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'past_due';
export type PaymentType = 'acompte' | 'solde' | 'abonnement' | 'one_shot';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type DocumentType = 'contract' | 'brief' | 'sop' | 'asset' | 'report' | 'signature';
export type SignatureStatus = 'pending' | 'signed' | 'declined';
export type SopCategory = 'website' | 'seo' | 'ads' | 'admin';
export type NotificationType = 'info' | 'warning' | 'success' | 'error';
export type NotificationSource = 'n8n' | 'system' | 'user' | 'ai';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';
export type ValidationStatus = 'pending' | 'approved' | 'revision_requested';

// ─── BASE ───

interface BaseEntity {
  id: string;
  created_at: string;
}

interface BaseEntityUpdatable extends BaseEntity {
  updated_at: string;
}

// ─── 1. NOYAU SYSTÈME ───

export interface User extends BaseEntityUpdatable {
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
}

export interface ActivityLog extends BaseEntity {
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, any>;
}

// ─── 2. CRM & PROSPECTION ───

export interface Contact extends BaseEntityUpdatable {
  type: ContactType;
  company: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  profession: string | null;
  source: string | null;
  score: number;
  assigned_to: string | null;
  stripe_customer_id: string | null;
  portal_user_id: string | null;
  friction_points: FrictionPoint[];
  notes: string | null;
}

export interface FrictionPoint {
  description: string;
  severity: 'low' | 'medium' | 'high';
  source_note_id?: string;
  extracted_at?: string;
}

export interface PipelineStage extends BaseEntity {
  name: string;
  position: number;
  color: string;
}

export interface Deal extends BaseEntityUpdatable {
  contact_id: string;
  stage_id: string;
  title: string;
  value: number;
  probability: number;
  expected_close: string | null;
  assigned_to: string | null;
}

export interface Interaction extends BaseEntity {
  contact_id: string;
  user_id: string | null;
  type: InteractionType;
  subject: string | null;
  content: string | null;
  date: string;
}

export interface WebAudit extends BaseEntityUpdatable {
  contact_id: string | null;
  url: string;
  audit_data: AuditData;
  overall_score: number;
  seo_score: number;
  performance_score: number;
  mobile_score: number;
  security_score: number;
  ai_summary: string | null;
  ai_recommendations: AuditRecommendation[];
  report_html: string | null;
  report_pdf_url: string | null;
  share_token: string;
  status: AuditStatus;
}

export interface AuditData {
  lighthouse?: Record<string, any>;
  headers?: Record<string, string>;
  ssl?: { valid: boolean; expires: string };
  dns?: Record<string, any>;
  crawl?: { pages_count: number; broken_links: string[] };
  [key: string]: any;
}

export interface AuditRecommendation {
  category: 'seo' | 'performance' | 'mobile' | 'security' | 'accessibility';
  priority: 'critical' | 'important' | 'improvement';
  title: string;
  description: string;
  impact: string;
}

// ─── 3. PROJETS & TÂCHES ───

export interface Project extends BaseEntityUpdatable {
  contact_id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  start_date: string | null;
  deadline: string | null;
  budget: number;
  assigned_to: string | null;
  progress: number;
}

export interface ChecklistTemplate extends BaseEntityUpdatable {
  name: string;
  project_type: ProjectType;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  label: string;
  description?: string;
  order: number;
}

export interface ProjectChecklist extends BaseEntity {
  project_id: string;
  template_id: string | null;
  name: string;
}

export interface Task extends BaseEntityUpdatable {
  title: string;
  description: string | null;
  project_id: string | null;
  checklist_id: string | null;
  assigned_to: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  position: number;
  source: TaskSource;
}

export interface TimeEntry extends BaseEntity {
  project_id: string;
  task_id: string | null;
  user_id: string;
  description: string | null;
  duration_min: number;
  date: string;
  billable: boolean;
}

// ─── 4. PUBLICITÉ & BUDGETS ───

export interface AdAccount extends BaseEntity {
  platform: AdPlatform;
  account_id: string;
  name: string;
  credentials_enc: string | null;
  contact_id: string;
}

export interface AdBudget extends BaseEntity {
  ad_account_id: string;
  project_id: string | null;
  monthly_budget: number;
  alert_threshold: number;
}

export interface AdSpendSnapshot extends BaseEntity {
  ad_budget_id: string;
  date: string;
  amount_spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cost_per_conv: number;
  roas: number;
}

// ─── 5. FINANCES & PAIEMENTS ───

export interface Quote extends BaseEntityUpdatable {
  contact_id: string;
  deal_id: string | null;
  reference: string;
  amount_ht: number;
  amount_ttc: number;
  status: QuoteStatus;
  valid_until: string | null;
  stripe_payment_id: string | null;
  pdf_url: string | null;
}

export interface Subscription extends BaseEntityUpdatable {
  contact_id: string;
  pack_type: SubscriptionPack;
  monthly_amount: number;
  start_date: string;
  status: SubscriptionStatus;
  stripe_sub_id: string | null;
  stripe_status: string | null;
}

export interface Payment extends BaseEntity {
  contact_id: string;
  project_id: string | null;
  subscription_id: string | null;
  stripe_payment_id: string | null;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  paid_at: string | null;
}

// ─── 6. COMMUNICATION ───

export interface Conversation extends BaseEntity {
  contact_id: string | null;
  project_id: string | null;
  subject: string | null;
  last_message_at: string;
}

export interface Message extends BaseEntity {
  conversation_id: string;
  sender_id: string | null;
  content: string;
  is_read: boolean;
  attachments: MessageAttachment[];
}

export interface MessageAttachment {
  name: string;
  url: string;
  size: number;
}

// ─── 7. NOTES IA & RAG ───

export interface Note extends BaseEntityUpdatable {
  user_id: string;
  contact_id: string | null;
  project_id: string | null;
  title: string;
  content_json: Record<string, any>; // TipTap ProseMirror JSON
  content_text: string;
  ai_extracted_actions: AIExtractedAction[];
  is_dispatched: boolean;
}

export interface AIExtractedAction {
  type: 'task' | 'rdv' | 'deadline' | 'friction' | 'reminder';
  title: string;
  details: string;
  target_entity?: string; // contact_id, project_id
  due_date?: string;
  dispatched?: boolean;
}

export interface Embedding extends BaseEntity {
  entity_type: string;
  entity_id: string;
  content_chunk: string;
  embedding: number[];
  metadata: Record<string, any>;
}

// ─── 8. AUTOMATISATIONS & NOTIFICATIONS ───

export interface Reminder extends BaseEntity {
  user_id: string;
  entity_type: string | null;
  entity_id: string | null;
  title: string;
  remind_at: string;
  is_sent: boolean;
  recurrence: RecurrenceType;
}

export interface Notification extends BaseEntity {
  user_id: string;
  title: string;
  message: string | null;
  type: NotificationType;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  source: NotificationSource;
}

export interface SiteMonitor extends BaseEntity {
  contact_id: string;
  url: string;
  check_interval_min: number;
  last_status: number | null;
  last_checked_at: string | null;
  ssl_valid_until: string | null;
  is_active: boolean;
}

// ─── 9. DOCUMENTS & SOPs ───

export interface Document extends BaseEntity {
  project_id: string | null;
  contact_id: string | null;
  type: DocumentType;
  name: string;
  storage_path: string;
  uploaded_by: string | null;
  file_size: number;
  documenso_id: string | null;
  signature_status: SignatureStatus | null;
}

export interface SopTemplate extends BaseEntityUpdatable {
  name: string;
  category: SopCategory;
  content: string;
  version: number;
}

export interface ClientAccess extends BaseEntityUpdatable {
  contact_id: string;
  service: string;
  url: string | null;
  credentials_enc: string | null;
  notes: string | null;
}

// ─── 10. PORTAIL CLIENT V2 ───

export interface ClientValidation extends BaseEntity {
  project_id: string;
  title: string;
  description: string | null;
  preview_url: string | null;
  status: ValidationStatus;
  client_comment: string | null;
  submitted_at: string;
  responded_at: string | null;
}

export interface ClientFile extends BaseEntity {
  contact_id: string;
  project_id: string | null;
  name: string;
  storage_path: string;
  uploaded_by_client: boolean;
  category: string;
}

// ═══════════════════════════════════════════════════════════════
// TYPES COMPOSÉS (pour les vues avec JOINs)
// ═══════════════════════════════════════════════════════════════

export interface ContactWithDetails extends Contact {
  deals?: Deal[];
  interactions?: Interaction[];
  audits?: WebAudit[];
  projects?: Project[];
  documents?: Document[];
  related_notes?: Note[];
  subscriptions?: Subscription[];
}

export interface DealWithRelations extends Deal {
  contact?: Contact;
  stage?: PipelineStage;
}

export interface ProjectWithDetails extends Project {
  contact?: Contact;
  checklists?: (ProjectChecklist & { tasks: Task[] })[];
  time_entries?: TimeEntry[];
  documents?: Document[];
}

export interface TaskWithRelations extends Task {
  project?: Project;
  assigned_user?: User;
}

export interface DashboardStats {
  ca_month: number;
  ca_mrr: number;
  ca_oneshot: number;
  ca_previous_month: number;
  prospects_active: number;
  prospects_new_week: number;
  projects_active: number;
  projects_urgent: number;
  deals_total_value: number;
  deals_count_by_stage: Record<string, number>;
  ads_budget_used_percent: number;
  ads_alerts: AdBudgetAlert[];
  tasks_today: Task[];
  reminders_today: Reminder[];
  next_rdv: CalendarEvent[];
  recent_activity: ActivityLog[];
  roas_global: number;
  sites_down: SiteMonitor[];
}

export interface AdBudgetAlert {
  client_name: string;
  platform: AdPlatform;
  budget: number;
  spent: number;
  percent: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
}

// ═══════════════════════════════════════════════════════════════
// TYPES API (Payloads pour les API Routes)
// ═══════════════════════════════════════════════════════════════

export interface CreateContactPayload {
  type?: ContactType;
  company?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  profession?: string;
  source?: string;
  notes?: string;
}

export interface CreateDealPayload {
  contact_id: string;
  stage_id: string;
  title: string;
  value?: number;
  probability?: number;
  expected_close?: string;
}

export interface CreateProjectPayload {
  contact_id: string;
  name: string;
  type: ProjectType;
  start_date?: string;
  deadline?: string;
  budget?: number;
  checklist_template_id?: string; // Auto-génère la checklist + tâches
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  project_id?: string;
  checklist_id?: string;
  assigned_to?: string;
  priority?: TaskPriority;
  due_date?: string;
  source?: TaskSource;
}

export interface LaunchAuditPayload {
  url: string;
  contact_id?: string;
}

export interface DispatchNotePayload {
  note_id: string;
}

export interface WebhookCF7Payload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  source_page?: string;
}

export interface WebhookStripePayload {
  type: string;
  data: {
    object: Record<string, any>;
  };
}
