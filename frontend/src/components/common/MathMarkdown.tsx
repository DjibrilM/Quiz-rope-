import { useState } from "react";
import Markdown from "react-native-markdown-display";
import { View, Text } from "react-native";
import Katex from "react-native-katex";
import { FONTS, FORTNITE_COLORS } from "../../constants/theme";
import { splitContent, convertLatexToMarkdown, ContentBlock } from "../../utils/latexUtils";

interface MathMarkdownProps {
  content: string;
  style?: any;
  isFitted?: boolean;
  isOption?: boolean;
  /** Background color of the parent container — needed to avoid white WebView boxes */
  bgColor?: string;
}

function normalizeChars(text: string): string {
  if (!text) return "";
  return text
    .replace(/π/g, "\\pi ")
    .replace(/Σ/g, "\\Sigma ")
    .replace(/Δ/g, "\\Delta ")
    .replace(/√\s*(\d+|\w+)/g, "\\sqrt{$1}");
}

/** Escape plain text for use inside KaTeX \text{} */
function escapeForKatexText(s: string): string {
  return s
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/%/g, "\\%")
    .replace(/&/g, "\\&")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\^/g, "\\^{}")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\n/g, " ");
}

/** Returns true if the text string contains markdown formatting that needs the Markdown renderer */
function hasMarkdown(text: string): boolean {
  return /\*\*|(?<!\*)\*(?!\*)|^#{1,3} |^[-*] |```|`|^> /m.test(text);
}

// Inject viewport meta tag so the WebView renders at device width (not ~980px desktop default).
const VIEWPORT = `</style><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><style>`;

const MEASURE_JS = `
  (function() {
    function measure() {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        String(Math.ceil(document.documentElement.scrollHeight))
      );
    }
    if (document.readyState === 'complete') {
      setTimeout(measure, 100);
    } else {
      var orig = window.onload;
      window.onload = function() {
        if (typeof orig === 'function') orig();
        setTimeout(measure, 100);
      };
    }
  })();
  true;
`;

/** Auto-sizing display math block (centered, displayMode=true). */
function AutoSizeKatex({
  expression,
  color = "#FFFFFF",
  bg = "transparent",
}: {
  expression: string;
  color?: string;
  bg?: string;
}) {
  const [height, setHeight] = useState(120);
  return (
    <View style={{ height, width: "100%" }}>
      <Katex
        expression={expression}
        displayMode={true}
        colorIsTextColor={true}
        style={{ height, width: "100%", backgroundColor: bg }}
        inlineStyle={`${VIEWPORT}
          html, body {
            margin: 0; padding: 0;
            background-color: ${bg};
            font-size: 18px;
            color: ${color};
          }
          .katex { font-size: 1.3em; }
          .katex-display { margin: 4px 0; text-align: center; }
        `}
        injectedJavaScript={MEASURE_JS}
        onMessage={(e: any) => {
          const h = parseInt(e.nativeEvent.data, 10);
          if (!isNaN(h) && h > 0) setHeight(h + 4);
        }}
      />
    </View>
  );
}

/**
 * Auto-sizing inline math block (left-aligned, displayMode=false).
 * Used when text and inline math are merged via \text{}.
 */
function AutoSizeKatexInline({
  expression,
  color = "#FFFFFF",
  bg = "transparent",
  fontSize = 16,
}: {
  expression: string;
  color?: string;
  bg?: string;
  fontSize?: number;
}) {
  const [height, setHeight] = useState(40);
  return (
    <View style={{ height, width: "100%" }}>
      <Katex
        expression={expression}
        displayMode={false}
        colorIsTextColor={true}
        style={{ height, width: "100%", backgroundColor: bg }}
        inlineStyle={`${VIEWPORT}
          html, body {
            margin: 0; padding: 0;
            background-color: ${bg};
            font-size: ${fontSize}px;
            color: ${color};
          }
          .katex { font-size: 1.1em; }
        `}
        injectedJavaScript={MEASURE_JS}
        onMessage={(e: any) => {
          const h = parseInt(e.nativeEvent.data, 10);
          if (!isNaN(h) && h > 0) setHeight(h + 4);
        }}
      />
    </View>
  );
}

// ─── Group building ────────────────────────────────────────────────────────────

type RenderGroup =
  | { kind: "display"; expression: string }
  | { kind: "inline_merged"; expression: string }
  | { kind: "inline_math"; expression: string }
  | { kind: "text"; content: string };

/**
 * Merges consecutive simple-text + inline-math blocks into a single
 * KaTeX expression so they render on one line instead of stacking vertically.
 * Text parts are wrapped in \text{} with special chars escaped.
 * Falls back to individual blocks when text has markdown formatting.
 */
