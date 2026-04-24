'use client';

// Add immediate test log
console.log('🚀 ArticleEditor.tsx file loaded - you should see this immediately');

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Plus, Trash2, ChevronUp, ChevronDown, Star, CheckCircle2, Eye, 
  Clock, Image, Type, List, Minus, Edit2, Upload, Sparkles, Link2, ExternalLink
} from "lucide-react";
import { AdminHeader } from "../../admin/layout/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthHeaders } from "@/src/utils/session.util";
import { useAdminLoading } from "@/src/contexts/AdminLoadingContext";
import { AdminLoader } from "@/src/components/admin/ui/AdminLoader";

type BlockType = "section" | "bullet-list" | "image" | "key-takeaways" | "spacer" | "reflection" | "link";

interface SectionBlock {
  type: "section";
  id: string;
  title: string;
  content: string;
}

interface BulletListBlock {
  type: "bullet-list";
  id: string;
  title: string;
  items: string[];
}

interface ImageBlock {
  type: "image";
  id: string;
  src: string | null;
  altText: string;
}

interface KeyTakeawaysBlock {
  type: "key-takeaways";
  id: string;
  items: string[];
}

interface SpacerBlock {
  type: "spacer";
  id: string;
}

interface ReflectionBlock {
  type: "reflection";
  id: string;
  heading: string;
  content: string;
}

interface LinkBlock {
  type: "link";
  id: string;
  title: string;
  url: string;
  description: string;
}

type ContentBlock = SectionBlock | BulletListBlock | ImageBlock | KeyTakeawaysBlock | SpacerBlock | ReflectionBlock | LinkBlock;

interface ArticleEditorProps {
  articleId: string;
}

