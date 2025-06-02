#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require("@modelcontextprotocol/sdk/types.js");
const mysql = require("mysql2/promise");

// Database configuration from environment variables
const DB_HOST = process.env.DB_HOST || "mysql";
const DB_PORT = process.env.DB_PORT || "3306";
const DB_DATABASE = process.env.DB_DATABASE || "database";
const DB_USERNAME = process.env.DB_USERNAME || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";

class MySQLServer {
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

    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async createConnection() {
    try {
      return await mysql.createConnection({
        host: DB_HOST,
        port: parseInt(DB_PORT, 10),
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE,
      });
    } catch (error) {
      console.error("Failed to create MySQL connection:", error);
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to connect to MySQL: ${error.message}`
      );
    }
  }

  setupToolHandlers() {
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

      const { sql } = request.params.arguments;

      // Basic validation to ensure this is a read-only query
      const normalizedSql = sql.trim().toLowerCase();
      if (
        normalizedSql.startsWith("insert") ||
        normalizedSql.startsWith("update") ||
        normalizedSql.startsWith("delete") ||
        normalizedSql.startsWith("drop") ||
        normalizedSql.startsWith("alter") ||
        normalizedSql.startsWith("create")
      ) {
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

      let connection;
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
              text: `MySQL Error: ${error.message}`,
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("MySQL MCP server running on stdio");
  }
}

const server = new MySQLServer();
server.run().catch(console.error);
