# MCP Registry Publishing Setup

This document provides instructions for setting up automated publishing to the MCP Registry using your custom domain `hove.capital`.

## Overview

This server is configured to publish to the MCP Registry under the namespace `capital.hove/read-only-mysql-mcp-server` using domain-based authentication.

## Prerequisites

- Access to DNS settings for `hove.capital`
- Admin access to this GitHub repository
- The `mcp-publisher` CLI tool (for initial setup)

## One-Time Setup

### Step 1: Install mcp-publisher CLI

Choose one of the following installation methods:

**macOS/Linux (Homebrew):**

```bash
brew install modelcontextprotocol/tap/mcp-publisher
```

**Pre-built binaries:**
Download from: <https://github.com/modelcontextprotocol/publisher/releases>

**Build from source (requires Go 1.24+):**

```bash
go install github.com/modelcontextprotocol/publisher/cmd/mcp-publisher@latest
```

### Step 2: Generate Ed25519 Keypair

Generate an Ed25519 keypair for domain authentication using OpenSSL:

```bash
# Generate private key
openssl genpkey -algorithm ed25519 -outform PEM -out private.pem

# Extract the raw private key as hex (64 hex characters - needed for mcp-publisher)
openssl pkey -in private.pem -outform DER | tail -c 32 | xxd -p -c 64 > private_key_hex.txt

# Extract the raw public key and convert to base64 (needed for DNS TXT record)
openssl pkey -in private.pem -pubout -outform DER | tail -c 32 | base64 > public_key_base64.txt

# Also save public key as hex for reference
openssl pkey -in private.pem -pubout -outform DER | tail -c 32 | xxd -p -c 64 > public_key_hex.txt

# View your keys
echo "Private key (hex - 64 characters):"
cat private_key_hex.txt
echo ""
echo "Public key (base64 - for DNS):"
cat public_key_base64.txt
echo ""
echo "Verify both hex keys are exactly 64 characters each"
```

**Important:**
- The private key should be exactly 64 hex characters (32 bytes)
- The public key base64 should be exactly 44 characters with `=` padding
- Never commit the private key files to the repository

### Step 3: Setup HTTP Authentication File

Create a publicly accessible file on your `hove.capital` web server with your public key:

1. On your web server, create the directory `.well-known/` (if it doesn't exist)
2. Create a file at: `.well-known/mcp-registry-auth`
3. Add this content (use the base64 value from step 2):

```
v=MCPv1; k=ed25519; p=MCqGKWNKpz4LnK/M74yTVhoTQMDqGKUp5Iw5myd4UVM=
```

4. Ensure the file is accessible at: `https://hove.capital/.well-known/mcp-registry-auth`

### Step 4: Verify HTTP File is Accessible

Test that the file is publicly accessible:

```bash
curl https://hove.capital/.well-known/mcp-registry-auth
```

Should return:
```
v=MCPv1; k=ed25519; p=MCqGKWNKpz4LnK/M74yTVhoTQMDqGKUp5Iw5myd4UVM=
```

### Step 5: Add Private Key to GitHub Secrets

Add the private key as a GitHub Actions secret:

1. Go to your GitHub repository: <https://github.com/hovecapital/read-only-local-mysql-mcp-server>
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Set:
   - **Name:** `MCP_PRIVATE_KEY`
   - **Secret:** Paste the 64 hex character private key from `private_key_hex.txt`
5. Click **Add secret**

### Step 6: Test Authentication (Optional)

Before pushing a tag, you can test authentication locally:

```bash
mcp-publisher login http --domain hove.capital --private-key $(cat private_key_hex.txt)
```

If successful, you should see:
```
✓ Successfully logged in
```

## Publishing a New Version

Once the one-time setup is complete, publishing is automated:

### Step 1: Update Version

Update the version in both files:

- `package.json` - Change the `version` field
- `server.json` - Change the `version` field

Make sure both versions match!

### Step 2: Commit Changes

```bash
git add package.json server.json
git commit -m "chore: bump version to v0.1.1"
```

### Step 3: Create and Push Version Tag

```bash
git tag v0.1.1
git push origin v0.1.1
```

This will trigger the GitHub Actions workflow that:

1. Checks out the code
2. Downloads mcp-publisher
3. Authenticates using your domain and private key
4. Publishes to the MCP Registry

### Step 4: Monitor Workflow

Watch the workflow execution at:
<https://github.com/hovecapital/read-only-local-mysql-mcp-server/actions>

### Step 5: Verify Publication

After successful workflow completion, verify the server is published:

```bash
curl "https://registry.modelcontextprotocol.io/v0/servers?search=capital.hove/read-only-mysql-mcp-server"
```

Or visit the MCP Registry website to search for your server.

## Troubleshooting

### HTTP Authentication File Not Found

- Verify the file exists at `https://hove.capital/.well-known/mcp-registry-auth`
- Check file permissions - it must be publicly readable
- Ensure no trailing whitespace or hidden characters in the file content
- Test with `curl` to confirm it's accessible

### Authentication Failed in GitHub Actions

- Verify the `MCP_PRIVATE_KEY` secret contains the correct private key (64 hex characters)
- Ensure the private key matches the public key in your HTTP auth file
- Confirm the HTTP auth file is still accessible and hasn't been deleted

### Version Mismatch

- Ensure `package.json` and `server.json` have the same version number
- Both files must be committed before creating the version tag

### Workflow Doesn't Trigger

- Ensure the tag format matches `v*` (e.g., v0.1.1, v1.0.0)
- Check that the workflow file exists at `.github/workflows/publish-mcp.yml`
- Verify you pushed the tag to GitHub: `git push origin v0.1.1`

## Security Notes

- **Never commit the private key files** (`private.pem`, `private_key_hex.txt`) to the repository
- Store the private key securely as a GitHub secret
- The public key in DNS is safe to share publicly
- Rotate keys periodically by generating a new keypair and updating DNS + GitHub secrets
- Add `*.pem`, `*_key*.txt` to your `.gitignore` file to prevent accidental commits

## Additional Resources

- [MCP Registry Documentation](https://github.com/modelcontextprotocol/registry)
- [MCP Publisher Guide](https://github.com/modelcontextprotocol/publisher)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

If you encounter issues:

1. Check the GitHub Actions logs for detailed error messages
2. Review this troubleshooting section
3. Consult the MCP Registry documentation
4. Open an issue in the repository
