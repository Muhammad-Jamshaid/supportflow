-- CreateTable
CREATE TABLE "plan_configs" (
    "plan" "Plan" NOT NULL,
    "maxSeats" INTEGER,
    "maxTickets" INTEGER,

    CONSTRAINT "plan_configs_pkey" PRIMARY KEY ("plan")
);

-- Seed Data
INSERT INTO "plan_configs" ("plan", "maxSeats", "maxTickets") VALUES
  ('FREE', 2, 100),
  ('PRO', 10, NULL),
  ('TEAM', NULL, NULL);
