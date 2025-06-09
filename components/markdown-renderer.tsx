import React, { useCallback } from 'react'
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
  // transform the content to ensure that Latex is properly rendered
  const transform = useCallback((): string => {
    let text = content.replace(/\\\(([\s\S]+?)\\\)/g, (_match, expr) => `$${expr.trim()}$`);
    text = text.replace(/\\\[\s*([\s\S]+?)\s*\\\]/g, (_m, expr) => `$$\n${expr.trim()}\n$$`);
    return text;
  }, [content]);

  return (
    <div className={`max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[
          remarkMath,
          remarkGfm
        ]}
        rehypePlugins={[
          [rehypeKatex, {
            // Enhanced KaTeX configuration for complex equations
            strict: false,
            trust: true,
            macros: {
              // Common mathematical macros for better rendering
              "\\RR": "\\mathbb{R}",
              "\\CC": "\\mathbb{C}",
              "\\ZZ": "\\mathbb{Z}",
              "\\NN": "\\mathbb{N}",
              "\\QQ": "\\mathbb{Q}",
              "\\vec": "\\boldsymbol{#1}",
              "\\norm": "\\left\\|#1\\right\\|",
              "\\abs": "\\left|#1\\right|",
              "\\set": "\\left\\{#1\\right\\}",
              "\\paren": "\\left(#1\\right)",
              "\\bracket": "\\left[#1\\right]",
              "\\brace": "\\left\\{#1\\right\\}",
              "\\angle": "\\left\\langle#1\\right\\rangle"
            },
            fleqn: false,
            leqno: false,
            minRuleThickness: 0.05,
            colorIsTextColor: false,
            maxSize: Infinity,
            maxExpand: 1000,
            globalGroup: false,
          }],
          [rehypeHighlight, {
            detect: true,
            ignoreMissing: true
          }]
        ]}
        // Enhanced parsing options for better math support
        skipHtml={false}
        disallowedElements={['script']}
        unwrapDisallowed={true}
        components={{
          // Custom heading renderer with better spacing
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900 border-b border-gray-200 pb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 mt-5 text-gray-800 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mb-2 mt-4 text-gray-700 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium mb-2 mt-3 text-gray-700">
              {children}
            </h4>
          ),
          
          // Enhanced paragraph styling - maintains your theme
          p: ({ children }) => (
            <p className="mb-3 leading-relaxed text-gray-700 [&:has(.katex-display)]:mb-4">
              {children}
            </p>
          ),
          
          // Better list styling
          ul: ({ children }) => (
            <ul className="mb-4 ml-5 space-y-1 list-disc marker:text-amber-600">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-5 space-y-1 list-decimal marker:text-amber-600">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 leading-relaxed pl-1">
              {children}
            </li>
          ),
          
          // Enhanced code blocks with your theme colors
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            if (inline && !/katex/.test(className || '')) {
              return (
                <code className="bg-amber-50 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              )
            }
            
            return (
              <div className="mb-4">
                {language && (
                  <div className="bg-amber-600 text-white px-3 py-1.5 text-xs font-mono rounded-t-md uppercase tracking-wide">
                    {language}
                  </div>
                )}
                <pre className={`bg-amber-50 border border-amber-200 ${language ? 'rounded-b-md border-t-0' : 'rounded-md'} overflow-x-auto`}>
                  <code className="block p-3 text-sm font-mono leading-relaxed text-gray-800" {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            )
          },
          
          // Enhanced table styling with your theme
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto">
              <table className="min-w-full border-collapse bg-white rounded-md overflow-hidden shadow-sm ring-1 ring-amber-200">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-amber-50">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-amber-200 px-4 py-3 text-left font-semibold text-gray-900 text-sm bg-amber-50">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-amber-100 px-4 py-3 text-gray-700 text-sm">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-amber-50/50 transition-colors duration-200">
              {children}
            </tr>
          ),
          
          // Blockquote styling with your theme
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-400 pl-4 py-2 mb-4 bg-amber-50/50 italic text-gray-700 rounded-r-md">
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
          
          // Link styling with your theme
          a: ({ href, children }) => (
            <a 
              href={href}
              className="text-amber-600 hover:text-amber-800 underline decoration-amber-300 hover:decoration-amber-500 transition-all duration-200 underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          
          // Horizontal rule
          hr: () => (
            <hr className="my-6 border-0 border-t border-amber-300" />
          ),
        }}
      >
        {transform()}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownMathRenderer