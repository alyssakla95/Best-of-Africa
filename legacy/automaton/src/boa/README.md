
# BoA Country Steward Automaton

A specialized agent framework for managing Country Stewards on the Best of Africa platform.

## Architecture

Extends the **Conway Automaton** base to provide:

- **Per-Country Wallet**: Isolated budgets and identities.
- **Budget-Aware Logic**: Checks Conway Credits & USDC balance before actions.
- **Safe BoA Client**: Whitelisted API endpoints only.

## Usage

### 1. Prerequisites

- Node.js 20+
- `pnpm`

### 2. Configuration

Create a config file in `src/boa/config/` (e.g., `rwanda.json`):

```json
{
  "countryCode": "RW",
  "boaApiBaseUrl": "https://api.bestofafrica.com",
  "walletDataDir": "~/.automaton/boa/RW",
  ...
}
```

### 3. Run Mock Server (Testing)

```bash
npx tsx src/boa/mock-server/server.ts
```

### 4. Run Stewards

```bash
npx tsx src/boa/index.ts
```

This will load all `.json` configs in `src/boa/config/` and start a steward loop for each.

## Constraints

This agent **CANNOT**:

1. Execute arbitrary shell commands.
2. Deploy code to BoA.
3. Call non-whitelisted URLs.

It **CAN**:

1. Read BoA Metrics.
2. Trigger BoA Audits.
3. Manage its own Wallet/Budget.
