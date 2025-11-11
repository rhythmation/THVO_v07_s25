import React, { useState, useEffect } from 'react';
import { white } from "../../utils/colors";
import RectButton from "../RectButton";

// PIXI Loader Component
const PixiLoader = ({ width, height }) => {
  const [animationTime, setAnimationTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationTime(prev => (prev + 0.1) % 1.5); // 1.5 second cycle
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Cell colors matching the original CSS
  const cellColors = [
    0xd4aee0, 0x8975b4, 0x64518a, 0x565190,
    0x44abac, 0x2ca7d8, 0x1482ce, 0x05597c,
    0xb2dd57, 0x57c443, 0x05b853, 0x19962e,
    0xfdc82e, 0xfd9c2e, 0xd5385a, 0x911750
  ];

  // Animation delays for each cell (in seconds)
  const delays = [0, 0.1, 0.2, 0.3, 0.1, 0.2, 0.3, 0.4, 0.2, 0.3, 0.4, 0.5, 0.3, 0.4, 0.5, 0.6];

  // Calculate alpha for ripple animation
  const calculateAlpha = (delay) => {
    const adjustedTime = (animationTime - delay + 1.5) % 1.5;
    if (adjustedTime < 0.45) { // 30% of 1.5s
      return adjustedTime / 0.45; // fade in
    } else if (adjustedTime < 0.9) { // 30% to 60% of 1.5s
      return 1 - (adjustedTime - 0.45) / 0.45; // fade out
    }
    return 0; // transparent
  };

  // Grid layout - 4x4 cells
  const cellSize = Math.min(width, height) * 0.06; // 6% of screen size
  const cellSpacing = cellSize * 0.02;
  const totalGridSize = 4 * (cellSize + cellSpacing);
  const startX = (width - totalGridSize) / 2;
  const startY = (height - totalGridSize) / 2;

  return (
    <>
      {/* Mosaic loader cells */}
      {Array.from({ length: 16 }, (_, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const x = startX + col * (cellSize + cellSpacing);
        const y = startY + row * (cellSize + cellSpacing);
        const alpha = calculateAlpha(delays[index]);

        return (
          <React.Fragment key={index}>
            {/* Cell border */}
            <RectButton
              height={cellSize}
              width={cellSize}
              x={x}
              y={y}
              color={cellColors[index]}
              fontSize={0}
              fontColor={white}
              text=""
              callback={null}
              alpha={0.3}
              borderWidth={2}
              borderColor={cellColors[index]}
            />
            {/* Cell fill (animated) */}
            <RectButton
              height={cellSize - 4}
              width={cellSize - 4}
              x={x + 2}
              y={y + 2}
              color={cellColors[index]}
              fontSize={0}
              fontColor={white}
              text=""
              callback={null}
              alpha={alpha}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default PixiLoader;