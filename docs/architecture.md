# OptiPress Architecture Blueprint

OptiPress is designed as a privacy-first, target-size PDF and image optimization platform built with a high-performance monorepo structure.

## Core Pillars & Design Principles

1. **Target-Size Precision**: Users choose an exact file size target (starting at 99 KB or custom values). Algorithms adjust compression parameters, sub-sampling, downscaling, and structural optimization to land as close to target as visually viable.
2. **Ephemeral Privacy**: No uploaded files or documents are permanently stored on servers. Temporary sessions are automatically purged when terminated or refreshed.
3. **Decoupled Architecture**: Clean separation between the Next.js presentation layer, Express API foundation, shared packages, and future asynchronous background worker queues (Redis / BullMQ).

## Monorepo Layout

```
optipress/
├── client/                     # Next.js 14 App Router frontend application
├── server/                     # Express.js REST API server
├── packages/
│   ├── types/                  # Shared TypeScript interfaces & types
│   └── config/                 # Domain constants, MIME limits, default presets
└── docs/                       # Technical specs & documentation
```

## Data & Processing Flow (Target State)

```
[ User Browser ]
       │
       ▼ (Upload Request)
[ Next.js Client / API Proxy ]
       │
       ▼ (Validate & Request Presigned Token)
[ Node/Express API Server ]
       │
       ├──► [ Redis / BullMQ Job Queue ] (Future Processing Pipeline)
       │           │
       │           ▼
       │     [ Worker Processors ]
       │     (Sharp, Ghostscript, qpdf, Poppler)
       │           │
       │           ▼
       │     [ Ephemeral Output Store ]
       │           │
       ▼           ▼
[ Download Stream to User ] ──► [ Automatic Purge Schedule ]
```

## Security & Privacy Guarantee
- SSL/TLS In-Flight Encryption.
- Zero Permanent Content Storage.
- Strict Upload MIME & Header Sanitization.
- Stateless Session Tokens.
