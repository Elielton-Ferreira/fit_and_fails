-- Add indexes to speed up feed queries
CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post"("createdAt");
CREATE INDEX IF NOT EXISTS "Like_postId_idx" ON "Like"("postId");
