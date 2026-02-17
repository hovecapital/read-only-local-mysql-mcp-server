#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import mysql from "mysql2/promise";
import type { Connection } from "mysql2/promise";

const DB_HOST: string = process.env.DB_HOST ?? "mysql";
const DB_PORT: string = process.env.DB_PORT ?? "3306";
const DB_DATABASE: string = process.env.DB_DATABASE ?? "database";
const DB_USERNAME: string = process.env.DB_USERNAME ?? "root";
const DB_PASSWORD: string = process.env.DB_PASSWORD ?? "";

type ConnectToolArguments = {
  connectionString: string;
};

type QueryToolArguments = {
  sql: string;
  connectionString?: string;
};

type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function parseConnectionString(connectionString: string): DatabaseConfig {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Invalid connection string. Expected format: mysql://user:password@host:port/database"
    );
  }

  const host = url.hostname;
  const database = url.pathname.slice(1);

  if (!host) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Connection string must include a host"
    );
  }
  if (!database) {
    throw new McpError(
      ErrorCode.InvalidParams,
      "Connection string must include a database name"
    );
  }

  return {
    host,
    port: url.port ? parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}

class MySQLServer {
  private server: Server;
  private runtimeConfig: DatabaseConfig | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "mysql-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();

    this.server.onerror = (error): void => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private async createConnection(
    configOverride?: DatabaseConfig
  ): Promise<Connection> {
    try {
      const config: DatabaseConfig = configOverride ??
        this.runtimeConfig ?? {
          host: DB_HOST,
          port: parseInt(DB_PORT, 10),
          user: DB_USERNAME,
          password: DB_PASSWORD,
          database: DB_DATABASE,
        };
      return await mysql.createConnection(config);
    } catch (error) {
      console.error("Failed to create MySQL connection:", error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to connect to MySQL: ${(error as Error).message}`
      );
    }
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "connect",
          description:
            "Connect to a MySQL database using a connection string. The connection will be used for subsequent queries until changed.",
          inputSchema: {
            type: "object",
            properties: {
              connectionString: {
                type: "string",
                description:
                  "MySQL connection string (e.g., mysql://user:password@host:port/database)",
              },
            },
            required: ["connectionString"],
          },
        },
        {
          name: "disconnect",
          description:
            "Disconnect from the current runtime database and revert to the default environment-configured connection",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "query",
          description:
            "Run a read-only SQL query against the currently connected database",
          inputSchema: {
            type: "object",
            properties: {
              sql: {
                type: "string",
                description: "SQL query to execute (read-only)",
              },
              connectionString: {
                type: "string",
                description:
                  "Optional: MySQL connection string to override the current connection for this query only",
              },
            },
            required: ["sql"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "connect": {
          const { connectionString } = request.params
            .arguments as ConnectToolArguments;
          const config = parseConnectionString(connectionString);

          let connection: Connection | undefined;
          try {
            connection = await mysql.createConnection(config);
            await connection.end();
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `Failed to connect: ${(error as Error).message}`,
                },
              ],
              isError: true,
            };
          }

          this.runtimeConfig = config;

          return {
            content: [
              {
                type: "text",
                text: `Connected to MySQL database "${config.database}" on ${config.host}:${config.port}`,
              },
            ],
          };
        }

        case "disconnect": {
          this.runtimeConfig = null;

          return {
            content: [
              {
                type: "text",
                text: "Disconnected from runtime database. Future queries will use the default environment-configured connection.",
              },
            ],
          };
        }

        case "query": {
          const { sql, connectionString } = request.params
            .arguments as QueryToolArguments;

          if (!this.isReadOnlyQuery(sql)) {
            return {
              content: [
                {
                  type: "text",
                  text: "Error: Only SELECT queries are allowed for security reasons.",
                },
              ],
              isError: true,
            };
          }

          const configOverride = connectionString
            ? parseConnectionString(connectionString)
            : undefined;

          let connection: Connection | undefined;
          try {
            connection = await this.createConnection(configOverride);
            const [rows] = await connection.execute(sql);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(rows, null, 2),
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: "text",
                  text: `MySQL Error: ${(error as Error).message}`,
                },
              ],
              isError: true,
            };
          } finally {
            if (connection) {
              await connection.end();
            }
          }
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    });
  }

  private isReadOnlyQuery(sql: string): boolean {
    const normalizedSql = sql.trim().toLowerCase();
    const writeOperations = [
      "insert",
      "update",
      "delete",
      "drop",
      "alter",
      "create",
    ] as const;

    return !writeOperations.some((op) => normalizedSql.startsWith(op));
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MySQL MCP server running on stdio");
  }
}

const server = new MySQLServer();
server.run().catch(console.error);
