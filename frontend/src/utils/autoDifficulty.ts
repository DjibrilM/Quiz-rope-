import type { Child } from "@shared/types/user.types";

export function autoDifficulty(children: Child[]): string {
  if (children.length === 0) return "EASY";

  const youngestAge = Math.min(...children.map((c) => c.age));

  if (youngestAge <= 8) return "EASY";
  if (youngestAge <= 11) return "MEDIUM";
  return "HARD";
}
