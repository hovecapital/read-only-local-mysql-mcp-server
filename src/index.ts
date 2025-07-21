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

type QueryToolArguments = {
  sql: string;
};

type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

class MySQLServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "mysql-server",
        version: "1.0.0",
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

  private async createConnection(): Promise<Connection> {
    try {
      const config: DatabaseConfig = {
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
          name: "query",
          description: "Run a read-only SQL query",
          inputSchema: {
            type: "object",
            properties: {
              sql: {
                type: "string",
                description: "SQL query to execute (read-only)",
              },
            },
            required: ["sql"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "query") {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const { sql } = request.params.arguments as QueryToolArguments;

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

      let connection: Connection | undefined;
      try {
        connection = await this.createConnection();
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
