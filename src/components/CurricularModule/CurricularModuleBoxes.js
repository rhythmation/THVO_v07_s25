import React, { useState, useEffect } from 'react';
import { Text } from "@inlet/react-pixi";
import { TextStyle } from "@pixi/text";
import { white, black } from "../../utils/colors";
import InputBox from "../InputBox";
import RectButton from "../RectButton";
import { blue, red, green, orange } from "../../utils/colors";
import {Curriculum} from "./CurricularModule"
import { setEditLevel, setGoBackFromLevelEdit, currentConjecture } from '../ConjectureModule/ConjectureModule';

// Handler functions
function handleCurricularName(key) {
  const existingValue = localStorage.getItem(key);
  const newValue = prompt("Please name your Game:", existingValue);
  if (newValue !== null) {
    localStorage.setItem(key, newValue);
  }
}

function handleCurricularKeywords(key) {
  const existingValue = localStorage.getItem(key);
  const newValue = prompt("Keywords make your search easier:", existingValue);
  if (newValue !== null) {
    localStorage.setItem(key, newValue);
  }
}

function handleCurricularAuthor(key) {
  const existingValue = localStorage.getItem(key);
  const newValue = prompt("Please add an Author name:", existingValue);
  if (newValue !== null) {
    localStorage.setItem(key, newValue);
  }
}

function handlePinInput(key) {
  let pin = prompt("Enter a code PIN", localStorage.getItem(key));
  if (pin && !isNaN(pin)) {
    localStorage.setItem(key, pin);
  } else if (pin !== null) {
    alert("PIN must be numeric.");
  }
}

function handleLevelClicked(conjecture, conjectureCallback){
    setEditLevel(false);
    setGoBackFromLevelEdit("NEWGAME");
    currentConjecture.setConjecture(conjecture);
    conjectureCallback(conjecture);
}

