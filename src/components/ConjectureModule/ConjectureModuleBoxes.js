import React, { useState, useEffect } from 'react';
import { Graphics, Text } from "@inlet/react-pixi";
import { TextStyle } from "@pixi/text";
import { yellow, blue, green, white, red, black } from "../../utils/colors";
import InputBox from "../InputBox";
import { getEditLevel } from './ConjectureModule';
import { sanitizeValue } from "../../utils/sanitize";

function safeSetItem(key, val) {
  if (val !== undefined && val !== null && val.toString().trim() !== '') {
    localStorage.setItem(key, val);
  } else {
    localStorage.removeItem(key);
  }
}

function createInputBox(charLimit, scaleFactor, widthMultiplier, xMultiplier, yMultiplier, textKey, totalWidth, totalHeight, inputCallback, disabled = false, username = null) {
    // fetch value once
    const raw = localStorage.getItem(textKey);

  const placeholderMap = {
    'Conjecture Name':       'Enter level name…',
    'Author Name':           'Author',
    'PIN':                   '4-digit PIN',
    'Conjecture Description':'Add a short description…',
    'Conjecture Keywords':   'keyword1, keyword2',
    'Multiple Choice 1':     'Choice A',
    'Multiple Choice 2':     'Choice B',
    'Multiple Choice 3':     'Choice C',
    'Multiple Choice 4':     'Choice D',
  };


  let displayValue = sanitizeValue(raw);

  if (textKey === 'Author Name' && !displayValue && username) {
    displayValue = username;
  }

  const isPlaceholder = displayValue === '';  
const text = displayValue
    ? (displayValue.length > charLimit ? displayValue.slice(0, charLimit) + '…' : displayValue)
    : placeholderMap[textKey] ?? '';

  const height = totalHeight * scaleFactor;
  const width = totalWidth * widthMultiplier;
  const x = totalWidth * xMultiplier;
  const y = totalHeight * yMultiplier;

  return (
    <InputBox
      height={height}
      width={width}
      x={x}
      y={y}
      color={disabled ? blue : white}
      fontSize={totalWidth * 0.012}
      fontColor={disabled ? white : (isPlaceholder ? '#888' : black)}
      text={text}
      fontWeight={disabled ? 1000 : 500}
      callback={disabled ? null : () => {
        if(getEditLevel())
          inputCallback(textKey);
      }}
    />
  );
}

export const NameBox = (props) => {
  const { height, width, username, boxState } = props;
  const [, setRefresh] = useState(0);

  // Auto-populate author name with username if no previous author exists
  useEffect(() => {
    if (username && !localStorage.getItem('Author Name')) {
      localStorage.setItem('Author Name', username);
    }
  }, [username]);

  let titleText = "";
  if(getEditLevel())
    titleText = "Level Editor";
  else
    titleText = "Level Preview";

  function handleBoxInput(key) {
    const existingValue = localStorage.getItem(key);
    const newValue = prompt(`Please Enter Your Value for ${key}`, existingValue);

    if (newValue !== null) {
      localStorage.setItem(key, newValue);
      setRefresh((n) => n + 1);
    }
  }

  return (
    <>
      {/* charLimit, scaleFactor, widthMultiplier, xMultiplier, yMultiplier, textKey, totalWidth, totalHeight, callback*/}
      {createInputBox(220, 0.19, 1.595, 0.134, 0.57, 'Multiple Choice 1', width, height, handleBoxInput)}
      {createInputBox(220, 0.19, 1.595, 0.134, 0.66, 'Multiple Choice 2', width, height, handleBoxInput)}
      {createInputBox(220, 0.19, 1.595, 0.134, 0.75, 'Multiple Choice 3', width, height, handleBoxInput)}
      {createInputBox(220, 0.19, 1.595, 0.134, 0.84, 'Multiple Choice 4', width, height, handleBoxInput)}
      {createInputBox(60, 0.10, 0.54, 0.143+ 0.062, 0.136-.050, 'Conjecture Name', width, height, handleBoxInput)}
      {createInputBox(220, 0.10, .3, 0.46+ 0.062, 0.136-.050, 'Author Name', width, height, null, true, username)}
      {createInputBox(220, 0.30, 1.595, 0.134, 0.175-.050, 'Conjecture Description', width, height, handleBoxInput)}
      {createInputBox(220, 0.10, 1.268, 0.203 + 0.062, 0.295-.050, 'Conjecture Keywords', width, height, handleBoxInput)}

      {/* text, xMultiplier, yMultiplier, fontSizeMultiplier, totalWidth, totalHeight, color */}
      {createTextElement("KEYWORDS:", 0.137+ 0.062, 0.315-0.05, 0.018, width, height)}
      {createTextElement("PIN:", 0.605+ 0.062, 0.155-0.05, 0.018, width, height)}
      {createTextElement("AUTHOR:", 0.41+ 0.062, 0.155-0.05, 0.018, width, height)}
      {createTextElement("CURRENT M-CLIP:", 0.45, 0.305, 0.018, width, height)}
      {createTextElement("MULTIPLE CHOICE", 0.45, 0.533, 0.018, width, height)}
      {createTextElement(titleText, 0.45, 0.05, 0.025, width, height)}
      {createTextElement("NAME:", 0.108+ 0.062, 0.155-0.05, 0.018, width, height)}

    </>
  );
}

function createTextElement(text, xMultiplier, yMultiplier, fontSizeMultiplier, totalWidth, totalHeight, color = blue) {
  return (
    <Text
      text={text}
      x={totalWidth * xMultiplier}
      y={totalHeight * yMultiplier}
      style={
        new TextStyle({
          align: "left",
          fontFamily: "Arial",
          fontSize: totalWidth * fontSizeMultiplier,
          fontWeight: 800,
          fill: [color],
          letterSpacing: 0,
        })
      }
      anchor={0.5}
    />
  );
}

export const PINBox = (props) => {
  const { height, width } = props;
  const [, setRefresh] = useState(0);

  // Creates a popup in which the user can set a pin for their conjecture
    /* 1.  local state mirrors storage so UI is stable */
const [pinValue, setPinValue] = useState(
  sanitizeValue(localStorage.getItem('PIN'))
);
  /* 2.  popup handler */
  function pinBoxInput() {
    if (!getEditLevel()) return;

    const newPin = prompt('Please enter a 4-digit PIN', pinValue);

    if (newPin === null) return;                 // user hit Cancel
    if (isNaN(newPin))  return alert('PIN must be numeric');

  safeSetItem('PIN', newPin);    
  setPinValue(newPin);                         // ← triggers rerender, no flicker
  }

  // Determine what text to display
  let displayText;
  let fontColor;

  if (!getEditLevel()) {
    // In preview mode, always show asterisks
    displayText = '****';
    fontColor = black;
  } else if (pinValue) {
    // In edit mode with a PIN set, show the actual PIN
    displayText = pinValue;
    fontColor = black;
  } else {
    // No PIN set, show placeholder
    displayText = '4-digit PIN';
    fontColor = '#888';
  }

  return (
      <>
      {/* PINBox InputBox */}
      <InputBox
        height={height * 0.10}
        width={width * 0.2}
        x={width * 0.6910}
        y={height * 0.085}
        color={white}
        fontSize={width * 0.013}
        text={displayText}
        fontColor={fontColor}
        fontWeight={300}
        callback={pinBoxInput} // Create Popup
      />
      </>
  )
}