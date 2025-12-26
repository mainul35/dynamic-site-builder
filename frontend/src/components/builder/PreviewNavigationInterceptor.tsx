import React, { useEffect, useRef, useCallback } from 'react';
import { useMultiPagePreviewStore } from '../../stores/multiPagePreviewStore';

interface PreviewNavigationInterceptorProps {
  children: React.ReactNode;
  enabled: boolean;
}

/**
 * PreviewNavigationInterceptor
 * Wraps preview content and intercepts link clicks to enable
 * multi-page navigation within the preview mode
 */
export const PreviewNavigationInterceptor: React.FC<PreviewNavigationInterceptorProps> = ({
  children,
  enabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { navigateToPage, pages } = useMultiPagePreviewStore();

  // Check if a path is an internal page
  const isInternalPage = useCallback((href: string): boolean => {
    if (!href) return false;

    // External URLs
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return false;
    }

    // Anchor links on current page
    if (href.startsWith('#')) {
      return false;
    }

    // mailto, tel, javascript links
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
      return false;
    }

    // Check if path matches any page
    const normalizedHref = href.startsWith('/') ? href : `/${href}`;

    // Check against known pages
    const matchesPage = pages.some(page => {
      const pagePath = page.routePath || `/${page.pageSlug}`;
      return pagePath === normalizedHref || `/${page.pageSlug}` === normalizedHref;
    });

    // Also allow root path
    if (normalizedHref === '/') return true;

    return matchesPage;
  }, [pages]);

  // Handle click events on the container
  const handleClick = useCallback((e: MouseEvent) => {
    if (!enabled) return;

    // Find the closest anchor element
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');

    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    // Check if it's an internal page link
    if (isInternalPage(href)) {
      e.preventDefault();
      e.stopPropagation();

      // Navigate to the page
      const normalizedPath = href.startsWith('/') ? href : `/${href}`;
      navigateToPage(normalizedPath);

      console.log('Preview navigation intercepted:', normalizedPath);
    }
    // External links: let them open normally (or could open in new tab)
    else if (href.startsWith('http://') || href.startsWith('https://')) {
      e.preventDefault();
      window.open(href, '_blank', 'noopener,noreferrer');
    }
    // Anchor links: scroll to element
    else if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.slice(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [enabled, isInternalPage, navigateToPage]);

  // Attach click listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('click', handleClick, true);

    return () => {
      container.removeEventListener('click', handleClick, true);
    };
  }, [enabled, handleClick]);

  return (
    <div ref={containerRef} className="preview-navigation-interceptor">
      {children}
    </div>
  );
};

export default PreviewNavigationInterceptor;
