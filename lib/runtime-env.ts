export type SquirrelRuntimeEnv = {
  DB?: D1Database;
  FILES?: R2Bucket;
};

export function runtimeEnv(): SquirrelRuntimeEnv {
  return (
    globalThis as typeof globalThis & {
      __SQUIRREL_RUNTIME_ENV__?: SquirrelRuntimeEnv;
    }
  ).__SQUIRREL_RUNTIME_ENV__ ?? {};
}

export function requireDatabase(): D1Database {
  const database = runtimeEnv().DB;
  if (!database) throw new Error("Squirrel's database is not available.");
  return database;
}

export function requireFileBucket(): R2Bucket {
  const bucket = runtimeEnv().FILES;
  if (!bucket) throw new Error("Squirrel's private file storage is not available.");
  return bucket;
}
