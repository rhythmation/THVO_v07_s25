import { Container, Graphics } from "@inlet/react-pixi";
import { useCallback, memo } from "react";
import { blue } from "../utils/colors";

const Background = memo((props) => {
  // props.height expects the full height of the stage
  const backgroundHeight = props.height * 0.55;
  // create background design drawing a horizontal line across the top of the Container
  const draw = useCallback(
    (g) => {
      g.clear();
      g.lineStyle(4, blue, 1);
      // horizontal lines
      const horizontalLineOffsets = [0, 0.025, 0.05, 0.1, 0.2, 0.35, 0.6];
      horizontalLineOffsets.forEach((offset) => {
        g.moveTo(0, offset * backgroundHeight);
        g.lineTo(props.width, offset * backgroundHeight);
      });
      // draw midline to bottom of screen
      const linesToSideOffsets = [
        0.014, 0.025, 0.05, 0.11, 0.175, 0.25, 0.375, 0.6, 1,
      ];
      linesToSideOffsets.forEach((element) => {
        // start from the middle
        g.moveTo(props.width / 2, 0);
        // draw line to the left
        g.lineTo(0, props.width * element);
        // start from the middle
        g.moveTo(props.width / 2, 0);
        // draw line to the right
        g.lineTo(props.width, props.width * element);
      });
      const linesToBottomOffsets = [0.375, 0.5, 0.625];
      linesToBottomOffsets.forEach((element) => {
        g.moveTo(props.width / 2, 0);
        g.lineTo(props.width * element, props.height);
      });
    },
    [props.height, props.width]
  );

  return (
    <Container position={[0, backgroundHeight]}>
      <Graphics draw={draw} />
    </Container>
  );
});

export default Background;
