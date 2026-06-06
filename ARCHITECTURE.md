# Pochi — Technical Architecture Document
**Version:** 1.0 — V1 Blueprint  
**Status:** Ready for Development  
**Market:** Kenya — East Africa  
**Build Tool:** Claude Code

---

## Section 1 — Product Overview

### 1.1 What is Pochi?
Pochi is a WhatsApp-native fundraising coordination platform built for the Kenyan market. It solves the bookkeeping nightmare that organizers face when managing group contributions — matching M-Pesa transaction names to real contributor identities, tracking pledges, and updating the WhatsApp group on progress.

Pochi is NOT a payment platform. Money flows directly between contributors and the organizer's own M-Pesa Paybill or Till. Pochi sits invisibly in the middle — listening to transactions, reconciling identities, and communicating results back to the WhatsApp group automatically.

### 1.2 The Core Problem
- Organizer creates a WhatsApp group for a harambee or fundraiser
- Contributors pledge and send money to the organizer's Paybill or Till
- M-Pesa SMS names do not match WhatsApp display names
- Organizer manually tracks everything in a notebook or Excel
- Progress updates are typed manually into the WhatsApp group
- Result: hours of frustrating, error-prone manual work

### 1.3 The Pochi Solution
- Organizer creates a fundraiser on Pochi in under 5 minutes
- Pochi connects to their Paybill/Till via Safaricom Daraja API
- Contributors register via a smart link shared in the WhatsApp group
- Every M-Pesa payment fires a webhook to Pochi in real time
- Pochi matches phone number to registered identity automatically
- Dashboard updates live — no manual entry
- WhatsApp bot posts automatic progress updates to the group
- Unmatched payments trigger a quick organizer prompt to resolve

### 1.4 Positioning
**Tagline:** Keep your Paybill. Keep your WhatsApp group. We make the bookkeeping automatic.

**vs OneKitty:** OneKitty routes money through their own system. Pochi never touches the money. Organizer keeps full control of their funds and their existing M-Pesa infrastructure.

**Core edge:** Pochi solves the identity mismatch problem — M-Pesa name vs WhatsApp name — which no competitor directly addresses. Phone number is the universal identity bridge.

---

## Section 2 — Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend Runtime | Node.js v20 LTS | Server, API, webhook handling |
| Backend Framework | Express.js v4 | REST API routing and middleware |
| Database | PostgreSQL v15 | Primary data store |
| ORM | Prisma v5 | Database schema and queries |
| WhatsApp API | Africa's Talking | WhatsApp Business API |
| M-Pesa API | Safaricom Daraja API | C2B webhooks and STK Push |
| Frontend | React v18 + Vite | Organizer dashboard |
| UI Components | TailwindCSS | Styling |
| Authentication | JWT + OTP via SMS | Phone-number based auth |
| File Export | PDFKit + ExcelJS | PDF and Excel reports |
| Hosting Backend | Railway.app | Node.js deployment |
| Hosting Frontend | Vercel | React deployment |
| Hosting Database | Railway.app PostgreSQL | Managed database |
| Version Control | GitHub | Source code |

