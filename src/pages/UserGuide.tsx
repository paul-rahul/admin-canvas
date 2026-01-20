import { useEffect, useState, useRef } from 'react';
import { Header } from '@/components/dashboard/Header';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { mockFeedback } from '@/data/mockFeedback';
import { NeedsAttentionOverlay, buildNeedsAttentionData } from '@/components/dashboard/NeedsAttentionOverlay';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

// Helper function to generate ID from text
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const UserGuide = () => {
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const needsAttentionData = useMemo(() => buildNeedsAttentionData(mockFeedback), []);
  const needsAttentionContent = useMemo(
    () => <NeedsAttentionOverlay data={needsAttentionData} />,
    [needsAttentionData]
  );

  // Handle scroll visibility and hash navigation
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    
    // Handle hash navigation on load
    if (window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const id = href.substring(1);
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 80; // Account for fixed header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    const loadUserGuide = async () => {
      try {
        const response = await fetch('/USER_GUIDE.md');
        if (!response.ok) {
          throw new Error('Failed to load user guide');
        }
        const text = await response.text();
        setMarkdownContent(text);
      } catch (error) {
        console.error('Error loading user guide:', error);
        setMarkdownContent('# User Guide\n\nFailed to load user guide content.');
      } finally {
        setIsLoading(false);
        setLastUpdatedAt(new Date());
      }
    };

    loadUserGuide();
  }, []);

  // Handle hash navigation after content loads
  useEffect(() => {
    if (!isLoading && markdownContent && window.location.hash) {
      setTimeout(() => {
        const id = window.location.hash.substring(1);
        const element = document.getElementById(id);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  }, [isLoading, markdownContent]);

  return (
    <div className="min-h-screen bg-muted">
      <Header
        onRefresh={() => setLastUpdatedAt(new Date())}
        lastUpdatedAt={lastUpdatedAt}
        needsAttentionContent={needsAttentionContent}
        insightsContent={needsAttentionContent}
        alertCount={needsAttentionData.alerts.length}
      />
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        <div className="glass rounded-lg border border-border/50 p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-muted-foreground">Loading User Guide...</div>
            </div>
          ) : (
            <div ref={contentRef} className="max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, children, ...props }: any) => {
                    const id = slugify(String(children));
                    return (
                      <h1 
                        id={id}
                        className="text-3xl font-bold text-foreground mt-8 mb-4 border-b border-border pb-2 scroll-mt-20" 
                        {...props}
                      >
                        {children}
                      </h1>
                    );
                  },
                  h2: ({ node, children, ...props }: any) => {
                    const id = slugify(String(children));
                    return (
                      <h2 
                        id={id}
                        className="text-2xl font-semibold text-foreground mt-6 mb-3 scroll-mt-20" 
                        {...props}
                      >
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ node, children, ...props }: any) => {
                    const id = slugify(String(children));
                    return (
                      <h3 
                        id={id}
                        className="text-xl font-semibold text-foreground mt-5 mb-2 scroll-mt-20" 
                        {...props}
                      >
                        {children}
                      </h3>
                    );
                  },
                  h4: ({ node, children, ...props }: any) => {
                    const id = slugify(String(children));
                    return (
                      <h4 
                        id={id}
                        className="text-lg font-medium text-foreground mt-4 mb-2 scroll-mt-20" 
                        {...props}
                      >
                        {children}
                      </h4>
                    );
                  },
                  p: ({ node, ...props }) => (
                    <p className="text-muted-foreground mb-4 leading-relaxed" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc mb-4 space-y-2 text-muted-foreground ml-6" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal mb-4 space-y-2 text-muted-foreground ml-6" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="pl-2 leading-relaxed" {...props} />
                  ),
                  code: ({ node, inline, children, ...props }: any) => {
                    if (inline) {
                      return (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono text-foreground mb-4" {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ node, children, ...props }: any) => (
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4" {...props}>
                      {children}
                    </pre>
                  ),
                  a: ({ node, href, ...props }: any) => {
                    const isAnchorLink = href?.startsWith('#');
                    return (
                      <a 
                        className="text-primary hover:text-primary/80 underline" 
                        href={href}
                        target={isAnchorLink ? undefined : "_blank"}
                        rel={isAnchorLink ? undefined : "noreferrer"}
                        onClick={isAnchorLink ? (e) => handleAnchorClick(e, href) : undefined}
                        {...props} 
                      />
                    );
                  },
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="min-w-full border border-border rounded-lg" {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }) => (
                    <thead className="bg-muted" {...props} />
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border border-border px-4 py-2 text-left font-semibold text-foreground" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border border-border px-4 py-2 text-muted-foreground" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4" {...props} />
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="border-border my-8" {...props} />
                  ),
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
      
      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/60 transition-all duration-200"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default UserGuide;
