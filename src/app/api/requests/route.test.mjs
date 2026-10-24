import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "./route.ts";

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
    const response = await submit(data);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.success, true);
    assert.deepEqual(result.data, data);
  });
}

for (const [field, values] of [
  ["name", ["", "   ", "А".repeat(25), "Анна1", "Анна/Мария", "Анна\\Мария", "Анна:Мария", "Анна_Мария", "Анна!", "---", 123, null]],
  ["email", ["", "   ", "anna.example.com", "anna@example", "anna@.com", "anna@@example.ru", "anna@example.c", "a@" + "b".repeat(60) + "." + "c".repeat(34) + ".com", 123, null]],
  ["description", ["", "   ", "А".repeat(9), "А".repeat(1001), "  коротко  ", 123, null]],
]) {
  for (const value of values) {
    test(`reject ${field}: ${JSON.stringify(value).slice(0, 55)}`, async () => {
      const response = await submit({ ...valid, [field]: value });
      assert.equal(response.status, 400);
      const result = await response.json();
      assert.equal(result.success, false);
      assert.ok(result.errors.fieldErrors[field].length > 0);
    });
  }
}

for (const data of [null, [], "text", {}, { name: "Анна" }]) {
  test(`reject invalid body: ${JSON.stringify(data)}`, async () => {
    assert.equal((await submit(data)).status, 400);
  });
}

test("trim outer whitespace", async () => {
  const response = await submit(Object.fromEntries(Object.entries(valid).map(([key, value]) => [key, `  ${value}  `])));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).data, valid);
});

test("reject malformed JSON", async () => {
  const response = await POST(new Request("http://localhost/api/requests", { method: "POST", body: "{" }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).success, false);
});
