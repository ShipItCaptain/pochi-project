# CLAUDE.md — Pochi Project Briefing

Read this file completely before doing anything. This is your master briefing.

## What is Pochi?

Pochi is a WhatsApp-native fundraising coordination platform built for the Kenyan market.

**The problem it solves:** When Kenyans raise money in WhatsApp groups, organizers spend hours manually matching M-Pesa payment names to contributor identities, tracking pledges, and updating the group. M-Pesa names often don't match WhatsApp names. Pochi solves this automatically.

**The core value proposition:** Keep your Paybill. Keep your WhatsApp group. We make the bookkeeping automatic.

**Critical differentiator:** Money NEVER touches Pochi. It flows directly to the organizer's own Paybill or Till. Pochi only listens to transactions, reconciles identities, and communicates results back to the WhatsApp group automatically.

## What has already been done

1. Complete technical architecture — see ARCHITECTURE.md
2. Full UI designs for every page — see ui-designs/ folder
3. Database schema — fully defined in ARCHITECTURE.md Section 3
4. API endpoints — fully defined in ARCHITECTURE.md Section 4
5. Business logic — fully defined in ARCHITECTURE.md Section 5

## Tech Stack — do not deviate from this

| Layer | Technology |
|-------|-----------|
| Backend Runtime | Node.js v20 LTS |
| Backend Framework | Express.js v4 |
| Database | PostgreSQL v15 |
| ORM | Prisma v5 |
| WhatsApp API | Africa's Talking WhatsApp Business API |
| M-Pesa API | Safaricom Daraja API (C2B webhooks + STK Push) |
| Frontend | React v18 + Vite |
| Styling | TailwindCSS |
| Authentication | JWT + OTP via Africa's Talking SMS |
| File Export | PDFKit + ExcelJS |
| Hosting | Railway.app (backend + DB) + Vercel (frontend) |
| Package Manager | npm |

## Project Structure

```
pochi/
├── CLAUDE.md                    ← this file
├── ARCHITECTURE.md              ← full technical blueprint
├── ui-designs/                  ← all UI page designs as HTML files
│   ├── landing-page.html
│   ├── signup-page.html
│   ├── login-page.html
│   ├── dashboard-home.html
│   ├── create-fundraiser.html
│   ├── fundraiser-detail.html
│   ├── unmatched-resolve.html
│   ├── export-screen.html
│   ├── settings-subscription.html
│   └── contributor-registration.html
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── webhooks/
│   │   ├── jobs/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   ├── .env
│   ├── index.html
│   └── package.json
└── .gitignore
```

## Build Sequence — follow this EXACTLY in order

