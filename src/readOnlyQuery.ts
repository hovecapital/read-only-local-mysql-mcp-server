import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";

const ALLOWED_STATEMENT_STARTS = [
  "select",
  "with",
  "show",
  "describe",
  "desc",
  "explain",
] as const;

// Words that must not appear anywhere in the statement, even after an allowed start.
// Covers WITH ... UPDATE/DELETE, SELECT ... INTO OUTFILE/DUMPFILE, SELECT ... FOR UPDATE,
// LOAD_FILE(), EXPLAIN ANALYZE (which executes the statement), and locking.
const FORBIDDEN_KEYWORDS = [
  "insert",
  "update",
  "delete",
  "replace",
  "into",
  "outfile",
  "dumpfile",
  "load_file",
  "load",
  "create",
  "drop",
  "alter",
  "truncate",
  "rename",
  "grant",
  "revoke",
  "set",
  "lock",
  "call",
  "do",
  "analyze",
  "execute",
  "kill",
  "flush",
  "shutdown",
] as const;

function invalidQuery(message: string): McpError {
  return new McpError(ErrorCode.InvalidParams, message);
}

// Blanks out string literals and backtick identifiers so their contents are not read as SQL.
function stripQuotedText(sql: string): string {
  return sql.replace(/'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`[^`]*`/g, " ");
}

function firstWord(sql: string): string {
  return sql.split(/\s+/, 1)[0]?.toLowerCase() ?? "";
}

export function assertReadOnlyQuery(sql: string): void {
  const bare = stripQuotedText(sql).trim().replace(/;$/, "").trim();

  if (bare.length === 0) {
    throw invalidQuery("Query is empty.");
  }
  // Comments can hide keywords from this check, and /*! ... */ comments are executed by MySQL.
  if (/\/\*|--|#/.test(bare)) {
    throw invalidQuery("Comments are not allowed in queries.");
  }
  if (bare.includes(";")) {
    throw invalidQuery("Only a single statement is allowed per query.");
  }
  if (
    !(ALLOWED_STATEMENT_STARTS as readonly string[]).includes(firstWord(bare))
  ) {
    throw invalidQuery(
      "Only SELECT, WITH, SHOW, DESCRIBE and EXPLAIN queries are allowed."
    );
  }
  const forbidden = FORBIDDEN_KEYWORDS.find((keyword) =>
    new RegExp(`\\b${keyword}\\b`, "i").test(bare)
  );
  if (forbidden) {
    throw invalidQuery(
      `Keyword "${forbidden.toUpperCase()}" is not allowed in read-only queries.`
    );
  }
}
