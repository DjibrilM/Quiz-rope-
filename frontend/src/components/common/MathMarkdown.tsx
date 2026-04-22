import React, { useMemo } from "react";
import { View, Linking } from "react-native";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";
import { FORTNITE_COLORS } from "../../constants/theme";

interface MathMarkdownProps {
  content: string;
  style?: any;
  isFitted?: boolean;
  isOption?: boolean;
  bgColor?: string;
}

/**
 * Brightens math by forcing a specific KaTeX color.
 * This matches the logic used in QuestionCard for the game session.
 */
const brightenMath = (text: string) => {
  if (!text) return "";

  return (
    text
      // block math $$...$$
      .replace(/\$\$(.*?)\$\$/gs, (_, expr) => {
        return `$$\\color{#fab143}{${expr}}$$`;
      })
      // inline math $...$
      .replace(/\$(.*?)\$/g, (_, expr) => {
        return `$\\color{#fab143}{${expr}}$`;
      })
  );
};

export function MathMarkdown({
  content,
  style,
  isFitted,
  isOption = false,
  bgColor = "transparent",
}: MathMarkdownProps) {
  const processedMarkdown = useMemo(() => {
    return brightenMath(content);
  }, [content]);

  if (!content) return null;

  // Map the incoming style object to EnrichedMarkdownText's markdownStyle
  // We prioritize the properties passed in 'style' while providing sensible defaults
  const markdownStyle = useMemo(() => {
    const baseColor = style?.body?.color || FORTNITE_COLORS.textPrimary;
    const baseFontSize = style?.body?.fontSize || 15;
    const baseFontFamily = style?.body?.fontFamily;

    return {
      paragraph: {
        color: "#FFFFFF",
        fontSize: baseFontSize,
        fontFamily: baseFontFamily,
        marginBottom: 8,
        lineHeight: baseFontSize * 1.4,
        ...(isFitted ? { textAlign: "center" as const } : {}),
      },
      h1: {
        color: baseColor,
        fontSize: baseFontSize + 8,
        fontWeight: "700" as const,
        marginBottom: 8,
        marginTop: 12,
      },
      h2: {
        color: baseColor,
        fontSize: baseFontSize + 6,
        fontWeight: "700" as const,
        marginBottom: 8,
        marginTop: 10,
      },
      h3: {
        color: baseColor,
        fontSize: baseFontSize + 4,
        fontWeight: "600" as const,
        marginBottom: 6,
        marginTop: 8,
      },
      strong: {
        fontWeight: "bold" as const,
        color: baseColor,
      },
      list: {
        color: baseColor,
        marginBottom: 10,
      },
      listItem: {
        color: baseColor,
        marginBottom: 4,
      },
      code: {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        color: "#A78BFA",
        borderRadius: 4,
        paddingHorizontal: 4,
      },
      ...style, // Allow overrides from the parent component
    };
  }, [style, isFitted]);

  return (
    <View style={{ width: "100%", backgroundColor: bgColor }}>
      <EnrichedMarkdownText
        flavor="github"
        markdown={processedMarkdown}
        onLinkPress={({ url }) => Linking.openURL(url)}
        markdownStyle={markdownStyle}
      />
    </View>
  );
}
