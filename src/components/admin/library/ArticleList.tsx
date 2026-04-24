'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSchoolFilter } from '@/src/contexts/SchoolFilterContext';
import { useTimeFilter } from '@/src/contexts/TimeFilterContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Eye, Trash2, FileText, Upload, Clock, BookOpen, X, Check, ChevronDown, MoreVertical, Search, CheckCircle2, Edit2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
// import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AdminHeader } from '../../admin/layout/AdminHeader';
import { getAuthHeaders } from '@/src/utils/session.util';
import { useToast } from '@/components/ui/use-toast';
import { useAdminLoading, AdminActions } from '@/src/contexts/AdminLoadingContext';
import { LoadingButton } from '@/src/components/admin/ui/AdminLoader';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
  views?: number;
  categories?: {
    id: string;
    categoryId: string;
    category: {
      id: string;
      name: string;
      status: string;
    };
  }[];
  moods?: {
    id: string;
    moodId: string;
    mood: {
      id: string;
      name: string;
    };
  }[];
  goals?: {
    id: string;
    goalId: string;
    goal: {
      id: string;
      name: string;
    };
  }[];
  _count?: {
    categories: number;
    moods: number;
    goals: number;
  };
}

interface ArticleFormData {
  title: string;
  subtitle: string;
  author: string;
  thumbnail: string;
  description: string;
  readTime: string;
  category: string;
  supportedMoods: string[];
  goal: string;
  status: 'draft' | 'published';
}

interface Mood {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  status: string;
}

