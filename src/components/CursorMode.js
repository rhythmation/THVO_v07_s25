// src/components/CursorMode.js
import { Rectangle } from "@pixi/math";
import { Container, Sprite } from "@inlet/react-pixi";
import { useState, useEffect, useRef } from "react";
import CursorMachine from "../machines/cursorMachine";
import { useMachine, useSelector } from "@xstate/react";
import cursorIcon from "../assets/cursor.png";
import nextBtn from "../assets/next_button.png";
import nextBtnHover from "../assets/next_button_hover.png";

const hitAreasIntersect = (cursorArea, buttonArea) => {
  const s = 0.7;
  return (
    cursorArea.x < buttonArea.x + buttonArea.width &&
    cursorArea.x + cursorArea.width * s > buttonArea.x &&
    cursorArea.y < buttonArea.y + buttonArea.height * s &&
    cursorArea.y + cursorArea.height > buttonArea.y
  );
};

const nextButtonY = (count) => {
  const [min, max] = [0.595, 0.85];
  return count
    ? count % 2 === 0
      ? min
      : max
    : Math.random() * (max - min) + min;
};

const selectHover = (state) => state.context.hovering;
const INDEX_TIP = 8;

export default function CursorMode({ callback, rowDimensions, colAttr, poseData }) {
  const nextRef = useRef();
  const curRef = useRef();
  const [state, send, service] = useMachine(CursorMachine, {
    context: { callback, placementCounter: 0 },
  });
  const hovering = useSelector(service, selectHover);

  const rowDims = rowDimensions(2);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [btnPos, setBtnPos] = useState({
    x: window.innerWidth - 3 * rowDims.margin - 75,
    y: window.innerHeight * nextButtonY(state.context.placementCounter),
  });

  const btnImg = hovering ? nextBtnHover : nextBtn;

  useEffect(() => {
    setBtnPos({
      x: window.innerWidth - 3 * rowDims.margin - 75,
      y: window.innerHeight * nextButtonY(state.context.placementCounter),
    });
  }, [state.context.placementCounter, rowDims.margin]);

  const toScreen = (lm, col) => ({
    x: col.x + lm.x * col.width,
    y: col.y + lm.y * col.height,
  });

  useEffect(() => {
    const realRight = poseData?.leftHandLandmarks?.[INDEX_TIP];
    const realLeft = poseData?.rightHandLandmarks?.[INDEX_TIP];

    let newPos;
    if (realRight) {
      newPos = toScreen(realRight, colAttr);
    } else if (realLeft) {
      newPos = toScreen(realLeft, colAttr);
    } else {
      newPos = { x: -100, y: -100 };
    }

    setCursorPos(newPos);

    if (
      hitAreasIntersect(
        new Rectangle(newPos.x, newPos.y, 76, 76),
        nextRef.current?.hitArea
      )
    ) {
      send("TRIGGER");
    }
  }, [poseData, colAttr, send]);

  return (
    <Container>
      <Sprite
        image={btnImg}
        x={btnPos.x}
        y={btnPos.y}
        interactive
        ref={nextRef}
        anchor={0}
        hitArea={new Rectangle(btnPos.x, btnPos.y, 76, 76)}
      />
      <Sprite
        image={cursorIcon}
        x={cursorPos.x}
        y={cursorPos.y}
        interactive
        ref={curRef}
        anchor={0.5}
        hitArea={new Rectangle(cursorPos.x, cursorPos.y, 76, 76)}
      />
    </Container>
  );
}
