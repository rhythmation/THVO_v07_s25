import React, { useState, useEffect } from 'react';
import { Text } from "@inlet/react-pixi";
import { TextStyle } from "@pixi/text";
import { white, black, blue, red, green, orange } from "../../utils/colors";
import InputBox from "../InputBox";
import RectButton from "../RectButton";
import { Curriculum } from "./CurricularModule";
import { setEditLevel, setGoBackFromLevelEdit, currentConjecture } from '../ConjectureModule/ConjectureModule';
import { sanitizeValue } from "../../utils/sanitize";

function handleCurricularName(key, triggerRerender) {
  const existingValue = localStorage.getItem(key);
  const newValue = prompt("Please name your Game:", existingValue);
  if (newValue !== null) {
    localStorage.setItem(key, newValue);
    triggerRerender();
  }
}

function handleCurricularKeywords(key, triggerRerender) {
  const existingValue = localStorage.getItem(key);
  const newValue = prompt("Keywords make your search easier:", existingValue);
  if (newValue !== null) {
    localStorage.setItem(key, newValue);
    triggerRerender();
  }
}

function handlePinInput(key, triggerRerender) {
  let pin = prompt("Enter a code PIN", localStorage.getItem(key));
  if (pin && !isNaN(pin)) {
    localStorage.setItem(key, pin);
    triggerRerender();
  } else if (pin !== null) {
    alert("PIN must be numeric.");
  }
}

function handleLevelClicked(conjecture, conjectureCallback) {
  setEditLevel(false);
  setGoBackFromLevelEdit("NEWGAME");
  currentConjecture.setConjecture(conjecture);
  conjectureCallback(conjecture);
}

function createInputBox(
  charLimit,
  scaleFactor,
  widthMultiplier,
  xMultiplier,
  yMultiplier,
  textKey,
  totalWidth,
  totalHeight,
  callback,
  renderKey,
  disabled = false
) {
  const raw  = localStorage.getItem(textKey);
  const value = sanitizeValue(raw);   // '' instead of "undefined", null, etc.
  const isPlaceholder = value === '';

  const placeholderMap = {
    CurricularName: 'Enter game name…',
    CurricularAuthor: 'Author',
    CurricularKeywords: 'keyword1, keyword2',
    CurricularPIN: '4-digit PIN',
  };

  const text = value
    ? value.length > charLimit
      ? value.slice(0, charLimit) + '…'
      : value
    : placeholderMap[textKey] ?? '';

  const height = totalHeight * scaleFactor;
  const width = totalWidth * widthMultiplier;
  const x = totalWidth * xMultiplier;
  const y = totalHeight * yMultiplier;

  return (
    <InputBox
      key={`${textKey}-${renderKey}`}
      height={height}
      width={width}
      x={x}
      y={y}
      color={disabled ? blue : white}
      fontSize={totalWidth * 0.012}
      fontColor={disabled ? white : (isPlaceholder ? '#888' : black)}
      text={text}
      fontWeight={disabled ? 1000 : 500}
      callback={disabled ? null : () => callback(textKey)}
    />
  );
}

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