function buildGroups(blocks: ContentBlock[]): RenderGroup[] {
  const groups: RenderGroup[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    // Display math always gets its own block
    if (block.type === "math" && block.isDisplay) {
      groups.push({ kind: "display", expression: normalizeChars(block.content) });
      i++;
      continue;
    }

    // Collect consecutive simple-text + inline-math into pending[]
    // Stop at: display math OR a text block that has markdown formatting
    const pending: ContentBlock[] = [];
    let hasMath = false;
    let j = i;

    while (j < blocks.length) {
      const b = blocks[j];
      if (b.type === "math" && b.isDisplay) break;
      if (b.type === "text" && hasMarkdown(b.content)) break;
      pending.push(b);
      if (b.type === "math" && !b.isDisplay) hasMath = true;
      j++;
    }

    if (hasMath && pending.length > 1) {
      // Merge: build a single KaTeX expression with \text{} for text parts
      const expr = pending
        .map((b) => {
          if (b.type === "math") return normalizeChars(b.content);
          const escaped = escapeForKatexText(b.content);
          return escaped.trim() ? `\\text{${escaped}}` : "";
        })
        .filter(Boolean)
        .join(" ");
      groups.push({ kind: "inline_merged", expression: expr });
      i = j;
    } else if (pending.length > 0) {
      // No math (or only one block) — push individually
      for (const b of pending) {
        if (b.type === "math") {
          groups.push({ kind: "inline_math", expression: normalizeChars(b.content) });
        } else {
          groups.push({ kind: "text", content: b.content });
        }
      }
      i = j;
    } else {
      // Stopped immediately at a markdown text block
      groups.push({ kind: "text", content: blocks[i].content });
      i++;
    }
  }

  return groups;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function MathMarkdown({
  content,
  style,
  isFitted,
  isOption = false,
  bgColor = "transparent",
}: MathMarkdownProps) {
  if (!content) return null;

  const blocks = splitContent(content);
  const textColor = style?.body?.color || FORTNITE_COLORS.textPrimary;
  const bodyFontSize = style?.body?.fontSize || 15;
  const katexInlinePx = Math.round(bodyFontSize * 1.1);

  // ── Option Mode: render each block individually ─────────────────────────────
  if (isOption) {
    return (
      <View style={{ width: "100%" }}>
        {blocks.map((block, index) => {
          if (block.type === "math") {
            const expression = normalizeChars(block.content);
            return (
              <Katex
                key={`math-${index}`}
                expression={expression}
                displayMode={false}
                colorIsTextColor={true}
                style={{ height: 50, width: "100%", backgroundColor: bgColor }}
                inlineStyle={`${VIEWPORT}
                  html, body { margin:0; padding:0; background-color:${bgColor}; font-size:18px; display:flex; align-items:center; }
                  body { color: #FFD93D; }
                  .katex { font-size: 1.5em; }
                `}
              />
            );
          }
          const mdText = convertLatexToMarkdown(block.content);
          return (
            <Text
              key={`text-${index}`}
              style={[
                style?.body,
                {
                  fontSize: bodyFontSize,
                  color: textColor,
                  fontFamily: style?.body?.fontFamily || FONTS.body,
                },
              ]}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.4}
            >
              {mdText}
            </Text>
          );
        })}
      </View>
    );
  }

  // ── Normal Mode: group + merge inline math with surrounding text ────────────
  const groups = buildGroups(blocks);

  return (
    <View style={{ width: "100%" }}>
      {groups.map((group, index) => {
        // Display math
        if (group.kind === "display") {
          return (
            <View key={`g-${index}`} style={{ marginVertical: 6, width: "100%" }}>
              <AutoSizeKatex expression={group.expression} color={textColor} bg={bgColor} />
            </View>
          );
        }

        // Merged inline: text + math on the same line via \text{}
        if (group.kind === "inline_merged") {
          return (
            <View key={`g-${index}`} style={{ width: "100%", marginVertical: 2 }}>
              <AutoSizeKatexInline
                expression={group.expression}
                color={textColor}
                bg={bgColor}
                fontSize={katexInlinePx}
              />
            </View>
          );
        }

        // Standalone inline math (no surrounding text)
        if (group.kind === "inline_math") {
          const h = Math.round(katexInlinePx * 2.6);
          return (
            <View key={`g-${index}`} style={{ height: h, width: "100%", marginVertical: 2 }}>
              <Katex
                expression={group.expression}
                displayMode={false}
                colorIsTextColor={true}
                style={{ height: h, width: "100%", backgroundColor: bgColor }}
                inlineStyle={`${VIEWPORT}
                  html, body { margin:0; padding:0; background-color:${bgColor}; font-size:${katexInlinePx}px; display:flex; align-items:center; }
                  body { color: ${textColor}; }
                  .katex { font-size: 1.2em; }
                `}
              />
            </View>
          );
        }

        // Text block (may have markdown)
        const mdText = convertLatexToMarkdown(group.content);

        if (isFitted) {
          return (
            <Text
              key={`g-${index}`}
              style={[
                style?.body,
                {
                  fontSize: 22,
                  color: textColor,
                  fontFamily: style?.body?.fontFamily || FONTS.body,
                },
              ]}
              adjustsFontSizeToFit
              numberOfLines={3}
              minimumFontScale={0.4}
            >
              {mdText}
            </Text>
          );
        }

        return (
          <Markdown
            key={`g-${index}`}
            style={{
              ...style,
              body: {
                ...style?.body,
                color: textColor,
                fontFamily: style?.body?.fontFamily || FONTS.body,
                fontSize: bodyFontSize,
                lineHeight: 22,
                flexWrap: "wrap",
              },
            }}
          >
            {mdText}
          </Markdown>
        );
      })}
    </View>
  );
}
