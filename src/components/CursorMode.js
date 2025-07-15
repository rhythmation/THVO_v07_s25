// src/components/CursorMode.js
import { Rectangle } from "@pixi/math";
import { Container, Sprite } from "@inlet/react-pixi";
import { useState, useEffect, useRef } from "react";
import CursorMachine from "../machines/cursorMachine";
import { useMachine, useSelector } from "@xstate/react";

const hitAreasIntersect = (cursorHitArea, nextButtonHitArea) => {
  const hitAreaScalar = 0.7;
  return (
    cursorHitArea.x < nextButtonHitArea.x + nextButtonHitArea.width &&
    cursorHitArea.x + cursorHitArea.width * hitAreaScalar >
      nextButtonHitArea.x &&
    cursorHitArea.y < nextButtonHitArea.y + nextButtonHitArea.height * hitAreaScalar &&
    cursorHitArea.y + cursorHitArea.height > nextButtonHitArea.y
  );
};
const nextButtonY = (positionCounter) => {
  const [min, max] = [0.595, 0.85];
  if (positionCounter) {
    return positionCounter % 2 === 0 ? min : max;
  }
  return Math.random() * (max - min) + min;
};

const selectHovering = (state) => state.context.hovering;

// maps a normalized landmark into colAttr coordinates
const toScreen = (lm, col) => ({
  x: col.x + lm.x * col.width,
  y: col.y + lm.y * col.height,
});

const INDEX_TIP = 8;       // hand landmark for index tip

export default function CursorMode(props) {
  const { callback, rowDimensions, colAttr } = props;
  const nextButtonRef = useRef(null);
  const cursorRef     = useRef(null);

  const [state, send, service] = useMachine(CursorMachine, {
    context: { callback, placementCounter: 0 },
  });
  const hovering = useSelector(service, selectHovering);

  // original Next‐button logic
  const [rowDims] = useState(rowDimensions(2));
  const [nextButton, setNextButton] = useState(
    new URL("../assets/next_button.png", import.meta.url)
  );
  const [nextButtonCoordinates, setNextButtonCoordinates] = useState({
    x: rowDims.width - 3 * rowDims.margin,
    y: window.innerHeight * nextButtonY(state.context.placementCounter),
  });

  // swap button texture on hover
  useEffect(() => {
    setNextButton(
      new URL(
        hovering
          ? "../assets/next_button_hover.png"
          : "../assets/next_button.png",
        import.meta.url
      )
    );
  }, [hovering]);

  // hop the Next‐button
  useEffect(() => {
    setNextButtonCoordinates({
      x: rowDims.width - 3 * rowDims.margin,
      y: window.innerHeight * nextButtonY(state.context.placementCounter),
    });
  }, [state.context.placementCounter, rowDims]);

  // cursor texture & state
  const [cursor] = useState(new URL("../assets/cursor.png", import.meta.url));
  const [cursorCoordinates, setCursorCoordinates] = useState({ x:0, y:0 });

  // **NEW**: track whichever index tip Holistic sees,
  // map it through colAttr (the same column you render Pose in)
  useEffect(() => {
    const lm =
      props.poseData?.rightHandLandmarks?.[INDEX_TIP] ??
      props.poseData?.leftHandLandmarks?.[INDEX_TIP] ??
      props.poseData?.poseLandmarks?.[20];

    if (!lm || !cursorRef.current) return;

    // convert 0-1 → pixel inside colAttr
    const { x, y } = toScreen(lm, colAttr);

    setCursorCoordinates({ x, y });

    // original hit logic
    if (
      hitAreasIntersect(
        new Rectangle(x, y, 76, 76),
        nextButtonRef.current.hitArea
      )
    ) {
      send("TRIGGER");
    }
  }, [props.poseData, colAttr, send]);

  return (
    <Container>
      {/* Next Button (unchanged) */}
      <Sprite
        image={nextButton.href}
        x={nextButtonCoordinates.x}
        y={nextButtonCoordinates.y}
        interactive
        anchor={0}
        ref={nextButtonRef}
        hitArea={
          new Rectangle(
            nextButtonCoordinates.x,
            nextButtonCoordinates.y,
            76,
            76
          )
        }
      />

      {/* Cursor Pointer (mapped via colAttr) */}
      <Sprite
        image={cursor.href}
        x={cursorCoordinates.x}
        y={cursorCoordinates.y}
        interactive={true}
        anchor={0.5}
        ref={cursorRef}
        hitArea={
          new Rectangle(
            cursorCoordinates.x,
            cursorCoordinates.y,
            76,
            76
          )
        }
      />
    </Container>
  );
}
