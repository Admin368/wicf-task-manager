-- AlterTable
ALTER TABLE "check_ins" ADD COLUMN     "checkout_at" TIMESTAMPTZ(6),
ADD COLUMN     "rating" SMALLINT;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "is_cloneable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_private" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "team_bans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "team_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "banned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_bans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_team_bans_team" ON "team_bans"("team_id");

-- CreateIndex
CREATE INDEX "idx_team_bans_user" ON "team_bans"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_bans_team_id_user_id_key" ON "team_bans"("team_id", "user_id");

-- CreateIndex
CREATE INDEX "idx_assignments_task" ON "task_assignments"("task_id");

-- CreateIndex
CREATE INDEX "idx_assignments_user" ON "task_assignments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_assignments_task_id_user_id_key" ON "task_assignments"("task_id", "user_id");

-- AddForeignKey
ALTER TABLE "team_bans" ADD CONSTRAINT "team_bans_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "team_bans" ADD CONSTRAINT "team_bans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
