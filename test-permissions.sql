-- Quick test script to set initial permissions for an admin
-- This will help us verify the permission system works end-to-end

-- First, find an admin user ID from the database
-- Then manually insert some permissions for that admin
-- Test if the sidebar shows only those permissions

-- Connect to your database
-- Run: psql --dbname="psychology_buddy" --username="your_username" --password="your_password"

-- Find admin ID:
SELECT id, email, first_name, last_name FROM "users" WHERE role_id = (SELECT id FROM roles WHERE name = 'ADMIN') LIMIT 1;

-- Insert some permissions (replace 'admin_id_here' with actual ID):
INSERT INTO "adminPermissions" (adminProfileId, permissionId, createdAt, updatedAt)
SELECT 
  'admin_id_here' as adminProfileId,
  p.id as permissionId
FROM permissions p
WHERE p.name IN ('dashboard.view', 'activity.view', 'psycho.education.view', 'selfhelp.view', 'analytics.view', 'users.view', 'escalations.view', 'badges.view', 'settings.view')
AND p.id IN (
  SELECT id FROM permissions WHERE name = 'dashboard.view',
  SELECT id FROM permissions WHERE name = 'activity.view',
  SELECT id FROM permissions WHERE name = 'psycho.education.view',
  SELECT id FROM permissions WHERE name = 'selfhelp.view',
  SELECT id FROM permissions WHERE name = 'analytics.view',
  SELECT id FROM permissions WHERE name = 'users.view',
  SELECT id FROM permissions WHERE name = 'escalations.view',
  SELECT id FROM permissions WHERE name = 'badges.view',
  SELECT id FROM permissions WHERE name = 'settings.view'
);

-- Check the results:
SELECT * FROM adminPermissions WHERE adminProfileId = 'admin_id_here';

-- After running this, the admin should have these 7 permissions
-- Log out and log back in as that admin to test the sidebar