### 2.1 Project Folder Structure
```
pochi/
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

---

## Section 3 — Database Schema

All tables use UUID primary keys. Timestamps use UTC. All monetary amounts stored in KES as integers (no decimals).

### Table: organizers
| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique organizer identifier |
| phone_number | VARCHAR(15) UNIQUE | Kenyan phone number — primary identity |
| full_name | VARCHAR(100) | Organizer full name |
| email | VARCHAR(150) NULLABLE | Optional email |
| password_hash | VARCHAR(255) | Hashed password |
| otp_code | VARCHAR(6) NULLABLE | Current OTP |
| otp_expires_at | TIMESTAMP NULLABLE | OTP expiry |
| is_verified | BOOLEAN DEFAULT false | Phone verified |
| subscription_plan | ENUM | spark, solo, group, enterprise |
| subscription_status | ENUM | active, expired, trial |
| subscription_expires_at | TIMESTAMP NULLABLE | Plan expiry |
| created_at | TIMESTAMP DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP DEFAULT NOW() | Last update |

### Table: fundraisers
| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique fundraiser identifier |
| organizer_id | UUID FK → organizers | Owner |
| title | VARCHAR(150) | Fundraiser name |
| description | TEXT NULLABLE | Optional description |
| target_amount | INTEGER | Target in KES |
| total_pledged | INTEGER DEFAULT 0 | Sum of pledges |
| total_paid | INTEGER DEFAULT 0 | Sum of confirmed payments |
| paybill_number | VARCHAR(20) NULLABLE | Organizer Paybill |
| till_number | VARCHAR(20) NULLABLE | Organizer Till |
| account_reference | VARCHAR(20) UNIQUE | Unique reference e.g. PCH-4X92 |
| whatsapp_group_id | VARCHAR(100) NULLABLE | Linked WhatsApp group |
| bot_phone_number | VARCHAR(15) NULLABLE | Bot number in group |
| daraja_webhook_registered | BOOLEAN DEFAULT false | Webhook active |
| registration_link_token | VARCHAR(50) UNIQUE | Token for reg link |
| status | ENUM | active, paused, closed |
| deadline | TIMESTAMP NULLABLE | Optional deadline |
| created_at | TIMESTAMP DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP DEFAULT NOW() | Last update |

### Table: contributors
| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique contributor record |
| fundraiser_id | UUID FK → fundraisers | Which fundraiser |
| full_name | VARCHAR(100) | Name as entered |
| phone_number | VARCHAR(15) | Phone — matches M-Pesa |
| whatsapp_name | VARCHAR(100) NULLABLE | WhatsApp display name |
| pledge_amount | INTEGER DEFAULT 0 | Promised amount |
| paid_amount | INTEGER DEFAULT 0 | Actually paid |
| pledge_status | ENUM | unpledged, pledged, partial, complete, overpaid |
| registered_at | TIMESTAMP DEFAULT NOW() | Registration time |
| last_payment_at | TIMESTAMP NULLABLE | Most recent payment |
| reminder_count | INTEGER DEFAULT 0 | Reminders sent |
| last_reminder_at | TIMESTAMP NULLABLE | Last reminder time |
| notes | TEXT NULLABLE | Organizer notes |

### Table: transactions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique transaction record |
| fundraiser_id | UUID FK → fundraisers | Which fundraiser |
| contributor_id | UUID FK NULLABLE | Matched contributor |
| mpesa_transaction_id | VARCHAR(20) UNIQUE | Safaricom transaction code |
| mpesa_sender_name | VARCHAR(100) | Name from M-Pesa |
| mpesa_sender_phone | VARCHAR(15) | Phone from Daraja webhook |
| amount | INTEGER | Amount in KES |
| account_reference | VARCHAR(50) NULLABLE | Reference used by sender |
| match_status | ENUM | auto_matched, manually_matched, unmatched |
| matched_at | TIMESTAMP NULLABLE | Match confirmation time |
| matched_by | ENUM NULLABLE | system, organizer |
| daraja_raw_payload | JSONB | Full raw webhook payload |
| received_at | TIMESTAMP DEFAULT NOW() | Webhook received time |

### Table: whatsapp_messages
| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique message record |
| fundraiser_id | UUID FK → fundraisers | Associated fundraiser |
| recipient | VARCHAR(15) | Phone or group ID |
| message_type | ENUM | group_update, confirmation, reminder, registration |
| message_body | TEXT | Message content |
| status | ENUM | sent, delivered, failed |
| at_message_id | VARCHAR(100) NULLABLE | Africa's Talking message ID |
| sent_at | TIMESTAMP DEFAULT NOW() | Send time |

### Table: subscriptions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Unique subscription record |
| organizer_id | UUID FK → organizers | Subscriber |
| plan | ENUM | spark, solo_monthly, solo_quarterly, solo_biannual, solo_annual, group, enterprise |
| amount_paid | INTEGER | KES paid |
| duration_months | INTEGER | Months covered |
| starts_at | TIMESTAMP | Start date |
| expires_at | TIMESTAMP | End date |
| mpesa_transaction_id | VARCHAR(20) | Payment reference |
| status | ENUM | active, expired, cancelled |
| created_at | TIMESTAMP DEFAULT NOW() | Record creation |

### Prisma Schema (complete)
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum SubscriptionPlan {
  spark
  solo
  group
  enterprise
}

enum SubscriptionStatus {
  active
  expired
  trial
}

enum FundraiserStatus {
  active
  paused
  closed
}

enum PledgeStatus {
  unpledged
  pledged
  partial
  complete
  overpaid
}

enum MatchStatus {
  auto_matched
  manually_matched
  unmatched
}

enum MatchedBy {
  system
  organizer
}

enum MessageType {
  group_update
  confirmation
  reminder
  registration
}

enum MessageStatus {
  sent
  delivered
  failed
}

enum SubscriptionPlanType {
  spark
  solo_monthly
  solo_quarterly
  solo_biannual
  solo_annual
  group
  enterprise
}

enum SubscriptionRecordStatus {
  active
  expired
  cancelled
}

model Organizer {
  id                     String             @id @default(uuid())
  phone_number           String             @unique @db.VarChar(15)
  full_name              String             @db.VarChar(100)
  email                  String?            @db.VarChar(150)
  password_hash          String             @db.VarChar(255)
  otp_code               String?            @db.VarChar(6)
  otp_expires_at         DateTime?
  is_verified            Boolean            @default(false)
  subscription_plan      SubscriptionPlan   @default(spark)
  subscription_status    SubscriptionStatus @default(trial)
  subscription_expires_at DateTime?
  created_at             DateTime           @default(now())
  updated_at             DateTime           @updatedAt
  fundraisers            Fundraiser[]
  subscriptions          Subscription[]
}

model Fundraiser {
  id                        String           @id @default(uuid())
  organizer_id              String
  organizer                 Organizer        @relation(fields: [organizer_id], references: [id])
  title                     String           @db.VarChar(150)
  description               String?
  target_amount             Int
  total_pledged             Int              @default(0)
  total_paid                Int              @default(0)
  paybill_number            String?          @db.VarChar(20)
  till_number               String?          @db.VarChar(20)
  account_reference         String           @unique @db.VarChar(20)
  whatsapp_group_id         String?          @db.VarChar(100)
  bot_phone_number          String?          @db.VarChar(15)
  daraja_webhook_registered Boolean          @default(false)
  registration_link_token   String           @unique @db.VarChar(50)
  status                    FundraiserStatus @default(active)
  deadline                  DateTime?
  created_at                DateTime         @default(now())
  updated_at                DateTime         @updatedAt
  contributors              Contributor[]
  transactions              Transaction[]
  whatsapp_messages         WhatsappMessage[]
}

model Contributor {
  id              String       @id @default(uuid())
  fundraiser_id   String
  fundraiser      Fundraiser   @relation(fields: [fundraiser_id], references: [id])
  full_name       String       @db.VarChar(100)
  phone_number    String       @db.VarChar(15)
  whatsapp_name   String?      @db.VarChar(100)
  pledge_amount   Int          @default(0)
  paid_amount     Int          @default(0)
  pledge_status   PledgeStatus @default(unpledged)
  registered_at   DateTime     @default(now())
  last_payment_at DateTime?
  reminder_count  Int          @default(0)
  last_reminder_at DateTime?
  notes           String?
  transactions    Transaction[]
}

model Transaction {
  id                   String      @id @default(uuid())
  fundraiser_id        String
  fundraiser           Fundraiser  @relation(fields: [fundraiser_id], references: [id])
  contributor_id       String?
  contributor          Contributor? @relation(fields: [contributor_id], references: [id])
  mpesa_transaction_id String      @unique @db.VarChar(20)
  mpesa_sender_name    String      @db.VarChar(100)
  mpesa_sender_phone   String      @db.VarChar(15)
  amount               Int
  account_reference    String?     @db.VarChar(50)
  match_status         MatchStatus @default(unmatched)
  matched_at           DateTime?
  matched_by           MatchedBy?
  daraja_raw_payload   Json
  received_at          DateTime    @default(now())
}

model WhatsappMessage {
  id            String        @id @default(uuid())
  fundraiser_id String
  fundraiser    Fundraiser    @relation(fields: [fundraiser_id], references: [id])
  recipient     String        @db.VarChar(15)
  message_type  MessageType
  message_body  String
  status        MessageStatus @default(sent)
  at_message_id String?       @db.VarChar(100)
  sent_at       DateTime      @default(now())
}

model Subscription {
  id                   String                   @id @default(uuid())
  organizer_id         String
  organizer            Organizer                @relation(fields: [organizer_id], references: [id])
  plan                 SubscriptionPlanType
  amount_paid          Int
  duration_months      Int
  starts_at            DateTime
  expires_at           DateTime
  mpesa_transaction_id String                   @db.VarChar(20)
  status               SubscriptionRecordStatus @default(active)
  created_at           DateTime                 @default(now())
}
```

