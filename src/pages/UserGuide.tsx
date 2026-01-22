import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useInView } from 'react-intersection-observer';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Extract table of contents from markdown
const extractTOC = (markdown: string): Array<{ id: string; title: string; level: number; index: number }> => {
  const toc: Array<{ id: string; title: string; level: number; index: number }> = [];
  const lines = markdown.split('\n');
  let skipUntilNextSection = false;
  let foundTOCHeader = false;
  let h2Index = 0;
  let h3Index = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect start of TOC section - skip it
    if (line.match(/^##\s+Table of Contents$/i)) {
      foundTOCHeader = true;
      skipUntilNextSection = true;
      continue;
    }
    
    // Detect end of TOC section (horizontal rule)
    if (skipUntilNextSection && line.match(/^---$/)) {
      skipUntilNextSection = false;
      continue;
    }
    
    // Skip lines while we're in the TOC section
    if (skipUntilNextSection) {
      continue;
    }
    
    // Only process headers after we've found and skipped the TOC section
    if (!foundTOCHeader) {
      continue;
    }
    
    // Match markdown headers (H2 and H3 for main content sections)
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
    
    if (h2Match) {
      const title = h2Match[1].trim();
      // Skip if it's the TOC section header
      if (title.toLowerCase() === 'table of contents') {
        continue;
      }
      h2Index++;
      h3Index = 0; // Reset H3 index when we encounter a new H2
      const baseId = slugify(title);
      // Make ID unique by appending index if there are duplicates
      const id = `${baseId}-${h2Index}`;
      toc.push({ id, title, level: 2, index: h2Index });
    } else if (h3Match) {
      const title = h3Match[1].trim();
      h3Index++;
      const baseId = slugify(title);
      // Make ID unique by including both H2 and H3 indices
      const id = `${baseId}-${h2Index}-${h3Index}`;
      toc.push({ id, title, level: 3, index: h3Index });
    }
  }
  
  return toc;
};

// Slugify function to create IDs from headers (matches GitHub markdown link format)
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/&/g, '') // Remove & symbols (GitHub removes them)
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .trim();
};

// Component to wrap each heading with intersection observer
const HeadingWithObserver = ({
  id,
  level,
  children,
  onInView,
  className,
  rootElement,
}: {
  id: string;
  level: number;
  children: React.ReactNode;
  onInView: (id: string, inView: boolean, entry: IntersectionObserverEntry) => void;
  className: string;
  rootElement: HTMLElement | null;
}) => {
  const { ref, entry } = useInView({
    threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    rootMargin: '-100px 0px -50% 0px', // Trigger when heading is 100px from top
    root: rootElement, // Use the scroll container as root
    onChange: (inView, entry) => {
      onInView(id, inView, entry);
    },
  });

  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  const elementRef = useRef<HTMLElement>(null);
  
  // Combine refs: one for intersection observer, one to ensure ID is set
  const combinedRef = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
    // Call the intersection observer ref
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref && typeof ref === 'object') {
      (ref as React.MutableRefObject<HTMLElement | null>).current = node;
    }
    
    // Ensure ID is set
    if (node && node.id !== id) {
      node.id = id;
    }
  }, [ref, id]);
  
  // Also set ID in useEffect as backup
  useEffect(() => {
    if (elementRef.current && elementRef.current.id !== id) {
      elementRef.current.id = id;
    }
  }, [id]);
  
  return (
    <HeadingTag ref={combinedRef} id={id} className={className}>
      {children}
    </HeadingTag>
  );
};

