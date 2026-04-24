export interface Role {
  id: string;
  name: string;
  rolePermissions?: {
    permission: {
      name: string;
    };
  }[];
}

export interface Admin {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: Role;
  school?: {
    id: string;
    name: string;
    address: string;
  };
  assignedLocations?: Array<{
    id: string;
    name: string;
    address?: string;
    city?: string;
  }>;
  adminProfile?: {
    department?: string;
    status?: string;
    profileImageUrl?: string;
    isPrimaryAdmin?: boolean;
    adminPermissions?: {
      permission: {
        name: string;
      };
    }[];
    locationAssignments?: any[];
  };
  createdAt: string;
  updatedAt: string;
  lastActive?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  _count?: {
    students: number;
  };
}
