import { Client, Pool } from 'pg'
import { config } from './config.js'
import { logError, logInfo } from './logger.js'

type Platform = 'android' | 'ios' | 'web'

type PostCreatedPayload = {
  post_id: string
  user_id: string
  type: string
  created_at?: string
}

type LikeCreatedPayload = {
  like_id: string
  post_id: string
  user_id: string
}

type CommentCreatedPayload = {
  comment_id: string
  post_id: string
  user_id: string
  created_at?: string
}

type DbListeners = {
  onPostCreated: (payload: PostCreatedPayload) => Promise<void>
  onLikeCreated: (payload: LikeCreatedPayload) => Promise<void>
  onCommentCreated: (payload: CommentCreatedPayload) => Promise<void>
}

export type PostSummary = {
  postId: string
  authorId: string
  authorName: string
  type: string
  text: string | null
}

export type LikeSummary = {
  likeId: string
  likerId: string
  likerName: string
  postId: string
  postOwnerId: string
  postOwnerName: string
  postType: string
}

export type CommentSummary = {
  commentId: string
  commentText: string
  commenterId: string
  commenterName: string
  postId: string
  postOwnerId: string
  postOwnerName: string
  postType: string
}

export type HydrationCandidate = {
  userId: string
  userName: string
  lastDrinkAt: Date | null
  stateLastDrinkAt: Date | null
  lastReminderLevel: number
}

export type DeviceToken = {
  token: string
  platform: Platform
}

const pool = new Pool({ connectionString: config.databaseUrl })

