import session, { type SessionData } from "express-session";
import { pool } from "@workspace/db";

const SESSION_TABLE = "admin_sessions";

/**
 * Small PostgreSQL-backed session store. Keeping sessions outside the process
 * prevents a restart or a second API instance from logging the admin out.
 */
export class PostgresSessionStore extends session.Store {
  private readonly ready: Promise<void>;

  constructor() {
    super();
    this.ready = pool
      .query(`
        CREATE TABLE IF NOT EXISTS ${SESSION_TABLE} (
          sid varchar(255) PRIMARY KEY,
          sess json NOT NULL,
          expire timestamptz NOT NULL
        );
        CREATE INDEX IF NOT EXISTS admin_sessions_expire_idx
          ON ${SESSION_TABLE} (expire);
      `)
      .then(() => undefined);
  }

  get(sid: string, callback: (err: unknown, session?: SessionData | null) => void): void {
    void this.ready
      .then(() => pool.query(
        `SELECT sess FROM ${SESSION_TABLE} WHERE sid = $1 AND expire > NOW()`,
        [sid],
      ))
      .then(({ rows }) => {
        if (rows.length === 0) {
          callback(null, null);
          return;
        }
        const value = rows[0].sess;
        callback(null, (typeof value === "string" ? JSON.parse(value) : value) as SessionData);
      })
      .catch((error: unknown) => callback(error));
  }

  set(sid: string, sessionData: SessionData, callback: (err?: unknown) => void): void {
    const expiresAt = sessionData.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    void this.ready
      .then(() => pool.query(
        `INSERT INTO ${SESSION_TABLE} (sid, sess, expire)
         VALUES ($1, $2::json, $3)
         ON CONFLICT (sid) DO UPDATE
         SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
        [sid, JSON.stringify(sessionData), expiresAt],
      ))
      .then(() => callback())
      .catch((error: unknown) => callback(error));
  }

  destroy(sid: string, callback: (err?: unknown) => void): void {
    void this.ready
      .then(() => pool.query(`DELETE FROM ${SESSION_TABLE} WHERE sid = $1`, [sid]))
      .then(() => callback())
      .catch((error: unknown) => callback(error));
  }

  touch(sid: string, sessionData: SessionData, callback: (err?: unknown) => void): void {
    const expiresAt = sessionData.cookie?.expires
      ? new Date(sessionData.cookie.expires)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    void this.ready
      .then(() => pool.query(
        `UPDATE ${SESSION_TABLE} SET expire = $2 WHERE sid = $1`,
        [sid, expiresAt],
      ))
      .then(() => callback())
      .catch((error: unknown) => callback(error));
  }
}