export default function ArticleEditor({ articleId }: ArticleEditorProps) {
  try {
    // console.log('🔥 ArticleEditor component rendering with articleId:', articleId);
    // console.log('🔥 Component render count - you should see this on every render');
    
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Debug: Log received articleId
    console.log('ArticleEditor received articleId:', articleId);
  
  // Article metadata state - ensure these are always strings
  const titleParam = searchParams.get("title");
  const categoryParam = searchParams.get("category");
  
  console.log('Search params:', { titleParam, categoryParam });
  
  const [articleTitle, setArticleTitle] = useState(
    typeof titleParam === 'string' ? titleParam : ""
  );
  const [articleCategory, setArticleCategory] = useState(
    typeof categoryParam === 'string' ? categoryParam : ""
  );
  
  console.log('Initial state:', { articleTitle, articleCategory });
  
  // Header section state
  const [headerImage, setHeaderImage] = useState<string | null>(null);
  const [introText, setIntroText] = useState("");
  const [readTime, setReadTime] = useState("5");
  const [authorName, setAuthorName] = useState("");
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  
  // Content blocks
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { executeWithLoading } = useAdminLoading();

  // Load article data and blocks
  const loadArticleData = async () => {
    // console.log('loadArticleData called for articleId:', articleId);
    if (!articleId) {
      // console.log('No articleId, returning early');
      return;
    }
    
    try {
      setIsLoading(true);
      // console.log('Loading data for articleId:', articleId);
      
      // Load article metadata
      console.log('Making API call to:', `/api/articles/${articleId}`);
      const articleResponse = await fetch(`/api/articles/${articleId}`, {
        headers: getAuthHeaders()
      });
      // console.log('Article response status:', articleResponse.status);
      // console.log('Article response headers:', articleResponse.headers);
      // console.log('Article response ok:', articleResponse.ok);
      
      if (articleResponse.ok) {
        const articleResult = await articleResponse.json();
        console.log('Article data received:', articleResult);
        
        // Extract the actual article data from the response
        const articleData = articleResult.data || articleResult;
        console.log('Article data extracted:', articleData);
        console.log('Available fields:', Object.keys(articleData));
        
        // Update article metadata - map API fields to our state
        if (articleData.title) {
          // Update the search params or local state with article data
          const url = new URL(window.location.href);
          if (articleData.title) url.searchParams.set('title', articleData.title);
          if (articleData.category) url.searchParams.set('category', articleData.category);
          if (articleData.description || articleData.subtitle) url.searchParams.set('description', articleData.description || articleData.subtitle);
          if (articleData.readTime) url.searchParams.set('readTime', articleData.readTime.toString());
          if (articleData.authorName || articleData.author) url.searchParams.set('author', articleData.authorName || articleData.author);
          
          // Always update state with API data, using fallbacks for missing values
          setArticleTitle(articleData.title || "");
          
          if (articleData.category) {
            console.log('Category data (direct field):', articleData.category, typeof articleData.category);
            const categoryValue = typeof articleData.category === 'string' 
              ? articleData.category 
              : articleData.category?.text || articleData.category?.title || '';
            setArticleCategory(categoryValue);
          } else if (articleData.categories && Array.isArray(articleData.categories) && articleData.categories.length > 0) {
            console.log('Categories data (array):', articleData.categories);
            console.log('First category object:', articleData.categories[0]);
            console.log('Category structure:', Object.keys(articleData.categories[0]));
            
            // Extract category name from nested category object
            const categoryValue = articleData.categories[0].category?.name 
              || articleData.categories[0].name 
              || articleData.categories[0].title
              || articleData.categories[0].text
              || (typeof articleData.categories[0] === 'string' ? articleData.categories[0] : '')
              || '';
            console.log('Extracted category value:', categoryValue);
            setArticleCategory(categoryValue);
          } else {
            console.log('No category data found, setting empty string');
            setArticleCategory("");
          }
          
          // Always set description with fallback
          const descriptionValue = articleData.description 
            ? (typeof articleData.description === 'string' ? articleData.description : articleData.description?.text || articleData.description?.title || '')
            : (articleData.subtitle 
              ? (typeof articleData.subtitle === 'string' ? articleData.subtitle : articleData.subtitle?.text || articleData.subtitle?.title || '')
              : "");
          setIntroText(descriptionValue);
          
          // Always set readTime with fallback
          const readTimeValue = articleData.readTime ? articleData.readTime.toString() : "5";
          setReadTime(readTimeValue);
          
          // Always set author with fallback (handle both authorName and author fields)
          let authorValue = "";
          if (articleData.authorName) {
            authorValue = typeof articleData.authorName === 'string' ? articleData.authorName : articleData.authorName?.text || articleData.authorName?.title || '';
          } else if (articleData.author) {
            console.log('Author data:', articleData.author, typeof articleData.author);
            authorValue = typeof articleData.author === 'string' ? articleData.author : articleData.author?.text || articleData.author?.title || '';
          }
          setAuthorName(authorValue);
          
          // Always set image with fallback
          let imageUrl = '';
          console.log('🔍 Checking for image fields in articleData:', {
            headerImage: articleData.headerImage,
            thumbnailUrl: articleData.thumbnailUrl,
            image: articleData.image,
            coverImage: articleData.coverImage,
            allFields: Object.keys(articleData)
          });
          
          if (articleData.headerImage || articleData.thumbnailUrl || articleData.image || articleData.coverImage) {
            const imageValue = articleData.headerImage || articleData.thumbnailUrl || articleData.image || articleData.coverImage;
            console.log('Image data:', imageValue, typeof imageValue);
            // Handle case where image might be an object with url property
            if (typeof imageValue === 'string') {
              imageUrl = imageValue;
            } else if (imageValue && typeof imageValue === 'object' && imageValue.url) {
              imageUrl = imageValue.url;
            }
          }
          console.log('Final image URL:', imageUrl);
          setHeaderImage(imageUrl);
        }
      } else {
        console.error('Failed to load article:', articleResponse.status, articleResponse.statusText);
      }
      
      // Load blocks from all dedicated endpoints
      console.log('Loading blocks from all endpoints...');
      try {
        const [sectionsRes, bulletListsRes, imagesRes, takeawaysRes, reflectionsRes, linksRes] = await Promise.all([
          fetch(`/api/articles/${articleId}/blocks/sections`, { headers: getAuthHeaders() }),
          fetch(`/api/articles/${articleId}/blocks/bullet-lists`, { headers: getAuthHeaders() }),
          fetch(`/api/articles/${articleId}/blocks/images`, { headers: getAuthHeaders() }),
          fetch(`/api/articles/${articleId}/blocks/key-takeaways`, { headers: getAuthHeaders() }),
          fetch(`/api/articles/${articleId}/blocks/reflections`, { headers: getAuthHeaders() }),
          fetch(`/api/articles/${articleId}/blocks/links`, { headers: getAuthHeaders() })
        ]);

        const allBlocks = [];
        
        // Process sections
        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          const sectionsArray = sectionsData.data || sectionsData;
          console.log('Sections loaded:', sectionsArray.length, sectionsArray);
          allBlocks.push(...sectionsArray.map((s: SectionBlock) => ({
            ...s,
            type: 'section'
          })));
        }

        // Process bullet-lists
        if (bulletListsRes.ok) {
          const bulletListsData = await bulletListsRes.json();
          const bulletListsArray = bulletListsData.data || bulletListsData;
          console.log('Bullet-lists loaded:', bulletListsArray.length, bulletListsArray);
          allBlocks.push(...bulletListsArray.map((bl: BulletListBlock) => ({
            ...bl,
            type: 'bullet-list'
          })));
        }

        // Process images
        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          const imagesArray = imagesData.data || imagesData;
          console.log('Images loaded:', imagesArray.length, imagesArray);
          allBlocks.push(...imagesArray.map((img: Partial<ImageBlock>) => ({
            ...img,
            type: 'image'
          })));
        }

        // Process key-takeaways
        if (takeawaysRes.ok) {
          const takeawaysData = await takeawaysRes.json();
          const takeawaysArray = takeawaysData.data || takeawaysData;
          console.log('Key-takeaways loaded:', takeawaysArray.length, takeawaysArray);
          allBlocks.push(...takeawaysArray.map((kt: any) => ({
            ...kt,
            type: 'key-takeaways'
          })));
        }

        // Process reflections
        if (reflectionsRes.ok) {
          const reflectionsData = await reflectionsRes.json();
          const reflectionsArray = reflectionsData.data || reflectionsData;
          console.log('Reflections loaded:', reflectionsArray.length, reflectionsArray);
          allBlocks.push(...reflectionsArray.map((ref: Partial<ReflectionBlock>) => ({
            ...ref,
            type: 'reflection'
          })));
        }

        // Process links
        if (linksRes.ok) {
          const linksData = await linksRes.json();
          const linksArray = linksData.data || linksData;
          console.log('Links loaded:', linksArray.length, linksArray);
          allBlocks.push(...linksArray.map((link: Partial<LinkBlock>) => ({
            ...link,
            type: 'link'
          })));
        }

        // Sort all blocks by order
        allBlocks.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        console.log('Total blocks loaded:', allBlocks.length);
        console.log('Final blocks array:', allBlocks);
        
        if (allBlocks.length > 0) {
          setBlocks(allBlocks);
        } else {
          console.log('No blocks found for this article');
        }
      } catch (blocksError) {
        console.error('Error loading blocks:', blocksError);
      }
    } catch (error) {
      console.error('Error in loadArticleData:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error', error instanceof Error ? error.stack : 'No stack trace');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
      // console.log('🚀 useEffect triggered for articleId:', articleId);
      // console.log('🔍 ArticleId type and value:', typeof articleId, articleId);
      // console.log('🔍 Window location:', window.location.href);
    
    if (!articleId) {
      // console.log('❌ No articleId, returning early');
      return;
    }
    
    // Only load data on initial mount, not on every articleId change
    // This prevents overwriting blocks after save
    if (blocks.length === 0) {
      console.log('🔄 First time loading, blocks empty');
      loadArticleData();
    }
  }, [articleId]);

  // Monitor headerImage changes for debugging
  useEffect(() => {
    console.log('🖼️ headerImage state changed:', {
      hasValue: !!headerImage,
      length: headerImage?.length || 0,
      preview: headerImage?.substring(0, 50) + '...' || 'null'
    });
  }, [headerImage]);

  const handleHeaderImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // console.log('Header image upload triggered:', file);
    if (file) {
      // console.log('File details:', { name: file.name, size: file.size, type: file.type });
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // console.log('File read completed, result length:', result.length);
        // console.log('Result preview:', result.substring(0, 100) + '...');
        // console.log('🔄 About to setHeaderImage with:', result ? 'data URL (length: ' + result.length + ')' : 'null');
        setHeaderImage(result);
        // console.log('✅ setHeaderImage called');
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No file selected');
    }
  };

  const handleBlockImageUpload = (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBlocks(blocks.map(b => 
          b.id === blockId && b.type === "image" ? { ...b, src: reader.result as string } : b
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const addBlock = (type: BlockType) => {
    const id = `temp-${Date.now().toString()}`;
    let newBlock: ContentBlock;
    
    switch (type) {
      case "section":
        newBlock = { type: "section", id, title: "", content: "" };
        break;
      case "bullet-list":
        newBlock = { type: "bullet-list", id, title: "", items: [""] };
        break;
      case "image":
        newBlock = { type: "image", id, src: null, altText: "" };
        break;
      case "key-takeaways":
        newBlock = { type: "key-takeaways", id, items: [""] };
        break;
      case "spacer":
        newBlock = { type: "spacer", id };
        break;
      case "reflection":
        newBlock = { type: "reflection", id, heading: "Take a moment to reflect", content: "" };
        break;
      case "link":
        newBlock = { type: "link", id, title: "", url: "", description: "" };
        break;
    }
    
    setBlocks([...blocks, newBlock]);
    setEditingBlockId(id);
  };

  const updateBlock = <T extends ContentBlock>(id: string, updates: Partial<T>) => {
    console.log('📝 Updating block:', { id, updates });
    setBlocks(blocks.map(b => {
      if (b.id === id) {
        const updatedBlock = { ...b, ...updates };
        console.log('✅ Block updated:', updatedBlock);
        return updatedBlock;
      }
      return b;
    }));
  };

  const removeOldBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    if (editingBlockId === id) setEditingBlockId(null);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const newBlocks = [...blocks];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < blocks.length) {
      [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
      setBlocks(newBlocks);
    }
  };

  const addBulletItem = (blockId: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId && (b.type === "bullet-list" || b.type === "key-takeaways")) {
        return { ...b, items: [...b.items, ""] };
      }
      return b;
    }));
  };

  const updateBulletItem = (blockId: string, index: number, value: string) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId && (b.type === "bullet-list" || b.type === "key-takeaways")) {
        return { ...b, items: b.items.map((item, i) => i === index ? value : item) };
      }
      return b;
    }));
  };

  const removeBulletItem = (blockId: string, index: number) => {
    setBlocks(blocks.map(b => {
      if (b.id === blockId && (b.type === "bullet-list" || b.type === "key-takeaways")) {
        return { ...b, items: b.items.filter((_, i) => i !== index) };
      }
      return b;
    }));
  };

  const removeBlock = async (blockId: string, blockType: string) => {
    console.log('🗑️ Attempting to delete block:', { blockId, blockType });
    
    if (!blockId) {
      console.log('Cannot remove block: invalid ID', blockId);
      return;
    }
    
    // If it's a temporary block, just remove it from the UI
    if (blockId.startsWith('temp-')) {
      console.log('Removing temporary block from UI:', blockId);
      setBlocks(prev => prev.filter(b => b.id !== blockId));
      if (editingBlockId === blockId) setEditingBlockId(null);
      return;
    }
    
    try {
      let response: Response;
      let endpoint = '';
      
      switch (blockType) {
        case "section":
          endpoint = `/api/articles/${articleId}/blocks/sections/${blockId}`;
          response = await fetch(endpoint, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          break;
        case "bullet-list":
          endpoint = `/api/articles/${articleId}/blocks/bullet-lists/${blockId}`;
          response = await fetch(endpoint, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          break;
        case "image":
          endpoint = `/api/articles/${articleId}/blocks/images/${blockId}`;
          response = await fetch(endpoint, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          break;
        case "key-takeaways":
          endpoint = `/api/articles/${articleId}/blocks/key-takeaways/${blockId}`;
          response = await fetch(endpoint, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          break;
        case "reflection":
          endpoint = `/api/articles/${articleId}/blocks/reflections/${blockId}`;
          response = await fetch(endpoint, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          break;
        case "link":
          endpoint = `/api/articles/${articleId}/blocks/links/${blockId}`;
          response = await fetch(endpoint, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          break;
        default:
          console.log('Block type not handled for deletion:', blockType);
          return;
      }
      
      console.log('📡 DELETE request to:', endpoint);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        console.log(`${blockType} block deleted successfully`);
        setBlocks(prev => prev.filter(b => b.id !== blockId));
      } else {
        const errorText = await response.text();
        console.error(`Failed to delete ${blockType} block:`, response.status, errorText);
      }
    } catch (error) {
      console.error('Error deleting block:', error);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      console.log('🚀 Starting save process...');
      console.log('📊 Total blocks to save:', blocks.length);
      console.log('📝 Blocks details:', blocks.map(b => ({ 
        id: b.id, 
        type: b.type, 
        isTemp: b.id.startsWith('temp-'),
        hasContent: b.type === 'section' ? !!(b as any).content : 
                   b.type === 'bullet-list' ? !!(b as any).items?.length :
                   b.type === 'image' ? !!(b as any).src :
                   true
      })));
      
      // First, save article metadata (title, category, description, header image, etc.)
      const articleData = {
        title: articleTitle || "",
        category: articleCategory || "",
        description: introText || "",
        readTime: parseInt(readTime) || 5,
        authorName: authorName || "",
        thumbnailUrl: (headerImage && headerImage.trim()) ? headerImage : "",
      };
      
      console.log('💾 Saving article metadata...');
      const articleResponse = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(articleData),
      });
      
      if (!articleResponse.ok) {
        const errorText = await articleResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        console.error('❌ Failed to save article metadata:', errorData);
        alert(`Failed to save article metadata: ${errorData.error || 'Unknown error'}`);
        return;
      }

      console.log('✅ Article metadata saved successfully');

      // Save all blocks
      const savePromises = [];
      const blocksToSave = blocks.filter(block => block.id.startsWith('temp-') || !block.id.startsWith('temp-'));
      
      console.log('🔄 Processing blocks for save...', blocksToSave.length);

      for (const block of blocksToSave) {
        const order = blocks.indexOf(block);
        let savePromise: Promise<Response>;
        
        switch (block.type) {
          case "section":
            const sectionData = {
              title: (block as SectionBlock).title || "",
              content: (block as SectionBlock).content || "",
              order
            };
            
            console.log(`📝 Section block data:`, sectionData);
            console.log(`📝 Section block ID:`, block.id);
            console.log(`📝 Is new block:`, !block.id || block.id.startsWith('temp-'));
            
            if (!block.id || block.id.startsWith('temp-')) {
              console.log(`📝 Creating new section block: "${sectionData.title}"`);
              console.log(`📝 API endpoint: /api/articles/${articleId}/blocks/sections`);
              console.log(`📝 Request data:`, JSON.stringify(sectionData, null, 2));
              
              savePromise = fetch(`/api/articles/${articleId}/blocks/sections`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(sectionData),
              });
            } else {
              console.log(`📝 Updating section block: "${sectionData.title}" (${block.id})`);
              console.log(`📝 API endpoint: /api/articles/${articleId}/blocks/sections/${block.id}`);
              console.log(`📝 Request data:`, JSON.stringify(sectionData, null, 2));
              
              savePromise = fetch(`/api/articles/${articleId}/blocks/sections/${block.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(sectionData),
              });
            }
            break;
            
          case "bullet-list":
            const bulletListData = {
              title: (block as any).title || "",
              items: (block as any).items || [],
              order
            };
            
            if (!block.id || block.id.startsWith('temp-')) {
              console.log(`📝 Creating new bullet-list block: "${bulletListData.title}" with ${bulletListData.items.length} items`);
              savePromise = fetch(`/api/articles/${articleId}/blocks/bullet-lists`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(bulletListData),
              });
            } else {
              console.log(`📝 Updating bullet-list block: "${bulletListData.title}" (${block.id})`);
              savePromise = fetch(`/api/articles/${articleId}/blocks/bullet-lists/${block.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(bulletListData),
              });
            }
            break;
            
          case "spacer":
            const spacerData = {
              type: "divider",
              content: {},
              order
            };
            
            if (!block.id || block.id.startsWith('temp-')) {
              console.log(`📝 Creating new spacer block`);
              savePromise = fetch(`/api/articles/${articleId}/blocks`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(spacerData),
              });
            } else {
              console.log(`📝 Updating spacer block (${block.id})`);
              savePromise = fetch(`/api/articles/${articleId}/blocks/${block.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(spacerData),
              });
            }
            break;
            
          case "image":
            const imageData = {
              src: (block as any).src || "",
              altText: (block as any).altText || "",
              caption: (block as any).caption || "",
              order
            };
            
            if (!block.id || block.id.startsWith('temp-')) {
              console.log(`📝 Creating new image block: "${imageData.altText}"`);
              savePromise = fetch(`/api/articles/${articleId}/blocks/images`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(imageData),
              });
            } else {
              console.log(`📝 Updating image block: "${imageData.altText}" (${block.id})`);
              savePromise = fetch(`/api/articles/${articleId}/blocks/images/${block.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(imageData),
              });
            }
            break;
            
          case "key-takeaways":
            const takeawaysData = {
              title: (block as any).title || "",
              items: (block as any).items || [],
              order
            };
            
            if (!block.id || block.id.startsWith('temp-')) {
              console.log(`📝 Creating new key-takeaways block: "${takeawaysData.title}"`);
              savePromise = fetch(`/api/articles/${articleId}/blocks/key-takeaways`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(takeawaysData),
              });
            } else {
              console.log(`📝 Updating key-takeaways block: "${takeawaysData.title}" (${block.id})`);
              savePromise = fetch(`/api/articles/${articleId}/blocks/key-takeaways/${block.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(takeawaysData),
              });
            }
            break;
            
          case "reflection":
            const reflectionData = {
              heading: (block as any).heading || "",
              content: (block as any).content || "",
              prompt: (block as any).prompt || "",
              order
            };
            
            if (!block.id || block.id.startsWith('temp-')) {
              console.log(`📝 Creating new reflection block: "${reflectionData.heading}"`);
              savePromise = fetch(`/api/articles/${articleId}/blocks/reflections`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(reflectionData),
              });
            } else {
              console.log(`📝 Updating reflection block: "${reflectionData.heading}" (${block.id})`);
              savePromise = fetch(`/api/articles/${articleId}/blocks/reflections/${block.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(reflectionData),
              });
            }
            break;
            
          case "link":
            const linkData = {
              title: (block as any).title || "",
              url: (block as any).url || "",
              description: (block as any).description || "",
              order
            };
            
            if (!block.id || block.id.startsWith('temp-')) {
              console.log(`📝 Creating new link block: "${linkData.title}"`);
              savePromise = fetch(`/api/articles/${articleId}/blocks/links`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(linkData),
              });
            } else {
              console.log(`📝 Updating link block: "${linkData.title}" (${block.id})`);
              savePromise = fetch(`/api/articles/${articleId}/blocks/links/${block.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(linkData),
              });
            }
            break;
        }
        
        // Add the save promise to the array
        savePromises.push(
          savePromise.then(async (response) => {
            if (response.ok) {
              const result = await response.json();
              console.log(`✅ ${block.type} block saved successfully:`, result);
              
              // Update block ID if it was a newly created block
              if (block.id.startsWith('temp-') && result.data?.id) {
                setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, id: result.data.id } : b));
              }
            } else {
              console.error(`❌ Failed to save ${block.type} block:`, await response.text());
            }
          }).catch(error => {
            console.error(`❌ Error saving ${block.type} block:`, error);
          })
        );
      }
      
      console.log(`⏳ Waiting for ${savePromises.length} block saves to complete...`);
      
      // Wait for all blocks to save
      const results = await Promise.allSettled(savePromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`📊 Save results: ${successful} successful, ${failed} failed`);
      
      if (failed === 0) {
        console.log('🎉 All blocks saved successfully to database!');
        // Show success confirmation
        setIsSaveConfirmOpen(true);
        
        // No need to refresh since blocks are already updated in real-time
        // The setBlocks calls in save promises already updated the state
      } else {
        console.error(`❌ ${failed} blocks failed to save`);
        alert(`${failed} blocks failed to save. Check console for details.`);
      }
      
    } catch (error) {
      console.error('❌ Error in save process:', error);
      alert('Failed to save article content');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSave = () => {
    setIsSaveConfirmOpen(false);
    router.push("/admin/library");
  };

  const handlePreview = () => {
    const params = new URLSearchParams({
      title: articleTitle,
      category: articleCategory,
      readTime: readTime,
      intro: introText,
      author: authorName,
    });
    if (headerImage) {
      params.set("headerImage", headerImage);
    }
    router.push(`/admin/library/article/preview?${params.toString()}`);
  };

  const BlockControls = ({ index, blockId }: { index: number; blockId: string }) => (
    <div className="absolute -left-12 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 bg-background border shadow-sm"
        onClick={() => moveBlock(index, "up")}
        disabled={index === 0}
      >
        <ChevronUp className="h-4 w-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-7 w-7 bg-background border shadow-sm"
        onClick={() => moveBlock(index, "down")}
        disabled={index === blocks.length - 1}
      >
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  );

  const BlockActions = ({ blockId, blockType }: { blockId: string; blockType: string }) => (
    <div className="absolute -right-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 bg-background border shadow-sm">
            <Trash2 className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem 
            onClick={() => {
              console.log('🗑️ Delete button clicked!', { blockId, blockType });
              removeBlock(blockId, blockType);
            }} 
            className="text-destructive"
          >
            Delete Block
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-muted/30">
      <AdminHeader 
        title="Article Template Editor" 
        subtitle={`Editing: ${articleTitle}`}
        showTimeFilter={false}
        
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push("/admin/library")}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => router.push(`/admin/library/preview/${articleId}`)} className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="bg-[#3c83f6] text-white">
              {isLoading ? 'Saving...' : 'Save Article'}
            </Button>
          </div>
        }
      />
      
      <div className="flex-1 overflow-auto animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <AdminLoader message="Loading article content..." />
          </div>
        ) : (
          /* Live Template Editor - Mirrors Student UI */
          <div className="max-w-4xl mx-auto">
          
          {/* ===== MAIN HEADER TEMPLATE (Editable) ===== */}
          <div 
            className="relative group cursor-pointer bg-[#3c83f6] text-white"
            onClick={() => setIsEditingHeader(true)}
          >
            {/* Debug overlay for header image */}
            {/* {process.env.NODE_ENV === 'development' && headerImage && (
              <div className="absolute top-0 left-0 bg-yellow-400 text-black text-xs p-1 z-50">
                DEBUG: Header Image Set
              </div>
            )} */}
            <div 
              className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground"
              style={headerImage ? { 
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${headerImage})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
              } : undefined}
            >
              <div className="max-w-3xl mx-auto px-6 py-12">
                <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0 mb-4">
                  {articleCategory}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{articleTitle}</h1>
                <p className="text-primary-foreground/80 text-lg mb-4">
                  {introText || "Click to add introduction text..."}
                </p>
                <div className="flex items-center gap-4 text-primary-foreground/70">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{readTime} min read</span>
                  </div>
                  {authorName && (
                    <span className="text-sm">by {authorName}</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Edit Overlay */}
            <div className="absolute inset-0 bg-background/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-background/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
                <Edit2 className="h-4 w-4" />
                <span className="text-sm font-medium">Click to edit header</span>
              </div>
            </div>
          </div>

          {/* Header Edit Modal */}
          {isEditingHeader && (
            <div className="border-x border-b border-primary/30 bg-background p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Edit Header Section</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingHeader(false)}>
                  Done
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Header Image (Optional)</Label>
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('header-image-upload')?.click()}
                  >
                    {headerImage ? (
                      <div className="relative">
                        <img 
                          src={headerImage} 
                          alt="Header" 
                          className="w-full h-20 object-cover rounded" 
                          onLoad={() => console.log('🖼️ Editor thumbnail loaded successfully')}
                          onError={(e) => console.error('❌ Editor thumbnail failed to load:', e)}
                        />
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="absolute top-1 right-1 h-6 text-xs"
                          onClick={(e) => { e.stopPropagation(); setHeaderImage(null); }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Image className="h-6 w-6 mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">Upload image</p>
                      </div>
                    )}
                    <input 
                      id="header-image-upload"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleHeaderImageUpload}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Read Time (minutes)</Label>
                  <Input 
                    type="number"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Author Name</Label>
                <Input 
                  placeholder="Enter author name..."
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Introduction / Subtitle</Label>
                <Textarea 
                  placeholder="Write a compelling introduction..."
                  value={introText}
                  onChange={(e) => setIntroText(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* ===== CONTENT BLOCKS ===== */}
          <div className="bg-background px-6 py-8">
            <div className="max-w-3xl mx-auto space-y-6 relative">
              
              {blocks.map((block, index) => (
                <div key={block.id} className="group relative pl-14 pr-12">
                  <BlockControls index={index} blockId={block.id} />
                  <BlockActions blockId={block.id} blockType={block.type} />
                  
                  {/* Section Block */}
                  {block.type === "section" && (
                    <div className="space-y-3">
                      {editingBlockId === block.id ? (
                        <div className="space-y-3 p-4 border border-[#3c83f6] rounded-lg bg-muted/30">
                          <Input 
                            placeholder="Section Title"
                            value={block.title || ""}
                            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                            className="text-xl font-bold border-none bg-transparent p-0 h-auto text-[#3c83f6] focus-visible:ring-0"
                          />
                          <Textarea 
                            placeholder="Write paragraph content..."
                            value={block.content || ""}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            className="border-none bg-transparent p-0 resize-none focus-visible:ring-0"
                            rows={4}
                          />
                          <Button variant="ghost" size="sm" onClick={() => setEditingBlockId(null)}>
                            Done Editing
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors"
                          onClick={() => {
                            console.log('✏️ Edit section block clicked!', { blockId: block.id, blockType: block.type });
                            setEditingBlockId(block.id);
                          }}
                        >
                          <h2 className="text-2xl font-bold text-[#3c83f6]">
                            {typeof block.title === 'string' 
                              ? block.title 
                              : (block.title as any)?.text || (block.title as any)?.title || "Click to add section title..."}
                          </h2>
                          <p className="text-[#0f1729cc] leading-relaxed mt-2">
                            {typeof block.content === 'string' 
                              ? block.content 
                              : (block.content as any)?.text || (block.content as any)?.title || "Click to add content..."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bullet List Block */}
                  {block.type === "bullet-list" && (
                    <div className="space-y-3">
                      {editingBlockId === block.id ? (
                        <div className="space-y-3 p-4 border border-primary/30 rounded-lg bg-muted/30">
                          <Input 
                            placeholder="List Title (optional)"
                            value={block.title || ""}
                            onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                            className="text-xl font-bold border-none bg-transparent p-0 h-auto text-[#3c83f6] focus-visible:ring-0"
                          />
                          <div className="space-y-2">
                            {block.items.map((item: string, i: number) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3c83f6] shrink-0" />
                                <Input 
                                  placeholder="Bullet point..."
                                  value={item || ""}
                                  onChange={(e) => updateBulletItem(block.id, i, e.target.value)}
                                  className="flex-1"
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => removeBulletItem(block.id, i)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="ghost" size="sm" onClick={() => addBulletItem(block.id)}>
                              <Plus className="h-3 w-3 mr-1" /> Add Point
                            </Button>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setEditingBlockId(null)}>
                            Done Editing
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="cursor-pointer hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors"
                          onClick={() => setEditingBlockId(block.id)}
                        >
                          {block.title && (
                            <h2 className="text-2xl font-bold text-[#3c83f6] mb-3">
                              {typeof block.title === 'string' ? block.title : (block.title as any)?.text || (block.title as any)?.title || ''}
                            </h2>
                          )}
                          <ul className="space-y-2 pl-4">
                            {block.items.filter(i => i).map((item, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3c83f6] mt-2 shrink-0" />
                                <span className="text-foreground/80">{item}</span>
                              </li>
                            ))}
                            {block.items.filter(i => i).length === 0 && (
                              <li className="text-muted-foreground">Click to add bullet points...</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Image Block */}
                  {block.type === "image" && (
                    <div className="space-y-2">
                      {block.src ? (
                        <div className="relative group/img">
                          <img 
                            src={block.src} 
                            alt={block.altText || "Article image"} 
                            className="w-full rounded-xl object-cover max-h-80"
                          />
                          {editingBlockId === block.id && (
                            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-3 rounded-xl">
                              <div className="space-y-2 w-64">
                                <Label>Alt Text (optional)</Label>
                                <Input 
                                  placeholder="Describe this image..."
                                  value={block.altText || ""}
                                  onChange={(e) => updateBlock(block.id, { altText: e.target.value })}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => document.getElementById(`block-image-${block.id}`)?.click()}
                                >
                                  <Upload className="h-3 w-3 mr-1" /> Replace
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setEditingBlockId(null)}>
                                  Done
                                </Button>
                              </div>
                              <input 
                                id={`block-image-${block.id}`}
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => handleBlockImageUpload(block.id, e)}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div 
                          className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => document.getElementById(`block-image-${block.id}`)?.click()}
                        >
                          <Image className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">Click to upload image</p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                          <input 
                            id={`block-image-${block.id}`}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleBlockImageUpload(block.id, e)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Key Takeaways Block */}
                  {block.type === "key-takeaways" && (
                    <Card className="border-[#cbdefa] bg-[#eff4fa]">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Star className="h-5 w-5 text-[#f59f0a] fill-[#f59f0a]" />
                          <h3 className="font-bold text-lg text-foreground">Key Takeaways</h3>
                        </div>
                        
                        {editingBlockId === block.id ? (
                          <div className="space-y-3">
                            {block.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-[#21c45d] shrink-0" />
                                <Input 
                                  placeholder="Key takeaway..."
                                  value={item || ""}
                                  onChange={(e) => updateBulletItem(block.id, i, e.target.value)}
                                  className="flex-1"
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => removeBulletItem(block.id, i)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => addBulletItem(block.id)}>
                                <Plus className="h-3 w-3 mr-1" /> Add Takeaway
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setEditingBlockId(null)}>
                                Done Editing
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <ul 
                            className="space-y-3 cursor-pointer"
                            onClick={() => setEditingBlockId(block.id)}
                          >
                            {block.items.filter(i => i).map((item, i) => (
                              <li key={i} className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-[#21c45d] shrink-0 mt-0.5" />
                                <span className="text-foreground/80">{item}</span>
                              </li>
                            ))}
                            {block.items.filter(i => i).length === 0 && (
                              <li className="text-muted-foreground">Click to add key takeaways...</li>
                            )}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Spacer Block */}
                  {block.type === "spacer" && (
                    <div className="h-8 border-t border-dashed border-border/50 relative">
                      <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-background px-2 text-xs text-muted-foreground">
                        Spacer
                      </span>
                    </div>
                  )}

                  {/* Reflection Block */}
                  {block.type === "reflection" && (
                    <Card className="border-[#cbdefa] bg-[#eff4fa]">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Sparkles className="h-5 w-5 text-[#3c83f6]" />
                          <h3 className="font-bold text-lg text-foreground">Reflect & Think</h3>
                        </div>
                        
                        {editingBlockId === block.id ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm text-[#0f1729cc]">Reflection Heading (optional)</Label>
                              <Input 
                                placeholder="e.g., Take a moment to reflect"
                                value={block.heading || ""}
                                onChange={(e) => updateBlock(block.id, { heading: e.target.value })}
                                className="mt-[10px] bg-white"
                              />
                            </div>
                            <div>
                              <Label className="text-sm text-[#0f1729cc]">Reflection Content</Label>
                              <Textarea 
                                placeholder="Write guidance for learner to internalize key ideas, summarize learnings, or reflect calmly..."
                                value={block.content || ""}
                                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                                rows={5}
                                className="resize-none mt-[10px] focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 mb-[10px] bg-white"
                              />
                              <p className="text-xs text-[#0f1729cc]">Tip: Bullet points and soft emojis are allowed</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setEditingBlockId(null)}>
                              Done Editing
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-primary/5 rounded-lg p-2 -m-2 transition-colors"
                            onClick={() => setEditingBlockId(block.id)}
                          >
                            {block.heading && (
                              <p className="text-sm font-medium text-primary mb-2 italic">{block.heading}</p>
                            )}
                            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                              {typeof block.content === 'string' 
                                ? block.content 
                                : (block.content as any)?.text || (block.content as any)?.title || "Click to add reflection content..."}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Link Block */}
                  {block.type === "link" && (
                    <div className="space-y-3">
                      {editingBlockId === block.id ? (
                        <div className="space-y-3 p-4 border border-primary/30 rounded-lg bg-muted/30">
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Link Title</Label>
                            <Input 
                              placeholder="e.g., Learn more about anxiety"
                              value={block.title || ""}
                              onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">URL</Label>
                            <Input 
                              placeholder="https://example.com"
                              value={block.url || ""}
                              onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                              type="url"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Description (optional)</Label>
                            <Input 
                              placeholder="Brief description of link..."
                              value={block.description || ""}
                              onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                            />
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setEditingBlockId(null)}>
                            Done Editing
                          </Button>
                        </div>
                      ) : (
                        <Card 
                          className="border-border hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => setEditingBlockId(block.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Link2 className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground truncate">
                                    {typeof block.title === 'string' 
                                      ? block.title 
                                      : (block.title as any)?.text || (block.title as any)?.title || "Click to add link title..."}
                                  </span>
                                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                </div>
                                {block.url && (
                                  <p className="text-xs text-primary/70 truncate mt-0.5">{block.url}</p>
                                )}
                                {block.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{block.description}</p>
                                )}
                                {!block.title && !block.url && (
                                  <p className="text-sm text-muted-foreground mt-0.5">Click to add URL...</p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Add Block Buttons */}
              <div className="flex items-center justify-center gap-2 pt-6 border-t border-dashed border-border">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 ">
                      <Plus className="h-4 w-4" />
                      Add Block
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bg-white">
                    <DropdownMenuItem onClick={() => addBlock("section")}>
                      <Type className="h-4 w-4 mr-2" />
                      Section (Title + Text)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addBlock("bullet-list")}>
                      <List className="h-4 w-4 mr-2" />
                      Bullet List
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addBlock("image")}>
                      <Image className="h-4 w-4 mr-2" />
                      Image
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addBlock("key-takeaways")}>
                      <Star className="h-4 w-4 mr-2" />
                      Key Takeaways
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addBlock("spacer")}>
                      <Minus className="h-4 w-4 mr-2" />
                      Spacer / Divider
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addBlock("reflection")}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Reflection Section
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addBlock("link")}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* ===== RATING SECTION (Fixed - Read Only) ===== */}
          <div className="bg-background px-6 pb-8">
            <div className="max-w-3xl mx-auto">
              <Card className="border-border">
                <CardContent className="p-6 text-center">
                  <h3 className="font-semibold text-foreground mb-2">How helpful was this article?</h3>
                  <p className="text-sm text-muted-foreground mb-4">Your feedback helps us improve</p>
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-8 w-8 text-gray-500/30" />
                    ))}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Ratings will appear after learners engage
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* ===== COMPLETE LESSON CTA (Fixed) ===== */}
          <div className="bg-background px-6 pb-12">
            <div className="max-w-3xl mx-auto text-center">
              <Button size="lg" className="min-w-64 bg-[#3c83f6] text-white" disabled>
                Complete Lesson
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This button is visible to learners only
              </p>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Save Confirmation Dialog */}
      {isSaveConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Save Article Content?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will save all your article content and template settings.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsSaveConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmSave}>
                Save Article
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error('❌ Component error:', error);
    return <div>Error loading editor: {error instanceof Error ? error.message : 'Unknown error'}</div>;
  }
}