export const ensureSchema = async () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS notification_devices (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      device_id TEXT,
      platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
      app_version TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      last_seen_at TIMESTAMPTZ DEFAULT now()
    );

    ALTER TABLE notification_devices
      ADD COLUMN IF NOT EXISTS device_id TEXT;

    CREATE UNIQUE INDEX IF NOT EXISTS notification_devices_user_platform_device_unique
      ON notification_devices (user_id, platform, device_id);

    CREATE OR REPLACE FUNCTION notification_devices_touch_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS notification_devices_set_updated_at ON notification_devices;
    CREATE TRIGGER notification_devices_set_updated_at
    BEFORE UPDATE ON notification_devices
    FOR EACH ROW
    EXECUTE FUNCTION notification_devices_touch_updated_at();

    CREATE OR REPLACE FUNCTION notify_post_created()
    RETURNS trigger AS $$
    BEGIN
      PERFORM pg_notify('post_created', json_build_object(
        'post_id', NEW.id,
        'user_id', NEW."userId",
        'type', NEW.type,
        'created_at', NEW."createdAt"
      )::text);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS post_created_notify ON "Post";
    CREATE TRIGGER post_created_notify
    AFTER INSERT ON "Post"
    FOR EACH ROW
    EXECUTE FUNCTION notify_post_created();

    CREATE OR REPLACE FUNCTION notify_like_created()
    RETURNS trigger AS $$
    BEGIN
      PERFORM pg_notify('like_created', json_build_object(
        'like_id', NEW.id,
        'post_id', NEW."postId",
        'user_id', NEW."userId"
      )::text);
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

	    DROP TRIGGER IF EXISTS like_created_notify ON "Like";
	    CREATE TRIGGER like_created_notify
	    AFTER INSERT ON "Like"
	    FOR EACH ROW
	    EXECUTE FUNCTION notify_like_created();

	    CREATE OR REPLACE FUNCTION notify_comment_created()
	    RETURNS trigger AS $$
	    BEGIN
	      PERFORM pg_notify('comment_created', json_build_object(
	        'comment_id', NEW.id,
	        'post_id', NEW."postId",
	        'user_id', NEW."userId",
	        'created_at', NEW."createdAt"
	      )::text);
	      RETURN NEW;
	    END;
	    $$ LANGUAGE plpgsql;

	    DROP TRIGGER IF EXISTS comment_created_notify ON "Comment";
	    CREATE TRIGGER comment_created_notify
	    AFTER INSERT ON "Comment"
	    FOR EACH ROW
	    EXECUTE FUNCTION notify_comment_created();

    CREATE TABLE IF NOT EXISTS hydration_reminder_state (
      user_id TEXT PRIMARY KEY,
      last_drink_at TIMESTAMPTZ,
      last_reminder_level INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE OR REPLACE FUNCTION hydration_reminder_state_touch_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS hydration_reminder_state_set_updated_at ON hydration_reminder_state;
    CREATE TRIGGER hydration_reminder_state_set_updated_at
    BEFORE UPDATE ON hydration_reminder_state
    FOR EACH ROW
    EXECUTE FUNCTION hydration_reminder_state_touch_updated_at();
  `

  await pool.query(sql)
  logInfo('Ensured notification schema and triggers are in place')
}

export const upsertDevice = async (params: {
  userId: string
  token: string
  deviceId?: string
  platform: Platform
  appVersion?: string
}) => {
  const { userId, token, deviceId, platform, appVersion } = params

  if (deviceId) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      await client.query('DELETE FROM notification_devices WHERE token = $1', [token])

      await client.query(
        `INSERT INTO notification_devices (user_id, token, device_id, platform, app_version, last_seen_at)
         VALUES ($1, $2, $3, $4, $5, now())
         ON CONFLICT (user_id, platform, device_id)
         DO UPDATE SET token = EXCLUDED.token,
                       app_version = EXCLUDED.app_version,
                       last_seen_at = now(),
                       updated_at = now()`,
        [userId, token, deviceId, platform, appVersion ?? null]
      )

      await client.query(
        'DELETE FROM notification_devices WHERE user_id = $1 AND platform = $2 AND device_id IS NULL',
        [userId, platform]
      )

      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
    return
  }

  await pool.query(
    `INSERT INTO notification_devices (user_id, token, platform, app_version, last_seen_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (token)
     DO UPDATE SET user_id = EXCLUDED.user_id,
                   platform = EXCLUDED.platform,
                   app_version = EXCLUDED.app_version,
                   last_seen_at = now(),
                   updated_at = now()`,
    [userId, token, platform, appVersion ?? null]
  )
}

export const deleteTokens = async (tokens: string[]) => {
  if (!tokens.length) return
  await pool.query('DELETE FROM notification_devices WHERE token = ANY($1::text[])', [tokens])
}

export const getTokensForBroadcast = async (excludeUserId?: string) => {
  const devices = await getDevicesForBroadcast(excludeUserId)
  return devices.map((d) => d.token)
}

export const getTokensForUser = async (userId: string) => {
  const devices = await getDevicesForUser(userId)
  return devices.map((d) => d.token)
}

export const getDevicesForBroadcast = async (excludeUserId?: string): Promise<DeviceToken[]> => {
  const params: unknown[] = []
  let where = ''

  if (excludeUserId) {
    params.push(excludeUserId)
    where = 'WHERE user_id <> $1'
  }

  const { rows } = await pool.query<DeviceToken>(
    `
    WITH base AS (
      SELECT user_id, platform, token, device_id, last_seen_at, updated_at, created_at
      FROM notification_devices
      ${where}
    ),
    modern AS (
      SELECT token, platform FROM base WHERE device_id IS NOT NULL
    ),
    legacy AS (
      SELECT DISTINCT ON (user_id, platform) token, platform
      FROM base
      WHERE device_id IS NULL
      ORDER BY user_id, platform, last_seen_at DESC, updated_at DESC, created_at DESC
    )
    SELECT token, platform FROM modern
    UNION ALL
    SELECT token, platform FROM legacy
    `,
    params
  )

  return rows
}

export const getDevicesForUser = async (userId: string): Promise<DeviceToken[]> => {
  const { rows } = await pool.query<DeviceToken>(
    `
    SELECT token, platform FROM notification_devices
    WHERE user_id = $1 AND device_id IS NOT NULL
    UNION ALL
    SELECT token, platform FROM (
      SELECT DISTINCT ON (platform) token, platform
      FROM notification_devices
      WHERE user_id = $1 AND device_id IS NULL
      ORDER BY platform, last_seen_at DESC, updated_at DESC, created_at DESC
    ) legacy
    `,
    [userId]
  )

  return rows
}

export const fetchPostSummary = async (postId: string): Promise<PostSummary | null> => {
  const { rows } = await pool.query<PostSummary>(
    `SELECT p.id AS "postId",
            p."userId" AS "authorId",
            u.name AS "authorName",
            p.type,
            p.text
     FROM "Post" p
     INNER JOIN "User" u ON u.id = p."userId"
     WHERE p.id = $1`,
    [postId]
  )

  return rows[0] ?? null
}

export const fetchLikeSummary = async (likeId: string): Promise<LikeSummary | null> => {
  const { rows } = await pool.query<LikeSummary>(
    `SELECT l.id AS "likeId",
            l."userId" AS "likerId",
            liker.name AS "likerName",
            l."postId" AS "postId",
            p."userId" AS "postOwnerId",
            owner.name AS "postOwnerName",
            p.type AS "postType"
     FROM "Like" l
     INNER JOIN "User" liker ON liker.id = l."userId"
     INNER JOIN "Post" p ON p.id = l."postId"
     INNER JOIN "User" owner ON owner.id = p."userId"
     WHERE l.id = $1`,
    [likeId]
  )

  return rows[0] ?? null
}

export const fetchCommentSummary = async (commentId: string): Promise<CommentSummary | null> => {
  const { rows } = await pool.query<CommentSummary>(
    `SELECT c.id AS "commentId",
            c.text AS "commentText",
            c."userId" AS "commenterId",
            commenter.name AS "commenterName",
            c."postId" AS "postId",
            p."userId" AS "postOwnerId",
            owner.name AS "postOwnerName",
            p.type AS "postType"
     FROM "Comment" c
     INNER JOIN "User" commenter ON commenter.id = c."userId"
     INNER JOIN "Post" p ON p.id = c."postId"
     INNER JOIN "User" owner ON owner.id = p."userId"
     WHERE c.id = $1`,
    [commentId]
  )

  return rows[0] ?? null
}

export const startDbListeners = async (listeners: DbListeners) => {
  const client = new Client({ connectionString: config.databaseUrl })
  await client.connect()
  await client.query('LISTEN post_created')
  await client.query('LISTEN like_created')
  await client.query('LISTEN comment_created')
  logInfo('Listening for Post/Like/Comment events from Postgres')

  client.on('notification', async (msg) => {
    if (!msg.payload) return

    try {
      const payload = JSON.parse(msg.payload)
      if (msg.channel === 'post_created') {
        await listeners.onPostCreated(payload as PostCreatedPayload)
      }
      if (msg.channel === 'like_created') {
        await listeners.onLikeCreated(payload as LikeCreatedPayload)
      }
      if (msg.channel === 'comment_created') {
        await listeners.onCommentCreated(payload as CommentCreatedPayload)
      }
    } catch (err) {
      logError(`Failed to handle notification ${msg.channel}`, err)
    }
  })

  client.on('error', (err) => {
    logError('Postgres LISTEN connection error', err)
  })

  return client
}

export const getHydrationReminderCandidates = async (): Promise<HydrationCandidate[]> => {
  const { rows } = await pool.query<{
    userId: string
    userName: string
    lastDrinkAt: Date | null
    stateLastDrinkAt: Date | null
    lastReminderLevel: number
  }>(
    `
    WITH devices AS (
      SELECT DISTINCT user_id FROM notification_devices
    )
    SELECT u.id AS "userId",
           u.name AS "userName",
           MAX(w.date) FILTER (WHERE w.date >= date_trunc('day', now())) AS "lastDrinkAt",
           hrs.last_drink_at AS "stateLastDrinkAt",
           COALESCE(hrs.last_reminder_level, 0) AS "lastReminderLevel"
    FROM devices d
    INNER JOIN "User" u ON u.id = d.user_id
    LEFT JOIN "WaterLog" w ON w."userId" = u.id AND w.date >= date_trunc('day', now())
    LEFT JOIN hydration_reminder_state hrs ON hrs.user_id = u.id
    GROUP BY u.id, u.name, hrs.last_drink_at, hrs.last_reminder_level
    `
  )

  return rows.map((row) => ({
    userId: row.userId,
    userName: row.userName,
    lastDrinkAt: row.lastDrinkAt ? new Date(row.lastDrinkAt) : null,
    stateLastDrinkAt: row.stateLastDrinkAt ? new Date(row.stateLastDrinkAt) : null,
    lastReminderLevel: row.lastReminderLevel ?? 0
  }))
}

export const saveHydrationState = async (params: {
  userId: string
  lastDrinkAt: Date | null
  lastReminderLevel: number
}) => {
  const { userId, lastDrinkAt, lastReminderLevel } = params

  await pool.query(
    `
    INSERT INTO hydration_reminder_state (user_id, last_drink_at, last_reminder_level, updated_at)
    VALUES ($1, $2, $3, now())
    ON CONFLICT (user_id)
    DO UPDATE SET last_drink_at = EXCLUDED.last_drink_at,
                  last_reminder_level = EXCLUDED.last_reminder_level,
                  updated_at = now()
    `,
    [userId, lastDrinkAt, lastReminderLevel]
  )
}
