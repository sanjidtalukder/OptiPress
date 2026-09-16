# OptiPress

> **"You choose the target size. We protect visual quality and privacy."**

OptiPress is a production-grade, privacy-first PDF and image optimization platform designed for modern SaaS workflows. It allows users to reduce PDF and image sizes down to specific target file sizes (starting from 99 KB to custom MB/KB values) while preserving visual clarity.

---

## 🏗️ Architecture & Monorepo Structure

OptiPress is structured as a clean, scalable TypeScript monorepo using npm workspaces:

```
optipress/
├── client/                 # Next.js App Router, Tailwind CSS, shadcn/ui, next-themes
├── server/                 # Node.js + Express API server with Zod configuration
├── packages/
│   ├── types/              # Shared TypeScript definitions (User, FileMetadata, Jobs)
│   └── config/             # Domain settings, MIME constants, target size limits
├── docs/                   # Architectural blueprints and diagrams
├── .env.example            # Environment configuration template
├── package.json            # Root workspace config
└── README.md
```

---

## 🚀 Tech Stack

### Frontend (`/client`)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with Centralized Semantic HSL Design Tokens (`globals.css`)
- **Icons**: Lucide React
- **Theme**: `next-themes` (Light, Dark, and System modes with zero flash)
- **Validation**: Zod
- **Architecture**: Modular layout with dedicated `/auth`, `/features`, `/components`, `/providers`

### Backend (`/server`)
- **Runtime**: Node.js & TypeScript
- **Framework**: Express.js
- **Configuration**: Zod environment validation
- **Middleware**: Centralized error handler, request logger, Helmet security, CORS configuration
- **Endpoints**: `GET /health` foundation endpoint

### Shared Packages (`/packages`)
- `@optipress/types`: Unified TypeScript declarations shared between frontend and API backend.
- `@optipress/config`: Centralized application constants, file size limits, and supported formats.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Installation

```bash
# Clone and navigate to the project directory
cd optipress

# Install workspace dependencies
npm install
```

### Environment Configuration

Copy `.env.example` to `.env` in the root and in the `/server` directory:

```bash
cp .env.example .env
cp .env.example server/.env
```

### Development Mode

Run both the client and server concurrently:

```bash
npm run dev
```

Or run individual services:

```bash
# Start Client (Next.js on http://localhost:3000)
npm run dev:client

# Start Server (Express on http://localhost:4000)
npm run dev:server
```

---

## 🧪 Verification & Endpoints

- **Health Check**: `GET http://localhost:4000/health`
  - Expected Response: `{"status": "ok"}`
- **Client Homepage**: Open `http://localhost:3000` to interact with the responsive design system, theme switcher, upload zone preview, and target size showcase.

---

## 🔒 Privacy & Security Model
- **Zero Permanent Storage**: Files are processed in ephemeral isolated memory/tmp storage and immediately evicted upon session termination or download completion.
- **Client Security**: Strict validation of MIME types, magic numbers, and file boundaries before upload initialization.

---

## 📋 Roadmap & Implementation Phases

- [x] **Step 1**: Monorepo workspace setup, centralized design system, semantic theme tokens, responsive UI layout, reusable upload zone, Express backend foundation & `/health` endpoint.
- [ ] **Step 2**: Ephemeral session storage, worker processing pipeline foundation.
- [ ] **Step 3**: PDF target-size reduction algorithms (qpdf / Ghostscript integration).
- [ ] **Step 4**: Image target-size optimization & format conversion (Sharp processing).
- [ ] **Step 5**: Authentication integration (Supabase Auth) & user metadata handling.
- [ ] **Step 6**: Batch processing, analytics, and enterprise controls.
