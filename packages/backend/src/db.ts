import { open, Database } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export interface RiskRecord {
  id: string;
  status: string;
  category: string;
  severity: string;
  confidence: number;
  signals: string[];
  description: string;
  consequences: string[];
  created_at: string;
}

export interface ActionProposalRecord {
  id: string;
  risk_id: string;
  type: string;
  approval_required: boolean;
  status: string;
  details: any;
  created_at: string;
}

export interface AuditLogRecord {
  id: number;
  session_id: string;
  event_type: string;
  event_message: string;
  timestamp: string;
}

export interface GoogleAuthRecord {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  updated_at: string;
}

export interface StorageAdapter {
  init(): Promise<void>;
  getRisks(): Promise<RiskRecord[]>;
  saveRisk(risk: RiskRecord): Promise<void>;
  getActions(): Promise<ActionProposalRecord[]>;
  saveAction(action: ActionProposalRecord): Promise<void>;
  updateActionStatus(id: string, status: string): Promise<void>;
  saveApproval(id: string, actionId: string, decision: string, reason?: string): Promise<void>;
  getLogs(limit?: number): Promise<AuditLogRecord[]>;
  logAudit(sessionId: string, eventType: string, eventMessage: string): Promise<void>;
  getGoogleAuth(): Promise<GoogleAuthRecord | null>;
  saveGoogleAuth(record: GoogleAuthRecord): Promise<void>;
  deleteGoogleAuth(): Promise<void>;
}

// -------------------------------------------------------------
// 1. SQLite Storage Adapter (For Local Desktop Testing)
// -------------------------------------------------------------
const dbPath = path.join(process.cwd(), "lifeguard.db");
let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    await dbInstance.exec("PRAGMA journal_mode = WAL;");
    dbInstance.close = async () => {};
  }
  return dbInstance;
}

export async function initDb() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS risks (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL,
      confidence REAL NOT NULL,
      signals TEXT NOT NULL,
      description TEXT,
      consequences TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS action_proposals (
      id TEXT PRIMARY KEY,
      risk_id TEXT NOT NULL,
      type TEXT NOT NULL,
      approval_required INTEGER NOT NULL,
      status TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id TEXT PRIMARY KEY,
      action_id TEXT NOT NULL,
      decision TEXT NOT NULL,
      reason TEXT,
      approved_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      event_type TEXT NOT NULL,
      event_message TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS google_auth (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      picture TEXT,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      expiry_date INTEGER,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

export class SQLiteStorageAdapter implements StorageAdapter {
  async init(): Promise<void> {
    await initDb();
  }

  async getRisks(): Promise<RiskRecord[]> {
    const db = await getDb();
    const rows = await db.all("SELECT * FROM risks ORDER BY created_at DESC");
    return rows.map((r) => {
      let signals: string[] = [];
      let consequences: string[] = [];
      try { signals = JSON.parse(r.signals); } catch (e) { signals = [r.signals]; }
      try { if (r.consequences) consequences = JSON.parse(r.consequences); } catch (e) { consequences = []; }
      return { ...r, signals, consequences };
    });
  }

  async saveRisk(r: RiskRecord): Promise<void> {
    const db = await getDb();
    await db.run(
      "INSERT INTO risks (id, status, category, severity, confidence, signals, description, consequences, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET status=excluded.status",
      [r.id, r.status, r.category, r.severity, r.confidence, JSON.stringify(r.signals), r.description, JSON.stringify(r.consequences), r.created_at]
    );
  }

  async getActions(): Promise<ActionProposalRecord[]> {
    const db = await getDb();
    const rows = await db.all("SELECT * FROM action_proposals ORDER BY created_at DESC");
    return rows.map((a) => {
      let details: any = {};
      try { details = JSON.parse(a.details); } catch (e) { details = {}; }
      return { ...a, details, approval_required: a.approval_required === 1 };
    });
  }

  async saveAction(a: ActionProposalRecord): Promise<void> {
    const db = await getDb();
    const detailsStr = typeof a.details === "string" ? a.details : JSON.stringify(a.details);
    await db.run(
      "INSERT INTO action_proposals (id, risk_id, type, approval_required, status, details, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET status=excluded.status",
      [a.id, a.risk_id, a.type, a.approval_required ? 1 : 0, a.status, detailsStr, a.created_at]
    );
  }

  async updateActionStatus(id: string, status: string): Promise<void> {
    const db = await getDb();
    await db.run("UPDATE action_proposals SET status = ? WHERE id = ?", [status, id]);
  }

  async saveApproval(id: string, actionId: string, decision: string, reason?: string): Promise<void> {
    const db = await getDb();
    await db.run(
      "INSERT INTO approvals (id, action_id, decision, reason, approved_at) VALUES (?, ?, ?, ?, ?)",
      [id, actionId, decision, reason || "", new Date().toISOString()]
    );
  }

  async getLogs(limit: number = 100): Promise<AuditLogRecord[]> {
    const db = await getDb();
    const rows = await db.all("SELECT * FROM audit_logs ORDER BY id DESC LIMIT ?", [limit]);
    return Array.isArray(rows) ? rows : [];
  }

  async logAudit(sessionId: string, eventType: string, eventMessage: string): Promise<void> {
    const db = await getDb();
    await db.run(
      "INSERT INTO audit_logs (session_id, event_type, event_message, timestamp) VALUES (?, ?, ?, ?)",
      [sessionId, eventType, eventMessage, new Date().toISOString()]
    );
  }

  async getGoogleAuth(): Promise<GoogleAuthRecord | null> {
    const db = await getDb();
    const row = await db.get("SELECT * FROM google_auth WHERE id = 'primary'");
    return row || null;
  }

  async saveGoogleAuth(r: GoogleAuthRecord): Promise<void> {
    const db = await getDb();
    await db.run(
      `INSERT INTO google_auth (id, email, name, picture, access_token, refresh_token, expiry_date, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         email=excluded.email, name=excluded.name, picture=excluded.picture,
         access_token=excluded.access_token, refresh_token=excluded.refresh_token,
         expiry_date=excluded.expiry_date, updated_at=excluded.updated_at`,
      [r.id || "primary", r.email, r.name || "", r.picture || "", r.access_token, r.refresh_token || "", r.expiry_date || 0, r.updated_at]
    );
  }

  async deleteGoogleAuth(): Promise<void> {
    const db = await getDb();
    await db.run("DELETE FROM google_auth WHERE id = 'primary'");
  }
}

// Singleton storage adapter instance
const defaultAdapter = new SQLiteStorageAdapter();
export async function getStorageAdapter(): Promise<StorageAdapter> {
  await defaultAdapter.init();
  return defaultAdapter;
}
