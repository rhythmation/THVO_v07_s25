import { Container, Text } from "@inlet/react-pixi";
import RectButton from "./RectButton";
// labelWidth is only needed if you later want vertical guidelines;
// for now we just expose buttonX / buttonWidth so each row is tweakable.
export default function SettingRow({
  label,
  value,
  x,
  y,
  onToggle,
  buttonX = 200,       // default x for the toggle pill
  buttonWidth = 90,    // default width of pill
}) {

  return (
    <Container position={[x, y]}>
      <Text
        text={label}
              style={{
          fontFamily: "Arial",
          fontWeight: "bold",
          fill: 0x333333,
        }}
        x={0}
        y={0}
      />
      <RectButton
        width={buttonWidth}
        height={32}
        x={buttonX}
        y={2}          /* slight top padding */

        text={value ? "ON" : "OFF"}
        color={value ? "green" : "red"}
        fontColor="white"
        callback={onToggle}
      />
    </Container>
  );
}
 