# ArcQRPay: Cross-Chain Web3 POS System

ArcQRPay is a premium Web3 Point-of-Sale (POS) system built for the **Arc Network**. It enables merchants to accept USDC payments on the Arc Testnet from customers using any major EVM testnet (Base, Sepolia, etc.) without requiring manual bridging.

## 🚀 Key Features

- **Multi-Chain USDC Payments**: Pay on Base/Sepolia, Merchant receives on Arc Testnet automatically via Circle Unified Balance (CCTP).
- **Passwordless Auth**: Secure consumer login using **Passkeys (FaceID/Biometrics)** via Dynamic SDK.
- **Premium QR Scanner**: Custom-built, Safari-optimized QR scanner with real-time laser animations and rear-camera priority.
- **Merchant DCW**: Merchant wallets are Developer-Controlled Wallets (DCW) managed via Circle Programmable Wallets API.
- **Real-time Notifications**: Merchants are notified instantly of successful payments via Pusher.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + Lucide Icons
- **Auth/Wallet**: [Dynamic SDK](https://www.dynamic.xyz/)
- **Cross-Chain**: [Circle App Kit](https://www.circle.com/en/programmable-wallets) + [Circle SDK](https://github.com/circlefin/circle-developer-controlled-wallets-nodejs)
- **Blockchain**: Viem v2 + Arc Testnet
- **Database**: Prisma + PostgreSQL
- **Real-time**: Pusher

## 🏗 System Architecture

### Merchant Flow (POS)
1. Merchant enters amount in the POS dashboard.
2. System creates a `Bill` in the database and generates a unique QR code.
3. QR code contains a URI: `arcpay://pay?merchant=[ADDR]&amount=[AMT]&billId=[ID]`.

### Consumer Flow (Wallet)
1. Consumer scans the QR using the custom `QRScanner`.
2. System detects the consumer's current network and USDC balance.
3. **If on Arc Testnet**: Direct USDC transfer.
4. **If on Other Chain**: Unified Balance "Bridge & Pay" flow (Deposit to Gateway → Spend on Arc).
5. Success notification sent to both parties.

## ⚙️ Network Details (Testnet)

| Network | Chain ID | USDC Contract Address |
|---|---|---|
| **Arc Testnet** | 5042002 | `0x2F7100346EaaE32C37A33eBf68A658823126305a` |
| **Ethereum Sepolia** | 11155111 | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| **Base Sepolia** | 84532 | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| **Arbitrum Sepolia** | 421614 | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |

## 🛠 Setup & Development

### 1. Environment Variables
Create a `.env` file with the following:
```env
# Dynamic Auth
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_id

# Circle API
CIRCLE_API_KEY=your_key
CIRCLE_ENTITY_SECRET=your_secret
CIRCLE_WALLET_SET_ID=your_set_id

# Database
DATABASE_URL=your_postgres_url

# Pusher
NEXT_PUBLIC_PUSHER_APP_ID=...
NEXT_PUBLIC_PUSHER_KEY=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_CLUSTER=...
```

### 2. Local Development
```bash
# Install dependencies
npm install

# Run with HTTPS (Required for Camera/Passkeys)
npm run dev:https
```

## 📜 License
MIT