---

## Section 4 — API Endpoints

**Base URL:** `https://api.pochi.co.ke/v1`  
All endpoints require `Authorization: Bearer <token>` unless marked PUBLIC.

### 4.1 Authentication
| Method + Endpoint | Auth | Description |
|------------------|------|-------------|
| POST /auth/request-otp | PUBLIC | Send OTP to phone |
| POST /auth/verify-otp | PUBLIC | Verify OTP — returns JWT |
| POST /auth/refresh | PUBLIC | Refresh JWT token |
| GET /auth/me | REQUIRED | Get organizer profile |
| PUT /auth/profile | REQUIRED | Update profile |

### 4.2 Fundraisers
| Method + Endpoint | Auth | Description |
|------------------|------|-------------|
| GET /fundraisers | REQUIRED | List all fundraisers |
| POST /fundraisers | REQUIRED | Create fundraiser |
| GET /fundraisers/:id | REQUIRED | Get single fundraiser |
| PUT /fundraisers/:id | REQUIRED | Update fundraiser |
| DELETE /fundraisers/:id | REQUIRED | Close/delete fundraiser |
| POST /fundraisers/:id/connect-daraja | REQUIRED | Register Daraja webhook |
| POST /fundraisers/:id/connect-whatsapp | REQUIRED | Link WhatsApp group |
| GET /fundraisers/:id/summary | REQUIRED | Live totals and progress |
| GET /fundraisers/:id/export/pdf | REQUIRED | Download PDF ledger |
| GET /fundraisers/:id/export/excel | REQUIRED | Download Excel ledger |

