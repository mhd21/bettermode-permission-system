-- CreateTable
CREATE TABLE "groups" (
    "creator_id" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("creator_id","id")
);

ALTER TABLE "groups" ADD CONSTRAINT "groups_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;


DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'create_distributed_table'
    ) THEN
        PERFORM create_distributed_table('groups', 'creator_id', colocate_with => 'users');
    END IF;
END $$;