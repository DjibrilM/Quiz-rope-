import { MathMarkdown } from "../common/MathMarkdown";

interface Props {
  content: string;
}

export function chat({ content }: Props) {
  return (
    <MathMarkdown
      content={content}
      style={{ body: { color: "#B8A9C9", fontSize: 15 } }}
      bgColor="#0D0B14"
    />
  );
}
