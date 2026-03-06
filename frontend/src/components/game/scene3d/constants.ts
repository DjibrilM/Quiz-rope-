// Camera
export const CAMERA_ZOOM = 55;
export const CAMERA_POSITION: [number, number, number] = [0, 2, 10];

// World layout
export const GROUND_Y = -1.2;
export const ROPE_Y = 0.3;
export const CHARACTER_SPACING = 1.4;
export const TEAM_OFFSET = 1.0;

// Rope
export const ROPE_MAX_OFFSET = 3.5;
export const ROPE_COLOR = "#c4a45a";
export const ROPE_SHADOW_COLOR = "#8b7635";
export const ROPE_HIGHLIGHT_COLOR = "#e0d08a";
export const ROPE_LENGTH = 8;

// Team colors
export const RED_TEAM_COLOR = "#ff6b6b";
export const BLUE_TEAM_COLOR = "#4ecdc4";

// Background / ground
export const BG_COLOR = "#1a1a2e";
export const GROUND_COLOR = "#2a2a4a";

// Character configs matching current SVG
export const LEFT_CHARS = [
  { skinTone: "#f4c28f", hairColor: "#2c1810", scale: 1.1 },
  { skinTone: "#8d5524", hairColor: "#1a1a1a", scale: 1.0 },
  { skinTone: "#c68642", hairColor: "#8b6914", scale: 0.88 },
];

export const RIGHT_CHARS = [
  { skinTone: "#e8b88a", hairColor: "#4a2c17", scale: 1.1 },
  { skinTone: "#d4956b", hairColor: "#2c1810", scale: 1.0 },
  { skinTone: "#f4c28f", hairColor: "#1a1a1a", scale: 0.88 },
];

// Animation
export const SPRING_STIFFNESS = 90;
export const SPRING_DAMPING = 8;
export const HEAVE_BASE_SPEED = 1.5;
export const HEAVE_TENSION_SPEED = 2.0;
export const PHASE_OFFSET = 0.7;
export const JERK_VELOCITY_THRESHOLD = 0.15;
export const JERK_DECAY = 5.0;
export const JERK_BOOST = 0.3;
