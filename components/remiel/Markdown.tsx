'use client';

import Link from 'next/link';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { memo } from 'react';

const components: Components = {
  a: ({ href = '', children }) =>
    href.startsWith('/') ? (
      <Link href={href} className="text-accent underline underline-offset-2 hover:opacity-80">
        {children}
      </Link>
    ) : (
      <a href={href} target="_blank" rel="noreferrer noopener" className="text-accent underline underline-offset-2 hover:opacity-80">
        {children}
      </a>
    ),
  p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>,
  h1: ({ children }) => <h3 className="mt-4 mb-2 text-sm font-bold">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-4 mb-2 text-sm font-bold">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-3 mb-1.5 text-[13px] font-bold">{children}</h4>,
  blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-accent/60 pl-3 text-zinc-500 dark:text-zinc-400">{children}</blockquote>,
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-3 text-[12px] leading-relaxed text-zinc-100">
      {children}
    </pre>
  ),
  code: ({ className, children }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-zinc-100 dark:bg-zinc-800/80 px-1 py-0.5 text-[0.85em]">{children}</code>
    ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-left font-semibold">{children}</th>,
  td: ({ children }) => <td className="border border-zinc-200 dark:border-zinc-800 px-2 py-1">{children}</td>,
};

function MarkdownImpl({ children }: { children: string }) {
  return (
    <div className="text-[13px] break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export const Markdown = memo(MarkdownImpl);
