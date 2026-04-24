-- Clear lastActive for admins who have never logged in
-- This script updates admins who have no session records but have a lastActive value

UPDATE "Users" 
SET "lastActive" = NULL 
WHERE "id" IN (
    SELECT u."id" 
    FROM "Users" u
    INNER JOIN "Roles" r ON u."roleId" = r."id"
    LEFT JOIN "Session" s ON u."id" = s."userId"
    WHERE r."name" IN ('ADMIN', 'SCHOOL_SUPERADMIN', 'SUPERADMIN')
    AND s."id" IS NULL  -- No sessions exist
    AND u."lastActive" IS NOT NULL  -- But they have a lastActive value
);

-- Show what was updated
SELECT 
    u."firstName", 
    u."lastName", 
    u."email", 
    r."name" as "role",
    u."lastActive" as "lastActive_before_update",
    NULL as "lastActive_after_update"
FROM "Users" u
INNER JOIN "Roles" r ON u."roleId" = r."id"
LEFT JOIN "Session" s ON u."id" = s."userId"
WHERE r."name" IN ('ADMIN', 'SCHOOL_SUPERADMIN', 'SUPERADMIN')
AND s."id" IS NULL
AND u."lastActive" IS NULL;
