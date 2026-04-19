import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';
import { Callout } from './components/mdx/Callout';
import { CodeGroup } from './components/mdx/CodeGroup';
import { Tabs, Tab } from './components/mdx/Tabs';
import { CodeBlock } from './components/mdx/CodeBlock';
import { Hero, HeroButton } from './components/mdx/Hero';
import { FeatureGrid, FeatureCard } from './components/mdx/FeatureGrid';
import { CheckList, CheckItem } from './components/mdx/CheckList';

/** Derive a URL-friendly slug from heading text. */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/** Extract plain text from React children for slug generation. */
function textContent(children: ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textContent).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return textContent((children as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

/** Heading with anchor link for in-page navigation. */
function Heading({
  level,
  children,
  ...props
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children?: ReactNode;
  [key: string]: unknown;
}) {
  const Tag = `h${level}` as const;
  const id = slugify(textContent(children));
  return (
    <Tag id={id} {...props}>
      <a href={`#${id}`} className="text-inherit no-underline hover:underline">
        {children}
      </a>
    </Tag>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Built-in guide components — available without imports in MDX files
    Callout,
    CodeGroup,
    Tabs,
    Tab,
    Hero,
    HeroButton,
    FeatureGrid,
    FeatureCard,
    CheckList,
    CheckItem,
    // Enhanced code blocks with copy button
    pre: (props) => <CodeBlock {...props} />,
    // Headings with anchor links
    h2: (props) => <Heading level={2} {...props} />,
    h3: (props) => <Heading level={3} {...props} />,
    h4: (props) => <Heading level={4} {...props} />,
    ...components,
  };
}
