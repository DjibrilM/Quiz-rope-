export const VB_W = 660;
export const VB_H = 160;
export const GROUND_Y = 132;
export const ROPE_Y = 68;
export const ROPE_START = 145;
export const ROPE_END = VB_W - 145;
export const ROPE_LEN = ROPE_END - ROPE_START;

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function buildRopePath(
  startX: number,
  endX: number,
  baseY: number,
  sag: number,
  steps = 40,
): string {
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = lerp(startX, endX, t);
    const sagY = sag * 4 * t * (1 - t);
    const y = baseY + sagY;
    parts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return parts.join(" ");
}
