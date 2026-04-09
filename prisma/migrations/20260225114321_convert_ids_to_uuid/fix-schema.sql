-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "roleId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "locationId" TEXT;

-- CreateTable
CREATE TABLE "Roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminPermissions" (
    "id" TEXT NOT NULL,
    "adminProfileId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "AdminPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_studentId_key" ON "Users"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Roles_name_key" ON "Roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_name_key" ON "Permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermissions_roleId_permissionId_key" ON "RolePermissions"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPermissions_adminProfileId_permissionId_key" ON "AdminPermissions"("adminProfileId", "permissionId");

-- Insert default roles
INSERT INTO "Roles" ("id", "name", "description") VALUES
('role-student', 'STUDENT', 'Student role'),
('role-admin', 'ADMIN', 'Admin role'),
('role-superadmin', 'SUPERADMIN', 'Superadmin role');

-- Insert default permissions
INSERT INTO "Permissions" ("id", "name", "module") VALUES
('perm-create-user', 'CREATE_USER', 'USER_MANAGEMENT'),
('perm-read-user', 'READ_USER', 'USER_MANAGEMENT'),
('perm-update-user', 'UPDATE_USER', 'USER_MANAGEMENT'),
('perm-delete-user', 'DELETE_USER', 'USER_MANAGEMENT'),
('perm-create-content', 'CREATE_CONTENT', 'CONTENT_MANAGEMENT'),
('perm-read-content', 'READ_CONTENT', 'CONTENT_MANAGEMENT'),
('perm-update-content', 'UPDATE_CONTENT', 'CONTENT_MANAGEMENT'),
('perm-delete-content', 'DELETE_CONTENT', 'CONTENT_MANAGEMENT'),
('perm-view-analytics', 'VIEW_ANALYTICS', 'ANALYTICS'),
('perm-manage-system', 'MANAGE_SYSTEM', 'SYSTEM_ADMIN');

-- Assign permissions to roles
INSERT INTO "RolePermissions" ("id", "roleId", "permissionId") VALUES
('rp-student-1', 'role-student', 'perm-read-content'),
('rp-admin-1', 'role-admin', 'perm-create-user'),
('rp-admin-2', 'role-admin', 'perm-read-user'),
('rp-admin-3', 'role-admin', 'perm-update-user'),
('rp-admin-4', 'role-admin', 'perm-create-content'),
('rp-admin-5', 'role-admin', 'perm-read-content'),
('rp-admin-6', 'role-admin', 'perm-update-content'),
('rp-admin-7', 'role-admin', 'perm-view-analytics'),
('rp-superadmin-1', 'role-superadmin', 'perm-create-user'),
('rp-superadmin-2', 'role-superadmin', 'perm-read-user'),
('rp-superadmin-3', 'role-superadmin', 'perm-update-user'),
('rp-superadmin-4', 'role-superadmin', 'perm-delete-user'),
('rp-superadmin-5', 'role-superadmin', 'perm-create-content'),
('rp-superadmin-6', 'role-superadmin', 'perm-read-content'),
('rp-superadmin-7', 'role-superadmin', 'perm-update-content'),
('rp-superadmin-8', 'role-superadmin', 'perm-delete-content'),
('rp-superadmin-9', 'role-superadmin', 'perm-view-analytics'),
('rp-superadmin-10', 'role-superadmin', 'perm-manage-system');

-- Update existing users to have default role
UPDATE "Users" SET "roleId" = 'role-student' WHERE "roleId" IS NULL;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Users" ADD CONSTRAINT "Users_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "SchoolLocations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermissions" ADD CONSTRAINT "RolePermissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPermissions" ADD CONSTRAINT "AdminPermissions_adminProfileId_fkey" FOREIGN KEY ("adminProfileId") REFERENCES "AdminProfiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminPermissions" ADD CONSTRAINT "AdminPermissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