### 4.3 Contributors
| Method + Endpoint | Auth | Description |
|------------------|------|-------------|
| GET /fundraisers/:id/contributors | REQUIRED | List contributors |
| POST /register/:token | PUBLIC | Contributor self-registration |
| GET /fundraisers/:id/contributors/:cid | REQUIRED | Get contributor |
| PUT /fundraisers/:id/contributors/:cid | REQUIRED | Update contributor |
| DELETE /fundraisers/:id/contributors/:cid | REQUIRED | Remove contributor |
| GET /fundraisers/:id/contributors/unpaid | REQUIRED | List unpaid |
| POST /fundraisers/:id/contributors/:cid/remind | REQUIRED | Send reminder |

### 4.4 Transactions
| Method + Endpoint | Auth | Description |
|------------------|------|-------------|
| GET /fundraisers/:id/transactions | REQUIRED | List all transactions |
| GET /fundraisers/:id/transactions/unmatched | REQUIRED | List unmatched |
| POST /fundraisers/:id/transactions/:tid/match | REQUIRED | Manual match |
| GET /fundraisers/:id/transactions/:tid | REQUIRED | Single transaction |

### 4.5 Webhooks
| Method + Endpoint | Auth | Description |
|------------------|------|-------------|
| POST /webhooks/daraja/c2b | DARAJA SECRET | Receive M-Pesa payment |
| POST /webhooks/daraja/validation | DARAJA SECRET | Payment validation |
| POST /webhooks/whatsapp/incoming | AT SECRET | Incoming WhatsApp messages |

