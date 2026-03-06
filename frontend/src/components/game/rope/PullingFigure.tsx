import React from "react";
import { G, Circle, Ellipse, Line, Path } from "react-native-svg";
import { ROPE_Y } from "./constants";

interface PullingFigureProps {
  x: number;
  groundY: number;
  facingRight: boolean;
  winning: boolean;
  teamColor: string;
  skinTone: string;
  hairColor: string;
  tension: number;
  scale?: number;
  figureOpacity?: number;
}

export function PullingFigure({
  x,
  groundY,
  facingRight,
  winning,
  teamColor,
  skinTone,
  hairColor,
  tension,
  scale = 1,
  figureOpacity = 1,
}: PullingFigureProps) {
  const dir = facingRight ? 1 : -1;
  const s = scale;

  // Dynamic lean — characters lean backward harder when under more tension
  const baseLean = 7 * s;
  const tensionLean = tension * 5 * s;
  const lean = baseLean + tensionLean;

  // ── FEET (anchored to ground, wide bracing stance) ──
  const frontFootX = x + dir * 5 * s;
  const backFootX = x - dir * 14 * s;
  const footY = groundY - 3;

  // ── KNEES (deeply bent for power) ──
  const frontKneeX = x + dir * 2 * s;
  const frontKneeY = groundY - 16 * s;
  const backKneeX = x - dir * 7 * s;
  const backKneeY = groundY - 18 * s;

  // ── HIPS (above feet, start of backward lean) ──
  const hipX = x - dir * 2 * s;
  const hipY = groundY - 34 * s;

  // ── TORSO (leaned backward — shoulders shifted behind hips) ──
  const shoulderX = hipX - dir * lean;
  const shoulderY = hipY - 20 * s;
  const bodyW = 18 * s;

  // ── HEAD (follows the lean) ──
  const headR = 13 * s;
  const headX = shoulderX - dir * 2 * s;
  const headY = shoulderY - 14 * s;

  // ── FRONT ARM (reaches forward to grip rope) ──
  const fShoulderX = shoulderX + dir * 7 * s;
  const fElbowX = shoulderX + dir * (lean + 12) * s;
  const fElbowY = ROPE_Y + 6 * s;
  const fHandX = shoulderX + dir * (lean + 20) * s;
  const fHandY = ROPE_Y;

  // ── BACK ARM (slightly behind front arm) ──
  const bShoulderX = shoulderX + dir * 3 * s;
  const bElbowX = shoulderX + dir * (lean + 8) * s;
  const bElbowY = ROPE_Y + 9 * s;
  const bHandX = shoulderX + dir * (lean + 16) * s;
  const bHandY = ROPE_Y + 1.5;

  // ── FACE positions ──
  const eyeY = headY - 1 * s;
  const eyeSpacing = 4 * s;

  // Torso midpoints for shirt stripe
  const torsoMidX = (shoulderX + hipX) / 2;
  const torsoMidY = (shoulderY + hipY) / 2;

  return (
    <G opacity={figureOpacity}>
      {/* Ground shadow */}
      <Ellipse
        cx={(frontFootX + backFootX) / 2}
        cy={groundY + 1}
        rx={14 * s}
        ry={3 * s}
        fill="rgba(0,0,0,0.15)"
      />

      {/* ── LEGS ── */}
      {/* Back leg — thigh */}
      <Line
        x1={hipX - dir * 2 * s} y1={hipY}
        x2={backKneeX} y2={backKneeY}
        stroke={teamColor} strokeWidth={6 * s} strokeLinecap="round"
      />
      {/* Back leg — shin */}
      <Line
        x1={backKneeX} y1={backKneeY}
        x2={backFootX} y2={footY}
        stroke={teamColor} strokeWidth={5.5 * s} strokeLinecap="round"
      />

      {/* Front leg — thigh */}
      <Line
        x1={hipX + dir * 2 * s} y1={hipY}
        x2={frontKneeX} y2={frontKneeY}
        stroke={teamColor} strokeWidth={6 * s} strokeLinecap="round"
      />
      {/* Front leg — shin */}
      <Line
        x1={frontKneeX} y1={frontKneeY}
        x2={frontFootX} y2={footY}
        stroke={teamColor} strokeWidth={5.5 * s} strokeLinecap="round"
      />

      {/* ── SHOES ── */}
      <Ellipse cx={backFootX - dir * 1 * s} cy={groundY - 1.5} rx={6.5 * s} ry={3.5 * s} fill="#fff" />
      <Line
        x1={backFootX - 5 * s} y1={groundY + 0.5}
        x2={backFootX + 5 * s} y2={groundY + 0.5}
        stroke="#B8A9C9" strokeWidth={1.5 * s} strokeLinecap="round"
      />
      <Ellipse cx={frontFootX - dir * 1 * s} cy={groundY - 1.5} rx={6.5 * s} ry={3.5 * s} fill="#fff" />
      <Line
        x1={frontFootX - 5 * s} y1={groundY + 0.5}
        x2={frontFootX + 5 * s} y2={groundY + 0.5}
        stroke="#B8A9C9" strokeWidth={1.5 * s} strokeLinecap="round"
      />

      {/* ── TORSO (tilted parallelogram — shows the lean) ── */}
      <Path
        d={`
          M ${shoulderX - bodyW / 2} ${shoulderY}
          Q ${shoulderX} ${shoulderY - 3 * s} ${shoulderX + bodyW / 2} ${shoulderY}
          L ${hipX + bodyW / 2 - 1 * s} ${hipY}
          Q ${hipX} ${hipY + 3 * s} ${hipX - bodyW / 2 + 1 * s} ${hipY}
          Z
        `}
        fill={teamColor}
      />
      {/* Shirt center stripe */}
      <Line
        x1={torsoMidX} y1={shoulderY + 4 * s}
        x2={hipX} y2={hipY - 3 * s}
        stroke="rgba(255,255,255,0.12)" strokeWidth={3.5 * s} strokeLinecap="round"
      />

      {/* ── BACK ARM ── */}
      <Line
        x1={bShoulderX} y1={shoulderY + 3 * s}
        x2={bElbowX} y2={bElbowY}
        stroke={skinTone} strokeWidth={4 * s} strokeLinecap="round"
      />
      <Line
        x1={bElbowX} y1={bElbowY}
        x2={bHandX} y2={bHandY}
        stroke={skinTone} strokeWidth={3.5 * s} strokeLinecap="round"
      />
      <Circle cx={bHandX} cy={bHandY} r={3.5 * s} fill={skinTone} />

      {/* ── FRONT ARM ── */}
      <Line
        x1={fShoulderX} y1={shoulderY + 1 * s}
        x2={fElbowX} y2={fElbowY}
        stroke={skinTone} strokeWidth={4.5 * s} strokeLinecap="round"
      />
      <Line
        x1={fElbowX} y1={fElbowY}
        x2={fHandX} y2={fHandY}
        stroke={skinTone} strokeWidth={4 * s} strokeLinecap="round"
      />
      <Circle cx={fHandX} cy={fHandY} r={4 * s} fill={skinTone} />

      {/* ── HEAD ── */}
      <Circle cx={headX} cy={headY} r={headR} fill={skinTone} />

      {/* Hair — thick volume */}
      <Path
        d={`M ${headX - 12 * s} ${headY - 4 * s}
            C ${headX - 11 * s} ${headY - 19 * s}, ${headX + 11 * s} ${headY - 19 * s}, ${headX + 12 * s} ${headY - 4 * s}
            L ${headX + 9 * s} ${headY - 2 * s}
            C ${headX + 7 * s} ${headY - 14 * s}, ${headX - 7 * s} ${headY - 14 * s}, ${headX - 9 * s} ${headY - 2 * s}
            Z`}
        fill={hairColor}
      />

      {/* Headband */}
      <Path
        d={`M ${headX - 13 * s} ${headY - 6 * s} Q ${headX} ${headY - 11 * s} ${headX + 13 * s} ${headY - 6 * s}`}
        stroke={teamColor}
        strokeWidth={2.8 * s}
        fill="none"
        strokeLinecap="round"
      />

      {/* ── EYES ── */}
      <Ellipse cx={headX - eyeSpacing} cy={eyeY} rx={3.2 * s} ry={3.5 * s} fill="#ffffff" />
      <Ellipse cx={headX + eyeSpacing} cy={eyeY} rx={3.2 * s} ry={3.5 * s} fill="#ffffff" />
      {/* Iris */}
      <Circle cx={headX - eyeSpacing + dir * 0.6 * s} cy={eyeY + 0.4 * s} r={2.2 * s} fill="#5D4037" />
      <Circle cx={headX + eyeSpacing + dir * 0.6 * s} cy={eyeY + 0.4 * s} r={2.2 * s} fill="#5D4037" />
      {/* Pupil */}
      <Circle cx={headX - eyeSpacing + dir * 0.6 * s} cy={eyeY + 0.4 * s} r={1.3 * s} fill="#1a1a2e" />
      <Circle cx={headX + eyeSpacing + dir * 0.6 * s} cy={eyeY + 0.4 * s} r={1.3 * s} fill="#1a1a2e" />
      {/* Eye highlights */}
      <Circle cx={headX - eyeSpacing + 1.2 * s} cy={eyeY - 1.2 * s} r={1 * s} fill="#ffffff" />
      <Circle cx={headX + eyeSpacing + 1.2 * s} cy={eyeY - 1.2 * s} r={1 * s} fill="#ffffff" />

      {/* ── EYEBROWS ── */}
      {winning ? (
        <>
          <Line
            x1={headX - eyeSpacing - 3 * s} y1={eyeY - 5.5 * s}
            x2={headX - eyeSpacing + 2.5 * s} y2={eyeY - 6 * s}
            stroke={hairColor} strokeWidth={2 * s} strokeLinecap="round"
          />
          <Line
            x1={headX + eyeSpacing - 2.5 * s} y1={eyeY - 6 * s}
            x2={headX + eyeSpacing + 3 * s} y2={eyeY - 5.5 * s}
            stroke={hairColor} strokeWidth={2 * s} strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <Line
            x1={headX - eyeSpacing - 3 * s} y1={eyeY - 6.5 * s}
            x2={headX - eyeSpacing + 2.5 * s} y2={eyeY - 5 * s}
            stroke={hairColor} strokeWidth={2 * s} strokeLinecap="round"
          />
          <Line
            x1={headX + eyeSpacing - 2.5 * s} y1={eyeY - 5 * s}
            x2={headX + eyeSpacing + 3 * s} y2={eyeY - 6.5 * s}
            stroke={hairColor} strokeWidth={2 * s} strokeLinecap="round"
          />
        </>
      )}

      {/* Cheek blush */}
      <Ellipse
        cx={headX - 8 * s} cy={eyeY + 3.5 * s}
        rx={2.8 * s} ry={1.6 * s}
        fill="rgba(255,120,120,0.2)"
      />
      <Ellipse
        cx={headX + 8 * s} cy={eyeY + 3.5 * s}
        rx={2.8 * s} ry={1.6 * s}
        fill="rgba(255,120,120,0.2)"
      />

      {/* Mouth */}
      {winning ? (
        <Path
          d={`M ${headX - 4.5 * s} ${headY + 4 * s} Q ${headX} ${headY + 9 * s} ${headX + 4.5 * s} ${headY + 4 * s}`}
          stroke="#2d1b0e" strokeWidth={1.3} fill="rgba(255,255,255,0.9)" strokeLinecap="round"
        />
      ) : (
        <Path
          d={`M ${headX - 3.5 * s} ${headY + 6 * s} Q ${headX} ${headY + 3.5 * s} ${headX + 3.5 * s} ${headY + 6 * s}`}
          stroke="#2d1b0e" strokeWidth={1.3} fill="none" strokeLinecap="round"
        />
      )}

      {/* ── STRAIN EFFECTS ── */}
      {/* Sweat drop */}
      {!winning && tension > 0.15 && (
        <Path
          d={`M ${headX - dir * 12 * s} ${headY - 4 * s}
              Q ${headX - dir * 13 * s} ${headY} ${headX - dir * 12 * s} ${headY + 3 * s}
              Q ${headX - dir * 11 * s} ${headY} ${headX - dir * 12 * s} ${headY - 4 * s} Z`}
          fill="rgba(100,200,255,0.5)"
        />
      )}
      {!winning && tension > 0.4 && (
        <Path
          d={`M ${headX - dir * 9 * s} ${headY + 7 * s}
              Q ${headX - dir * 10 * s} ${headY + 10 * s} ${headX - dir * 9 * s} ${headY + 12 * s}
              Q ${headX - dir * 8 * s} ${headY + 10 * s} ${headX - dir * 9 * s} ${headY + 7 * s} Z`}
          fill="rgba(100,200,255,0.35)"
        />
      )}
      {/* Effort speed lines */}
      {!winning && tension > 0.3 && (
        <>
          <Line
            x1={headX - dir * 15 * s} y1={headY - 7 * s}
            x2={headX - dir * 18 * s} y2={headY - 9 * s}
            stroke="rgba(255,255,255,0.25)" strokeWidth={1.2 * s} strokeLinecap="round"
          />
          <Line
            x1={headX - dir * 15 * s} y1={headY - 3 * s}
            x2={headX - dir * 18 * s} y2={headY - 3 * s}
            stroke="rgba(255,255,255,0.2)" strokeWidth={1 * s} strokeLinecap="round"
          />
          <Line
            x1={headX - dir * 14 * s} y1={headY + 1 * s}
            x2={headX - dir * 17 * s} y2={headY + 2 * s}
            stroke="rgba(255,255,255,0.15)" strokeWidth={0.8 * s} strokeLinecap="round"
          />
        </>
      )}
    </G>
  );
}
