import mongoose from "mongoose";
import { applyTestEnv } from "./env";

export function hasMongoUri(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function connectTestDb(): Promise<void> {
  applyTestEnv();
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI required for integration tests");
  }
  await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
}

export async function clearTestCollections(): Promise<void> {
  if (!mongoose.connection.db) return;

  const dbName = mongoose.connection.db.databaseName;
  const safe =
    /_(test|ci)$/i.test(dbName) || process.env.ALLOW_TEST_DB_WIPE === "1";
  if (!safe) {
    throw new Error(
      `Refusing to wipe database "${dbName}". Use a URI ending in _test or _ci (e.g. mongodb://127.0.0.1:27017/oneauth_test).`
    );
  }

  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
  global.mongooseCache = { conn: null, promise: null };
}