### 4.6 Subscriptions
| Method + Endpoint | Auth | Description |
|------------------|------|-------------|
| GET /subscriptions/plans | PUBLIC | List all plans |
| POST /subscriptions/initiate | REQUIRED | Initiate STK push |
| GET /subscriptions/status | REQUIRED | Current plan status |
| GET /subscriptions/history | REQUIRED | Payment history |

---

## Section 5 — Core Services and Business Logic

### 5.1 Daraja Service
**File:** `backend/src/services/daraja.service.js`

Responsibilities:
- Register C2B webhook URL against organizer's Paybill/Till shortcode
- Handle incoming C2B payment webhooks
- Initiate STK Push for subscription payments
- Validate Daraja webhook signatures
- Parse and normalize raw Daraja payloads

Environment variables required:
```
DARAJA_CONSUMER_KEY=
DARAJA_CONSUMER_SECRET=
DARAJA_PASSKEY=
DARAJA_SHORTCODE=
DARAJA_ENV=sandbox
DARAJA_CALLBACK_URL=https://api.pochi.co.ke/v1/webhooks/daraja/c2b
```

### 5.2 Smart Matching Engine
**File:** `backend/src/services/matching.service.js`

Algorithm — runs on every Daraja webhook in this order:

1. **Exact phone match:** Look up contributor by mpesa_sender_phone. If found → auto match. Confidence: HIGH
2. **Phone normalization:** Normalize 07XX to 2547XX and retry. If found → auto match. Confidence: HIGH
3. **Account reference match:** If sender used fundraiser reference → match by reference. Confidence: HIGH
4. **Name fuzzy match:** Run fuzzy string match between mpesa_sender_name and contributor full_name. Threshold: 80% similarity → flag for organizer confirmation. Confidence: MEDIUM
5. **No match:** Create unmatched transaction. Notify organizer immediately.

### 5.3 WhatsApp Bot Service
**File:** `backend/src/services/whatsapp.service.js`

Triggers and message templates:
```
Payment confirmed:
✅ {name} ameweka KES {amount}. Jumla: KES {total}/{target} ({pct}%)

Registration:
👋 Karibu {name}! Pledge yako ya KES {pledge} imeandikwa.
Tuma: Paybill {paybill} | Ref: {reference}

Reminder:
Habari {name}, bado una KES {balance} ya pledge yako.
Tuma sasa: Paybill {paybill} | Ref: {reference}

Status reply (contributor texts STATUS):
📊 {name}
Pledge: KES {pledge}
Paid: KES {paid}
Balance: KES {balance}

Total reply (organizer texts TOTAL):
📈 {fundraiser_title}
Raised: KES {total}
Target: KES {target}
Progress: {pct}%
Contributors: {count}
```

### 5.4 Reminder Job
**File:** `backend/src/jobs/reminders.job.js`

- Runs daily via node-cron
- Sends reminder if deadline within 48 hours and contributor has unpaid balance
- Maximum 2 automated reminders per contributor per fundraiser
- Partial payment contributors get reminder 3 days before deadline

---

## Section 6 — User Flows

### 6.1 Organizer Onboarding
1. Land on pochi.co.ke → Get Started
2. Enter phone → OTP sent → Verify OTP → JWT issued
3. Dashboard empty state → Create First Fundraiser
4. Fill title, target, deadline
5. Enter Paybill or Till number
6. Platform registers Daraja webhook
7. Add bot number to WhatsApp group
8. Share registration link in group
9. Dashboard goes live

### 6.2 Contributor Registration
1. Tap link in WhatsApp group
2. See fundraiser info and progress
3. Enter full name, phone number, pledge amount
4. Submit → contributor record created
5. Receive WhatsApp confirmation with Paybill and reference
6. Group bot announces new registration

