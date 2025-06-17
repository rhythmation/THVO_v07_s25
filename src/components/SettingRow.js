// src/components/SettingRow.js
import React from "react";
import { Container, Text } from "@inlet/react-pixi";
import RectButton from "./RectButton";

export default function SettingRow({ label, value, x, y, onToggle }) {
  return (
    <Container position={[x, y]}>
      <Text
        text={label}
        style={{ fontFamily: "Arial", fontSize: 18, fill: 0x333333 }}
        x={0}
        y={0}
      />
      <RectButton
        width={80}
        height={28}
        x={180}
        y={2}
        text={value ? "ON" : "OFF"}
        color={value ? "green" : "red"}
        fontColor="white"
        callback={onToggle}
      />
    </Container>
  );
}
 