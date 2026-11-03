# 🎵 SonicFlow — Complete, Production-Ready, Ad-Free Music Streaming Platform

SonicFlow is a modern, high-fidelity music streaming platform built from the ground up to deliver a clean, uninterrupted, and 100% advertisement-free audio experience. Inspired by intuitive streaming interaction patterns, SonicFlow maintains its own original branding, design system, and modular architecture.

---

## 🌟 Key Highlights & Architecture

- **100% Ad-Free Listening**: Zero audio ads, zero sponsored banner interruptions, and zero tracking SDKs.
- **Persistent Global Audio Engine**: Single HTML5 Audio singleton state that continues smooth audio playback while the user navigates across routes without stuttering or restarting.
- **HTTP Byte-Range Audio Seeking**: Streaming endpoints support `Range: bytes=start-end` (HTTP 206 Partial Content) for instantaneous scrubbing and seeking.
- **Procedural Hi-Res Audio Demo Engine**: Seed script generates authentic uncompressed 16-bit PCM Stereo RIFF WAV files with rich multi-octave harmonic progressions.
- **Comprehensive Database**: Normalized PostgreSQL schema with Prisma ORM, foreign key relationships, indexes, and cascade deletion.
- **Role-Based Access Control**:
  - `USER`: Personal library, playlist management, liking songs, listening history, custom profiles.
  - `CONTENT_MANAGER`: Catalog management, audio and artwork uploads, song availability controls.
  - `ADMIN`: Complete dashboard metrics, system audit logs, and user role management.
