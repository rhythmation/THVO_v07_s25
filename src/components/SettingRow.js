import { Container, Text } from "@inlet/react-pixi";
import RectButton from "./RectButton";

export default function SettingRow({
  label,
  value,
  x,
  y,
  onToggle,
  buttonX = 260, // space between label & toggle
  buttonW = 96,  // wider pill
}) {
  return (
    <Container position={[x, y]}>
      <Text
        text={label}
        style={{
          fontFamily: "Arial",
          fontSize: 16,
          fontWeight: "600",
          fill: 0x1f2937,      // slate-800
          letterSpacing: 0.5,
        }}
      />
      <RectButton
        width={buttonW}
        height={32}
        x={buttonX}
        y={-2}                // slight visual centering
        text={value ? "ON" : "OFF"}
        color={value ? "#2563eb" : "#9ca3af"} // blue ON, neutral OFF (accessible)
        fontColor="white"
        callback={onToggle}
      />
    </Container>
  );
}
