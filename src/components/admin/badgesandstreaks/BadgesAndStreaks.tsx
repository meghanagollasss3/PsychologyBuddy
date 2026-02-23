"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Edit, Trash2, Trophy, Star, Flame, Target, Loader2 } from "lucide-react";
import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useSchoolFilter } from "@/src/contexts/SchoolFilterContext";

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: string;
  type: 'STREAK' | 'JOURNAL_COUNT' | 'ARTICLE_READ' | 'MEDITATION_COUNT' | 'MUSIC_COUNT' | 'MOOD_CHECKIN';
  conditionValue?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  admin?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    userBadges: number;
  };
}

interface BadgeStats {
  totalBadges: number;
  totalEarned: number;
  activeStreaks: number;
  avgEngagement: number;
}

interface CreateBadgeData {
  name: string;
  icon: string;
  description: string;
  requirement: string;
  type: Badge['type'];
  conditionValue?: number;
  isActive: boolean;
  schoolId?: string;
}


export default function BadgesAndStreaks() {
  const { toast } = useToast();
  const { selectedSchoolId, setSelectedSchoolId, schools, setSchools, isSuperAdmin } = useSchoolFilter();
  
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<BadgeStats>({
    totalBadges: 0,
    totalEarned: 0,
    activeStreaks: 0,
    avgEngagement: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState<CreateBadgeData>({
    name: "",
    icon: "",
    description: "",
    requirement: "",
    type: "STREAK",
    conditionValue: undefined,
    isActive: true,
    schoolId: undefined,
  });
  const [selectedSchoolForBadge, setSelectedSchoolForBadge] = useState<string>('');

  // Fetch badges and stats
  const fetchBadges = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('isActive', String(statusFilter === 'active'));
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (selectedSchoolId && selectedSchoolId !== 'all') params.append('schoolId', selectedSchoolId);
      
      const response = await fetch(`/api/admin/badges?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setBadges(data.data.badges);
        // Calculate stats from real data
        const totalEarned = data.data.badges.reduce((sum: number, badge: Badge) => 
          sum + (badge._count?.userBadges || 0), 0
        );
        setStats({
          totalBadges: data.data.badges.length,
          totalEarned,
          activeStreaks: 342, // TODO: Get from API
          avgEngagement: 78, // TODO: Get from API
        });
      } else {
        toast({ title: "Error", description: data.error?.message || "Failed to fetch badges", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch badges", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, [searchQuery, statusFilter, typeFilter, selectedSchoolId || 'all']);

  // Create badge
  const handleCreateBadge = async () => {
    if (!formData.name || !formData.icon || !formData.description || !formData.requirement) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      setCreateLoading(true);
      
      const response = await fetch('/api/admin/badges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Only include conditionValue if it's a valid positive number
          ...(formData.conditionValue && formData.conditionValue > 0 ? { conditionValue: formData.conditionValue } : {})
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Success", description: "Badge created successfully" });
        setIsCreateOpen(false);
        setFormData({
          name: "",
          icon: "",
          description: "",
          requirement: "",
          type: "STREAK",
          conditionValue: undefined,
          isActive: true,
          schoolId: undefined,
        });
        setSelectedSchoolForBadge('');
        fetchBadges();
      } else {
        toast({ title: "Error", description: data.error?.message || "Failed to create badge", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create badge", variant: "destructive" });
    } finally {
      setCreateLoading(false);
    }
  };

  // Edit badge
  const handleEditBadge = async () => {
    if (!editingBadge || !formData.name || !formData.icon || !formData.description || !formData.requirement) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      setCreateLoading(true);
      const response = await fetch(`/api/admin/badges?id=${editingBadge.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Success", description: "Badge updated successfully" });
        setIsEditOpen(false);
        setEditingBadge(null);
        setFormData({
          name: "",
          icon: "",
          description: "",
          requirement: "",
          type: "STREAK",
          conditionValue: undefined,
          isActive: true,
        });
        setSelectedSchoolForBadge('');
        fetchBadges();
      } else {
        toast({ title: "Error", description: data.error?.message || "Failed to update badge", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update badge", variant: "destructive" });
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete badge
  const handleDeleteBadge = async (badgeId: string) => {
    if (!confirm('Are you sure you want to delete this badge?')) return;

    try {
      const response = await fetch(`/api/admin/badges?id=${badgeId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Success", description: "Badge deleted successfully" });
        fetchBadges();
      } else {
        toast({ title: "Error", description: data.error?.message || "Failed to delete badge", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete badge", variant: "destructive" });
    }
  };

  // Open edit dialog
  const openEditDialog = (badge: Badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      icon: badge.icon,
      description: badge.description,
      requirement: badge.requirement,
      type: badge.type,
      conditionValue: badge.conditionValue,
      isActive: badge.isActive,
    });
    setIsEditOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader 
        title="Badges & Streaks" 
        subtitle="Manage achievement badges and track student engagement"
        showTimeFilter={false}
        showSchoolFilter={true} // Show for any admin to test functionality
        schoolFilterValue={selectedSchoolId}
        onSchoolFilterChange={setSelectedSchoolId}
        schools={schools}
        actions={
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Badge
          </Button>
        }
      />
      
      <div className="flex-1 overflow-auto p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#D97706]" />
                Total Badges
              </CardDescription>
              <CardTitle className="text-2xl">{stats.totalBadges}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[#D97706]" />
                Badges Earned
              </CardDescription>
              <CardTitle className="text-2xl">{stats.totalEarned}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-[#EF4444]" />
                Active Streaks
              </CardDescription>
              <CardTitle className="text-2xl">{stats.activeStreaks}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[#059669]" />
                Avg Engagement
              </CardDescription>
              <CardTitle className="text-2xl">{stats.avgEngagement}%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Tabs defaultValue="badges" className="space-y-4">
          <TabsList>
            <TabsTrigger value="badges">Badge Library</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search badges..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="STREAK">Streak</SelectItem>
                  <SelectItem value="JOURNAL_COUNT">Journal</SelectItem>
                  <SelectItem value="ARTICLE_READ">Article</SelectItem>
                  <SelectItem value="MEDITATION_COUNT">Meditation</SelectItem>
                  <SelectItem value="MUSIC_COUNT">Music</SelectItem>
                  <SelectItem value="MOOD_CHECKIN">Mood</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {badges.map((badge) => (
                  <Card key={badge.id} className={!badge.isActive ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{badge.icon}</span>
                          <div>
                            <CardTitle className="text-base">{badge.name}</CardTitle>
                            <CardDescription className="text-xs">{badge.requirement}</CardDescription>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {badge.type.replace('_', ' ')}
                              </Badge>
                              {badge.conditionValue && (
                                <Badge variant="secondary" className="text-xs">
                                  {badge.conditionValue}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(badge)}>
                              <Edit className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 text-destructive focus:text-destructive" 
                              onClick={() => handleDeleteBadge(badge.id)}
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          <span className="font-medium text-foreground">{badge._count?.userBadges || 0}</span>
                          <span className="text-muted-foreground"> earned</span>
                        </span>
                        <Badge variant={badge.isActive ? "default" : "secondary"}>
                          {badge.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Gamification Settings</CardTitle>
                <CardDescription>Configure rewards and visibility options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Streak Notifications</p>
                    <p className="text-sm text-muted-foreground">Notify students about their streaks</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Badge Celebrations</p>
                    <p className="text-sm text-muted-foreground">Show celebration animation when earning badges</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Badge Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Badge</DialogTitle>
            <DialogDescription>
              Design a new achievement badge for students.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Badge Name</Label>
              <Input 
                id="name" 
                placeholder="e.g., Mindfulness Master" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input 
                id="icon" 
                placeholder="e.g., 🏆" 
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Badge Type</Label>
              <Select value={formData.type} onValueChange={(value: Badge['type']) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select badge type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STREAK">Streak</SelectItem>
                  <SelectItem value="JOURNAL_COUNT">Journal Count</SelectItem>
                  <SelectItem value="ARTICLE_READ">Article Read</SelectItem>
                  <SelectItem value="MEDITATION_COUNT">Meditation Count</SelectItem>
                  <SelectItem value="MUSIC_COUNT">Music Count</SelectItem>
                  <SelectItem value="MOOD_CHECKIN">Mood Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="school">School (Optional)</Label>
              <Select value={selectedSchoolForBadge} onValueChange={(value: string) => {
    setSelectedSchoolForBadge(value);
    setFormData({ ...formData, schoolId: value || undefined });
  }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global Badge</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(formData.type === 'STREAK' || formData.type === 'JOURNAL_COUNT' || formData.type === 'ARTICLE_READ' || 
              formData.type === 'MEDITATION_COUNT' || formData.type === 'MUSIC_COUNT' || formData.type === 'MOOD_CHECKIN') && (
              <div className="grid gap-2">
                <Label htmlFor="conditionValue">Condition Value</Label>
                <Input 
                  id="conditionValue" 
                  type="number"
                  placeholder="e.g., 7" 
                  value={formData.conditionValue || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      conditionValue: value ? parseInt(value) : undefined 
                    });
                  }}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="What this badge represents..." 
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="requirement">Requirement</Label>
              <Textarea 
                id="requirement" 
                placeholder="How to earn this badge..." 
                rows={2}
                value={formData.requirement}
                onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Activate immediately</Label>
              <Switch 
                id="active" 
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBadge} disabled={createLoading}>
              {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Badge Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Badge</DialogTitle>
            <DialogDescription>
              Update the badge details and requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Badge Name</Label>
              <Input 
                id="edit-name" 
                placeholder="e.g., Mindfulness Master" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-icon">Icon (Emoji)</Label>
              <Input 
                id="edit-icon" 
                placeholder="e.g., 🏆" 
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Badge Type</Label>
              <Select value={formData.type} onValueChange={(value: Badge['type']) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select badge type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STREAK">Streak</SelectItem>
                  <SelectItem value="JOURNAL_COUNT">Journal Count</SelectItem>
                  <SelectItem value="ARTICLE_READ">Article Read</SelectItem>
                  <SelectItem value="MEDITATION_COUNT">Meditation Count</SelectItem>
                  <SelectItem value="MUSIC_COUNT">Music Count</SelectItem>
                  <SelectItem value="MOOD_CHECKIN">Mood Check-in</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="school">School (Optional)</Label>
              <Select value={selectedSchoolForBadge} onValueChange={(value: string) => {
    setSelectedSchoolForBadge(value);
    setFormData({ ...formData, schoolId: value || undefined });
  }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global Badge</SelectItem>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(formData.type === 'STREAK' || formData.type === 'JOURNAL_COUNT' || formData.type === 'ARTICLE_READ' || 
              formData.type === 'MEDITATION_COUNT' || formData.type === 'MUSIC_COUNT' || formData.type === 'MOOD_CHECKIN') && (
              <div className="grid gap-2">
                <Label htmlFor="edit-conditionValue">Condition Value</Label>
                <Input 
                  id="edit-conditionValue" 
                  type="number"
                  placeholder="e.g., 7" 
                  value={formData.conditionValue || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      conditionValue: value ? parseInt(value) : undefined 
                    });
                  }}
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description" 
                placeholder="What this badge represents..." 
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-requirement">Requirement</Label>
              <Textarea 
                id="edit-requirement" 
                placeholder="How to earn this badge..." 
                rows={2}
                value={formData.requirement}
                onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-active">Activate immediately</Label>
              <Switch 
                id="edit-active" 
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditBadge} disabled={createLoading}>
              {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Badge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
