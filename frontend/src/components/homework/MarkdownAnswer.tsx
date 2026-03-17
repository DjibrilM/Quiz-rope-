import Markdown from "react-native-markdown-display";
import { FONTS } from "../../constants/theme";

const markdownStyles = {
  body: {
    color: "#B8A9C9",
    fontSize: 15,
    fontFamily: FONTS.body,
    lineHeight: 24,
  },
  heading2: {
    color: "#FFFFFF",
    fontFamily: "Bungee_400Regular",
    fontSize: 17,
    marginTop: 24,
    marginBottom: 8,
  },
  heading3: {
    color: "#E8D0FF",
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    marginTop: 16,
    marginBottom: 4,
  },
  strong: {
    color: "#FFD93D",
    fontFamily: FONTS.bodyBold,
  },
  em: {
    color: "#9B59B6",
    fontStyle: "italic" as const,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    color: "#B8A9C9",
    fontFamily: FONTS.body,
    fontSize: 15,
    lineHeight: 24,
  },
  code_inline: {
    backgroundColor: "#231C2B",
    color: "#E85D75",
    borderRadius: 4,
    fontFamily: FONTS.body,
    fontSize: 13,
  },
  fence: {
    backgroundColor: "#1A1520",
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
  },
  code_block: {
    backgroundColor: "#1A1520",
    borderRadius: 10,
    padding: 12,
  },
  blockquote: {
    backgroundColor: "#1A1520",
    borderLeftColor: "#6C5CE7",
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hr: {
    backgroundColor: "#231C2B",
    height: 1,
    marginVertical: 16,
  },
};

interface Props {
  content: string;
}

export function MarkdownAnswer({ content }: Props) {
  return <Markdown style={markdownStyles}>{content}</Markdown>;
}
