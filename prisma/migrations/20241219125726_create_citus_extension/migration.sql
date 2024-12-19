DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_available_extensions
        WHERE name = 'citus'
    ) THEN
        CREATE EXTENSION IF NOT EXISTS citus;
    ELSE
        RAISE NOTICE 'Citus extension is not available.';
    END IF;
END $$;