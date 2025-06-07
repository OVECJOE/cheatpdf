import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github.css'

interface MarkdownMathRendererProps {
  content: string
  className?: string
}

const MarkdownMathRenderer: React.FC<MarkdownMathRendererProps> = ({ 
  content, 
  className = ''
}) => {
  return (
    <div className={`prose prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          // Custom heading renderer with better spacing
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold mb-6 mt-8 text-gray-900 border-b border-gray-200 pb-3 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold mb-4 mt-8 text-gray-800 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-medium mb-3 mt-6 text-gray-700 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium mb-2 mt-4 text-gray-700">
              {children}
            </h4>
          ),
          
          // Enhanced paragraph styling
          p: ({ children }) => (
            <p className="mb-4 leading-7 text-gray-700 text-base [&:has(.katex-display)]:mb-6">
              {children}
            </p>
          ),
          
          // Better list styling
          ul: ({ children }) => (
            <ul className="mb-6 ml-6 space-y-2 list-disc marker:text-gray-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-6 ml-6 space-y-2 list-decimal marker:text-gray-400">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 leading-7 pl-1">
              {children}
            </li>
          ),
          
          // Enhanced code blocks
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            if (node?.properties?.inlineCode) {
              return (
                <code 
                  className="bg-gray-100 text-rose-600 px-1.5 py-0.5 rounded-md text-sm font-mono border border-gray-200"
                  {...props}
                >
                  {children}
                </code>
              )
            }
            
            return (
              <div className="mb-6 not-prose">
                {language && (
                  <div className="bg-gray-800 text-gray-300 px-4 py-2 text-xs font-mono rounded-t-lg border-b border-gray-600 uppercase tracking-wide">
                    {language}
                  </div>
                )}
                <pre className={`bg-gray-50 border border-gray-200 ${language ? 'rounded-b-lg border-t-0' : 'rounded-lg'} overflow-x-auto`}>
                  <code className="block p-4 text-sm font-mono leading-6 text-gray-800" {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            )
          },
          
          // Enhanced table styling
          table: ({ children }) => (
            <div className="mb-6 overflow-x-auto not-prose">
              <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm ring-1 ring-gray-200">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50/50">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-gray-200 px-6 py-4 text-left font-semibold text-gray-900 text-sm bg-gray-50/50">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-gray-100 px-6 py-4 text-gray-700 text-sm">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50/50 transition-colors duration-200">
              {children}
            </tr>
          ),
          
          // Blockquote styling
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-400 pl-6 py-4 mb-6 bg-blue-50/50 italic text-gray-700 rounded-r-lg">
              {children}
            </blockquote>
          ),
          
          // Strong and em styling
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-800">
              {children}
            </em>
          ),
          
          // Link styling
          a: ({ href, children }) => (
            <a 
              href={href}
              className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 transition-all duration-200 underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          
          // Horizontal rule
          hr: () => (
            <hr className="my-12 border-0 border-t border-gray-300" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      
      {/* Math-specific styles that can't be handled by Tailwind */}
      <style jsx>{`
        /* KaTeX display math styling */
        :global(.katex-display) {
          margin: 1.5rem 0 !important;
          padding: 1.25rem !important;
          background-color: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 0.5rem !important;
          overflow-x: auto !important;
        }
        
        /* KaTeX inline math styling */
        :global(.katex:not(.katex-display)) {
          background-color: #f1f5f9 !important;
          padding: 0.125rem 0.375rem !important;
          border-radius: 0.25rem !important;
          border: 1px solid #e2e8f0 !important;
          font-size: 1em !important;
        }
        
        /* Code highlighting adjustments */
        :global(.prose pre code.hljs) {
          background: transparent !important;
          padding: 0 !important;
        }
        
        /* Mobile responsiveness for math */
        @media (max-width: 640px) {
          :global(.katex-display) {
            font-size: 0.9em !important;
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default MarkdownMathRenderer