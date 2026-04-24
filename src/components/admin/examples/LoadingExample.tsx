"use client";

import React, { useState } from 'react';
import { useAdminLoading, AdminActions } from '@/src/contexts/AdminLoadingContext';
import { LoadingButton, AdminLoader, TableRowLoader, CardLoader, InlineLoader } from '@/src/components/admin/ui/AdminLoader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Settings, Download, Search, Plus, Edit, Trash2 } from 'lucide-react';

export default function LoadingExample() {
  const { executeWithLoading, setLoading, isLoading } = useAdminLoading();

  const simulateAsyncOperation = async (operation: string, delay: number = 2000) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`${operation} completed`);
        resolve(true);
      }, delay);
    });
  };

  const handleBasicAction = async () => {
    await executeWithLoading(
      AdminActions.SEARCH,
      simulateAsyncOperation('Basic search'),
      'Searching...'
    );
  };

  const handleAddStudent = async () => {
    await executeWithLoading(
      AdminActions.ADD_STUDENT,
      simulateAsyncOperation('Adding student', 3000),
      'Adding new student...'
    );
  };

  const handleDeleteAction = async () => {
    await executeWithLoading(
      AdminActions.DELETE_STUDENT,
      simulateAsyncOperation('Deleting student', 2500),
      'Deleting student data...'
    );
  };

  const handleExportData = async () => {
    await executeWithLoading(
      AdminActions.EXPORT_DATA,
      simulateAsyncOperation('Exporting data', 4000),
      'Exporting student data...'
    );
  };

  const handleManualToggle = () => {
    const currentlyLoading = isLoading(AdminActions.FETCH_STUDENTS);
    setLoading(AdminActions.FETCH_STUDENTS, !currentlyLoading, 'Manual loading state...');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Loading Examples</h1>
        <p className="text-muted-foreground">
          Demonstrating different loading states and spinner components for admin actions
        </p>
      </div>

      <Tabs defaultValue="buttons" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="buttons">Loading Buttons</TabsTrigger>
          <TabsTrigger value="tables">Table Loading</TabsTrigger>
          <TabsTrigger value="cards">Card Loading</TabsTrigger>
          <TabsTrigger value="custom">Custom Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Loading Button Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <LoadingButton
                  onClick={handleBasicAction}
                  loadingText="Searching..."
                  className="gap-2"
                >
                  <Search className="w-4 h-4" />
                  Search Students
                </LoadingButton>

                <LoadingButton
                  onClick={handleAddStudent}
                  loadingText="Adding..."
                  variant="default"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Student
                </LoadingButton>

                <LoadingButton
                  onClick={handleDeleteAction}
                  loadingText="Deleting..."
                  variant="destructive"
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Student
                </LoadingButton>

                <LoadingButton
                  onClick={handleExportData}
                  loadingText="Exporting..."
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </LoadingButton>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Manual Loading Control</h4>
                <div className="flex items-center gap-4">
                  <Button onClick={handleManualToggle} variant="secondary">
                    {isLoading(AdminActions.FETCH_STUDENTS) ? 'Stop Manual Loading' : 'Start Manual Loading'}
                  </Button>
                  <Badge variant={isLoading(AdminActions.FETCH_STUDENTS) ? 'default' : 'secondary'}>
                    {isLoading(AdminActions.FETCH_STUDENTS) ? 'Loading' : 'Idle'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Table Loading Examples
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>John Doe</TableCell>
                    <TableCell><Badge variant="default">Active</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  <TableRowLoader colSpan={3} message="Loading more students..." />
                  
                  <TableRow>
                    <TableCell>Jane Smith</TableCell>
                    <TableCell><Badge variant="secondary">Inactive</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Students:</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Today:</span>
                    <span className="font-medium">456</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CardLoader message="Loading statistics..." />

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Loading Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <h4 className="font-medium">Ring Spinner</h4>
                  <AdminLoader type="ring" size="md" message="Ring loading..." />
                </div>

                <div className="text-center space-y-2">
                  <h4 className="font-medium">Dots Spinner</h4>
                  <AdminLoader type="dots" message="Dots loading..." />
                </div>

                <div className="text-center space-y-2">
                  <h4 className="font-medium">Classic Spinner</h4>
                  <AdminLoader type="classic" size="lg" message="Classic loading..." />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Inline Loading Examples</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Searching database...</span>
                    <InlineLoader message="Searching..." />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Uploading file...</span>
                    <InlineLoader message="Uploading..." />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <span>Processing data...</span>
                    <InlineLoader message="Processing..." />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