const CurriculumList = ({
  xMultiplier, yMultiplier, fontSizeMultiplier,
  totalWidth, totalHeight, conjectureCallback,
  triggerRerender, renderKey
}) => {
  const conjectureList = Curriculum.getCurrentConjectures();
  const conjecturesPerPage = 6;
  const totalPages = Math.ceil(conjectureList.length / conjecturesPerPage);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [totalPages, currentPage]);

  if (conjectureList.length === 0) return null;

  const startIndex = currentPage * conjecturesPerPage;
  const currentConjectures = conjectureList.slice(startIndex, startIndex + conjecturesPerPage);

  return (
    <>
      {currentConjectures.map((conjecture, localIndex) => {
        const globalIndex = startIndex + localIndex;
        const yPos = totalHeight * (localIndex + 1) * 4 * fontSizeMultiplier + totalHeight * yMultiplier;

        return (
          <React.Fragment key={globalIndex + '-' + renderKey}>
            <RectButton
              height={totalHeight / 2 * yMultiplier}
              width={totalWidth * xMultiplier * 4}
              x={totalWidth * xMultiplier * 0.25}
              y={yPos}
              color={white}
              fontSize={totalWidth * fontSizeMultiplier / 1.3}
              fontColor={blue}
              text={conjecture["Text Boxes"]["Author Name"]}
              fontWeight="bold"
              callback={() => handleLevelClicked(conjecture, conjectureCallback)}
            />
            <RectButton
              height={totalHeight / 2 * yMultiplier}
              width={totalWidth * xMultiplier * 7}
              x={totalWidth * xMultiplier * 1.9}
              y={yPos}
              color={white}
              fontSize={totalWidth * fontSizeMultiplier / 1.3}
              fontColor={blue}
              text={conjecture["Text Boxes"]["Conjecture Name"]}
              fontWeight="bold"
              callback={() => handleLevelClicked(conjecture, conjectureCallback)}
            />
            <RectButton
              height={totalHeight / 2 * yMultiplier}
              width={totalWidth * xMultiplier * 7}
              x={totalWidth * xMultiplier * 4.75}
              y={yPos}
              color={white}
              fontSize={totalWidth * fontSizeMultiplier / 1.3}
              fontColor={blue}
              text={conjecture["Text Boxes"]["Conjecture Keywords"]}
              fontWeight="bold"
              callback={() => handleLevelClicked(conjecture, conjectureCallback)}
            />
            <RectButton
              height={totalHeight / 2 * yMultiplier}
              width={totalWidth * xMultiplier * 0.8}
              x={totalWidth * xMultiplier * 7.6}
              y={yPos}
              color={green}
              fontSize={totalWidth * fontSizeMultiplier}
              fontColor={white}
              text={"^"}
              fontWeight="bold"
              callback={() => {
                Curriculum.moveConjectureUpByIndex(globalIndex);
                triggerRerender();
              }}
            />
            <RectButton
              height={totalHeight / 2 * yMultiplier}
              width={totalWidth * xMultiplier * 0.8}
              x={totalWidth * xMultiplier * 8}
              y={yPos}
              color={red}
              fontSize={totalWidth * fontSizeMultiplier / 1.3}
              fontColor={white}
              text={"v"}
              fontWeight="bold"
              callback={() => {
                Curriculum.moveConjectureDownByIndex(globalIndex);
                triggerRerender();
              }}
            />
            <RectButton
              height={totalHeight / 2 * yMultiplier}
              width={totalWidth * xMultiplier * 1.6}
              x={totalWidth * xMultiplier * 8.4}
              y={yPos}
              color={orange}
              fontSize={totalWidth * fontSizeMultiplier / 1.3}
              fontColor={white}
              text={"Remove"}
              fontWeight="bold"
              callback={() => {
                Curriculum.removeConjectureByIndex(globalIndex);
                triggerRerender();
              }}
            />
          </React.Fragment>
        );
      })}

      <RectButton
        height={totalHeight * 0.13}
        width={totalWidth * 0.26}
        x={totalWidth * 0.02}
        y={totalHeight * 0.93}
        color={blue}
        fontSize={totalWidth * 0.014}
        fontColor={white}
        text={"PREVIOUS"}
        fontWeight={800}
        callback={currentPage > 0 ? () => setCurrentPage(currentPage - 1) : null}
        alpha={currentPage > 0 ? 1 : 0.3}
      />

      <RectButton
        height={totalHeight * 0.13}
        width={totalWidth * 0.26}
        x={totalWidth * 0.13}
        y={totalHeight * 0.93}
        color={blue}
        fontSize={totalWidth * 0.014}
        fontColor={white}
        text={"NEXT"}
        fontWeight={800}
        callback={currentPage < totalPages - 1 ? () => setCurrentPage(currentPage + 1) : null}
        alpha={currentPage < totalPages - 1 ? 1 : 0.3}
      />
    </>
  );
};

export const CurricularContentEditor = (props) => {
  const { height, width, userName, conjectureCallback} = props;
  const [renderKey, setRenderKey] = useState(0);
  const triggerRerender = () => setRenderKey(prev => prev + 1);

  useEffect(() => {
    if (userName) {
      // Only set if not already set or if it's empty
      const currentAuthor = localStorage.getItem('CurricularAuthor');
      if (!currentAuthor || currentAuthor === '' || currentAuthor === 'undefined') {
        localStorage.setItem('CurricularAuthor', userName);
        triggerRerender();
      }
    }
  }, [userName]);

  return (
    <>
      {createInputBox(60, 0.10, 0.55, 0.223, 0.106, 'CurricularName', width, height, (key) => handleCurricularName(key, triggerRerender), renderKey)}
      {createInputBox(180, 0.10, 1, 0.210, 0.17, 'CurricularKeywords', width, height, (key) => handleCurricularKeywords(key, triggerRerender), renderKey)}
      {createInputBox(220, 0.10, 0.8, 0.55, 0.106, 'CurricularAuthor', width, height, null, renderKey, true)}
      {createInputBox(4, 0.10, 0.3, 0.730, 0.175, 'CurricularPIN', width, height, (key) => handlePinInput(key, triggerRerender), renderKey)}

      {createTextElement("Game Editor", 0.43, 0.030, 0.025, width, height)}
      {createTextElement("Keywords:", 0.110, 0.17, 0.018, width, height)}
      {createTextElement("Pin:", 0.690, 0.17, 0.018, width, height)}
      {createTextElement("Author:", 0.480, 0.105, 0.018, width, height)}
      {createTextElement("Game Name:", 0.110, 0.100, 0.018, width, height)}

      {createTextElement("Author", 0.0825, 0.32, 0.015, width, height)}
      {createTextElement("Level Name", 0.275, 0.32, 0.015, width, height)}
      {createTextElement("Keywords", 0.58, 0.32, 0.015, width, height)}

      <CurriculumList
        xMultiplier={0.1}
        yMultiplier={0.3}
        fontSizeMultiplier={0.018}
        totalWidth={width}
        totalHeight={height}
        conjectureCallback={conjectureCallback}
        triggerRerender={triggerRerender}
        renderKey={renderKey}
      />
    </>
  );
};