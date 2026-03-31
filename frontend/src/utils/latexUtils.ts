/**
 * Utility for parsing and converting LaTeX document structures to Markdown,
 * and splitting content into blocks of text vs. math for specialized rendering.
 */

/**
 * Converts common LaTeX document commands to their Markdown equivalents.
 */
export function convertLatexToMarkdown(latex: string): string {
  if (!latex) return "";

  let md = latex;

  // Sections and Headers
  md = md.replace(/\\section\*\{([^}]+)\}/g, "## $1");
  md = md.replace(/\\section\{([^}]+)\}/g, "## $1");
  md = md.replace(/\\subsection\*\{([^}]+)\}/g, "### $1");
  md = md.replace(/\\subsection\{([^}]+)\}/g, "### $1");

  // Text Formatting
  md = md.replace(/\\textbf\{([^}]+)\}/g, "**$1**");
  md = md.replace(/\\emph\{([^}]+)\}/g, "*$1*");
  md = md.replace(/\\textit\{([^}]+)\}/g, "*$1*");
  md = md.replace(/\\underline\{([^}]+)\}/g, "$1"); // Markdown doesn't natively support underline well

  // Lists - Itemize
  md = md.replace(/\\begin\{itemize\}/g, "");
  md = md.replace(/\\end\{itemize\}/g, "\n");
  md = md.replace(/\\item\s+/g, "\n- ");

  // Lists - Enumerate
  md = md.replace(/\\begin\{enumerate\}/g, "");
  md = md.replace(/\\end\{enumerate\}/g, "\n");
  // Basic numeric list conversion - more complex regex needed for nested/custom labels
  md = md.replace(/\\item\s+/g, "\n1. ");

  // Spacing and Text Commands
  md = md.replace(/\\vspace\{[^}]+\}/g, "\n\n");
  md = md.replace(/\\\\(?:\[[^\]]*\])?/g, "\n"); // LaTeX line breaks
  md = md.replace(/\\text\{([^}]+)\}/g, "$1");
  md = md.replace(/\\quad/g, "    ");
  md = md.replace(/\\qquad/g, "        ");

  // Clean up extra whitespace that might result from removals
  md = md.replace(/\n\s*\n\s*\n/g, "\n\n");

  return md;
}

export interface ContentBlock {
  type: "text" | "math";
  content: string;
  isDisplay?: boolean;
}

/**
 * Splits content into blocks of text and math.
 * Handles \[ ... \], \( ... \), $$, and $.
 */
export function splitContent(content: string): ContentBlock[] {
  if (!content) return [];

  // Match display math: \[...\] or $$...$$
  // Match inline math: \(...\) or $...$
  const regex = /(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\\([\s\S]*?\\\)|(?<!\$)\$(?!\$)[^$]+(?<!\$)\$)/g;
  
  const parts = content.split(regex);
  const blocks: ContentBlock[] = [];

  parts.forEach((part) => {
    if (!part) return;

    if (part.startsWith("\\[") && part.endsWith("\\]")) {
      blocks.push({
        type: "math",
        content: part.slice(2, -2).trim(),
        isDisplay: true,
      });
    } else if (part.startsWith("$$") && part.endsWith("$$")) {
      blocks.push({
        type: "math",
        content: part.slice(2, -2).trim(),
        isDisplay: true,
      });
    } else if (part.startsWith("\\(") && part.endsWith("\\)")) {
      blocks.push({
        type: "math",
        content: part.slice(2, -2).trim(),
        isDisplay: false,
      });
    } else if (part.startsWith("$") && part.endsWith("$")) {
      blocks.push({
        type: "math",
        content: part.slice(1, -1).trim(),
        isDisplay: false,
      });
    } else {
      blocks.push({
        type: "text",
        content: part,
      });
    }
  });

  return blocks;
}
