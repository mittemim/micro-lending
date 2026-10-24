import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";

const databasePath = fileURLToPath(new URL("../data/requests.sqlite", import.meta.url));
const dateFormat = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Moscow",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

try {
  if (!existsSync(databasePath)) {
    console.log("База данных ещё не создана. Отправьте первую заявку через форму.");
  } else {
    const db = await new Promise((resolve, reject) => {
      const connection = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY, (error) => {
        if (error) reject(error);
        else resolve(connection);
      });
    });

    try {
      const rows = await new Promise((resolve, reject) => {
        db.all("SELECT id, name, email, description, created_at FROM requests ORDER BY id ASC", (error, rows) => {
          if (error) reject(error);
          else resolve(rows);
        });
      });

      if (rows.length === 0) console.log("Сохранённых заявок пока нет.");
      for (const row of rows) {
        const description = row.description.replace(/\s+/g, " ").trim();
        console.log(`${row.id}. ${row.name} | ${row.email} | ${description} | ${dateFormat.format(new Date(row.created_at))}`);
      }
    } finally {
      await new Promise((resolve, reject) => {
        db.close((error) => error ? reject(error) : resolve());
      });
    }
  }
} catch (error) {
  console.error("Не удалось прочитать заявки:", error.message);
  process.exitCode = 1;
}
