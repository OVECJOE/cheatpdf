import React, { useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";
import "highlight.js/styles/github.css";

interface MarkdownMathRendererProps {
  content: string;
  className?: string;
}

const MarkdownMathRenderer: React.FC<MarkdownMathRendererProps> = ({
  content,
  className = "",
}) => {
  const transform = useCallback((): string => {
    let text = content;

    // Replace dollar signs in currency contexts
    text = text.replace(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)\b/g, "USD$1");

    // Replace other standalone dollar signs
    text = text.replace(/(?<!\$)\$(?!\$)(?!\d)(?![a-zA-Z_])/g, "USD");

    // Convert LaTeX delimiters first
    text = text.replace(
      /\\\(([\s\S]+?)\\\)/g,
      (_match, expr) => `$${expr.trim()}$`
    );
    text = text.replace(
      /\\\[\s*([\s\S]+?)\s*\\\]/g,
      (_m, expr) => `$$\n${expr.trim()}\n$$`
    );

    return text;
  }, [content]);

  return (
    <div className={`max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[
          [
            rehypeKatex,
            {
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
                "\\angle": "\\left\\langle#1\\right\\rangle",
              },
              fleqn: false,
              leqno: false,
              minRuleThickness: 0.05,
              colorIsTextColor: false,
              maxSize: Infinity,
              maxExpand: 1000,
              globalGroup: false,
            },
          ],
          [
            rehypeHighlight,
            {
              detect: true,
              ignoreMissing: true,
            },
          ],
        ]}
        // Enhanced parsing options for better math support
        skipHtml={false}
        disallowedElements={["script"]}
        unwrapDisallowed={true}
        components={{
          // Custom heading renderer with better spacing
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 text-foreground border-b border-border pb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 mt-5 text-foreground first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-medium mb-2 mt-4 text-foreground first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium mb-2 mt-3 text-foreground">
              {children}
            </h4>
          ),

          // Enhanced paragraph styling - maintains your theme
          p: ({ children }) => (
            <p className="mb-3 leading-relaxed text-foreground [&:has(.katex-display)]:mb-4">
              {children}
            </p>
          ),

          // Better list styling
          ul: ({ children }) => (
            <ul className="mb-4 ml-5 space-y-1 list-disc marker:text-primary">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-5 space-y-1 list-decimal marker:text-primary">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground leading-relaxed pl-1">{children}</li>
          ),

          // Enhanced code blocks with your theme colors
          code: (props) => {
            const { node, className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";

            // Check if this is inline code (not a code block)
            const isInline = !className || (!language && !className.includes('katex'));

            if (isInline) {
              return (
                <code
                  className="bg-muted text-foreground font-mono text-[0.875em] px-1.5 py-0.5 rounded-sm !inline whitespace-nowrap"
                  {...rest}
                >
                  {children}
                </code>
              );
            }

            // This is a code block
            return (
              <div className="mb-4">
                {language && (
                  <div className="bg-primary text-primary-foreground px-3 py-1.5 text-xs font-mono rounded-t-md uppercase tracking-wide">
                    {language}
                  </div>
                )}
                <pre
                  className={`bg-muted border border-border ${language ? "rounded-b-md border-t-0" : "rounded-md"} overflow-x-auto`}
                >
                  <code
                    className="block p-3 text-sm font-mono leading-relaxed text-foreground"
                    {...rest}
                  >
                    {children}
                  </code>
                </pre>
              </div>
            );
          },

          // Enhanced table styling with your theme
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto">
              <table className="min-w-full border-collapse bg-card rounded-md overflow-hidden shadow-sm ring-1 ring-border">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-border px-4 py-3 text-left font-semibold text-foreground text-sm bg-muted">
              {children}
            </th>
            ),
          td: ({ children }) => (
            <td className="border-b border-border px-4 py-3 text-foreground text-sm">
              {children}
            </td>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/50 transition-colors duration-200">
              {children}
            </tr>
          ),

          // Blockquote styling with your theme
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-2 mb-4 bg-muted/30 rounded-r-md">
              <div className="text-foreground italic">{children}</div>
            </blockquote>
          ),

          // Enhanced link styling
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),

          // Horizontal rule styling
          hr: () => <hr className="my-6 border-border" />,

          // Strong and emphasis styling
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground">{children}</em>
          ),
        }}
      >
        {transform()}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMathRenderer;