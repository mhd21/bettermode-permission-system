-- CreateEnum
CREATE TYPE "member_type" AS ENUM ('user', 'group');

-- CreateTable
CREATE TABLE "group_members" (
    "group_creator_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "member_type" "member_type" NOT NULL,
    "member_id" TEXT NOT NULL,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_creator_id","group_id","member_id","member_type")
);


-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_creator_id_group_id_fkey" FOREIGN KEY ("group_creator_id", "group_id") REFERENCES "groups"("creator_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'create_distributed_table'
    ) THEN
        PERFORM create_distributed_table('group_members', 'group_creator_id', colocate_with => 'users');
    END IF;
END $$;