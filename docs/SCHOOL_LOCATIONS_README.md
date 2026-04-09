# School Locations System

## Overview

The School Locations system enables schools to manage multiple branches, campuses, or locations within a single school entity. This provides a scalable structure for educational institutions with multiple physical locations while maintaining centralized school management.

## Features

### 🏫 Multi-Location Support
- Schools can have unlimited locations/branches
- Each location has complete address information
- Main/head office designation capability
- Optional notes for additional location details

### 👥 Location-Specific Management
- Users can be assigned to specific locations
- Classes can be associated with specific locations
- Clear separation of data by location
- Comprehensive location statistics

### 🛠️ Administrative Interface
- Intuitive admin panel for location management
- Real-time search and filtering
- Bulk operations support
- Detailed location views with users and classes

## Database Schema

### Models

#### SchoolLocation
```prisma
model SchoolLocation {
  id          String   @id @default(uuid())
  schoolId    String
  name        String   // Branch/campus name, e.g., "Hyderabad", "Secunderabad", "Bangalore"
  address     String?
  city        String?
  state       String?
  country     String?
  postalCode  String?
  notes       String?  // Optional notes related to the branch
  isMain      Boolean  @default(false) // Mark main/head office location
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  classes     Class[]  // Classes can be associated with specific locations
  users       User[]   // Users can be associated with specific locations

  @@map("SchoolLocations")
}
```

#### Updated Models
- **School**: Removed `address` field, added `locations` relation
- **User**: Added optional `locationId` field and relation
- **Class**: Added optional `locationId` field and relation

## API Endpoints

### Location Management

#### GET /api/admin/schools/locations
Retrieve all locations for a specific school
- **Query Params**: `schoolId` (required)
- **Response**: Array of SchoolLocation objects

#### POST /api/admin/schools/locations
Create a new school location
- **Body**: Location creation data
- **Response**: Created SchoolLocation object

#### GET /api/admin/schools/locations/[locationId]
Get a specific location by ID
- **Params**: `locationId`
- **Response**: SchoolLocation object

#### PUT /api/admin/schools/locations/[locationId]
Update a specific location
- **Params**: `locationId`
- **Body**: Location update data
- **Response**: Updated SchoolLocation object

#### DELETE /api/admin/schools/locations/[locationId]
Delete a specific location
- **Params**: `locationId`
- **Response**: Success message
- **Restrictions**: Cannot delete locations with users or classes, cannot delete main location

### School with Locations

#### GET /api/admin/schools/with-locations
Retrieve all schools with their associated locations
- **Response**: Array of School objects with nested locations

#### GET /api/admin/schools/locations/[locationId]/details
Get detailed information about a location including users and classes
- **Params**: `locationId`
- **Response**: Location object with users and classes arrays

## Frontend Components

### SchoolLocationsSection
Main component for managing school locations

**Features:**
- School selector with location counts
- Location listing with search and filtering
- Add/Edit/Delete location operations
- Location details modal with users and classes
- Main location indicators

**Props:** None (self-contained)

**Usage:**
```tsx
import SchoolLocationsSection from '@/src/components/admin/sections/SchoolLocationsSection';

export default function LocationsPage() {
  return (
    <div>
      <SchoolLocationsSection />
    </div>
  );
}
```

### Updated Components

#### OrganizationsSection
- Added "Locations" column to schools table
- Added "Locations" button for each school
- Shows location count badges

#### AddOrganizationModal
- Enhanced to create initial location with school
- Optional location creation during school setup
- Main location designation option

## Business Rules

### Location Management
- ✅ Schools can have unlimited locations
- ✅ Each location must have a name
- ✅ Only one location can be marked as main per school
- ✅ Locations can have optional address information
- ✅ Main location cannot be deleted without assigning a new main

### Data Integrity
- ✅ Users can only be assigned to locations within their school
- ✅ Classes can only be assigned to locations within their school
- ✅ Location deletion is prevented if users or classes are assigned
- ✅ Cascade deletion maintains referential integrity

### Access Control
- ✅ Location management requires appropriate permissions
- ✅ School-level data isolation
- ✅ Role-based access to location features

## Usage Examples

### Creating a School with Multiple Locations