export function ArticleList() {
  const router = useRouter();
  const mountedRef = useRef(true);
  const { toast } = useToast();
  const { selectedSchoolId, setSelectedSchoolId, schools, isSuperAdmin } = useSchoolFilter();
  const { timeFilter, dateRange } = useTimeFilter();
  const { executeWithLoading } = useAdminLoading();
  const [articles, setArticles] = useState<Article[]>([]);
  // const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', status: 'active' });
  const [categoryError, setCategoryError] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [articleForm, setArticleForm] = useState<ArticleFormData>({
    title: '',
    subtitle: '',
    author: '',
    thumbnail: '',
    description: '',
    readTime: '',
    category: '',
    supportedMoods: [],
    goal: '',
    status: 'draft',
  });
  const [formErrors, setFormErrors] = useState<{
  title?: string; 
  author?: string; 
  description?: string; 
  readTime?: string; 
  category?: string; 
  supportedMoods?: string; 
  goal?: string;
}>({});
  const [moods, setMoods] = useState<Mood[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMoodPopoverOpen, setIsMoodPopoverOpen] = useState(false);
  const [isGoalPopoverOpen, setIsGoalPopoverOpen] = useState(false);
  const [newMood, setNewMood] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [articleMoods, setArticleMoods] = useState<string[]>([]);
  const [articleGoals, setArticleGoals] = useState<string[]>([]);

  const fetchArticles = useCallback(async () => {
    if (!mountedRef.current) return; // Only prevent calls on unmounted component
    
    try {
      await executeWithLoading(
        AdminActions.FETCH_ARTICLES,
        (async () => {
          const headers = getAuthHeaders();
          const params = new URLSearchParams();
          
          // Add school filter if applicable
          if (isSuperAdmin && selectedSchoolId && selectedSchoolId !== 'all') {
            params.append('schoolId', selectedSchoolId);
          }
          
          // Add time filter
          params.append('timeRange', timeFilter);
          
          const url = `/api/articles${params.toString() ? `?${params.toString()}` : ''}`;
          const response = await fetch(url, { headers });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          if (data.success && mountedRef.current) {
            setArticles(data.data);
          } else if (!data.success) {
            console.error("API returned error:", data.message);
          }
        })(),
        'Fetching articles...'
      );
    } catch (error) {
      if (mountedRef.current) {
        console.error('Failed to fetch articles:', error);
      }
    }
  }, [selectedSchoolId, isSuperAdmin, timeFilter, executeWithLoading]);

  const fetchLabels = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      const headers = getAuthHeaders();
      const [categoriesRes, moodsRes, goalsRes] = await Promise.all([
        fetch('/api/labels/categories', { headers }),
        fetch('/api/labels/moods', { headers }),
        fetch('/api/labels/goals', { headers }),
      ]);

      const [categoriesData, moodsData, goalsData] = await Promise.all([
        categoriesRes.json(),
        moodsRes.json(),
        goalsRes.json(),
      ]);

      if (categoriesData.success && mountedRef.current) {
        setCategories(categoriesData.data);
      } else if (!categoriesData.success) {
        console.error("Categories API error:", categoriesData.message);
      }
      
      if (moodsData.success && mountedRef.current) {
        setMoods(moodsData.data);
        setArticleMoods(moodsData.data?.map((mood: Mood) => mood.name) || []);
      } else if (!moodsData.success) {
        console.error("Moods API error:", moodsData.message);
      }
      
      if (goalsData.success && mountedRef.current) {
        setGoals(goalsData.data);
        setArticleGoals(goalsData.data?.map((goal: Goal) => goal.name) || []);
      } else if (!goalsData.success) {
        console.error("Goals API error:", goalsData.message);
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error('Failed to fetch labels:', error);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchArticles();
    fetchLabels();
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchArticles, fetchLabels, timeFilter]);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setArticleForm(prev => ({ ...prev, thumbnail: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveThumbnail = () => {
    setArticleForm(prev => ({ ...prev, thumbnail: '' }));
    // Clear the file input as well
    const fileInput = document.getElementById('thumbnail-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const resetArticleForm = () => {
    setArticleForm({
      title: '',
      subtitle: '',
      author: '',
      thumbnail: '',
      description: '',
      readTime: '',
      category: '',
      supportedMoods: [],
      goal: '',
      status: 'draft',
    });
    setArticleMoods([]);
    setArticleGoals([]);
    setFormErrors({});
  };

  const handleSaveAndContinue = async () => {
    const errors: {
      title?: string; 
      author?: string; 
      description?: string; 
      readTime?: string; 
      category?: string; 
      supportedMoods?: string; 
      goal?: string;
    } = {};
    
    // Title validation
    if (!articleForm.title.trim()) {
      errors.title = 'Article title is required';
    } else if (articleForm.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters long';
    } else if (articleForm.title.trim().length > 200) {
      errors.title = 'Title must be less than 200 characters';
    } else {
      // Check for duplicate title
      const trimmedTitle = articleForm.title.trim();
      const duplicateArticle = articles.find(article => 
        article.title.toLowerCase() === trimmedTitle.toLowerCase()
      );
      
      if (duplicateArticle) {
        errors.title = 'An article with this title already exists';
      }
    }
    
    // Author validation
    if (!articleForm.author.trim()) {
      errors.author = 'Author name is required';
    } else if (articleForm.author.trim().length < 2) {
      errors.author = 'Author name must be at least 2 characters long';
    }
    
    // Description validation
    if (!articleForm.description.trim()) {
      errors.description = 'Description is required';
    } else if (articleForm.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters long';
    } else if (articleForm.description.trim().length > 500) {
      errors.description = 'Description must be less than 500 characters';
    }
    
    // Read Time validation
    if (articleForm.readTime.trim()) {
      const readTimeNum = parseInt(articleForm.readTime);
      if (isNaN(readTimeNum) || readTimeNum < 1) {
        errors.readTime = 'Read time must be at least 1 minute';
      } else if (readTimeNum > 120) {
        errors.readTime = 'Read time seems too long (max 120 minutes)';
      }
    }
    
    // Category validation
    if (!articleForm.category) {
      errors.category = 'Please select a category';
    }
    
    // Moods validation
    if (articleForm.supportedMoods.length === 0) {
      errors.supportedMoods = 'Please select at least one supported mood';
    }
    
    // Goal validation
    if (!articleForm.goal) {
      errors.goal = 'Please select a primary goal';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Show toast for first error
      const firstError = Object.values(errors)[0];
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive"
      });
      return;
    }
    
    setFormErrors({});
    
    try {
      await executeWithLoading(
        AdminActions.CREATE_ARTICLE,
        (async () => {
          const headers = getAuthHeaders();
          const response = await fetch('/api/articles', {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...articleForm,
              thumbnailUrl: articleForm.thumbnail, // Map thumbnail to thumbnailUrl for database
              readTime: parseInt(articleForm.readTime) || null,
              categoryIds: articleForm.category && categories.find(c => c.id === articleForm.category) ? [articleForm.category] : [],
              moodIds: articleForm.supportedMoods.map((moodName) => {
                const mood = moods.find(m => m.name === moodName);
                return mood ? mood.id : '';
              }).filter(Boolean),
              goalIds: articleForm.goal && goals.find(g => g.name === articleForm.goal) ? 
                [goals.find(g => g.name === articleForm.goal)?.id || '']
              : [],
              status: articleForm.status.toUpperCase(), // Convert to uppercase for backend
            }),
          });

          console.log('🖼️ Creating article with thumbnailUrl:', articleForm.thumbnail ? articleForm.thumbnail.substring(0, 100) + '...' : 'null');
          console.log('🖼️ Thumbnail length:', articleForm.thumbnail ? articleForm.thumbnail.length : 0);

          const data = await response.json();

          if (data.success) {
            setArticles([data.data, ...articles]);
            resetArticleForm();
            toast({
              title: "Article Created",
              description: "Article has been created successfully."
            });
            
            // Navigate to edit mode to add content
            router.push(`/admin/library/editor/${data.data.id}`);
          } else {
            toast({
              title: "Error",
              description: data.message || "Failed to create article",
              variant: "destructive"
            });
          }
        })(),
        'Creating article...'
      );
    } catch (error) {
      console.error('Failed to create article:', error);
      toast({
        title: "Error",
        description: "Failed to create article. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveAndContinue();
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || article.status.toLowerCase() === statusFilter;
    const matchesCategory = categoryFilter === "all" || 
      (article.categories && article.categories.some(cat => cat.category.name === categoryFilter));
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDelete = (article: Article) => {
    setSelectedArticle(article);
    setIsDeleteOpen(true);
  };

  const handleToggleStatus = async (article: Article) => {
    try {
      const newStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      
      const headers = getAuthHeaders();
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (response.ok) {
        // Update the local state to reflect the change
        setArticles(prevArticles => 
          prevArticles.map(a => 
            a.id === article.id 
              ? { ...a, status: newStatus }
              : a
          )
        );
      } else {
        console.error('Failed to update article status');
      }
    } catch (error) {
      console.error('Error updating article status:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedArticle) return;

    try {
      await executeWithLoading(
        AdminActions.DELETE_ARTICLE,
        (async () => {
          const headers = getAuthHeaders();
          const response = await fetch(`/api/articles/${selectedArticle.id}`, {
            method: 'DELETE',
            headers,
          });

          const data = await response.json();
          if (data.success) {
            setArticles(articles.filter(a => a.id !== selectedArticle.id));
            setIsDeleteOpen(false);
            setSelectedArticle(null);
            toast({
              title: "Article Deleted",
              description: "Article has been deleted successfully."
            });
          } else {
            toast({
              title: "Error",
              description: data.message || "Failed to delete article",
              variant: "destructive"
            });
          }
        })(),
        'Deleting article...'
      );
    } catch (error) {
      console.error('Failed to delete article:', error);
      toast({
        title: "Error",
        description: "Failed to delete article. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', status: 'active' });
    setCategoryError('');
  };

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name.",
        variant: "destructive",
      });
      return;
    }
    
    setCategoryError(''); // Clear error if validation passes
    setIsAddingCategory(true);
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/labels/categories', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryForm.name.trim(),
          status: categoryForm.status.toUpperCase()
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Category Added",
          description: `"${categoryForm.name}" has been added to categories.`,
        });
        resetCategoryForm();
        setIsCategoryOpen(false);
        setCategoryError(''); // Clear error on success
        // Refresh labels to show new category
        fetchLabels();
      } else {
        setCategoryError('Failed to create category: ' + data.message);
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      setCategoryError('Failed to create category');
    } finally {
      setIsAddingCategory(false);
    }
  };

  return (
    <>
    <AdminHeader 
        title="Psychoeducation Library" 
        subtitle="Manage educational content and resources"
        showTimeFilter={true}
        showSchoolFilter={isSuperAdmin}
        schoolFilterValue={selectedSchoolId}
        schools={schools}
        onSchoolFilterChange={setSelectedSchoolId}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2 hover:bg-gray-200" onClick={() => setIsCategoryOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} className='gap-2 bg-[#3c83f6] text-white'>
          <Plus className="h-4 w-4" />
          Add Article
        </Button>
          </div>
        }
      />
      {/* Header Controls */}
    <div className="flex-1 overflow-auto p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground">
              <Search className="h-4 w-4 text-gray-500" />
            </div>
            <input 
              placeholder="Search articles..." 
              className={`pl-9 w-full h-10 rounded-lg border border-input bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 disabled:cursor-not-allowed ${searchQuery ? 'pr-9' : ''}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent className='bg-white'>
              <SelectItem value="all">All Categories</SelectItem>
              {categories
                .filter(cat => cat.status?.toLowerCase() === 'active')
                .map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className='bg-white'>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f5f7f8] text-[#65758b]">
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-[#94A3B8]">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-lg font-medium">No articles found</p>
                      <p className="text-sm">Create your first article to get started</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredArticles.map((article) => (
                  <TableRow key={article.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ebf2fe]">
                          <FileText className="h-4 w-4" style={{ color: 'rgb(37 99 235)' }} />
                        </div>
                        <span className="font-medium text-foreground">{article.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {article.categories && article.categories.length > 0 
                          ? article.categories.map((cat: any) => cat.category.name).join(', ')
                          : 'General'
                        }
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#65758b]">{article.author}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          article.status === 'PUBLISHED' 
                            ? "bg-[#e8f9ee] text-[#21c25c]" 
                            : "bg-[#f0e8da] text-[#e6952a]"
                        )}
                      >
                        {article.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-[#65758b]">
                      {article.views || 0}
                    </TableCell>
                    <TableCell className="text-[#65758b]">
                      {new Date(article.updatedAt).toLocaleDateString('en-CA', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu >
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 focus:ring-2 focus:ring-[#3c83f6] hover:bg-gray-400">
                            <MoreVertical className="h-4 w-4  " />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className='bg-white'>
                          <DropdownMenuItem 
                            className="gap-2 hover:bg-gray-200"
                            onClick={() => {
                              router.push(`/admin/library/preview/${article.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 hover:bg-gray-200"
                            onClick={() => {
                              console.log('Edit Content clicked for article:', article.id, article);
                              router.push(`/admin/library/editor/${article.id}`);
                            }}
                          >
                            <Edit className="h-4 w-4" /> Edit Content
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 hover:bg-gray-200"
                            onClick={() => handleToggleStatus(article)}
                          >
                            {article.status === 'PUBLISHED' ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-green-600" /> 
                                <span className="text-green-600">Published</span>
                              </>
                            ) : (
                              <>
                                <Edit2 className="h-4 w-4 text-gray-600" /> 
                                <span className="text-gray-600">Publish</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-red-600 focus:text-destructive hover:bg-gray-200"
                            onClick={() => handleDelete(article)}
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedArticle?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <LoadingButton
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              loadingText="Cancelling..."
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              variant="destructive"
              onClick={handleDeleteConfirm}
              loadingText="Deleting..."
            >
              Delete
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={isCategoryOpen} onOpenChange={(open) => { setIsCategoryOpen(open); if (!open) resetCategoryForm(); }}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription className='text-[#65758b]'>
              Create a new category to organize your resources.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="categoryName" >Category Name <span className="text-red-500">*</span></Label>
              <Input 
                id="categoryName" 
                placeholder="e.g. Study Skills"
                value={categoryForm.name}
                onChange={(e) => {
                  setCategoryForm(prev => ({ ...prev, name: e.target.value }));
                  if (categoryError) setCategoryError(''); // Clear error on typing
                }}
                className='mt-[8px] h-10 shadow-none border border-border bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#3c83f6] focus-visible:ring-offset-2 focus-visible:outline-none'
                required
              />
              {categoryError && (
                <p className="text-sm text-red-500 mt-1">{categoryError}</p>
              )}
            </div>

            {/* Category Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={categoryForm.status}
          
                onValueChange={(value: "active" | "inactive") => setCategoryForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className='mt-[8px] mb-[9px] shadow-none border border-border bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Inactive categories won't appear in article filters</p>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCategoryOpen(false)}>
              Cancel
            </Button>
            <LoadingButton 
              onClick={handleAddCategory} 
              className='bg-[#3c83f6] text-white'
              isLoading={isAddingCategory}
              loadingText="Adding..."
            >
              Add Category
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Article Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg bg-white max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add New Article</DialogTitle>
            <DialogDescription className='text-[#65758b]'>
              Step 1: Enter article metadata. You'll add content in the next step.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label>Thumbnail</Label>
              <div 
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer mt-2"
                onClick={() => document.getElementById('thumbnail-upload')?.click()}
              >
                {articleForm.thumbnail ? (
                  <div className="relative">
                    <img 
                      src={articleForm.thumbnail} 
                      alt="Thumbnail preview" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveThumbnail();
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-500" />
                    <p className="text-sm text-gray-500">Click to upload thumbnail</p>
                    <p className="text-xs text-gray-500 mt-[9px]">PNG, JPG up to 2MB</p>
                    <p className="text-xs text-gray-500 mt-[9px]">[399 × 140]</p>
                  </div>
                )}
                <input 
                  id="thumbnail-upload"
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleThumbnailUpload}
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2 mt-[20px]">
                <Label htmlFor="title">Article Title <span className='text-red-500'>*</span></Label>
                <Input
                  id="title"
                  value={articleForm.title}
                  onChange={(e) => {
                    setArticleForm(prev => ({ ...prev, title: e.target.value }));
                    if (formErrors.title) {
                      setFormErrors(prev => ({ ...prev, title: undefined }));
                    }
                  }}
                  placeholder="Enter article title"
                  required
                  className={formErrors.title ? 'border-red-500' : 'mt-[8px] h-10 shadow-none border border-border bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#3c83f6] focus-visible:ring-offset-2 focus-visible:outline-none'}
                />
                {formErrors.title && (
                  <p className="text-sm text-red-500">{formErrors.title}</p>
                )}
              </div>

              <div className="space-y-2 mt-[20px]">
                <Label htmlFor="author">Author <span className='text-red-500'>*</span></Label>
                <Input
                  id="author"
                  value={articleForm.author}
                  onChange={(e) => {
                    setArticleForm(prev => ({ ...prev, author: e.target.value }));
                    if (formErrors.author) {
                      setFormErrors(prev => ({ ...prev, author: undefined }));
                    }
                  }}
                  placeholder="e.g. Dr. Jane Smith or Wellness Institute"
                  className={formErrors.author ? 'border-red-500' : 'mt-[8px] h-10 shadow-none border border-border bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#3c83f6] focus-visible:ring-offset-2 focus-visible:outline-none'}
                />
                <p className="text-xs text-gray-500">Individual or organization for attribution</p>
                {formErrors.author && (
                  <p className="text-sm text-red-500">{formErrors.author}</p>
                )}
              </div>

              <div className="space-y-2 mt-[20px]">
                <Label htmlFor="readTime">Read Time (minutes) <span className='text-red-500'>*</span></Label>
                <Input
                  id="readTime"
                  type="number"
                  value={articleForm.readTime}
                  onChange={(e) => {
                    setArticleForm(prev => ({ ...prev, readTime: e.target.value }));
                    if (formErrors.readTime) {
                      setFormErrors(prev => ({ ...prev, readTime: undefined }));
                    }
                  }}
                  placeholder="e.g. 5"
                  className={formErrors.readTime ? 'border-red-500 mt-[8px] h-10 shadow-none border border-border bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#3c83f6] focus-visible:ring-offset-2 focus-visible:outline-none' : 'mt-[8px] h-10 shadow-none border border-border bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#3c83f6] focus-visible:ring-offset-2 focus-visible:outline-none'}
                />
                {formErrors.readTime && (
                  <p className="text-sm text-red-500">{formErrors.readTime}</p>
                )}
              </div>

              <div className="space-y-2 mt-[20px]">
                <Label htmlFor="description">Short Description <span className='text-red-500'>*</span></Label>
                <Textarea
                  id="description"
                  value={articleForm.description}
                  onChange={(e) => {
                    setArticleForm(prev => ({ ...prev, description: e.target.value }));
                    if (formErrors.description) {
                      setFormErrors(prev => ({ ...prev, description: undefined }));
                    }
                  }}
                  placeholder="Write a brief description..."
                  rows={3}
                  required
                  className={formErrors.description ? 'border-red-500 mt-[8px] shadow-none border border-border bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#3c83f6] focus-visible:ring-offset-2 focus-visible:outline-none' : 'mt-[8px] shadow-none border border-border bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#3c83f6] focus-visible:ring-offset-2 focus-visible:outline-none'}
                />
                {formErrors.description && (
                  <p className="text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>

              <div className="space-y-2 mt-[20px]" >
                <Label htmlFor="category">Category <span className='text-red-500'>*</span></Label>
                <Select
                  value={articleForm.category}
                  onValueChange={(value) => {
                    setArticleForm(prev => ({ ...prev, category: value }));
                    if (formErrors.category) {
                      setFormErrors(prev => ({ ...prev, category: undefined }));
                    }
                  }}
                >
                  <SelectTrigger className='mt-[9px] h-10 shadow-none border border-border bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 focus:outline-none'>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    {categories
                      .filter(cat => cat.status?.toLowerCase() === 'active')
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id} className='hover:bg-gray-200'>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-sm text-red-500">{formErrors.category}</p>
                )}
              </div>

              <div className="space-y-2 mt-[20px]">
              <Label>Supported Moods <span className='text-red-500'>*</span></Label>
              <Popover open={isMoodPopoverOpen} onOpenChange={setIsMoodPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between h-auto min-h-10 mt-[8px] hover:bg-gray-200"
                  >
                    <div className="flex flex-wrap gap-1">
                      {articleForm.supportedMoods.length > 0 ? (
                        articleForm.supportedMoods.map((mood) => (
                          <Badge key={mood} variant="secondary" className="text-xs">
                            {mood}
                            <span
                              className="ml-1 hover:text-destructive cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setArticleForm(prev => ({ ...prev, supportedMoods: prev.supportedMoods.filter(m => m !== mood) }));
                              }}
                            >
                              <X className="h-3 w-3" />
                            </span>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Select moods...</span>
                      )}
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-2 mt-1 border bg-white shadow-xl rounded-[6px]" align="start">
                  <div className="space-y-2">
                    {moods.map((mood) => (
                      <div
                        key={mood.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          if (articleForm.supportedMoods.includes(mood.name)) {
                            setArticleForm(prev => ({ ...prev, supportedMoods: prev.supportedMoods.filter(m => m !== mood.name) }));
                          } else {
                            setArticleForm(prev => ({ ...prev, supportedMoods: [...prev.supportedMoods, mood.name] }));
                          }
                          // Clear mood error when moods are selected
                          if (formErrors.supportedMoods) {
                            setFormErrors(prev => ({ ...prev, supportedMoods: undefined }));
                          }
                        }}
                      >
                        <div className={`h-4 w-4 border rounded flex items-center justify-center ${articleForm.supportedMoods.includes(mood.name) ? 'bg-primary border-primary' : 'border-input'}`}>
                          {articleForm.supportedMoods.includes(mood.name) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <span className="text-sm">{mood.name}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new mood..."
                          value={newMood}
                          onChange={(e) => setNewMood(e.target.value)}
                          className="h-8 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="sm"
                          className="h-8 bg-[#3c83f6] text-white"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (newMood.trim() && !articleMoods.includes(newMood.trim())) {
                              const newMoodName = newMood.trim();
                              try {
                                // Create mood in database
                                const headers = getAuthHeaders();
                                const response = await fetch('/api/labels/moods', {
                                  method: 'POST',
                                  headers: {
                                    ...headers,
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    name: newMoodName,
                                    status: 'active'
                                  }),
                                });
                                
                                const result = await response.json();
                                
                                if (result.success) {
                                  // Add to both arrays with real database ID
                                  setArticleMoods(prev => [...prev, newMoodName]);
                                  setMoods(prev => [...prev, result.data]);
                                  setNewMood("");
                                } else {
                                  alert('Failed to create mood: ' + result.message);
                                }
                              } catch (error) {
                                console.error('Error creating mood:', error);
                                alert('Failed to create mood');
                              }
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            {formErrors.supportedMoods && (
              <p className="text-sm text-red-500">{formErrors.supportedMoods}</p>
            )}
            </div>

              <div className="space-y-2 mt-[20px]">
              <Label>Goal <span className='text-red-500'>*</span></Label>
              <Popover open={isGoalPopoverOpen} onOpenChange={setIsGoalPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between mt-[8px] hover:bg-gray-200"
                  >
                    <span className={articleForm.goal ? "" : "text-muted-foreground"}>
                      {articleForm.goal || "Select goal..."}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-2 mt-1 border bg-white shadow-xl rounded-[6px]" align="start">
                  <div className="space-y-2">
                    {goals.map((goal) => (
                      <div
                        key={goal.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-200"
                        onClick={() => {
                          setArticleForm(prev => ({ ...prev, goal: goal.name }));
                          setIsGoalPopoverOpen(false);
                          // Clear goal error when goal is selected
                          if (formErrors.goal) {
                            setFormErrors(prev => ({ ...prev, goal: undefined }));
                          }
                        }}
                      >
                        <div className={`h-4 w-4 border rounded-full flex items-center justify-center ${articleForm.goal === goal.name ? 'bg-primary border-primary' : 'border-input'}`}>
                          {articleForm.goal === goal.name && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                        </div>
                        <span className="text-sm">{goal.name}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new goal..."
                          value={newGoal}
                          onChange={(e) => setNewGoal(e.target.value)}
                          className="h-8 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          size="sm"
                          className="h-8 bg-[#3c83f6] text-white"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (newGoal.trim() && !articleGoals.includes(newGoal.trim())) {
                              const newGoalName = newGoal.trim();
                              try {
                                // Create goal in database
                                const headers = getAuthHeaders();
                                const response = await fetch('/api/labels/goals', {
                                  method: 'POST',
                                  headers: {
                                    ...headers,
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    name: newGoalName,
                                    status: 'active'
                                  }),
                                });
                                
                                const result = await response.json();
                                
                                if (result.success) {
                                  // Add to both arrays with real database ID
                                  setArticleGoals(prev => [...prev, newGoalName]);
                                  setGoals(prev => [...prev, result.data]);
                                  setNewGoal("");
                                } else {
                                  alert('Failed to create goal: ' + result.message);
                                }
                              } catch (error) {
                                console.error('Error creating goal:', error);
                                alert('Failed to create goal');
                              }
                            }
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            {formErrors.goal && (
              <p className="text-sm text-red-500">{formErrors.goal}</p>
            )}
            </div>

              {/* <div className="space-y-2">
                <Label htmlFor="readTime">Read Time (minutes)</Label>
                <Input
                  id="readTime"
                  type="number"
                  value={articleForm.readTime}
                  onChange={(e) => setArticleForm(prev => ({ ...prev, readTime: e.target.value }))}
                  placeholder="5"
                />
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={articleForm.status}
                  onValueChange={(value: "draft" | "published") => setArticleForm(prev => ({ ...prev, status: value }))}
        
                >
                  <SelectTrigger className='mt-[8px] h-10 shadow-none border border-border bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 focus:outline-none'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value="draft" className='hover:bg-gray-200'>Draft</SelectItem>
                    <SelectItem value="published" className='hover:bg-gray-200'>Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <LoadingButton
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              loadingText="Cancelling..."
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              onClick={handleSaveAndContinue}
              loadingText="Creating..."
              className='bg-[#3c83f6] text-white'
            >
              Save & Add Content
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
     
    </div>
    </>
  );
}
