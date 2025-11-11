import React, { useState, useEffect } from 'react';
import { Text } from "@inlet/react-pixi";
import { TextStyle } from "@pixi/text";
import { white, black, red, blue } from "../../utils/colors";


function createTextElement(text, xMultiplier, yMultiplier, fontSizeMultiplier, totalWidth, totalHeight) {
  return (
    <Text
      key={text}
      text={text}
      x={totalWidth * xMultiplier}
      y={totalHeight * yMultiplier}
      style={
        new TextStyle({
          align: "left",
          fontFamily: "Arial",
          fontSize: totalWidth * fontSizeMultiplier,
          fontWeight: "bold",
          fill: [blue],
        })
      }
    />
  );
}

export const CurricularSelectorBoxes = (props) => {
  const { height, width } = props;

  return (
    <>
      {/* For text input boxes */}
      {createTextElement("Game Select", 0.4, 0.030, 0.025, width, height)}
      {createTextElement("Author", 0.200, 0.160, 0.015, width, height)}
      {createTextElement("Level Name", 0.450, 0.160, 0.015, width, height)}
      {createTextElement("Keywords", 0.750, 0.160, 0.015, width, height)}
      {createTextElement("Published", 0.005, 0.160, 0.015, width, height)}
    </>
  );
};