
-- CreateEnum
CREATE TYPE "tweet_permission" AS ENUM ('can_view', 'can_edit');

-- CreateEnum
CREATE TYPE "tweet_permission_type" AS ENUM ('user', 'group');


-- CreateTable
CREATE TABLE "tweet_permissions" (
    "root_author_id" TEXT NOT NULL,
    "tweet_id" TEXT NOT NULL,
    "type" "tweet_permission_type" NOT NULL,
    "type_id" TEXT NOT NULL,
    "permission" "tweet_permission" NOT NULL,

    CONSTRAINT "tweet_permissions_pkey" PRIMARY KEY ("root_author_id","tweet_id","type","type_id","permission")
);


-- AddForeignKey
ALTER TABLE "tweet_permissions" ADD CONSTRAINT "tweet_permissions_tweet_id_root_author_id_fkey" FOREIGN KEY ("tweet_id", "root_author_id") REFERENCES "tweets"("id", "root_author_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'create_distributed_table'
    ) THEN
        PERFORM create_distributed_table('tweet_permissions', 'root_author_id');
    END IF;
END $$;