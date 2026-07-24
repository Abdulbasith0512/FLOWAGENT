"use server";

import { createHash, randomBytes, createCipheriv } from "node:crypto";
import { eq, and, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";

function encryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY ?? "change-me-dev-only-encryption";
  return createHash("sha256").update(secret).digest();
}

function encrypt(plaintext: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), nonce);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([nonce, enc, tag]).toString("base64");
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 48) || "credential"
  );
}

export async function listCredentials() {
  const user = await requireUser();
  return db
    .select({
      id: schema.credentials.id,
      name: schema.credentials.name,
      slug: schema.credentials.slug,
      type: schema.credentials.type,
      lastUsedAt: schema.credentials.lastUsedAt,
    })
    .from(schema.credentials)
    .where(eq(schema.credentials.userId, user.id))
    .orderBy(desc(schema.credentials.createdAt));
}

export async function createCredential(input: {
  name: string;
  type: string;
  value: string;
}) {
  const user = await requireUser();
  await db
    .insert(schema.credentials)
    .values({
      userId: user.id,
      name: input.name,
      slug: slugify(input.name),
      type: input.type,
      ciphertext: encrypt(input.value),
    })
    .onConflictDoUpdate({
      target: [schema.credentials.userId, schema.credentials.slug],
      set: { ciphertext: encrypt(input.value), updatedAt: new Date() },
    });
}

export async function deleteCredential(id: string) {
  const user = await requireUser();
  await db
    .delete(schema.credentials)
    .where(
      and(eq(schema.credentials.id, id), eq(schema.credentials.userId, user.id)),
    );
}
