-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('spark', 'solo', 'group', 'enterprise');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'expired', 'trial');

-- CreateEnum
CREATE TYPE "FundraiserStatus" AS ENUM ('active', 'paused', 'closed');

-- CreateEnum
CREATE TYPE "PledgeStatus" AS ENUM ('unpledged', 'pledged', 'partial', 'complete', 'overpaid');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('auto_matched', 'manually_matched', 'unmatched');

-- CreateEnum
CREATE TYPE "MatchedBy" AS ENUM ('system', 'organizer');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('group_update', 'confirmation', 'reminder', 'registration');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('sent', 'delivered', 'failed');

-- CreateEnum
CREATE TYPE "SubscriptionPlanType" AS ENUM ('spark', 'solo_monthly', 'solo_quarterly', 'solo_biannual', 'solo_annual', 'group', 'enterprise');

-- CreateEnum
CREATE TYPE "SubscriptionRecordStatus" AS ENUM ('active', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "Organizer" (
    "id" TEXT NOT NULL,
    "phone_number" VARCHAR(15) NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150),
    "password_hash" VARCHAR(255) NOT NULL,
    "otp_code" VARCHAR(6),
    "otp_expires_at" TIMESTAMP(3),
    "otp_attempts" INTEGER NOT NULL DEFAULT 0,
    "otp_locked_until" TIMESTAMP(3),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "subscription_plan" "SubscriptionPlan" NOT NULL DEFAULT 'spark',
    "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'trial',
    "subscription_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fundraiser" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "target_amount" INTEGER NOT NULL,
    "total_pledged" INTEGER NOT NULL DEFAULT 0,
    "total_paid" INTEGER NOT NULL DEFAULT 0,
    "paybill_number" VARCHAR(20),
    "till_number" VARCHAR(20),
    "account_reference" VARCHAR(20) NOT NULL,
    "whatsapp_group_id" VARCHAR(100),
    "bot_phone_number" VARCHAR(15),
    "daraja_webhook_registered" BOOLEAN NOT NULL DEFAULT false,
    "registration_link_token" VARCHAR(50) NOT NULL,
    "status" "FundraiserStatus" NOT NULL DEFAULT 'active',
    "deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fundraiser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contributor" (
    "id" TEXT NOT NULL,
    "fundraiser_id" TEXT NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "phone_number" VARCHAR(15) NOT NULL,
    "whatsapp_name" VARCHAR(100),
    "pledge_amount" INTEGER NOT NULL DEFAULT 0,
    "paid_amount" INTEGER NOT NULL DEFAULT 0,
    "pledge_status" "PledgeStatus" NOT NULL DEFAULT 'unpledged',
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_payment_at" TIMESTAMP(3),
    "reminder_count" INTEGER NOT NULL DEFAULT 0,
    "last_reminder_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Contributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "fundraiser_id" TEXT NOT NULL,
    "contributor_id" TEXT,
    "mpesa_transaction_id" VARCHAR(20) NOT NULL,
    "mpesa_sender_name" VARCHAR(100) NOT NULL,
    "mpesa_sender_phone" VARCHAR(15) NOT NULL,
    "amount" INTEGER NOT NULL,
    "account_reference" VARCHAR(50),
    "match_status" "MatchStatus" NOT NULL DEFAULT 'unmatched',
    "matched_at" TIMESTAMP(3),
    "matched_by" "MatchedBy",
    "daraja_raw_payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappMessage" (
    "id" TEXT NOT NULL,
    "fundraiser_id" TEXT NOT NULL,
    "recipient" VARCHAR(15) NOT NULL,
    "message_type" "MessageType" NOT NULL,
    "message_body" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "at_message_id" VARCHAR(100),
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "plan" "SubscriptionPlanType" NOT NULL,
    "amount_paid" INTEGER NOT NULL,
    "duration_months" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "mpesa_transaction_id" VARCHAR(20) NOT NULL,
    "status" "SubscriptionRecordStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_phone_number_key" ON "Organizer"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Fundraiser_account_reference_key" ON "Fundraiser"("account_reference");

-- CreateIndex
CREATE UNIQUE INDEX "Fundraiser_registration_link_token_key" ON "Fundraiser"("registration_link_token");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_mpesa_transaction_id_key" ON "Transaction"("mpesa_transaction_id");

-- AddForeignKey
ALTER TABLE "Fundraiser" ADD CONSTRAINT "Fundraiser_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contributor" ADD CONSTRAINT "Contributor_fundraiser_id_fkey" FOREIGN KEY ("fundraiser_id") REFERENCES "Fundraiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fundraiser_id_fkey" FOREIGN KEY ("fundraiser_id") REFERENCES "Fundraiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_contributor_id_fkey" FOREIGN KEY ("contributor_id") REFERENCES "Contributor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappMessage" ADD CONSTRAINT "WhatsappMessage_fundraiser_id_fkey" FOREIGN KEY ("fundraiser_id") REFERENCES "Fundraiser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "Organizer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
