import assert from "node:assert/strict";
import test, { after } from "node:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rename, rm, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import sqlite3 from "sqlite3";
import { POST } from "./route.ts";
import { saveRequest } from "../../../lib/requests-db.ts";

const originalDirectory = process.cwd();
const testDirectory = await mkdtemp(join(tmpdir(), "lending-sqlite-test-"));
const databasePath = join(testDirectory, "data", "requests.sqlite");
process.chdir(testDirectory);

after(async () => {
  process.chdir(originalDirectory);
  assert.equal(dirname(resolve(testDirectory)), resolve(tmpdir()));
  await rm(testDirectory, { recursive: true, force: true });
});

async function readRows(path = databasePath) {
  if (!existsSync(path)) return [];
  return new Promise((resolveRows, reject) => {
    const db = new sqlite3.Database(path, sqlite3.OPEN_READONLY, (openError) => {
      if (openError) return reject(openError);
      db.all("SELECT * FROM requests ORDER BY id", (error, rows) => {
        db.close((closeError) => {
          if (error || closeError) reject(error || closeError);
          else resolveRows(rows);
        });
      });
    });
  });
}

const valid = { name: "Анна-Мария", email: "anna@example.com", description: "Нужен сайт для студии." };

async function submit(data) {
  return POST(new Request("http://localhost/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }));
}

for (const [label, data] of [
  ["valid data", valid],
  ["ru email and spaced name", { ...valid, name: "Анна Мария", email: "anna@example.ru" }],
  ["org email", { ...valid, email: "anna@example.org" }],
  ["name at 24 characters", { ...valid, name: "А".repeat(24) }],
  ["email at 100 characters", { ...valid, email: "a@" + "b".repeat(60) + "." + "c".repeat(33) + ".com" }],
  ["description at 10 characters", { ...valid, description: "А".repeat(10) }],
  ["description at 1000 characters", { ...valid, description: "А".repeat(1000) }],
]) {
  test(label, async () => {
    const countBefore = (await readRows()).length;
    const response = await submit(data);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.success, true);
    assert.deepEqual(result.data, data);
    assert.ok(Number.isInteger(result.id) && result.id > 0);
    assert.equal(new Date(result.createdAt).toISOString(), result.createdAt);
    const rows = await readRows();
    assert.equal(rows.length, countBefore + 1);
    assert.deepEqual(rows.at(-1), {
      id: result.id,
      ...data,
      created_at: result.createdAt,
    });
  });
}

for (const [field, values] of [
  ["name", ["", "   ", "А".repeat(25), "Анна1", "Анна/Мария", "Анна\\Мария", "Анна:Мария", "Анна_Мария", "Анна!", "---", 123, null]],
  ["email", ["", "   ", "anna.example.com", "anna@example", "anna@.com", "anna@@example.ru", "anna@example.c", "a@" + "b".repeat(60) + "." + "c".repeat(34) + ".com", 123, null]],
  ["description", ["", "   ", "А".repeat(9), "А".repeat(1001), "  коротко  ", 123, null]],
]) {
  for (const value of values) {
    test(`reject ${field}: ${JSON.stringify(value).slice(0, 55)}`, async () => {
      const countBefore = (await readRows()).length;
      const response = await submit({ ...valid, [field]: value });
      assert.equal(response.status, 400);
      const result = await response.json();
      assert.equal(result.success, false);
      assert.ok(result.errors.fieldErrors[field].length > 0);
      assert.equal((await readRows()).length, countBefore);
    });
  }
}

for (const data of [null, [], "text", {}, { name: "Анна" }]) {
  test(`reject invalid body: ${JSON.stringify(data)}`, async () => {
    const countBefore = (await readRows()).length;
    assert.equal((await submit(data)).status, 400);
    assert.equal((await readRows()).length, countBefore);
  });
}

test("trim outer whitespace", async () => {
  const response = await submit(Object.fromEntries(Object.entries(valid).map(([key, value]) => [key, `  ${value}  `])));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, valid);
});

test("reject malformed JSON", async () => {
  const countBefore = (await readRows()).length;
  const response = await POST(new Request("http://localhost/api/requests", { method: "POST", body: "{" }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).success, false);
  assert.equal((await readRows()).length, countBefore);
});

test("create missing directory, database and table; preserve records on reopening", async () => {
  const path = join(testDirectory, "fresh", "requests.sqlite");
  assert.equal(existsSync(path), false);
  const first = await saveRequest(valid, path);
  const second = await saveRequest(valid, path);
  const rows = await readRows(path);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].id, first.id);
  assert.equal(rows[1].id, second.id);
});

test("store SQL punctuation as text without changing the table", async () => {
  const description = "A project'); DROP TABLE requests; --";
  const response = await submit({ ...valid, description });
  assert.equal(response.status, 200);
  assert.equal((await readRows()).at(-1).description, description);
});

test("return 500 without success when database cannot be opened", async () => {
  const backupPath = databasePath + ".backup";
  await rename(databasePath, backupPath);
  await mkdir(databasePath);
  try {
    const response = await submit(valid);
    assert.equal(response.status, 500);
    const result = await response.json();
    assert.equal(result.success, false);
    assert.match(result.message, /Не удалось сохранить/);
    assert.equal(result.id, undefined);
  } finally {
    await rmdir(databasePath);
    await rename(backupPath, databasePath);
  }
});