// Function to create input boxes for curricular content
function createInputBox(charLimit, scaleFactor, widthMultiplier, xMultiplier, yMultiplier, textKey, totalWidth, totalHeight, callback) {
  const text = localStorage.getItem(textKey)?.slice(0, charLimit) +
               (localStorage.getItem(textKey)?.length > charLimit ? '...' : '');

  const height = totalHeight * scaleFactor;
  const width = totalWidth * widthMultiplier;
  const x = totalWidth * xMultiplier;
  const y = totalHeight * yMultiplier;

  return (
    <InputBox
      key={textKey}
      height={height}
      width={width}
      x={x}
      y={y}
      color={white}
      fontSize={totalWidth * 0.012}
      fontColor={black}
      text={text}
      fontWeight={500}
      outlineColor={black}
      callback={() => callback(textKey)}
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


const CurriculumList = ({ xMultiplier, yMultiplier, fontSizeMultiplier, totalWidth, totalHeight, conjectureCallback }) => {
  const conjectureList = Curriculum.getCurrentConjectures();
  //use to get a fixed number of conjectures per page and to navigate between the pages
  const conjecturesPerPage = 6;
  const totalPages = Math.ceil(conjectureList.length / conjecturesPerPage);
  const [currentPage, setCurrentPage] = useState(0);

  if (conjectureList.length === 0){
    return null;
  }

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // use to determine the subset of conjectures to display based on the current page
  const startIndex = currentPage * conjecturesPerPage;
  const currentConjectures = conjectureList.slice(startIndex, startIndex + conjecturesPerPage);

  return (
    <>
      {currentConjectures.map((conjecture, index) => (
        <RectButton
          key={conjecture["Text Boxes"]["Author Name"] + index}
          height={totalHeight /2 * yMultiplier}
          width={totalWidth * xMultiplier *4}
          x={totalWidth * xMultiplier * 0.25}
          y={totalHeight * (index+1) * 4 * fontSizeMultiplier + totalHeight * yMultiplier}
          color={white}
          fontSize={totalWidth * fontSizeMultiplier/1.3}
          fontColor={blue}
          text={conjecture["Text Boxes"]["Author Name"]}
          fontWeight="bold"
          callback = {() => handleLevelClicked(conjecture, conjectureCallback)}
        />
      ))}
      {currentConjectures.map((conjecture, index) => (
        <RectButton
          key={conjecture["Text Boxes"]["Conjecture Name"] + index}
          height={totalHeight /2 * yMultiplier}
          width={totalWidth * xMultiplier *7}
          x={totalWidth * xMultiplier * 1.9}
          y={totalHeight * (index+1) * 4 * fontSizeMultiplier + totalHeight * yMultiplier}
          color={white}
          fontSize={totalWidth * fontSizeMultiplier/1.3}
          fontColor={blue}
          text={conjecture["Text Boxes"]["Conjecture Name"]}
          fontWeight="bold"
          callback = {() => handleLevelClicked(conjecture, conjectureCallback)}
        />
      ))}
      {currentConjectures.map((conjecture, index) => (
        <RectButton
          key={conjecture["Text Boxes"]["Conjecture Keywords"] + index}
          height={totalHeight /2 * yMultiplier}
          width={totalWidth * xMultiplier * 7}
          x={totalWidth * xMultiplier * 4.75} 
          y={totalHeight * (index+1) * 4 * fontSizeMultiplier + totalHeight * yMultiplier} 
          color={white}
          fontSize={totalWidth * fontSizeMultiplier/1.3}
          fontColor={blue}
          text={conjecture["Text Boxes"]["Conjecture Keywords"]}
          fontWeight="bold"
          callback = {() => handleLevelClicked(conjecture, conjectureCallback)}
        />
      ))}
      {currentConjectures.map((conjecture, index) => (
        <RectButton
          key={index + " up"}
          height={totalHeight /2 * yMultiplier}
          width={totalWidth * xMultiplier * 0.8}
          x={totalWidth * xMultiplier * 7.6} 
          y={totalHeight * yMultiplier + totalHeight * (index+1) * 4 * fontSizeMultiplier} 
          color={green}
          fontSize={totalWidth * fontSizeMultiplier}
          fontColor={white}
          text={"^"}
          fontWeight="bold"
          callback = {() => {
            Curriculum.moveConjectureUpByIndex(index);
          }}
        />
      ))}
      {currentConjectures.map((conjecture, index) => (
        <RectButton
          key={index+ " down"}
          height={totalHeight /2 * yMultiplier}
          width={totalWidth * xMultiplier * 0.8}
          x={totalWidth * xMultiplier * 8} 
          y={totalHeight * (index+1) * 4 * fontSizeMultiplier + totalHeight * yMultiplier} 
          color={red}
          fontSize={totalWidth * fontSizeMultiplier/1.3}
          fontColor={white}
          text={"v"}
          fontWeight="bold"
          callback = {() => {
            Curriculum.moveConjectureDownByIndex(index);
          }}
        />
      ))}
      {currentConjectures.map((conjecture, index) => (
        <RectButton
          key={index + " remove"}
          height={totalHeight /2 * yMultiplier}
          width={totalWidth * xMultiplier *1.6}
          x={totalWidth * xMultiplier * 8.4} 
          y={totalHeight * (index+1) * 4 * fontSizeMultiplier + totalHeight * yMultiplier} 
          color={orange}
          fontSize={totalWidth * fontSizeMultiplier/1.3}
          fontColor={white}
          text={"Remove"}
          fontWeight="bold"
          callback = {() => {
            Curriculum.removeConjectureByIndex(index);
          }}
        />
      ))}
      
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
        callback={currentPage > 0 ? prevPage : null}
        alpha={currentPage > 0 ? 1 : 0.3}
      />

      <RectButton
        height={totalHeight * 0.13}
        width={totalWidth * 0.26}
        x={totalWidth * 0.14}
        y={totalHeight * 0.93}
        color={blue}
        fontSize={totalWidth * 0.014}
        fontColor={white}
        text={"NEXT"}
        fontWeight={800}
        callback={currentPage < totalPages - 1 ? nextPage : null}
        alpha={currentPage < totalPages - 1 ? 1 : 0.3}
      />
    </>
  );
}

export const CurricularContentEditor = (props) => {
  const { height, width, conjectureCallback } = props;

  return (
    <>
      {createInputBox(60, 0.10, 0.55, 0.123+ 0.10, 0.136-.030, 'CurricularName', width, height, handleCurricularName)}
      {createInputBox(180, 0.10, 1, 0.210, 0.17, 'CurricularKeywords', width, height, handleCurricularKeywords)}
      {createInputBox(220, 0.10, .8, 0.46+ 0.09, 0.136-.030, 'CurricularAuthor', width, height, handleCurricularAuthor)}
      {createInputBox(4, 0.10, .3, 0.730, 0.175, 'CurricularPIN', width, height, handlePinInput)}

      {/* For the text input boxes */}
      {createTextElement("Game Editor", 0.43, 0.030, 0.025, width, height)}
      {createTextElement("Keywords:", 0.110, 0.17, 0.018, width, height)}
      {createTextElement("Pin:", 0.690, 0.17, 0.018, width, height)}
      {createTextElement("Author:", 0.480, 0.105, 0.018, width, height)}
      {createTextElement("Game Name:",0.110, 0.100, 0.018, width, height)}

      {/* To label the conjectures */}
      {createTextElement("Author", 0.0825, 0.32, 0.015, width, height)}
      {createTextElement("Conjecture Name", 0.275, 0.32, 0.015, width, height)}
      {createTextElement("Keywords", 0.58, 0.32, 0.015, width, height)}

      <CurriculumList 
        xMultiplier={0.1} 
        yMultiplier={0.3} 
        fontSizeMultiplier={0.018} 
        totalWidth={width} 
        totalHeight={height} 
        conjectureCallback={conjectureCallback} 
      />
    </>
  );
};