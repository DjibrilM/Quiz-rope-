import { useState } from "react";
import { View, Text } from "react-native";
import Katex from "react-native-katex";
import Markdown from "react-native-markdown-display";
import { FONTS, FORTNITE_COLORS } from "../../constants/theme";
import { splitContent, convertLatexToMarkdown } from "../../utils/latexUtils";

interface MathJaxRendererProps {
  content: string;
  textColor?: string;
  fontSize?: number;
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

/**
 * Auto-sizing KaTeX wrapper.
 * Uses injectedJavaScript + onMessage to detect actual rendered height.
 * Works on both iOS (DOMContentLoaded timing) and Android (post-load timing).
 */
function AutoSizeKatex({
  expression,
  displayMode,
  color = "#FFFFFF",
  fontSize = 18,
}: {
  expression: string;
  displayMode: boolean;
  color?: string;
  fontSize?: number;
}) {
  const [height, setHeight] = useState(displayMode ? 80 : 32);

  // Cross-platform height measurement:
  // - iOS: injectedJS fires at DOMContentLoaded (before window.onload where KaTeX renders)
  //        → we wrap window.onload to measure after KaTeX
  // - Android: injectedJS fires after page load (KaTeX already rendered)
  //            → document.readyState === 'complete', measure directly
  const injectedJavaScript = `
    (function() {
      function measure() {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          String(Math.ceil(document.documentElement.scrollHeight))
        );
      }
      if (document.readyState === 'complete') {
        setTimeout(measure, 50);
      } else {
        var orig = window.onload;
        window.onload = function() {
          if (typeof orig === 'function') orig();
          setTimeout(measure, 50);
        };
      }
    })();
    true;
  `;

  const katexSize = displayMode ? `${Math.round(fontSize * 1.4)}px` : `${fontSize}px`;

  return (
    <View style={{ height, width: "100%" }}>
      <Katex
        expression={expression}
        displayMode={displayMode}
        colorIsTextColor={true}
        style={{ height, width: "100%", backgroundColor: "transparent" }}
        inlineStyle={`
          html, body {
            margin: 0; padding: 0;
            background-color: transparent;
            font-size: ${katexSize};
            overflow: hidden;
          }
          body { color: ${color}; }
          .katex-display { margin: 4px 0; }
          .katex { font-size: 1em; }
        `}
        injectedJavaScript={injectedJavaScript}
        onMessage={(e: any) => {
          const h = parseInt(e.nativeEvent.data, 10);
          if (!isNaN(h) && h > 0) setHeight(h + 4);
        }}
      />
    </View>
  );
}

/**
 * Full content renderer: text blocks via Markdown, math via AutoSizeKatex.
 * Handles both display math (\[...\] or $$...$$) and inline math (\(...\) or $...$).
 */
export function MathJaxRenderer({
  content,
  textColor = "#B8A9C9",
  fontSize = 15,
  bgColor: _bgColor = "#0D0B14",
}: MathJaxRendererProps) {
  if (!content) return null;

  const blocks = splitContent(content);

  return (
    <View style={{ width: "100%" }}>
      {blocks.map((block, index) => {
        if (block.type === "math") {
          const expression = normalizeChars(block.content);

          if (block.isDisplay) {
            return (
              <View key={`math-${index}`} style={{ marginVertical: 6 }}>
                <AutoSizeKatex
                  expression={expression}
                  displayMode={true}
                  color={textColor}
                  fontSize={fontSize}
                />
              </View>
            );
          }

          // Inline math — fixed height, flows with text
          return (
            <View
              key={`math-${index}`}
              style={{ height: 32, minWidth: 20, marginHorizontal: 2, justifyContent: "center" }}
            >
              <Katex
                expression={expression}
                displayMode={false}
                colorIsTextColor={true}
                style={{ height: 32, width: "100%", backgroundColor: "transparent" }}
                inlineStyle={`
                  html, body {
                    margin: 0; padding: 0;
                    background-color: transparent;
                    font-size: ${fontSize}px;
                    display: flex;
                    align-items: center;
                    color: ${textColor};
                    overflow: hidden;
                  }
                  .katex { font-size: 1.1em; }
                `}
              />
            </View>
          );
        }

        // Text block
        const mdText = convertLatexToMarkdown(block.content);
        return (
          <Markdown
            key={`text-${index}`}
            style={{
              body: {
                color: textColor,
                fontSize,
                fontFamily: FONTS.body,
                lineHeight: Math.round(fontSize * 1.6),
                flexWrap: "wrap",
              },
              heading2: { color: "#FFFFFF", fontSize: Math.round(fontSize * 1.2), marginTop: 16, marginBottom: 6, fontFamily: FONTS.bodyBold },
              heading3: { color: "#E8D0FF", fontSize: Math.round(fontSize * 1.07), marginTop: 12, marginBottom: 4, fontFamily: FONTS.bodyBold },
              strong: { color: "#FFD93D", fontFamily: FONTS.bodyBold },
              em: { color: "#C4A8E0", fontStyle: "italic" as const },
              bullet_list: { marginVertical: 4 },
              ordered_list: { marginVertical: 4 },
              list_item: { color: textColor, fontSize, fontFamily: FONTS.body },
              paragraph: { marginTop: 0, marginBottom: 6 },
            }}
          >
            {mdText}
          </Markdown>
        );
      })}
    </View>
  );
}

// Keep SimpleMarkdown as a lightweight fallback
interface SimpleProps {
  content: string;
  textColor?: string;
  fontSize?: number;
}

export function SimpleMarkdown({ content, textColor = "#B8A9C9", fontSize = 15 }: SimpleProps) {
  const md = convertLatexToMarkdown(content);
  return (
    <Markdown
      style={{
        body: { color: textColor, fontSize, fontFamily: FONTS.body, lineHeight: Math.round(fontSize * 1.6) },
        heading2: { color: "#FFFFFF", fontSize: Math.round(fontSize * 1.2), marginTop: 16, marginBottom: 6 },
        heading3: { color: "#E8D0FF", fontSize: Math.round(fontSize * 1.07), marginTop: 12, marginBottom: 4 },
        strong: { color: "#FFD93D", fontFamily: FONTS.bodyBold },
        em: { color: "#C4A8E0", fontStyle: "italic" as const },
        bullet_list: { marginVertical: 4 },
        ordered_list: { marginVertical: 4 },
        list_item: { color: textColor, fontSize, fontFamily: FONTS.body },
        paragraph: { marginTop: 0, marginBottom: 6 },
      }}
    >
      {md}
    </Markdown>
  );
}

// Re-export MathMarkdown logic here too so callers can import from one place
interface MathMarkdownProps {
  content: string;
  style?: any;
  isOption?: boolean;
}

export function MathMarkdown({ content, style, isOption = false }: MathMarkdownProps) {
  if (!content) return null;

  const blocks = splitContent(content);
  const textColor = style?.body?.color || FORTNITE_COLORS.textPrimary;
  const fontSize = style?.body?.fontSize || 15;

  return (
    <View style={{ width: "100%", flexDirection: isOption ? "column" : "row", flexWrap: "wrap", alignItems: "center" }}>
      {blocks.map((block, index) => {
        if (block.type === "math") {
          const expression = normalizeChars(block.content);

          if (isOption) {
            return (
              <Katex
                key={`math-${index}`}
                expression={expression}
                displayMode={false}
                colorIsTextColor={true}
                style={{ height: 50, minWidth: 35, backgroundColor: "transparent" }}
                inlineStyle={`
                  html, body { margin:0;padding:0;background:transparent;font-size:18px;display:flex;align-items:center;color:${textColor}; }
                  .katex { font-size: 1.5em; }
                `}
              />
            );
          }

          if (!block.isDisplay) {
            return (
              <View key={`math-${index}`} style={{ height: 32, minWidth: 20, marginHorizontal: 2, justifyContent: "center" }}>
                <Katex
                  expression={expression}
                  displayMode={false}
                  colorIsTextColor={true}
                  style={{ height: 32, width: "100%", backgroundColor: "transparent" }}
                  inlineStyle={`
                    html, body { margin:0;padding:0;background:transparent;font-size:18px;display:flex;align-items:center;color:${textColor}; overflow:hidden; }
                    .katex { font-size: 1.3em; }
                  `}
                />
              </View>
            );
          }

          return (
            <View key={`math-${index}`} style={{ marginVertical: 6, width: "100%" }}>
              <AutoSizeKatex expression={expression} displayMode={true} color={textColor} fontSize={fontSize} />
            </View>
          );
        }

        const mdText = convertLatexToMarkdown(block.content);

        if (isOption) {
          return (
            <Text
              key={`text-${index}`}
              style={[style?.body, {
                fontSize: style?.body?.fontSize || 15,
                color: textColor,
                fontFamily: style?.body?.fontFamily || FONTS.body,
              }]}
              adjustsFontSizeToFit
              numberOfLines={1}
              minimumFontScale={0.4}
            >
              {mdText}
            </Text>
          );
        }

        return (
          <Markdown
            key={`text-${index}`}
            style={{
              ...style,
              body: {
                ...style?.body,
                color: textColor,
                fontFamily: style?.body?.fontFamily || FONTS.body,
                fontSize,
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