```javascript
// 1. Create the school
const school = await fetch('/api/admin/schools', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Gyanville Academy',
    phone: '+91-1234567890',
    email: 'info@gyanville.com'
  })
});

// 2. Create locations
const hyderabad = await fetch('/api/admin/schools/locations', {
  method: 'POST',
  body: JSON.stringify({
    schoolId: school.id,
    name: 'Hyderabad',
    address: '123 Jubilee Hills',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    postalCode: '500033',
    isMain: true
  })
});

const bangalore = await fetch('/api/admin/schools/locations', {
  method: 'POST',
  body: JSON.stringify({
    schoolId: school.id,
    name: 'Bangalore',
    address: '456 MG Road',
    city: 'Bangalore',
    state: 'Karnataka',
    country: 'India',
    postalCode: '560001'
  })
});
```

### Managing Location Assignments

```javascript
// Assign user to location
await fetch(`/api/admin/schools/locations/${locationId}/users`, {
  method: 'POST',
  body: JSON.stringify({ userId: 'user123' })
});

// Assign class to location
await fetch(`/api/admin/schools/locations/${locationId}/classes`, {
  method: 'POST',
  body: JSON.stringify({ classId: 'class456' })
});
```

## Data Structure Examples

### School with Locations
```json
{
  "id": "school-123",
  "name": "Gyanville Academy",
  "phone": "+91-1234567890",
  "email": "info@gyanville.com",
  "locations": [
    {
      "id": "loc-123",
      "schoolId": "school-123",
      "name": "Hyderabad",
      "address": "123 Jubilee Hills",
      "city": "Hyderabad",
      "state": "Telangana",
      "country": "India",
      "postalCode": "500033",
      "isMain": true,
      "_count": {
        "users": 150,
        "classes": 8
      }
    },
    {
      "id": "loc-456",
      "schoolId": "school-123",
      "name": "Bangalore",
      "address": "456 MG Road",
      "city": "Bangalore",
      "state": "Karnataka",
      "country": "India",
      "postalCode": "560001",
      "isMain": false,
      "_count": {
        "users": 120,
        "classes": 6
      }
    }
  ],
  "_count": {
    "locations": 2,
    "users": 270,
    "classes": 14
  }
}
```

## Migration Guide

### For Existing Schools
1. **Database Migration**: Run `npx prisma db push` to apply schema changes
2. **Data Migration**: Existing school addresses are preserved (manual migration may be needed)
3. **UI Updates**: Use new location management interface
4. **API Updates**: Update any code that directly accessed school addresses

### For New Development
1. **Use Location APIs**: Prefer location-specific endpoints over school-level address data
2. **Consider Location Context**: Always consider location when working with users and classes
3. **UI Integration**: Use SchoolLocationsSection component for location management

## File Structure

```
src/
├── components/admin/sections/
│   └── SchoolLocationsSection.tsx          # Main location management component
├── components/admin/modals/
│   └── AddOrganizationModal.tsx           # Updated to support initial location
├── services/
│   └── school-location.service.ts         # Location business logic
└── app/api/admin/schools/locations/
    ├── route.ts                          # GET/POST locations
    ├── [locationId]/route.ts              # GET/PUT/DELETE location
    └── [locationId]/details/route.ts      # Location details with users/classes
```

## Testing

### Database Testing
```bash
# Apply schema changes
npx prisma db push

# Generate client
npx prisma generate
```

### API Testing
Test endpoints using the provided examples or use API testing tools like Postman.

### Frontend Testing
1. Navigate to `/admin/locations`
2. Select a school from the dropdown
3. Test creating, editing, and deleting locations
4. Verify location details and statistics
5. Test search and filtering functionality

## Troubleshooting

### Common Issues

#### Location Not Found
- Verify the location ID is correct
- Check if the location belongs to the correct school
- Ensure proper permissions

#### Cannot Delete Location
- Check if location has assigned users or classes
- Verify it's not the main location
- Reassign users/classes before deletion

#### API Errors
- Check network connectivity
- Verify authentication and permissions
- Review error messages for specific issues

### Performance Considerations
- Use pagination for schools with many locations
- Implement caching for frequently accessed location data
- Optimize queries with proper indexing

## Future Enhancements

### Planned Features
- [ ] Location-based reporting and analytics
- [ ] Bulk user/class assignment to locations
- [ ] Location hierarchy support (regions → locations)
- [ ] Location-based permissions and access control
- [ ] Geographic mapping and visualization

### Scalability
- Database indexing optimization for location queries
- Caching strategies for location data
- API rate limiting for location operations

## Support

For questions or issues related to the School Locations system:
1. Check this documentation first
2. Review the API endpoints and error messages
3. Verify database schema and migrations
4. Contact the development team with specific error details

---

**Last Updated**: March 2025  
**Version**: 1.0.0  
**Compatibility**: Next.js 14+, Prisma 5+, PostgreSQL 14+