### 6.3 Payment and Matching
1. Contributor sends M-Pesa to organizer's Paybill
2. Daraja webhook fires to POST /webhooks/daraja/c2b
3. Webhook validated
4. Transaction record created
5a. Match found → paid_amount updated → group update posted
5b. No match → flagged → organizer notified
6. Dashboard updates in real time

---

## Section 7 — Subscription Model

| Plan | Price | Limits |
|------|-------|--------|
| Spark — Free | KES 0 forever | 1 fundraiser, 20 contributors, KES 30k cap |
| Solo — 1 Month | KES 999/month | Unlimited fundraisers, unlimited contributors |
| Solo — 3 Months | KES 899/month | Save 10% — billed KES 2,697 |
| Solo — 6 Months | KES 799/month | Save 20% — billed KES 4,794 |
| Solo — Annual | KES 699/month | Save 30% — billed KES 8,388 |
| Group — Chama/SACCO | KES 2,500/month | 5 admins, recurring contributions |
| Group — Church | KES 4,000/month | 10 admins, branded bot |
| Events — One-time | KES 1,500 flat | Single event, no monthly billing |
| Enterprise | KES 25,000–50,000/year | Custom, dedicated support |

### Plan Enforcement
- Spark: block fundraiser creation if already has 1 active
- Spark: block contributor registration beyond 20
- Spark: show upgrade prompt when target approaches KES 30,000
- Expired paid plan: downgrade to Spark limits, preserve all data
- Renewal discount: 5% off each renewal, stacks to 20% max

---

## Section 8 — Security Requirements

- OTP codes expire after 10 minutes
- Max 3 OTP attempts → 15 minute lockout
- JWT tokens expire after 7 days
- All Daraja webhooks validated using Safaricom signature
- Webhook endpoint rate limited — max 100 requests/minute
- Duplicate transaction IDs rejected — idempotent processing
- Passwords hashed using bcrypt salt rounds 12
- Phone numbers normalized to 2547XXXXXXXXX
- No plaintext sensitive data in logs
- Environment variables never committed to Git
- Database SSL in production
- Rate limiting on all public endpoints — 20 req/min per IP
- CORS configured to Pochi frontend domain only
- Helmet.js for HTTP security headers
- Input validation using Joi on all endpoints
- SQL injection prevention via Prisma parameterized queries

---

## Section 9 — Environment Variables

### backend/.env
```
NODE_ENV=development
PORT=5000
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://user:password@localhost:5432/pochi_db
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
DARAJA_ENV=sandbox
DARAJA_CONSUMER_KEY=
DARAJA_CONSUMER_SECRET=
DARAJA_PASSKEY=
DARAJA_SHORTCODE=
DARAJA_CALLBACK_URL=https://yourdomain/v1/webhooks/daraja/c2b
DARAJA_VALIDATION_URL=https://yourdomain/v1/webhooks/daraja/validation
AT_API_KEY=
AT_USERNAME=
AT_WHATSAPP_NUMBER=
AT_SENDER_ID=POCHI
WEBHOOK_SECRET=daraja_webhook_signature_secret
ENCRYPTION_KEY=32_char_encryption_key_here
```

### frontend/.env
```
VITE_API_URL=http://localhost:5000/v1
VITE_APP_NAME=Pochi
```

---

## Section 10 — Deployment

| Service | Platform |
|---------|----------|
| Backend API | Railway.app — Node.js service |
| PostgreSQL | Railway.app — PostgreSQL plugin |
| Frontend | Vercel — React static deployment |
| Domain | pochi.co.ke |
| SSL | Automatic via Railway and Vercel |

### Go-Live Checklist
- [ ] Business registered in Kenya
- [ ] Daraja API Go-Live approval from Safaricom
- [ ] Africa's Talking WhatsApp Business API Meta approval
- [ ] ODPC data controller registration
- [ ] Domain registered and DNS configured
- [ ] SSL certificates active
- [ ] Environment variables set in Railway production
- [ ] Database migrations run on production
- [ ] 10 beta organizers onboarded and tested