- **Smart Rule-Based Recommendations**: Discovers new tracks based on top genres, followed artists, and listening history with non-repeating filters.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 18, TypeScript)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with a custom dark aesthetic palette
- **Icons**: [Lucide React](https://lucide.dev/)
- **Client State**: [Zustand](https://github.com/pmndrs/zustand) for global audio player and authentication session state
- **Validation**: [Zod](https://zod.dev/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) (v20+ / v22+)
- **Framework**: [Express.js](https://expressjs.com/) & TypeScript
- **ORM**: [Prisma](https://www.prisma.io/)
- **Security & Middleware**: Helmet, CORS, Morgan, Cookie-Parser, Express-Rate-Limit, Bcrypt.js, JSONWebToken, Multer
- **Database**: PostgreSQL (Neon-compatible or local PostgreSQL 16+)

### Testing
- **Test Runner**: [Vitest](https://vitest.dev/)
- **HTTP Integration Testing**: [Supertest](https://github.com/ladjs/supertest)

---

## 📂 Repository Structure

```
sonicflow/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma PostgreSQL models and indexes
│   │   ├── seed.ts             # Database seeder with users, songs & playlists
│   │   └── generateAudio.ts    # Procedural 16-bit PCM WAV audio synthesizer
│   ├── src/
│   │   ├── config/             # Environment validation (Zod) & Prisma client
│   │   ├── controllers/        # REST controllers (auth, catalog, library, playlist, playback, admin)
│   │   ├── middleware/         # Auth JWT, Role RBAC, Rate-limiters, Error handling
│   │   ├── routes/             # Versioned REST endpoints (/api/v1)
│   │   ├── services/           # Domain business logic & data access
│   │   ├── utils/              # Error classes, standardized JSON responses
│   │   └── server.ts           # Express application entrypoint
│   ├── tests/
│   │   └── api.test.ts         # Vitest + Supertest suite (15 automated test cases)
│   ├── uploads/                # Local audio & artwork storage directory
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── page.tsx        # Personalized Home & Music Discovery
│   │   │   ├── search/         # Debounced Search with category filtering
│   │   │   ├── library/        # User playlists, saved albums, followed artists
│   │   │   ├── liked-songs/    # Liked songs table with play-all
│   │   │   ├── playlist/[id]/  # Playlist details, track addition & reordering
│   │   │   ├── album/[id]/     # Album view with tracklist
│   │   │   ├── artist/[id]/    # Artist profile with popular tracks & discography
│   │   │   ├── history/        # Listening history with clear history action
│   │   │   ├── profile/        # User profile & avatar settings
│   │   │   ├── settings/       # Streaming bitrate, audio quality, account deletion
│   │   │   ├── auth/login/     # Login page with 1-click Demo credentials
│   │   │   ├── auth/register/  # Sign up page
│   │   │   └── admin/          # Admin dashboard & music upload console
│   │   ├── components/         # Reusable UI cards, player controls, layout shell
│   │   ├── stores/             # usePlayerStore & useAuthStore
│   │   ├── lib/api.ts          # Typed API client
│   │   └── types/index.ts      # TypeScript interfaces
│   ├── tailwind.config.ts
│   └── package.json
│
└── package.json                # Root monorepo workspace orchestrator
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 20+ / 22+
- PostgreSQL database running (e.g. localhost:5432 or Neon connection string)

### 2. Configure Environment

**Backend (`backend/.env`):**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sonicflow?schema=public"
JWT_SECRET="sonicflow-production-ultra-secure-key-99887766"
JWT_EXPIRES_IN="7d"
CLIENT_URL="http://localhost:3000"
PORT=4000
NODE_ENV="development"
STORAGE_PROVIDER="local"
STORAGE_LOCAL_DIR="e:\\REA\\sonicflow\\backend\\uploads"
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### 3. Setup Database & Seed Demo Catalog
```bash
cd backend

# Generate Prisma Client
npm run prisma:generate

# Sync schema to PostgreSQL
npx prisma db push

# Seed demo users, procedural audio tracks, albums, artists, and playlists
npx tsx prisma/seed.ts
```

### 4. Run the Automated Tests
```bash
cd backend
npm run test
```
*Executes all 15 integration tests covering registration, login, catalog search, byte-range audio streaming, playlists, and user favorites.*

### 5. Start Development Servers
From the `sonicflow/` root:
```bash
# Start backend on http://localhost:4000
npm run dev:backend

# In another terminal, start frontend on http://localhost:3000
npm run dev:frontend
```

---

## 🔑 Demo Accounts

| Role | Email | Password | Privileges |
|------|-------|----------|------------|
| **Admin** | `admin@sonicflow.app` | `AdminPass123!` | Full dashboard analytics, upload songs/art, user role management, system audit logs |
| **Listener** | `user@sonicflow.app` | `UserPass123!` | Create playlists, save albums, follow artists, listen history, like tracks |

*(You can also click the quick demo buttons on the `/auth/login` page for 1-click access!)*

---

## 📡 REST API Endpoints (`/api/v1`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/health` | Public | Platform health & ad-free verification |
| `POST` | `/auth/register` | Public | Register new listener |
| `POST` | `/auth/login` | Public | Login & issue session cookie / JWT |
| `GET` | `/auth/me` | User | Get current profile & statistics |
| `PATCH` | `/auth/me` | User | Update display name / avatar |
| `GET` | `/songs` | Public | Paginated catalog songs |
| `GET` | `/songs/:id` | Public | Track details and liked status |
| `GET` | `/artists` | Public | Browse artists |
| `GET` | `/albums` | Public | Browse albums |
| `GET` | `/genres` | Public | List all music genres |
| `GET` | `/search?q=...` | Public | Ranked multi-entity search |
| `GET` | `/recommendations`| Public/User| Personalized rule-based recommendation engine |
| `POST` | `/playback/stream-url`| Public | Resolve authorized streaming endpoint |
| `GET` | `/playback/stream/:id`| Public | Byte-range audio delivery (HTTP 206 Partial Content) |
| `POST` | `/playback/events` | Public/User| Record playback play counts and qualified plays |
| `GET` | `/playlists` | Public | List public playlists |
| `POST` | `/playlists` | User | Create custom playlist |
| `GET` | `/playlists/:id` | Public/User| View playlist tracks |
| `POST` | `/playlists/:id/tracks` | Owner | Add track to playlist |
| `DELETE`| `/playlists/:id/tracks/:songId`| Owner | Remove track from playlist |
| `POST` | `/library/liked-songs/:songId` | User | Toggle like on track |
| `GET` | `/library/liked-songs` | User | Get user's liked songs |
| `POST` | `/library/albums/:albumId` | User | Toggle save on album |
| `POST` | `/library/artists/:artistId` | User | Toggle follow on artist |
| `GET` | `/library/history` | User | Get user listening history |
| `DELETE`| `/library/history` | User | Clear listening history |
| `GET` | `/admin/dashboard` | Admin/CM | Live database metrics |
| `POST` | `/admin/upload` | Admin/CM | Upload audio & artwork files |
| `POST` | `/admin/songs` | Admin/CM | Create song record |
| `DELETE`| `/admin/songs/:id` | Admin/CM | Delete song record |
| `GET` | `/admin/users` | Admin | Manage user permissions |
| `PATCH` | `/admin/users/:id/role` | Admin | Update user role |

---

## 🔒 Security & Performance Features

- **Passwords**: Hashed with `bcryptjs` using 12 salt rounds.
- **Sanitized SQL**: Guaranteed through parameterized Prisma ORM queries.
- **XSS & Headers**: Helmet security headers configured with cross-origin media streaming permissions.
- **Rate Limiting**: `express-rate-limit` guards authentication endpoints against brute-force attacks and bounds streaming concurrency.
- **Zero Leaked Secrets**: Stack traces and internal database strings suppressed in production responses.
#   s o n i c f l o w  
 