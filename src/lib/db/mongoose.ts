import mongoose from "mongoose";
import { getConfig } from "@/lib/config";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cache;

export async function connectDb(): Promise<typeof mongoose> {
  const { mongodbUri } = getConfig().secrets;

  if (!mongodbUri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(mongodbUri, {
      bufferCommands: false,
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export function isDbConfigured(): boolean {
  return Boolean(getConfig().secrets.mongodbUri);
}
