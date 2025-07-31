import { Container, Text } from "@inlet/react-pixi";
import RectButton from "./RectButton";

export default function SettingRow({
  label,
  value,
  x,
  y,
  onToggle,
  buttonX   = 260,   // ⬅️ more space between label & toggle
  buttonW   = 96,    // ⬅️ slightly wider pill
}) {
  return (
    <Container position={[x, y]}>
      <Text
        text={label}
        style={{
          fontFamily: "Arial",
          fontWeight: "bold",
          fill: 0x333333,
          letterSpacing: 1.2,   // ⬅️ nicer tracking
        }}
      />
      <RectButton
        width={buttonW}
        height={32}
        x={buttonX}
        y={2}
        text={value ? "ON" : "OFF"}
        color={value ? "green" : "red"}
        fontColor="white"
        callback={onToggle}
      />
    </Container>
  );
}
