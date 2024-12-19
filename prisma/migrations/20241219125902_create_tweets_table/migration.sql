-- CreateEnum
CREATE TYPE "tweet_category" AS ENUM ('sport', 'finance', 'tech', 'news');


-- CreateTable
CREATE TABLE "tweets" (
    "root_author_id" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "hashtags" TEXT[],
    "parent_tweet_id" TEXT,
    "category" "tweet_category",
    "location" TEXT,
    "inherit_view_permissions" BOOLEAN NOT NULL DEFAULT true,
    "inherit_edit_permissions" BOOLEAN NOT NULL DEFAULT true,
    "is_public_view" BOOLEAN NOT NULL DEFAULT true,
    "is_public_edit" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tweets_pkey" PRIMARY KEY ("root_author_id","id")
);



-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "tweets_author_id_idx" ON "tweets"("author_id");

-- CreateIndex
CREATE INDEX "tweets_created_at_idx" ON "tweets"("created_at" DESC);

-- CreateIndex
CREATE INDEX "tweets_is_public_edit_idx" ON "tweets"("is_public_edit");

-- CreateIndex
CREATE INDEX "tweets_is_public_view_idx" ON "tweets"("is_public_view");


-- AddForeignKey
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_root_author_id_parent_tweet_id_fkey" FOREIGN KEY ("root_author_id", "parent_tweet_id") REFERENCES "tweets"("root_author_id", "id") ON DELETE NO ACTION ON UPDATE NO ACTION;



DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'create_distributed_table'
    ) THEN
        PERFORM create_distributed_table('tweets', 'root_author_id', colocate_with => 'users');
    END IF;
END $$;