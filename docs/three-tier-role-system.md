# Three-Tier Role System Implementation

## 🏗️ Role Hierarchy

### 1. **Superadmin** 
- **Permissions**: Full system access across all organizations
- **Can Create**: School Superadmins and regular Admins
- **Scope**: Global - manages all schools and locations
- **Use Case**: Platform administrator

### 2. **School Superadmin** (Primary Admin)
- **Permissions**: Full control within their assigned school
- **Can Create**: Location-specific Admins for their school
- **Scope**: School-wide - manages all locations within their school
- **Use Case**: School principal/director

### 3. **Admin** (Location-specific)
- **Permissions**: Limited to assigned locations only
- **Can Create**: Students, content within their locations
- **Scope**: Location-specific - only sees their assigned locations
- **Use Case**: Branch manager, location coordinator

## 📊 Permission Matrix

| Feature | Superadmin | School Superadmin | Admin |
|---------|------------|-------------------|-------|
| Create Schools | ✅ | ❌ | ❌ |
| Create Locations | ✅ | ✅ | ❌ |
| Create School Superadmins | ✅ | ❌ | ❌ |
| Create Location Admins | ✅ | ✅ | ❌ |
| Manage All Schools | ✅ | ❌ | ❌ |
| Manage Own School | ❌ | ✅ | ❌ |
| Manage Own Locations | ❌ | ✅ | ✅ |
| View All Data | ✅ | School only | Location only |

## 🔄 Implementation Details

### Database Changes
```sql
-- Added SCHOOL_SUPERADMIN role to Roles table
INSERT INTO "Roles" (id, name, description) 
VALUES (gen_random_uuid(), 'SCHOOL_SUPERADMIN', 'Primary administrator for a school with control over all locations');
```

### Permission Configuration
```typescript
// Added to ROLE_PERMISSIONS in src/config/permission.ts
SCHOOL_SUPERADMIN: [
  "dashboard.view",
  "activity.view",
  "organizations.view",
  "organizations.update",
  "users.view",
  "users.create", 
  "users.update",
  // ... other permissions for school management
]
```

### API Updates
- **UserService.createAdmin()**: Now supports `role` parameter
- **Permission Middleware**: Handles both ADMIN and SCHOOL_SUPERADMIN roles
- **Location APIs**: Enforce location-specific access for regular admins

### UI Enhancements
- **AddOrganizationModal**: Role selection dropdown
- **Admin Management**: Role-based filtering and permissions
- **Location Assignment**: Only School Superadmins can assign location admins

## 🎯 Usage Examples

### Superadmin creates School Superadmin
```bash
POST /api/admin/admins
{
  "email": "principal@school.edu",
  "firstName": "John",
  "lastName": "Doe", 
  "role": "SCHOOL_SUPERADMIN",
  "schoolId": "school-uuid",
  "isPrimaryAdmin": true
}
```

### School Superadmin creates Location Admin
```bash
POST /api/admin/admins
{
  "email": "manager@branch.edu",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "ADMIN", 
  "schoolId": "school-uuid",
  "locationId": "location-uuid"
}
```

### Permission Enforcement
```typescript
// Middleware automatically enforces:
if (user.role.name === "SCHOOL_SUPERADMIN") {
  // Can manage all locations in their school
  ctx.userSchoolId = userSchoolId;
  ctx.isPrimaryAdmin = true;
}

if (user.role.name === "ADMIN") {
  // Can only manage assigned locations
  ctx.accessibleLocationIds = assignedLocations;
}
```

## 🔐 Security Features

1. **Role-based Access Control**: Each role has predefined permissions
2. **Location Scoping**: Regular admins only access assigned locations
3. **School Isolation**: School Superadmins only access their own school
4. **Permission Middleware**: Automatic enforcement at API level

## 🚀 Next Steps

1. **Test Role Creation**: Verify all three roles can be created properly
2. **Test Permission Scoping**: Ensure access control works correctly
3. **Update Admin Management UI**: Add role filtering and management
4. **Create Role Assignment Interface**: For superadmins to manage roles
5. **Add Audit Logging**: Track role changes and assignments

## 📋 Testing Checklist

- [ ] Superadmin can create School Superadmin
- [ ] School Superadmin can create Location Admins  
- [ ] Location Admins cannot access other locations
- [ ] School Superadmins cannot access other schools
- [ ] Permission middleware enforces all rules
- [ ] UI shows appropriate options based on user role
