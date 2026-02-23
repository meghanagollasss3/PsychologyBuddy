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
  adminProfile?: {
    department?: string;
    lastActive?: string;
    status?: string;
    profileImageUrl?: string;
    adminPermissions?: {
      permission: {
        name: string;
      };
    }[];
  };
  createdAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  _count?: {
    students: number;
  };
}