const UserGuide = () => {
  const [markdown, setMarkdown] = useState<string>('');
  const [toc, setToc] = useState<Array<{ id: string; title: string; level: number; index: number }>>([]);
  const [activeSection, setActiveSection] = useState<string>('');
  const [sectionVisibility, setSectionVisibility] = useState<Map<string, number>>(new Map());
  const mainContentRef = useRef<HTMLElement>(null);
  const tocNavRef = useRef<HTMLElement>(null);
  const isScrollingRef = useRef(false);
  
  // Create a fresh counter object for each ReactMarkdown render
  // This will be reset every time ReactMarkdown renders
  const createHeaderCounter = () => {
    let h2Count = 0;
    let h3Count = 0;
    return {
      getH2Position: () => {
        const pos = h2Count;
        h2Count++;
        h3Count = 0; // Reset H3 counter when H2 increments
        return pos;
      },
      getH3Position: () => {
        const pos = h3Count;
        h3Count++;
        return pos;
      },
      getCurrentH2Count: () => h2Count,
    };
  };

  // Handle section visibility changes from intersection observer
  const handleSectionInView = useCallback((id: string, inView: boolean, entry: IntersectionObserverEntry) => {
    if (isScrollingRef.current) return; // Don't update during programmatic scroll
    
    setSectionVisibility((prev) => {
      const newMap = new Map(prev);
      if (inView && entry) {
        // Use the intersection ratio from the observer entry
        // Also track the top position to determine which is "topmost"
        const element = entry.target as HTMLElement;
        const containerRect = mainContentRef.current?.getBoundingClientRect();
        if (containerRect) {
          const elementRect = element.getBoundingClientRect();
          // Calculate distance from top of viewport (100px reading point)
          const distanceFromTop = Math.abs(elementRect.top - containerRect.top - 100);
          // Store both ratio and distance - we'll use distance to find topmost
          newMap.set(id, entry.intersectionRatio * 1000 - distanceFromTop); // Higher value = more visible and closer to top
        } else {
          newMap.set(id, entry.intersectionRatio);
        }
      } else {
        newMap.delete(id);
      }
      return newMap;
    });
  }, []);

  // Update active section based on visibility - prioritize topmost visible section
  useEffect(() => {
    if (isScrollingRef.current) return; // Don't update during programmatic scroll
    
    if (sectionVisibility.size === 0) {
      // If nothing is visible, check scroll position
      if (mainContentRef.current && toc.length > 0) {
        const scrollTop = mainContentRef.current.scrollTop;
        if (scrollTop < 100) {
          // Near top, activate first section
          if (toc[0].id !== activeSection) {
            setActiveSection(toc[0].id);
          }
        }
      }
      return;
    }

    // Find the section that is closest to the reading point (100px from top)
    // and is at or above that point
    if (!mainContentRef.current) return;
    
    const containerRect = mainContentRef.current.getBoundingClientRect();
    const readingPoint = 100; // 100px from top of viewport
    
    let bestId = '';
    let bestDistance = Infinity;
    let bestIsAboveReadingPoint = false;
    
    // First pass: Find sections at or above the reading point
    sectionVisibility.forEach((score, id) => {
      const element = document.getElementById(id);
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      const elementTop = rect.top - containerRect.top;
      const isAboveReadingPoint = elementTop <= readingPoint;
      const distanceFromReadingPoint = Math.abs(elementTop - readingPoint);
      
      // Prioritize sections at or above reading point
      if (isAboveReadingPoint) {
        if (!bestIsAboveReadingPoint || distanceFromReadingPoint < bestDistance) {
          bestIsAboveReadingPoint = true;
          bestDistance = distanceFromReadingPoint;
          bestId = id;
        }
      } else if (!bestIsAboveReadingPoint) {
        // If no section is above reading point, use the closest one below
        if (distanceFromReadingPoint < bestDistance) {
          bestDistance = distanceFromReadingPoint;
          bestId = id;
        }
      }
    });
    
    // If we found a section, set it as active
    if (bestId && bestId !== activeSection) {
      setActiveSection(bestId);
    } else if (!bestId && toc.length > 0) {
      // Fallback: if no visible section found, use first section
      if (toc[0].id !== activeSection) {
        setActiveSection(toc[0].id);
      }
    }
  }, [sectionVisibility, activeSection, toc]);

  useEffect(() => {
    // Fetch the markdown file
    fetch('/USER_GUIDE.md')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        return res.text();
      })
      .then((text) => {
        if (!text || text.trim().length === 0) {
          throw new Error('Markdown file is empty');
        }
        setMarkdown(text);
        const extractedTOC = extractTOC(text);
        setToc(extractedTOC);
        
        // Wait for DOM to render, then set initial active section
        setTimeout(() => {
          const hash = window.location.hash.slice(1);
          if (hash && extractedTOC.some(item => item.id === hash)) {
            setActiveSection(hash);
            const element = document.getElementById(hash);
            if (element && mainContentRef.current) {
              isScrollingRef.current = true;
              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
              setTimeout(() => {
                isScrollingRef.current = false;
              }, 1000);
            }
          } else if (extractedTOC.length > 0) {
            setActiveSection(extractedTOC[0].id);
          }
        }, 200);
      })
      .catch((err) => {
        console.error('Failed to load user guide:', err);
        setToc([]);
        setMarkdown(`# Error Loading User Guide\n\nFailed to load the user guide: ${err.message}\n\nPlease check the console for more details.`);
      });
  }, []);

  // Create header counter - reset when TOC changes
  // Use a ref to ensure the counter persists across the ReactMarkdown render cycle
  const headerCounterRef = useRef(createHeaderCounter());
  
  // Reset counter when TOC changes - MUST happen before ReactMarkdown renders
  useEffect(() => {
    headerCounterRef.current = createHeaderCounter();
  }, [toc]);
  
  // Also reset counter right before rendering ReactMarkdown
  // This ensures it's fresh for each render cycle
  const resetCounter = () => {
    headerCounterRef.current = createHeaderCounter();
  };

  // Handle hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && toc.some(item => item.id === hash)) {
        setActiveSection(hash);
        const element = document.getElementById(hash);
        if (element && mainContentRef.current) {
          isScrollingRef.current = true;
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 1000);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [toc]);

  // Auto-scroll TOC sidebar to ALWAYS show active section
  useEffect(() => {
    if (!activeSection || !tocNavRef.current) return;

    const scrollToActiveButton = () => {
      const nav = tocNavRef.current;
      if (!nav) return;

      const activeButton = nav.querySelector(`[data-section-id="${activeSection}"]`) as HTMLElement;
      if (!activeButton) {
        // Retry if button not found yet
        setTimeout(scrollToActiveButton, 100);
        return;
      }

      // Get button position relative to its offset parent (the nav element)
      const buttonOffsetTop = activeButton.offsetTop;
      const buttonHeight = activeButton.offsetHeight;
      const navScrollTop = nav.scrollTop;
      const navHeight = nav.clientHeight;
      const navScrollHeight = nav.scrollHeight;
      
      // Calculate button's position in the scrollable area
      const buttonTop = buttonOffsetTop;
      const buttonBottom = buttonTop + buttonHeight;
      
      // Padding from edges
      const padding = 30;
      
      // Check if button is visible
      const visibleTop = navScrollTop;
      const visibleBottom = navScrollTop + navHeight;
      
      const isVisible = buttonTop >= visibleTop - padding && buttonBottom <= visibleBottom + padding;
      
      if (!isVisible) {
        // Calculate target scroll position
        let targetScroll: number;
        
        if (buttonTop < visibleTop) {
          // Button is above viewport - scroll to show it at the top
          targetScroll = Math.max(0, buttonTop - padding);
        } else {
          // Button is below viewport - scroll to show it at the bottom
          targetScroll = Math.min(
            navScrollHeight - navHeight,
            buttonBottom - navHeight + padding
          );
        }
        
        // Scroll to target position
        nav.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        });
      } else {
        // Button is visible, but check if it's too close to edges
        const distanceFromTop = buttonTop - visibleTop;
        const distanceFromBottom = visibleBottom - buttonBottom;
        const minDistance = 50; // Minimum distance from edges
        
        if (distanceFromTop < minDistance) {
          // Too close to top, scroll up a bit
          const targetScroll = Math.max(0, buttonTop - minDistance);
          nav.scrollTo({
            top: targetScroll,
            behavior: 'smooth',
          });
        } else if (distanceFromBottom < minDistance) {
          // Too close to bottom, scroll down a bit
          const targetScroll = Math.min(
            navScrollHeight - navHeight,
            buttonBottom - navHeight + minDistance
          );
          nav.scrollTo({
            top: targetScroll,
            behavior: 'smooth',
          });
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToActiveButton();
      });
    });
  }, [activeSection]);

  const handleTOCClick = useCallback((id: string) => {
    console.log('[UserGuide] TOC clicked, scrolling to:', id);
    
    // Set active section immediately for visual feedback
    setActiveSection(id);
    window.location.hash = id;
    
    // Prevent intersection observer from interfering during scroll
    isScrollingRef.current = true;
    
    // Use multiple attempts to ensure element is found
      const attemptScroll = (attempts = 0) => {
      const element = document.getElementById(id);
      const mainContent = mainContentRef.current;
      
      if (!element) {
        if (attempts < 5) {
          // Retry if element not found yet (might still be rendering)
          setTimeout(() => attemptScroll(attempts + 1), 100);
          return;
        }
        console.error(`[UserGuide] Element with id "${id}" not found after ${attempts} attempts`);
        const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
        console.log('[UserGuide] Available IDs (first 20):', allIds.slice(0, 20));
        console.log('[UserGuide] TOC IDs:', toc.map(item => item.id).slice(0, 20));
        console.log('[UserGuide] Looking for ID:', id);
        // Try to find similar IDs
        const similarIds = allIds.filter(aid => aid.includes(id.split('-').slice(0, -1).join('-')) || id.includes(aid.split('-').slice(0, -1).join('-')));
        if (similarIds.length > 0) {
          console.log('[UserGuide] Similar IDs found:', similarIds);
        }
        isScrollingRef.current = false;
        return;
      }
      
      if (!mainContent) {
        console.error('[UserGuide] Main content ref not available');
        isScrollingRef.current = false;
        return;
      }
      
      console.log('[UserGuide] Found element, scrolling...', {
        elementId: element.id,
        elementTop: element.getBoundingClientRect().top,
        containerTop: mainContent.getBoundingClientRect().top,
        currentScrollTop: mainContent.scrollTop,
      });
      
      // Calculate scroll position relative to the scroll container
      const containerRect = mainContent.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const currentScrollTop = mainContent.scrollTop;
      
      // Calculate element position relative to container's scroll position
      const elementTopInContainer = elementRect.top - containerRect.top + currentScrollTop;
      
      // Scroll with offset for header (100px)
      const targetScrollTop = Math.max(0, elementTopInContainer - 100);
      
      console.log('[UserGuide] Scrolling to:', {
        elementTopInContainer,
        targetScrollTop,
        currentScrollTop,
      });
      
      mainContent.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth',
      });
      
      // Reset scrolling flag after animation completes
      setTimeout(() => {
        isScrollingRef.current = false;
        console.log('[UserGuide] Scroll completed');
      }, 1000);
    };
    
    // Start scroll attempt with small delay to ensure DOM is ready
    setTimeout(() => attemptScroll(), 10);
  }, []);

  const scrollToTop = useCallback(() => {
    if (mainContentRef.current) {
      isScrollingRef.current = true;
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
    }
    if (toc.length > 0) {
      setActiveSection(toc[0].id);
    }
    window.location.hash = '';
  }, [toc]);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Fixed Left Sidebar - Table of Contents */}
        <aside className="w-64 border-r border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0 overflow-y-auto">
          <div className="sticky top-0 p-4 border-b border-border bg-background z-10">
            <h2 className="text-lg font-semibold">Table of Contents</h2>
          </div>
          <nav ref={tocNavRef} className="p-4 space-y-1">
            {markdown === '' ? (
              <p className="text-sm text-muted-foreground">Loading table of contents...</p>
            ) : toc.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                <p>No table of contents found.</p>
                <p className="text-xs mt-2">Check console for details.</p>
              </div>
            ) : (
              toc.map((item) => (
                <button
                  key={item.id}
                  data-section-id={item.id}
                  onClick={() => handleTOCClick(item.id)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  } ${item.level === 2 ? 'font-semibold' : item.level === 3 ? 'ml-4 text-xs' : ''}`}
                >
                  {item.title}
                </button>
              ))
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-8 py-8">
            <div className="prose prose-invert prose-slate max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground">
              {(() => {
                // CRITICAL: Reset counter right before ReactMarkdown renders
                // This ensures fresh counters for each render cycle
                headerCounterRef.current = createHeaderCounter();
                return (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    key={`markdown-${toc.length}-${markdown.substring(0, 100)}`} // Force re-render when TOC or markdown changes
                    components={{
                  h1: ({ node, children, ...props }) => {
                    const title = String(children).replace(/\s+/g, ' ').trim();
                    const id = slugify(title);
                    return (
                      <h1 id={id} className="scroll-mt-20 text-4xl font-bold text-foreground mt-12 mb-6 first:mt-0 border-b-2 border-primary/30 pb-3" {...props}>
                        {children}
                      </h1>
                    );
                  },
                  h2: ({ node, children, ...props }) => {
                    const title = String(children).replace(/\s+/g, ' ').trim();
                    
                    // Get H2 position from counter (this increments automatically)
                    const h2Position = headerCounterRef.current.getH2Position();
                    
                    // Get H2 items from TOC
                    const h2Items = toc.filter(item => item.level === 2);
                    
                    // Get the TOC item by absolute position
                    const tocItem = h2Items[h2Position];
                    
                    // Always use the TOC item's ID - it should match exactly
                    const id = tocItem ? tocItem.id : `${slugify(title)}-${h2Position + 1}`;
                    
                    return (
                      <HeadingWithObserver
                        key={`h2-${h2Position}-${id}`}
                        id={id}
                        level={2}
                        onInView={handleSectionInView}
                        rootElement={mainContentRef.current}
                        className="scroll-mt-20 text-3xl font-bold text-foreground mt-10 mb-5 border-b border-border/50 pb-2"
                      >
                        {children}
                      </HeadingWithObserver>
                    );
                  },
                  h3: ({ node, children, ...props }) => {
                    const title = String(children).replace(/\s+/g, ' ').trim();
                    
                    // Get current H2 count (before incrementing H3)
                    const currentH2Count = headerCounterRef.current.getCurrentH2Count();
                    
                    // Get H3 position from counter (this increments automatically)
                    const h3Position = headerCounterRef.current.getH3Position();
                    
                    // Find the current H2 in TOC
                    const h2Items = toc.filter(item => item.level === 2);
                    const currentH2TocItem = h2Items[currentH2Count - 1];
                    
                    if (!currentH2TocItem || currentH2Count === 0) {
                      // Fallback if H2 not found
                      const id = `${slugify(title)}-${currentH2Count}-${h3Position + 1}`;
                      return (
                        <HeadingWithObserver
                          key={`h3-${currentH2Count}-${h3Position}-${id}`}
                          id={id}
                          level={3}
                          onInView={handleSectionInView}
                          className="scroll-mt-20 text-2xl font-semibold text-foreground mt-8 mb-4 text-primary/90"
                        >
                          {children}
                        </HeadingWithObserver>
                      );
                    }
                    
                    // Find the current H2's position in the full TOC
                    const currentH2TocIndex = toc.indexOf(currentH2TocItem);
                    
                    // Get all H3s that come after the current H2 in TOC (before next H2)
                    const h3ItemsAfterCurrentH2 = toc.slice(currentH2TocIndex + 1).filter(item => {
                      // Stop at next H2
                      if (item.level === 2) return false;
                      return item.level === 3;
                    });
                    
                    // Get the H3 TOC item by position
                    const tocItem = h3ItemsAfterCurrentH2[h3Position];
                    
                    // Always use the TOC item's ID - it should match exactly
                    const id = tocItem ? tocItem.id : `${slugify(title)}-${currentH2Count}-${h3Position + 1}`;
                    
                    return (
                      <HeadingWithObserver
                        key={`h3-${currentH2Count}-${h3Position}-${id}`}
                        id={id}
                        level={3}
                        onInView={handleSectionInView}
                        rootElement={mainContentRef.current}
                        className="scroll-mt-20 text-2xl font-semibold text-foreground mt-8 mb-4 text-primary/90"
                      >
                        {children}
                      </HeadingWithObserver>
                    );
                  },
                  p: ({ node, children, ...props }) => (
                    <p className="text-muted-foreground leading-relaxed mb-4" {...props}>
                      {children}
                    </p>
                  ),
                  code: ({ node, inline, className, children, ...props }) => {
                    return inline ? (
                      <code className="px-1.5 py-0.5 rounded bg-muted text-foreground text-sm font-mono" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="block p-4 rounded-lg bg-muted text-foreground text-sm font-mono overflow-x-auto my-4" {...props}>
                        {children}
                      </code>
                    );
                  },
                  ul: ({ node, children, ...props }) => (
                    <ul className="ml-6 space-y-2 list-disc mb-4" {...props}>
                      {children}
                    </ul>
                  ),
                  ol: ({ node, children, ...props }) => (
                    <ol className="ml-6 space-y-2 list-decimal mb-4" {...props}>
                      {children}
                    </ol>
                  ),
                  li: ({ node, children, ...props }) => (
                    <li className="pl-2 leading-relaxed text-muted-foreground" {...props}>
                      {children}
                    </li>
                  ),
                  table: ({ node, children, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse border border-border" {...props}>
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ node, children, ...props }) => (
                    <th className="border border-border px-4 py-2 bg-muted font-semibold text-left text-foreground" {...props}>
                      {children}
                    </th>
                  ),
                  td: ({ node, children, ...props }) => (
                    <td className="border border-border px-4 py-2 text-muted-foreground" {...props}>
                      {children}
                    </td>
                  ),
                  hr: ({ node, ...props }) => (
                    <hr className="my-8 border-border" {...props} />
                    ),
                  }}
                >
                  {markdown.replace(/^## Table of Contents[\s\S]*?^---$/gm, '').trim()}
                </ReactMarkdown>
                );
              })()}
            </div>
          </div>

          {/* Scroll to Top Button */}
          <Button
            onClick={scrollToTop}
            className="fixed bottom-6 left-[calc(16rem+2rem)] z-50 rounded-full h-10 w-10 p-0 shadow-lg bg-primary hover:bg-primary/90"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </main>
      </div>
    </div>
  );
};

export default UserGuide;
