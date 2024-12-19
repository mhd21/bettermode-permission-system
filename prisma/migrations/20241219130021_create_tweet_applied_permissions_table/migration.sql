
-- CreateTable
CREATE TABLE "tweet_applied_permissions" (
    "root_author_id" TEXT NOT NULL,
    "tweet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission" "tweet_permission" NOT NULL,

    CONSTRAINT "tweet_applied_permissions_pkey" PRIMARY KEY ("root_author_id","tweet_id","user_id","permission")
);

-- CreateIndex
CREATE INDEX "tweet_applied_permissions_permission_idx" ON "tweet_applied_permissions"("permission");


-- AddForeignKey
ALTER TABLE "tweet_applied_permissions" ADD CONSTRAINT "tweet_applied_permissions_root_author_id_tweet_id_fkey" FOREIGN KEY ("root_author_id", "tweet_id") REFERENCES "tweets"("root_author_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;





DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'create_distributed_table'
    ) THEN
        PERFORM create_distributed_table('tweet_applied_permissions', 'root_author_id');
    END IF;
END $$;