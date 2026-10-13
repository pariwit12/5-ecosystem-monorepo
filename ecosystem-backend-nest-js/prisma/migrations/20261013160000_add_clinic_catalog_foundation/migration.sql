CREATE TABLE "dental_procedure" (
    "id" UUID NOT NULL,
    "organization_dental_clinic_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100),
    "default_price" DECIMAL(10,2),
    "min_price" DECIMAL(10,2),
    "max_price" DECIMAL(10,2),
    "default_dentist_fee_percent" DECIMAL(5,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "legacy_source" VARCHAR(100),
    "legacy_id" INTEGER,

    CONSTRAINT "dental_procedure_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dental_procedure_prices_nonnegative" CHECK (
      ("default_price" IS NULL OR "default_price" >= 0) AND
      ("min_price" IS NULL OR "min_price" >= 0) AND
      ("max_price" IS NULL OR "max_price" >= 0)
    ),
    CONSTRAINT "dental_procedure_price_range" CHECK (
      "min_price" IS NULL OR "max_price" IS NULL OR "min_price" <= "max_price"
    ),
    CONSTRAINT "dental_procedure_default_price_range" CHECK (
      ("default_price" IS NULL OR "min_price" IS NULL OR "default_price" >= "min_price") AND
      ("default_price" IS NULL OR "max_price" IS NULL OR "default_price" <= "max_price")
    ),
    CONSTRAINT "dental_procedure_default_fee_range" CHECK (
      "default_dentist_fee_percent" IS NULL OR
      ("default_dentist_fee_percent" >= 0 AND "default_dentist_fee_percent" <= 100)
    )
);

CREATE TABLE "clinic_payment_method" (
    "id" UUID NOT NULL,
    "organization_dental_clinic_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "legacy_source" VARCHAR(100),
    "legacy_id" INTEGER,

    CONSTRAINT "clinic_payment_method_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dentist_procedure_fee_rate" (
    "id" UUID NOT NULL,
    "organization_dental_clinic_id" UUID NOT NULL,
    "person_dentist_id" UUID NOT NULL,
    "dental_procedure_id" UUID NOT NULL,
    "fee_percent" DECIMAL(5,2) NOT NULL,
    "legacy_source" VARCHAR(100),
    "legacy_id" INTEGER,

    CONSTRAINT "dentist_procedure_fee_rate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dentist_procedure_fee_rate_percent_range" CHECK (
      "fee_percent" >= 0 AND "fee_percent" <= 100
    )
);

CREATE UNIQUE INDEX "dental_procedure_id_clinic_key"
ON "dental_procedure"("id", "organization_dental_clinic_id");
CREATE UNIQUE INDEX "dental_procedure_clinic_legacy_key"
ON "dental_procedure"("organization_dental_clinic_id", "legacy_source", "legacy_id");
CREATE INDEX "dental_procedure_clinic_active_idx"
ON "dental_procedure"("organization_dental_clinic_id", "active");
CREATE INDEX "dental_procedure_clinic_category_idx"
ON "dental_procedure"("organization_dental_clinic_id", "category");

CREATE UNIQUE INDEX "clinic_payment_method_clinic_name_key"
ON "clinic_payment_method"("organization_dental_clinic_id", "name");
CREATE UNIQUE INDEX "clinic_payment_method_clinic_legacy_key"
ON "clinic_payment_method"("organization_dental_clinic_id", "legacy_source", "legacy_id");
CREATE INDEX "clinic_payment_method_clinic_active_idx"
ON "clinic_payment_method"("organization_dental_clinic_id", "active");

CREATE UNIQUE INDEX "dentist_procedure_fee_rate_dentist_clinic_procedure_key"
ON "dentist_procedure_fee_rate"("person_dentist_id", "organization_dental_clinic_id", "dental_procedure_id");
CREATE UNIQUE INDEX "dentist_procedure_fee_rate_clinic_legacy_key"
ON "dentist_procedure_fee_rate"("organization_dental_clinic_id", "legacy_source", "legacy_id");
CREATE INDEX "dentist_procedure_fee_rate_procedure_clinic_idx"
ON "dentist_procedure_fee_rate"("dental_procedure_id", "organization_dental_clinic_id");
CREATE INDEX "dentist_procedure_fee_rate_clinic_idx"
ON "dentist_procedure_fee_rate"("organization_dental_clinic_id");

ALTER TABLE "dental_procedure"
ADD CONSTRAINT "dental_procedure_clinic_fkey"
FOREIGN KEY ("organization_dental_clinic_id")
REFERENCES "organization_dental_clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "clinic_payment_method"
ADD CONSTRAINT "clinic_payment_method_clinic_fkey"
FOREIGN KEY ("organization_dental_clinic_id")
REFERENCES "organization_dental_clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dentist_procedure_fee_rate"
ADD CONSTRAINT "dentist_procedure_fee_rate_dentist_affiliation_fkey"
FOREIGN KEY ("person_dentist_id", "organization_dental_clinic_id")
REFERENCES "person_dentist_affiliation"("person_dentist_id", "organization_dental_clinic_id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dentist_procedure_fee_rate"
ADD CONSTRAINT "dentist_procedure_fee_rate_procedure_fkey"
FOREIGN KEY ("dental_procedure_id", "organization_dental_clinic_id")
REFERENCES "dental_procedure"("id", "organization_dental_clinic_id")
ON DELETE RESTRICT ON UPDATE CASCADE;
