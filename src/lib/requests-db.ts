import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import sqlite3 from "sqlite3";

type RequestFields = { name: string; email: string; description: string };

// Call only after the API has validated the fields with Zod.
export async function saveRequest(
  fields: RequestFields,
  databasePath = join(process.cwd(), "data", "requests.sqlite"),
) {
  await mkdir(dirname(databasePath), { recursive: true });

  const db = await new Promise<sqlite3.Database>((resolve, reject) => {
    const connection = new sqlite3.Database(databasePath, (error) => {
      if (error) reject(error);
      else resolve(connection);
    });
  });
  db.configure("busyTimeout", 5000);

  function run(sql: string, parameters: string[] = []) {
    return new Promise<sqlite3.RunResult>((resolve, reject) => {
      db.run(sql, parameters, function (error) {
        if (error) reject(error);
        else resolve(this);
      });
    });
  }

  try {
    await run(`CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`);

    const createdAt = new Date().toISOString();
    const result = await run(
      "INSERT INTO requests (name, email, description, created_at) VALUES (?, ?, ?, ?)",
      [fields.name, fields.email, fields.description, createdAt],
    );

    return { id: result.lastID, createdAt };
  } finally {
    await new Promise<void>((resolve, reject) => {
      db.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}
