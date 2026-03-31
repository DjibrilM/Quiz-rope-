import Svg, { Rect, Path, Circle } from "react-native-svg";

function DevIcon() {
  return (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        fill="#1E293B"
        stroke="#4ADE80"
        strokeWidth={2}
      />
      {/* Coding Symbol */}
      <Path
        d="M7 10l3 2-3 2M13 14h4"
        stroke="#4ADE80"
        strokeWidth={2}
        strokeLinecap="round"
      />
      {/* Top Bar Circles */}
      <Circle cx="6" cy="7.5" r="1" fill="#FF5F56" />
      <Circle cx="9" cy="7.5" r="1" fill="#FFBD2E" />
      <Circle cx="12" cy="7.5" r="1" fill="#27C93F" />
    </Svg>
  );
}

export default DevIcon;
