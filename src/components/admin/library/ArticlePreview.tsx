'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Star, CheckCircle2, Eye, Edit2 } from "lucide-react";
import { AdminHeader } from "@/src/components/admin/layout/AdminHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthHeaders } from "@/src/utils/session.util";
import { useAdminLoading } from "@/src/contexts/AdminLoadingContext";
import { AdminLoader } from "@/src/components/admin/ui/AdminLoader";

interface ArticlePreviewProps {
  articleId: string;
}

interface ContentSection {
  id: string;
  title: string;
  content: string;
  bulletPoints: string[];
  image: string | null;
}

interface KeyTakeaway {
  id: string;
  text: string;
}

export default function ArticlePreview({ articleId }: ArticlePreviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const { executeWithLoading } = useAdminLoading();
  
  // Get URL params for fallback
  const articleTitle = searchParams.get("title") || "";
  const articleCategory = searchParams.get("category") || "";
  const readTime = searchParams.get("readTime") || "5";
  const introText = searchParams.get("intro") || "";
  const headerImage = searchParams.get("headerImage") || null;
  const authorName = searchParams.get("author") || "";
  
  useEffect(() => {
    fetchArticle();
    fetchBlocks();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      console.log('🔍 Fetching article with ID:', articleId);
      const response = await fetch(`/api/articles/${articleId}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      console.log('📄 Article response:', data);
      if (data.success) {
        console.log('🖼️ Article thumbnailUrl:', data.data.thumbnailUrl);
        console.log('🖼️ Full article data:', JSON.stringify(data.data, null, 2));
        setArticle(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      console.log('🔍 Fetching blocks for article:', articleId);
      
      // Fetch all block types from their dedicated endpoints
      const [sectionsRes, bulletListsRes, imagesRes, takeawaysRes, reflectionsRes, linksRes] = await Promise.all([
        fetch(`/api/articles/${articleId}/blocks/sections`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/articles/${articleId}/blocks/bullet-lists`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/articles/${articleId}/blocks/images`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/articles/${articleId}/blocks/key-takeaways`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/articles/${articleId}/blocks/reflections`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/articles/${articleId}/blocks/links`, {
          headers: getAuthHeaders()
        })
      ]);

      const allBlocks = [];
      
      // Process sections
      if (sectionsRes.ok) {
        const sectionsData = await sectionsRes.json();
        const sectionsArray = sectionsData.data || sectionsData;
        console.log('� Sections loaded:', sectionsArray.length, sectionsArray);
        allBlocks.push(...sectionsArray.map((s: any) => ({
          ...s,
          type: 'section'
        })));
      }

      // Process bullet-lists
      if (bulletListsRes.ok) {
        const bulletListsData = await bulletListsRes.json();
        const bulletListsArray = bulletListsData.data || bulletListsData;
        console.log('� Bullet-lists loaded:', bulletListsArray.length, bulletListsArray);
        allBlocks.push(...bulletListsArray.map((bl: any) => ({
          ...bl,
          type: 'bullet-list'
        })));
      }

      // Process images
      if (imagesRes.ok) {
        const imagesData = await imagesRes.json();
        const imagesArray = imagesData.data || imagesData;
        console.log('🖼️ Images loaded:', imagesArray.length, imagesArray);
        allBlocks.push(...imagesArray.map((img: any) => ({
          ...img,
          type: 'image'
        })));
      }

      // Process key-takeaways
      if (takeawaysRes.ok) {
        const takeawaysData = await takeawaysRes.json();
        const takeawaysArray = takeawaysData.data || takeawaysData;
        console.log('⭐ Key-takeaways loaded:', takeawaysArray.length, takeawaysArray);
        allBlocks.push(...takeawaysArray.map((kt: any) => ({
          ...kt,
          type: 'key-takeaways'
        })));
      }

      // Process reflections
      if (reflectionsRes.ok) {
        const reflectionsData = await reflectionsRes.json();
        const reflectionsArray = reflectionsData.data || reflectionsData;
        console.log('🤔 Reflections loaded:', reflectionsArray.length, reflectionsArray);
        allBlocks.push(...reflectionsArray.map((ref: any) => ({
          ...ref,
          type: 'reflection'
        })));
      }

      // Process links
      if (linksRes.ok) {
        const linksData = await linksRes.json();
        const linksArray = linksData.data || linksData;
        console.log('🔗 Links loaded:', linksArray.length, linksArray);
        allBlocks.push(...linksArray.map((link: any) => ({
          ...link,
          type: 'link'
        })));
      }

      // Sort all blocks by order
      allBlocks.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      console.log('✅ Setting blocks:', allBlocks.length, allBlocks);
      setBlocks(allBlocks);
      
    } catch (error) {
      console.error('Failed to fetch blocks:', error);
    }
  };

  const renderBlock = (block: any) => {
    console.log('🎨 Rendering block:', block);
    switch (block.type) {
      case 'section':
        return (
          <div key={block.id} className="space-y-4">
            {block.title && (
              <h2 className="text-2xl font-bold text-[#3c83f6]">{block.title}</h2>
            )}
            {block.content && (
              <p className="text-foreground/80 leading-relaxed">{block.content}</p>
            )}
          </div>
        );

      case 'bullet-list':
        return (
          <div key={block.id} className="space-y-4">
            {block.title && (
              <h2 className="text-2xl font-bold text-[#3c83f6]">{block.title}</h2>
            )}
            {block.items && block.items.length > 0 && (
              <ul className="space-y-2 pl-4">
                {block.items.map((point: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c83f6] mt-2 shrink-0" />
                    <span className="text-foreground/80">{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'image':
        return (
          <div key={block.id} className="my-6">
            {block.src && (
              <img
                src={block.src}
                alt={block.altText || ''}
                className="w-full rounded-xl object-cover max-h-64"
              />
            )}
            {block.altText && (
              <p className="text-sm text-muted-foreground mt-2 italic">{block.altText}</p>
            )}
          </div>
        );

      case 'key-takeaways':
        return (
          <Card key={block.id} className="border-[#cbdefa] bg-[#eff4fa]">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-[#f59f0a] fill-[#f59f0a]" />
                <h3 className="font-bold text-lg text-foreground">Key Takeaways</h3>
              </div>
              <ul className="space-y-3">
                {(block.items || []).map((point: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#21c45d] shrink-0 mt-0.5" />
                    <span className="text-foreground/80">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );

      case 'reflection':
        return (
          <div key={block.id} className="border-[#cbdefa] bg-[#eff4fa] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Edit2 className="h-5 w-5 text-[#3c83f6]" />
              <h3 className="font-bold text-lg text-foreground">Reflect & Think</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-[#0f1729cc]">Reflection Content</p>
                <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <p className="text-foreground/80 italic text-center">{block.content}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader 
          title="Article Preview" 
          subtitle="Student-facing view"
          showTimeFilter={false}
          actions={
            <Button variant="outline" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Editor
            </Button>
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <AdminLoader message="Loading preview..." />
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col min-h-screen">
        <AdminHeader 
          title="Article Preview" 
          subtitle="Student-facing view"
          showTimeFilter={false}
          actions={
            <Button variant="outline" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Editor
            </Button>
          }
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-muted-foreground mb-2">Article not found</p>
            <p className="text-sm text-muted-foreground">The article you're trying to preview doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const categoryName = article.categories?.[0]?.name || articleCategory || "General";
  const finalHeaderImage = article.thumbnailUrl || headerImage || null;
  
  console.log('🎨 Rendering article with:', {
    title: article.title,
    thumbnailUrl: article.thumbnailUrl,
    headerImage: finalHeaderImage,
    categoryName: categoryName
  });
 
  return (
    <div className="flex flex-col min-h-screen">
      <AdminHeader 
        title="Article Preview" 
        subtitle="Student-facing view"
        showTimeFilter={false}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/admin/library/editor/${articleId}`)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Editor
            </Button>
          </div>
        }
      />
      
      <div className="flex-1 overflow-auto">
        {/* Article Hero Header */}
        <div className="relative">
          <div 
            className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground"
            style={finalHeaderImage ? { 
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${finalHeaderImage})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center' 
            } : undefined}
          >
            <div className="max-w-3xl mx-auto px-6 py-12">
              <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-0 mb-4">
                {categoryName}
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
              <p className="text-primary-foreground/80 text-lg mb-4">
                {article.description || introText || "Click to add introduction text..."}
              </p>
              <div className="flex items-center gap-4 text-primary-foreground/70">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{article.readTime || readTime || 5} min read</span>
                </div>
                <span className="text-sm">by {article.authorName || authorName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* Article Content Blocks */}
          {blocks
            .sort((a, b) => a.order - b.order)
            .map((block) => renderBlock(block))}
        </div>
      </div>
    </div>
  );
}
