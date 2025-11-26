-- Alter column type preserving existing enum values
ALTER TABLE "ExerciseSession"
  ALTER COLUMN "type" TYPE TEXT USING "type"::text;

-- Drop old enum after column is cast
DROP TYPE IF EXISTS "ExerciseType";
