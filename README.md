# MySQL MCP Server

A Model Context Protocol (MCP) server that enables Claude Desktop to interact with MySQL databases through natural language queries.

## Features

- 🔍 Execute read-only SQL queries through Claude Desktop
- 🛡️ Built-in security with query validation (only SELECT statements allowed)
- 🔌 Easy integration with Claude Desktop
- 📊 JSON formatted query results
- 🔐 Environment-based configuration for database credentials

## Prerequisites

- Node.js (v14 or higher)
- MySQL database server
- Claude Desktop application

## Installation

### 1. Clone or Download

Save the `index.js` file to a directory on your system:

```bash
mkdir ~/mcp-servers/mysql
cd ~/mcp-servers/mysql
```

### 2. Install Dependencies

```bash
npm install
```

## Configuration

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
