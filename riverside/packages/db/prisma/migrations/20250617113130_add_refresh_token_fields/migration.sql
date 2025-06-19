-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "device_fingerprint" TEXT,
ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "token_family" TEXT;

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");
