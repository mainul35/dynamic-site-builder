import React, { useMemo } from 'react';
import type { RendererProps } from '../types';

/**
 * SocialLink interface for social media links
 */
interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

/**
 * TopHeaderBarRenderer - Utility bar component for above main navigation
 * Features:
 * - Left/Center/Right content areas
 * - Social media links
 * - Contact information display
 * - Announcements/promotions
 */
const defaultSocialLinks = [
  { platform: 'facebook', url: '#', icon: '📘' },
  { platform: 'twitter', url: '#', icon: '🐦' },
  { platform: 'linkedin', url: '#', icon: '💼' },
];

const hasSocialLinks = (items: unknown): boolean => {
  if (!items) return false;
  if (Array.isArray(items) && items.length > 0) return true;
  if (typeof items === 'string' && items.trim() !== '' && items !== '[]') return true;
  return false;
};

const TopHeaderBarRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const props = component.props || {};
  const leftContent = (props.leftContent as string) || '📧 contact@example.com';
  const rightContent = (props.rightContent as string) || '📞 +1 234 567 890';
  const centerContent = (props.centerContent as string) || '';
  const showSocialLinks = props.showSocialLinks !== false;
  const propsSocialLinks = props.socialLinks;

  const socialLinks = hasSocialLinks(propsSocialLinks) ? propsSocialLinks : defaultSocialLinks;

  const {
    backgroundColor = '#f8f9fa',
    textColor = '#666666',
    accentColor = '#007bff',
    padding = '8px 20px',
    borderBottom = '1px solid #e9ecef',
    fontFamily = 'inherit',
    fontSize = '13px',
  } = component.styles as Record<string, string>;

  const parsedSocialLinks: SocialLink[] = useMemo(() => {
    if (typeof socialLinks === 'string') {
      try {
        return JSON.parse(socialLinks);
      } catch (e) {
        console.warn('Failed to parse socialLinks:', e);
        return [];
      }
    }
    return Array.isArray(socialLinks) ? socialLinks : [];
  }, [socialLinks]);

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor,
    color: textColor,
    padding,
    borderBottom,
    fontFamily,
    fontSize,
    boxSizing: 'border-box',
  };

  const sectionStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  };

  const leftSectionStyles: React.CSSProperties = {
    ...sectionStyles,
    justifyContent: 'flex-start',
    flex: 1,
  };

  const centerSectionStyles: React.CSSProperties = {
    ...sectionStyles,
    justifyContent: 'center',
    flex: centerContent ? 2 : 0,
  };

  const rightSectionStyles: React.CSSProperties = {
    ...sectionStyles,
    justifyContent: 'flex-end',
    flex: 1,
  };

  const contentTextStyles: React.CSSProperties = {
    margin: 0,
    whiteSpace: 'nowrap',
  };

  const socialContainerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const socialLinkStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    textDecoration: 'none',
    color: textColor,
    transition: 'color 0.2s ease',
    cursor: isEditMode ? 'default' : 'pointer',
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
    }
  };

  const renderContent = (content: string) => {
    if (!content) return null;
    return <span style={contentTextStyles}>{content}</span>;
  };

  const getPlatformIcon = (platform: string): string => {
    const icons: Record<string, string> = {
      facebook: '📘',
      twitter: '🐦',
      instagram: '📷',
      linkedin: '💼',
      youtube: '📺',
      github: '💻',
      email: '✉️',
      phone: '📞',
    };
    return icons[platform.toLowerCase()] || '🔗';
  };

  const renderSocialLink = (link: SocialLink, index: number) => (
    <a
      key={`${link.platform}-${index}`}
      href={link.url}
      style={socialLinkStyles}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (!isEditMode) {
          (e.currentTarget as HTMLElement).style.color = accentColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!isEditMode) {
          (e.currentTarget as HTMLElement).style.color = textColor;
        }
      }}
      title={link.platform}
      target="_blank"
      rel="noopener noreferrer"
    >
      {link.icon || getPlatformIcon(link.platform)}
    </a>
  );

  const hasContent = leftContent || rightContent || centerContent || (showSocialLinks && parsedSocialLinks.length > 0);

  if (!hasContent && isEditMode) {
    return (
      <div style={{
        ...containerStyles,
        justifyContent: 'center',
        color: '#999',
        fontStyle: 'italic',
      }}>
        Add content in Properties panel (left/right/center content or social links)
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      <div style={leftSectionStyles}>
        {renderContent(leftContent)}
      </div>

      {centerContent && (
        <div style={centerSectionStyles}>
          {renderContent(centerContent)}
        </div>
      )}

      <div style={rightSectionStyles}>
        {renderContent(rightContent)}

        {showSocialLinks && parsedSocialLinks.length > 0 && (
          <div style={socialContainerStyles}>
            {parsedSocialLinks.map((link, index) => renderSocialLink(link, index))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopHeaderBarRenderer;
export { TopHeaderBarRenderer };