### Step 1 — Scaffold the project
```bash
cd backend && npm init -y
npm install express prisma @prisma/client bcryptjs jsonwebtoken
npm install axios dotenv cors helmet express-rate-limit node-cron
npm install joi pdfkit exceljs multer
npm install -D nodemon
npx prisma init

cd ../frontend
npm create vite@latest . -- --template react
npm install
npm install axios react-router-dom zustand react-hot-toast
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 2 — Database first
Build the complete Prisma schema from ARCHITECTURE.md Section 3.
Run: `npx prisma migrate dev --name init`

### Step 3 — Backend foundation
- server.js entry point with middleware (cors, helmet, express.json, rate limiting)
- Error handling middleware
- Authentication middleware (JWT verification)

### Step 4 — Authentication
- POST /v1/auth/request-otp
- POST /v1/auth/verify-otp
- GET /v1/auth/me
- OTP sent via Africa's Talking SMS

### Step 5 — Fundraiser CRUD
- All endpoints from ARCHITECTURE.md Section 4.3

### Step 6 — Daraja Integration
- C2B webhook registration against organizer's Paybill/Till
- Incoming payment webhook handler
- STK Push for subscription payments
- See ARCHITECTURE.md Section 5.1

### Step 7 — Smart Matching Engine
- Phone number matching algorithm
- See ARCHITECTURE.md Section 5.2 for full algorithm

### Step 8 — Contributor Registration
- Public endpoint POST /v1/register/:token
- Mobile-optimized registration page matches ui-designs/contributor-registration.html

### Step 9 — WhatsApp Bot
- Africa's Talking WhatsApp Business API
- Auto group updates on payment confirmation
- Registration confirmations
- Status check replies
- See ARCHITECTURE.md Section 5.3

### Step 10 — Transaction Management
- List transactions
- Manual match endpoint
- Unmatched alerts

### Step 11 — Reminder Jobs
- node-cron scheduled reminders
- See ARCHITECTURE.md Section 5.4

### Step 12 — Export
- PDF export via PDFKit
- Excel export via ExcelJS

### Step 13 — Subscription Payments
- Plan management
- STK Push for subscription collection
- Access control enforcement

### Step 14 — React Frontend Dashboard
Build each page to match the designs in ui-designs/ folder exactly:
- Login page → ui-designs/login-page.html
- Sign up page → ui-designs/signup-page.html
- Dashboard home → ui-designs/dashboard-home.html
- Create fundraiser → ui-designs/create-fundraiser.html
- Fundraiser detail → ui-designs/fundraiser-detail.html
- Unmatched resolve → ui-designs/unmatched-resolve.html
- Export screen → ui-designs/export-screen.html
- Settings → ui-designs/settings-subscription.html

### Step 15 — Connect frontend to backend
Wire all API calls, authentication, real-time polling.

### Step 16 — End to end testing
Test full flow on Daraja sandbox.

## Design System — apply consistently across all frontend pages

```
Primary color:     #00A651  (Pochi Green)
Dark color:        #1A1A2E  (Navy — headers, sidebar)
Surface:           #F7F8FA  (Page background)
Text primary:      #1A1A2E
Text secondary:    #4B5563
Text tertiary:     #9CA3AF
Border:            #E5E7EB
Error:             #E53935
Warning:           #F59E0B
Font:              System sans-serif stack
Border radius:     8px buttons, 12px cards, 20px badges
```

## Environment Variables Required

```
# backend/.env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/pochi_db
JWT_SECRET=your_secret_here
JWT_EXPIRES_IN=7d
DARAJA_ENV=sandbox
DARAJA_CONSUMER_KEY=
DARAJA_CONSUMER_SECRET=
DARAJA_PASSKEY=
DARAJA_SHORTCODE=
DARAJA_CALLBACK_URL=https://yourdomain/v1/webhooks/daraja/c2b
AT_API_KEY=
AT_USERNAME=
AT_WHATSAPP_NUMBER=
AT_SENDER_ID=POCHI
WEBHOOK_SECRET=

# frontend/.env
VITE_API_URL=http://localhost:5000/v1
VITE_APP_NAME=Pochi
```

## Key Business Rules to enforce in code

1. Money NEVER touches Pochi — organizer keeps their own Paybill/Till
2. Phone number is the universal identity bridge between M-Pesa and WhatsApp
3. Free Spark plan limits: 1 fundraiser, 20 contributors, KES 30k target cap
4. Matching engine runs on every incoming Daraja webhook
5. Every matched payment triggers a WhatsApp group update automatically
6. Unmatched payments are flagged immediately — organizer notified
7. All monetary amounts stored as integers in KES (no decimals)
8. All phone numbers stored normalized as 2547XXXXXXXXX format
9. Daraja webhook payloads stored raw for audit trail
10. OTP codes expire after 10 minutes, max 3 attempts then 15 min lockout

## Testing Checklist before deployment

- [ ] OTP login works on real Kenyan phone number
- [ ] Fundraiser creation saves to database correctly
- [ ] Daraja sandbox webhook fires and is received
- [ ] Matching engine identifies contributor by phone number
- [ ] Unmatched transaction appears in dashboard
- [ ] Manual match updates contributor paid_amount
- [ ] WhatsApp bot posts to test group on payment
- [ ] PDF and Excel export download correctly
- [ ] Subscription STK push fires and plan updates
- [ ] Free tier limits are enforced correctly
