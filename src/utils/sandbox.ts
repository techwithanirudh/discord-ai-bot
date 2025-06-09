// utils/sandbox.ts

export type SandboxContext = Record<string, any>;

export interface SandboxOptions {
  code: string;
  context: SandboxContext;
  timeoutMs?: number;
  allowRequire?: boolean;
  allowedModules?: string[];
}

/**
 * Executes user code in a pseudo-sandbox with optional require whitelisting.
 * - Supports async/await
 * - Injects provided context
 * - Enforces execution timeout
 * - Optionally injects a restricted `require` that only allows whitelisted modules
 */
export async function runInSandbox({
  code,
  context,
  timeoutMs = 5000,
  allowRequire = false,
  allowedModules = [],
}: SandboxOptions): Promise<
  | { ok: true; result: any }
  | { ok: false; error: string }
> {
  // If require is allowed, provide a safe wrapper
  if (allowRequire) {
    context.require = (moduleName: string) => {
      if (!allowedModules.includes(moduleName)) {
        throw new Error(`Module '${moduleName}' is not permitted.`);
      }
      return require(moduleName);
    };
  }

  const keys = Object.keys(context);
  const values = Object.values(context);

  const AsyncFunction = Object.getPrototypeOf(async function(){}
    ).constructor;

  try {
    const runner = new AsyncFunction(...keys, `"use strict";\n${code}`);
    const result = await Promise.race([
      runner(...values),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Execution timed out")), timeoutMs)
      ),
    ]);
    return { ok: true, result };
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) };
  }
}
