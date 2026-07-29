export async function getPlatformValue(name: string) {
  const localValue = process.env[name];
  if (localValue) return localValue;
  if (process.env.NETLIFY || process.env.CONTEXT) return undefined;

  const moduleName = "cloudflare:workers";
  const { env } = (await import(moduleName)) as {
    env: Record<string, unknown>;
  };
  const value = env[name];
  return typeof value === "string" ? value : undefined;
}
