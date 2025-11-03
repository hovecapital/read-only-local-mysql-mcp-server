# MCP Registry Publishing Setup

This document provides instructions for setting up fully automated publishing to npm and the MCP Registry using Release Please and your custom domain `hove.capital`.

## Overview

This server uses **Release Please** for automated version management and publishing:

- **Namespace:** `capital.hove/read-only-mysql-mcp-server`
- **Authentication:** HTTP-based domain authentication
- **Versioning:** Automated via Conventional Commits
- **Publishing:** Automatic to npm and MCP Registry on release

When you push commits to `main` using Conventional Commit format, Release Please automatically:

1. Creates/updates a release PR with changelog
2. When merged, publishes to npm and MCP Registry
3. Creates GitHub releases with proper tags

## Prerequisites

- Access to your web server at `hove.capital` (for HTTP authentication file)
- Admin access to this GitHub repository
- npm publish permissions for `@hovecapital` organization
- The `mcp-publisher` CLI tool (for initial setup and testing)

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

### Step 5: Add GitHub Secrets

Add the required secrets for automated publishing:

1. Go to your GitHub repository: <https://github.com/hovecapital/read-only-local-mysql-mcp-server>
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add two secrets:

**Secret 1: MCP_PRIVATE_KEY**

- **Name:** `MCP_PRIVATE_KEY`
- **Value:** Paste the 64 hex character private key from `private_key_hex.txt`

**Secret 2: NPM_TOKEN**

- **Name:** `NPM_TOKEN`
- **Value:** Your npm authentication token with publish permissions
- Get token from: <https://www.npmjs.com/settings/your-username/tokens>

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

This project uses [Release Please](https://github.com/googleapis/release-please) for automated releases. Publishing is fully automated based on your commit messages - no manual version bumping or tagging required!

### How It Works

1. **Make changes** to your code
2. **Commit using Conventional Commits** (see below)
3. **Push to main branch**
4. **Release Please automatically**:
   - Creates/updates a release PR with changelog
   - When you merge the PR, it creates a GitHub release
   - Publishes to npm
   - Publishes to MCP Registry

### Conventional Commit Format

Use these commit message prefixes to control versioning:

**Patch Release (0.0.X) - Bug fixes:**

```bash
git commit -m "fix: resolve authentication timeout issue"
git commit -m "fix(api): correct parameter validation in user endpoint"
```

**Minor Release (0.X.0) - New features:**

```bash
git commit -m "feat: add user profile export functionality"
git commit -m "feat(dashboard): implement real-time analytics widget"
```

**Major Release (X.0.0) - Breaking changes:**

```bash
git commit -m "feat!: migrate to new authentication API

BREAKING CHANGE: The old auth.login() method has been replaced with auth.authenticate().
All clients must update their integration code."
```

**Non-versioning commits (no release):**

```bash
git commit -m "docs: update API documentation examples"
git commit -m "chore: update dependencies"
git commit -m "ci: add automated security scanning"
git commit -m "test: add integration tests for payment flow"
```

### Release Workflow Example

1. **Make your changes:**

```bash
# Add a new feature
git add .
git commit -m "feat: add support for PostgreSQL connections"
git push origin main
```

2. **Release Please creates a PR:**
   - Automatically creates/updates a release PR
   - PR includes updated CHANGELOG.md
   - PR shows the new version number based on commits

3. **Review and merge the release PR:**
   - Review the changelog
   - Merge the PR when ready

4. **Automatic publishing:**
   - GitHub release is created with tag (e.g., `v0.2.0`)
   - Package is published to npm
   - Server is published to MCP Registry

5. **Verify publication:**

```bash
curl "https://registry.modelcontextprotocol.io/v0/servers?search=capital.hove/read-only-mysql-mcp-server"
```

### Monitor Workflow

Watch the workflow execution at:
<https://github.com/hovecapital/read-only-local-mysql-mcp-server/actions>

The workflow runs on every push to main and handles everything automatically.

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

### Release PR Not Created

- Ensure you're using Conventional Commit format (`feat:`, `fix:`, etc.)
- Check that commits were pushed to the `main` branch
- Verify workflow permissions are set correctly in `.github/workflows/release-please.yml`
- Non-versioning commits (`docs:`, `chore:`, `ci:`, `test:`) don't trigger releases

### NPM Publication Failed

- Verify the `NPM_TOKEN` secret is set correctly in GitHub repository secrets
- Ensure you have publish permissions for the `@hovecapital` npm organization
- Check the npm registry is accessible from GitHub Actions

### Version Mismatch Between Files

- Release Please automatically updates both `package.json` and `server.json`
- If manual edits are needed, ensure both files have matching versions
- The `.release-please-manifest.json` tracks the current version

## Security Notes

- **Never commit the private key files** (`private.pem`, `private_key_hex.txt`) to the repository
- Store the private key securely as a GitHub secret
- The public key in DNS is safe to share publicly
- Rotate keys periodically by generating a new keypair and updating DNS + GitHub secrets
- Add `*.pem`, `*_key*.txt` to your `.gitignore` file to prevent accidental commits

## Additional Resources

- [MCP Registry Documentation](https://github.com/modelcontextprotocol/registry)
- [MCP Publisher Guide](https://github.com/modelcontextprotocol/publisher)
- [Release Please Documentation](https://github.com/googleapis/release-please)
- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

If you encounter issues:

1. Check the GitHub Actions logs for detailed error messages
2. Review this troubleshooting section
3. Consult the MCP Registry documentation
4. Open an issue in the repository
