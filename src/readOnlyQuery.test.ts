import { test } from "node:test";
import assert from "node:assert/strict";
import { assertReadOnlyQuery } from "./readOnlyQuery.js";

const allowed = [
  "SELECT * FROM users LIMIT 5",
  "select 1;",
  "  SHOW TABLES",
  "DESCRIBE users",
  "EXPLAIN SELECT * FROM users",
  "WITH t AS (SELECT 1 AS n) SELECT n FROM t",
  "SELECT * FROM users WHERE name = 'drop table; set password' AND updated_at > 0",
  "SELECT `set`, `into` FROM `delete`",
  "SELECT created, deleted_at FROM orders",
];

const rejected = [
  "DROP TABLE users",
  "SET PASSWORD FOR root = 'x'",
  "SELECT 1; DROP TABLE users",
  "WITH t AS (SELECT 1) DELETE FROM users",
  "WITH t AS (SELECT 1) UPDATE users SET a = 1",
  "SELECT 'x' INTO OUTFILE '/tmp/m10x'",
  "SELECT 'x' INTO DUMPFILE '/tmp/m10x'",
  "SELECT LOAD_FILE('/etc/passwd')",
  "SELECT * FROM users FOR UPDATE",
  "SELECT * FROM users LOCK IN SHARE MODE",
  "SELECT 1 /*! DROP TABLE users */",
  "SELECT 1 -- comment",
  "SELECT 1 # comment",
  "DROP/**/TABLE users",
  "EXPLAIN ANALYZE DELETE FROM users",
  "SELECT 1 ' ; DROP TABLE users",
  "",
];

test("allows read-only statements", () => {
  for (const sql of allowed) {
    assert.doesNotThrow(() => assertReadOnlyQuery(sql), sql);
  }
});

test("rejects state-changing statements", () => {
  for (const sql of rejected) {
    assert.throws(() => assertReadOnlyQuery(sql), sql);
  }
});
