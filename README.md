# MySQL MCP Server

A Model Context Protocol (MCP) server that enables Claude Desktop to interact with MySQL databases through natural language queries.

## Features

- 🔍 Execute read-only SQL queries through Claude Desktop
- 🛡️ Built-in security with query validation (only SELECT statements allowed)
- 🔌 Easy integration with Claude Desktop
- 📊 JSON formatted query results
- 🔐 Environment-based configuration for database credentials

## Prerequisites

- Node.js (v14 or higher) - If using mise, update the command path accordingly
- MySQL database server
- Claude Desktop application

## Installation

### Option 1: Installation with Claude Code

If you're using Claude Code, you can easily install this MCP server:

```bash
# Clone the repository
git clone https://github.com/your-username/read-only-local-mysql-mcp-server.git
cd read-only-local-mysql-mcp-server

# Install dependencies and build
npm run build
```

Then configure Claude Code by adding to your MCP settings.

### Option 2: Manual Installation

#### 1. Clone or Download

Save the repository to a directory on your system:

```bash
mkdir ~/mcp-servers/mysql
cd ~/mcp-servers/mysql
git clone https://github.com/your-username/read-only-local-mysql-mcp-server.git .
```

#### 2. Install Dependencies

```bash
npm install
# Or for production deployment:
npm run build
```

## Configuration

### Claude Code Configuration

If you're using Claude Code, add the MySQL server to your MCP settings:

1. Open your Claude Code settings (typically in `~/.config/claude-code/settings.json` on macOS/Linux or `%APPDATA%\claude-code\settings.json` on Windows)

2. Add the MySQL MCP server configuration:

```json
{
  "mcp": {
    "servers": {
      "mysql": {
        "command": "node",
        "args": ["/absolute/path/to/read-only-local-mysql-mcp-server/index.js"],
        "env": {
          "DB_HOST": "localhost",
          "DB_PORT": "3306",
          "DB_DATABASE": "your_database_name",
          "DB_USERNAME": "your_username",
          "DB_PASSWORD": "your_password"
        }
      }
    }
  }
}
```

3. Restart Claude Code for the changes to take effect.

### Claude Desktop Configuration

Open your Claude Desktop configuration file:

**macOS:**

```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**

```bash
%APPDATA%\Claude\claude_desktop_config.json
```

Add the MySQL server configuration:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/absolute/path/to/index.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "3306",
        "DB_DATABASE": "your_database_name",
        "DB_USERNAME": "your_username",
        "DB_PASSWORD": "your_password"
      }
    }
  }
}
```

### Using mise for Node.js

If you're using [mise](https://mise.jdx.dev/) for Node.js version management, make sure to use the full path to the Node.js executable in your configuration. For example:

- Replace `"command": "node"` with `"command": "/Users/YOUR_USERNAME/.local/share/mise/installs/node/VERSION/bin/node"`
- You can find your mise Node.js path by running: `which node` when mise is active

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL server hostname | `mysql` |
| `DB_PORT` | MySQL server port | `3306` |
| `DB_DATABASE` | Database name | `database` |
| `DB_USERNAME` | MySQL username | `root` |
| `DB_PASSWORD` | MySQL password | (empty) |

## Usage

1. **Restart Claude Desktop** after updating the configuration
2. **Start chatting** with Claude about your database

### Example Queries

```bash
"Show me all tables in my database"
"What's the structure of the users table?"
"Get the first 10 records from the products table"
"How many orders were placed last month?"
"Show me users with email addresses ending in @gmail.com"
```

Claude will automatically convert your natural language requests into appropriate SQL queries and execute them against your database.

## Security Features

### Read-Only Operations

The server only allows SELECT queries. The following operations are blocked:

- `INSERT` - Adding new records
- `UPDATE` - Modifying existing records  
- `DELETE` - Removing records
- `DROP` - Removing tables/databases
- `ALTER` - Modifying table structure
- `CREATE` - Creating new tables/databases

### Recommended Database Setup

For enhanced security, create a dedicated read-only user for the MCP server:

```sql
-- Create a read-only user
CREATE USER 'claude_readonly'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant only SELECT permissions
GRANT SELECT ON your_database.* TO 'claude_readonly'@'localhost';

-- Apply the changes
FLUSH PRIVILEGES;
```

## Troubleshooting

### Connection Issues

1. **Verify MySQL is running**: Check if your MySQL server is active
2. **Check credentials**: Ensure username/password are correct
3. **Network connectivity**: Confirm Claude Desktop can reach your MySQL server

### Configuration Issues

1. **Restart required**: Always restart Claude Desktop after configuration changes
2. **Path accuracy**: Ensure the absolute path to `index.js` is correct
3. **JSON syntax**: Validate your `claude_desktop_config.json` format

### Debug Mode

To see server logs, you can run the server manually:

```bash
node index.js
```

## File Structure

```bash
~/mcp-servers/mysql/
├── index.js
├── package.json
└── node_modules/
```

## Dependencies

- **@modelcontextprotocol/sdk**: MCP protocol implementation
- **mysql2**: Modern MySQL client for Node.js with Promise support

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your MySQL connection independently
3. Ensure Claude Desktop is updated to the latest version
4. Review the Claude Desktop MCP documentation

---

**Note**: This server is designed for development and analysis purposes. For production use, consider additional security measures and monitoring.
