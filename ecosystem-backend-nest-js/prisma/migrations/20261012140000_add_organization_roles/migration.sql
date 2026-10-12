CREATE TYPE "OrganizationRole" AS ENUM ('ADMIN', 'MEMBER');

ALTER TABLE "person_organization_affiliation"
ADD COLUMN "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER';

-- Membership creation did not exist before this migration, so every existing
-- affiliation was created together with its organization by its creator.
UPDATE "person_organization_affiliation" SET "role" = 'ADMIN';
