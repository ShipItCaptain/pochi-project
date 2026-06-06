-- CreateTable
CREATE TABLE "StkPushRequest" (
    "id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "plan_id" VARCHAR(30) NOT NULL,
    "checkout_request_id" VARCHAR(100) NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StkPushRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StkPushRequest_checkout_request_id_key" ON "StkPushRequest"("checkout_request_id");
