# Sankha's Assets — HotPocket React Frontend

A modern React + TypeScript + Tailwind CSS frontend for the Evernode HotPocket smart contract "Sankha's Assets".

## Features
- JSON-based HotPocket client integration (matching backend protocol)
- Mock mode for development without HotPocket servers
- Dashboard with stats (Query.getStats)
- Assets list with search/filters/sort and cursor pagination (Query.listAssets)
- Asset detail page with history timeline (Query.getAsset, Query.getAssetHistory)
- Create asset form and owner/admin-gated actions (Asset service)
- Admin panel for roles and contract controls (Access service)
- Wallet keypair generation and network selection
- Optimistic updates, toasts, responsive UI

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
- For mock mode (default):
```
VITE_MOCK_MODE=true
VITE_CONTRACT_URLS=wss://localhost:8081
```
- For real servers:
```
VITE_MOCK_MODE=false
VITE_CONTRACT_URLS=wss://your-hotpocket-server:port
```

3. Run dev server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Notes
- The backend does not expose a read endpoint to fetch the current user's role. Admin-only UI controls are exposed with an "Admin Mode" toggle under Settings for convenience; unauthorized actions will return 403 and show an error.
- The contract uses JSON protocol; this client serializes messages as JSON accordingly.

## Project Structure
- `src/services/contract-service.ts` — HotPocket client (singleton) with mock mode
- `src/services/api-service.ts` — SDK mapped to backend actions
- `src/pages/*` — Pages for routes
- `src/app/store.ts` — Redux store with snackbar and auth slices

## Tests
Minimal smoke tests for mock mode are included under `src/__tests__/`. These rely on Node's test runner (node:test). You can run them with:
```bash
node --test src/__tests__/api-service.mock.test.ts
```
(Requires Node 20+)
