"use client";

import React, { useState, useEffect } from 'react';
import { usePermissions } from '@/src/hooks/usePermissions';
import { useAuth } from '@/src/contexts/AuthContext';
import { useSchoolFilter } from '@/src/contexts/SchoolFilterContext';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  UserPlus,
  Calendar,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { AddStudentModal } from '../modals/AddStudentModal';
import { EditStudentModal } from '../modals/EditStudentModal';
import { ViewStudentModal } from '../modals/ViewStudentModal';
import { AdminHeader } from '../layout/AdminHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  classRef?: {
    id: string;
    name: string;
    grade: number;
    section: string;
  };
  school?: {
    id: string;
    name: string;
  };
  studentProfile?: {
    lastMoodCheckin?: string;
    averageMood?: number;
    riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    profileImage?: string;
  };
  _count?: {
    chatSessions: number;
    moodCheckins: number;
  };
}

export function StudentsManagementSection() {
  const { selectedSchoolId, setSelectedSchoolId, schools, setSchools, isSuperAdmin } = useSchoolFilter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  console.log('StudentsManagementSection - School filter state:', { selectedSchoolId, isSuperAdmin, schoolsCount: schools.length });

  // Add debugging to track when selectedSchoolId changes
  React.useEffect(() => {
    console.log('selectedSchoolId changed to:', selectedSchoolId);
  }, [selectedSchoolId]);

  // Permission checks
  const canCreateStudents = hasPermission('users.create');
  const canViewStudents = hasPermission('users.view');
  const canUpdateStudents = hasPermission('users.update');
  const canDeleteStudents = hasPermission('users.delete');

  useEffect(() => {
    if (canViewStudents) {
      console.log('Main useEffect called - canViewStudents:', canViewStudents);
      fetchStudents();
      fetchClasses();
      if (isSuperAdmin) {
        fetchSchools();
      }
    }
  }, [canViewStudents, isSuperAdmin]);

  // Auto-set school ID for regular admins
  useEffect(() => {
    if (!isSuperAdmin && user?.school?.id && selectedSchoolId === 'all') {
      console.log('Auto-setting schoolId for regular admin:', user.school.id);
      setSelectedSchoolId(user.school.id);
    }
  }, [isSuperAdmin, user, selectedSchoolId, setSelectedSchoolId]);

  useEffect(() => {
    if (canViewStudents) {
      console.log('useEffect triggered - fetching students due to filter change');
      fetchStudents();
    }
  }, [searchTerm, statusFilter, classFilter, selectedSchoolId, canViewStudents]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (classFilter !== 'all') params.append('classId', classFilter);
      
      console.log('School filter condition check:', { selectedSchoolId, isNotAll: selectedSchoolId !== 'all', shouldAdd: selectedSchoolId && selectedSchoolId !== 'all' });
      
      if (selectedSchoolId && selectedSchoolId !== 'all') {
        params.append('schoolId', selectedSchoolId);
        console.log('Added schoolId to params:', selectedSchoolId);
      }

      console.log('Fetching students with params:', params.toString());
      console.log('Selected school ID:', selectedSchoolId);

      const response = await fetch(`/api/students?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      console.log('Students API response:', data);
      
      if (data.success) {
        console.log('Students fetched:', data.data.length);
        setStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setClasses(data.data);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/schools', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        let schoolsData = data.data;
        
        // Map API response to expected interface
        schoolsData = schoolsData.map((school: any) => ({
          ...school,
          location: school.address || 'Unknown Location',
          studentCount: school._count?.users || 0,
          alertCount: 0,
          checkInsToday: 0,
        }));
        
        setSchools(schoolsData); // Set global schools for filter
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setShowAddModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowEditModal(true);
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to deactivate this student?')) return;

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        fetchStudents();
      }
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50';
      case 'INACTIVE': return 'text-gray-600 bg-gray-50';
      case 'SUSPENDED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'text-red-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (!canViewStudents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to view students.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader 
        title="Student Management" 
        subtitle="View and manage student profiles"
        showSchoolFilter={isSuperAdmin}
        schoolFilterValue={selectedSchoolId}
        onSchoolFilterChange={setSelectedSchoolId}
        schools={schools}
        showTimeFilter={false}
        actions={canCreateStudents && (
          <button
            onClick={handleAddStudent}
            className="flex items-center space-x-2 px-4 py-2 bg-[#3c83f6] text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        )}
      />
      {/* Header */}
      {/* <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-gray-600">Manage students and their information</p>
        </div>
        {canCreateStudents && (
          <button
            onClick={handleAddStudent}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        )}
      </div> */}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or student ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Mood
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={student.studentProfile?.profileImage || ''} 
                              alt={`${student.firstName} ${student.lastName}`}
                            />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {getInitials(student.firstName, student.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                            <div className="text-xs text-gray-400">{student.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.classRef?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.studentProfile?.lastMoodCheckin ? (
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(student.studentProfile.lastMoodCheckin).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.studentProfile?.averageMood ? (
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                            {student.studentProfile.averageMood.toFixed(1)}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student._count?.chatSessions || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.studentProfile?.riskLevel ? (
                          <div className={`flex items-center ${getRiskColor(student.studentProfile.riskLevel)}`}>
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{student.studentProfile.riskLevel}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewStudent(student)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canUpdateStudents && (
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Edit Student"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteStudents && (
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Deactivate Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <AddStudentModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchStudents();
          }}
          schools={schools}
          classes={classes}
        />
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <EditStudentModal
          student={selectedStudent}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchStudents();
          }}
          schools={schools}
          classes={classes}
        />
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <ViewStudentModal
          student={selectedStudent}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  );
}
