import { getDatabase } from "@netlify/database";
import type { GameDatabase, GamePreparedStatement } from "./runtime";

type DatabaseValue = string | number | boolean | null;

function toPostgresQuery(source: string) {
  const ignoresConflict = /\bINSERT\s+OR\s+IGNORE\s+INTO\b/i.test(source);
  let parameter = 0;
  let query = source
    .replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, "INSERT INTO")
    .replace(/\?/g, () => `$${++parameter}`)
    .replace(/\bAS\s+([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)\b/g, 'AS "$1"')
    .replace(/datetime\('now',\s*'-15 seconds'\)/gi, "(CURRENT_TIMESTAMP - INTERVAL '15 seconds')")
    .trim()
    .replace(/;$/, "");

  if (ignoresConflict) query += " ON CONFLICT DO NOTHING";
  return query;
}

function normalizeRow<T>(row: Record<string, unknown>): T {
  if (
    typeof row.studentCount === "string" &&
    /^\d+$/.test(row.studentCount)
  ) {
    row.studentCount = Number(row.studentCount);
  }
  return row as T;
}

class NetlifyPreparedStatement implements GamePreparedStatement {
  constructor(
    private readonly query: string,
    private readonly values: DatabaseValue[] = [],
  ) {}

  bind(...values: unknown[]) {
    return new NetlifyPreparedStatement(
      this.query,
      values as DatabaseValue[],
    );
  }

  private async execute<T>() {
    const rows = await getDatabase().sql.unsafe(
      toPostgresQuery(this.query),
      this.values,
      { rowMode: "object" },
    );
    return rows.map((row) => normalizeRow<T>(row));
  }

  async first<T>() {
    const rows = await this.execute<T>();
    return rows[0] ?? null;
  }

  async all<T>() {
    return { results: await this.execute<T>() };
  }

  async run() {
    await this.execute();
    return { success: true };
  }
}

class NetlifyDatabase implements GameDatabase {
  prepare(query: string) {
    return new NetlifyPreparedStatement(query);
  }

  async batch(statements: GamePreparedStatement[]) {
    const results = [];
    for (const statement of statements) results.push(await statement.run());
    return results;
  }
}

const database = new NetlifyDatabase();

export function getNetlifyDatabase() {
  return database;
}
