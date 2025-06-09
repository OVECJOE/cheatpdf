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
            globalGroup: false
          }],
          [rehypeHighlight, {
            detect: true,
            ignoreMissing: true
          }]
        ]}
        // Enhanced parsing options for better math support
        skipHtml={false}
        allowedElements={undefined}
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
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            
            if (node?.properties?.inlineCode) {
              return (
                <code 
                  className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded text-sm font-mono border border-amber-200"
                  {...props}
                >
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
        {content}
      </ReactMarkdown>
      
      {/* Enhanced math-specific styles for complex equations */}
      <style jsx>{`
        /* KaTeX display math styling - optimized for complex equations */
        :global(.katex-display) {
          margin: 1.5rem 0 !important;
          padding: 1.25rem !important;
          background-color: #fffbeb !important;
          border: 1px solid #fcd34d !important;
          border-radius: 0.5rem !important;
          overflow-x: auto !important;
          overflow-y: visible !important;
          font-size: 1.1em !important;
          line-height: 1.6 !important;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1) !important;
          position: relative !important;
        }
        
        /* Enhanced spacing for complex fractions and multi-line equations */
        :global(.katex-display .katex) {
          white-space: nowrap !important;
          min-height: 2.5em !important;
        }
        
        /* Better rendering for fractions */
        :global(.katex .frac-line) {
          border-bottom-width: 0.08em !important;
        }
        
        /* Improved matrix and array spacing */
        :global(.katex .arraycolsep) {
          width: 0.8em !important;
        }
        
        /* Enhanced delimiter sizing for complex expressions */
        :global(.katex .delimsizing) {
          line-height: 1 !important;
        }
        
        /* Better vertical alignment for sub/superscripts */
        :global(.katex .vlist-t) {
          display: inline-table !important;
          table-layout: fixed !important;
        }
        
        /* KaTeX inline math styling with better readability */
        :global(.katex:not(.katex-display)) {
          background-color: #fffbeb !important;
          padding: 0.2rem 0.4rem !important;
          border-radius: 0.25rem !important;
          border: 1px solid #fde68a !important;
          font-size: 1.05em !important;
          line-height: 1.4 !important;
          vertical-align: baseline !important;
          margin: 0 0.1em !important;
        }
        
        /* Enhanced function name styling */
        :global(.katex .mord.mathnormal) {
          font-style: italic !important;
        }
        
        :global(.katex .mop) {
          font-family: "KaTeX_Main", "Times New Roman", serif !important;
          font-style: normal !important;
        }
        
        /* Better integral, sum, product symbols */
        :global(.katex .mop.op-symbol) {
          font-size: 1.3em !important;
          vertical-align: -0.15em !important;
        }
        
        /* Improved root symbol rendering */
        :global(.katex .sqrt > .vlist-t) {
          border-left: 0.08em solid !important;
        }
        
        /* Enhanced bracket and parentheses scaling */
        :global(.katex .delimsizing.mult .delim-size1) {
          font-size: 1.2em !important;
        }
        
        :global(.katex .delimsizing.mult .delim-size2) {
          font-size: 1.44em !important;
        }
        
        :global(.katex .delimsizing.mult .delim-size3) {
          font-size: 1.73em !important;
        }
        
        :global(.katex .delimsizing.mult .delim-size4) {
          font-size: 2.07em !important;
        }
        
        /* Better spacing for limits and operators */
        :global(.katex .mop.op-limits > .vlist-t) {
          text-align: center !important;
        }
        
        /* Enhanced table/matrix borders */
        :global(.katex .arraycolsep) {
          width: 1em !important;
        }
        
        :global(.katex .arraycolsep.small) {
          width: 0.3em !important;
        }
        
        /* Improved accent positioning */
        :global(.katex .accent-body) {
          position: relative !important;
        }
        
        /* Code highlighting adjustments */
        :global(pre code.hljs) {
          background: transparent !important;
          padding: 0 !important;
        }
        
        /* Mobile responsiveness for math with better scaling */
        @media (max-width: 768px) {
          :global(.katex-display) {
            font-size: 1em !important;
            padding: 1rem !important;
            margin: 1rem 0 !important;
            border-radius: 0.375rem !important;
          }
          
          :global(.katex:not(.katex-display)) {
            font-size: 1em !important;
            padding: 0.15rem 0.3rem !important;
          }
          
          /* Ensure complex equations don't break mobile layout */
          :global(.katex-display .katex) {
            min-width: 100% !important;
            font-size: 0.9em !important;
          }
        }
        
        @media (max-width: 480px) {
          :global(.katex-display) {
            font-size: 0.85em !important;
            padding: 0.75rem !important;
          }
          
          :global(.katex-display .katex) {
            font-size: 0.8em !important;
          }
        }
        
        /* High DPI display improvements */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          :global(.katex) {
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
          }
        }
        
        /* Print styles for math equations */
        @media print {
          :global(.katex-display) {
            background-color: transparent !important;
            border: 1px solid #000 !important;
            break-inside: avoid !important;
          }
          
          :global(.katex:not(.katex-display)) {
            background-color: transparent !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default MarkdownMathRenderer