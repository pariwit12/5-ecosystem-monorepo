CREATE TABLE "user_account" (
    "id" UUID NOT NULL,
    "clerk_id" TEXT NOT NULL,
    CONSTRAINT "user_account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_account_clerk_id_key" ON "user_account"("clerk_id");

INSERT INTO "user_account" ("id", "clerk_id")
SELECT "id", "clerk_id" FROM "person" WHERE "clerk_id" IS NOT NULL;

ALTER TABLE "person" ADD COLUMN "user_account_id" UUID;
UPDATE "person" SET "user_account_id" = "id" WHERE "clerk_id" IS NOT NULL;

DROP INDEX IF EXISTS "person_clerk_id_key";
ALTER TABLE "person" DROP COLUMN "clerk_id";

CREATE UNIQUE INDEX "person_user_account_id_key" ON "person"("user_account_id");
ALTER TABLE "person" ADD CONSTRAINT "person_user_account_id_fkey"
FOREIGN KEY ("user_account_id") REFERENCES "user_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
