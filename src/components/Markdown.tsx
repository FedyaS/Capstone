'use client';

import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

interface MarkdownProps {
  children: string;
  className?: string;
  empty?: string;
}

/**
 * GFM + LaTeX ($inline$ and $$display$$) + syntax-highlighted code fences.
 * Styling lives in `.md-body` in globals.css.
 */
export function Markdown({ children, className = '', empty = 'Nothing here yet.' }: MarkdownProps) {
  if (!children.trim()) {
    return <p className="font-sans text-sm italic text-slate-600">{empty}</p>;
  }

  return (
    <div className={`md-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          a: ({ href, children: linkChildren, ...rest }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
              {linkChildren}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
