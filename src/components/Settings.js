import React, { useState, useCallback } from "react";
import { Container, Graphics, Text } from "@inlet/react-pixi";
import RectButton from "./RectButton";

const Settings = ({ width, height, x, y, onClose }) => {
  // State to manage all settings
  const [settings, setSettings] = useState({
    sound: true,
    music: true,
    story: true,
    mclips: true,
    tween: true,
    calibration: true,
    Hints: true,
    NumberOfhints:4,
    language: "English",
    fps: 30,
    audioRecording: true,
    videoRecording: true,
    research: true,
    teaching: false,
    closedCaptions: true,
    visualAssist: false,
    textToSpeech: true,
    pip: false,
  });

  // Toggle settings between ON and OFF
  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Update the number of hints (increment or decrement)
  const updateNumberOfhints= (increment) => {
    setSettings((prev) => ({
      ...prev,
      NumberOfhints: Math.max(0, prev.NumberOfhints + increment),
    }));
  };

  // Change language between English and Spanish
  const updateLanguage = () => {
    setSettings((prev) => ({
      ...prev,
      language: prev.language === "English" ? "Spanish" : "English",
    }));
  };

  // Draw the background for the settings menu
  const drawBackground = useCallback(
    (g) => {
      g.clear();
      g.beginFill(0xffffe0); // Light yellow background
      g.drawRect(0, 0, width, height);
      g.endFill();
    },
    [width, height]
  );

  return (
    <Container position={[x, y]} zIndex={100}>
      {/* Background */}
      <Graphics draw={drawBackground} />

      {/* Title */}
      <Text
        text={"SETTINGS"}
        style={{
          fontFamily: "Arial",
          fontSize: 24,
          fontWeight: "bold",
          fill: "blue",
        }}
        x={width / 2}
        y={20}
        anchor={0.5}
      />

      {/* Left Column Settings */}
       {/* Audio part  */}
      <Text text={"Audio"} style={{ fontSize: 12, fill: "black" }} x={20} y={40} />
      <Text text={"Sound:"} style={{ fontSize: 20, fill: "black" }} x={20} y={50} />
      <RectButton
        width={100}
        height={30}
        x={width / 3 - 50}
        y={60}
        text={settings.sound ? "ON" : "OFF"}
        color={settings.sound ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("sound")}
      />

      <Text text={"Music:"} style={{ fontSize: 20, fill: "black" }} x={20} y={70} />
      <RectButton
        width={100}
        height={30}
        x={width / 3 - 50}
        y={80}
        text={settings.music ? "ON" : "OFF"}
        color={settings.music ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("music")}

      />

      {/* Narrative  part  */}
      <Text text={"Narrative"} style={{ fontSize: 12, fill: "black" }} x={20} y={120} />
      <Text text={"Story:"} style={{ fontSize: 20, fill: "black" }} x={20} y={130} />
      <RectButton
        width={100}
        height={30}
        x={width / 3 - 50}
        y={130}
        text={settings.story ? "ON" : "OFF"}
        color={settings.story ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("story")}
      />
      {/* Motion part  */}
      <Text text={"Motion"} style={{ fontSize: 12, fill: "black" }} x={20} y={160} />

      <Text text={"M-Clips:"} style={{ fontSize: 20, fill: "black" }} x={20} y={170} />
      <RectButton
        width={100}
        height={30}
        x={width / 3 - 50}
        y={170}
        text={settings.mclips ? "ON" : "OFF"}
        color={settings.mclips ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("mclips")}
      />
     
      <Text text={"Tween:"} style={{ fontSize: 20, fill: "black" }} x={20} y={190} />
      <RectButton
        width={100}
        height={30}
        x={width / 3 - 50}
        y={200}
        text={settings.tween ? "ON" : "OFF"}
        color={settings.tween ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("tween")}
      />
          {/* Scaffolds part  */}
      <Text text={"Scaffolds"} style={{ fontSize: 12, fill: "black" }} x={20} y={230} /> 

      <Text
        text={"Calibration:"}
        style={{ fontSize: 20, fill: "black" }}
        x={20}
        y={240}
      />
      <RectButton
        width={100}
        height={30}
        x={width / 3 - 50}
        y={250}
        text={settings.calibration ? "ON" : "OFF"}
        color={settings.calibration ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("calibration")}
        
      />

     <Text
        text={"Hints:"}
        style={{ fontSize: 20, fill: "black" }}
        x={20}
        y={260}
      />
      <RectButton
        width={100}
        height={30}
        x={width / 3 - 50}
        y={270}
        text={settings.Hints ? "ON" : "OFF"}
        color={settings.Hints ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("Hints")}
        
      />
      

      <Text text={"No of Hints:"} style={{ fontSize: 20, fill: "black" }} x={20} y={280} />
      <Text
        text={`${settings.NumberOfhints}`}
        style={{ fontSize: 16, fill: "black" }}
        x={width / 3 - 20}
        y={300}
      />
      <RectButton
        width={30}
        height={30}
        x={width / 3 - 70}
        y={300}
        text={"-"}
        color={"red"}
        fontColor={"white"}
        callback={() => updateNumberOfhints(-1)}
      />
      <RectButton
        width={30}
        height={30}
        x={width / 3 + 10}
        y={300}
        text={"+"}
        color={"green"}
        fontColor={"white"}
        callback={() => updateNumberOfhints(1)}
      />

      <Text text={"Language"} style={{ fontSize: 20, fill: "black" }} x={20} y={340} />
      <RectButton
        width={110}
        height={40}
        x={width / 3 - 50}
        y={340}
        text={settings.language}
        color={"blue"}
        fontColor={"white"}
        callback={updateLanguage}
      />

      {/* Right Column Settings */}
      
     {/* Data part  */}
      
      <Text text={"Data"} style={{ fontSize: 12, fill: "black" }} x={width / 2 + 20} y={50} />
      <Text
        text={"Audio Recording:"}
        style={{ fontSize: 20, fill: "black" }}
        x={width / 2 + 20}
        y={60}
      />
      <RectButton
        width={100}
        height={30}
        x={width - 120}
        y={65}
        text={settings.audioRecording ? "ON" : "OFF"}
        color={settings.audioRecording ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("audioRecording")}
      />
      <Text
        text={"Video Recording:"}
        style={{ fontSize: 20, fill: "black" }}
        x={width / 2 + 20}
        y={80}
      />
      <RectButton
        width={100}
        height={30}
        x={width - 120}
        y={85}
        text={settings.videoRecording ? "ON" : "OFF"}
        color={settings.videoRecording ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("videoRecording")}
      />

      <Text text={"FPS:"} style={{ fontSize: 20, fill: "black" }} x={width / 2 + 20} y={100} />
      <Text
        text={`${settings.fps}`}
        style={{ fontSize: 16, fill: "black" }}
        x={width - 120}
        y={110}
      />

       {/* Mode part  */}
      <Text text={"Mode"} style={{ fontSize: 12, fill: "black" }} x={width / 2 + 20} y={140} />
      <Text
        text={"Research:"}
        style={{ fontSize: 20, fill: "black" }}
        x={width / 2 + 20}
        y={150}
      />
      <RectButton
        width={100}
        height={30}
        x={width - 120}
        y={160}
        text={settings.research ? "ON" : "OFF"}
        color={settings.research ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("research")}
      />

      <Text
        text={"Teaching:"}
        style={{ fontSize: 20, fill: "black" }}
        x={width / 2 + 20}
        y={170}
      />
      <RectButton
        width={100}
        height={30}
        x={width - 120}
        y={190}
        text={settings.teaching ? "ON" : "OFF"}
        color={settings.teaching ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("teaching")}
      />

       {/* access part  */}
       <Text text={"access"} style={{ fontSize: 12, fill: "black" }} x={width / 2 + 20} y={220} />

       <Text
        text={"Closed-Captions:"}
        style={{ fontSize: 20, fill: "black" }}
        x={width / 2 + 20}
        y={230}
      />
      <RectButton
        width={100}
        height={30}
        x={width - 120}
        y={230}
        text={settings.closedCaptions ? "ON" : "OFF"}
        color={settings.closedCaptions ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("closedCaptions")}
      />

      <Text
        text={"VisualAssist:"}
        style={{ fontSize: 20, fill: "black" }}
        x={width / 2 + 20}
        y={250}
      />
      <RectButton
        width={100}
        height={30}
        x={width - 120}
        y={250}
        text={settings.visualAssist ? "ON" : "OFF"}
        color={settings.visualAssist ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("visualAssist")}
      />

      <Text
        text={"TextToSpeech:"}
        style={{ fontSize: 20, fill: "black" }}
        x={width / 2 + 20}
        y={270}
      />
      <RectButton
        width={100}
        height={30}
        x={width - 120}
        y={275}
        text={settings.textToSpeech ? "ON" : "OFF"}
        color={settings.textToSpeech ? "green" : "red"}
        fontColor={"white"}
        callback={() => toggleSetting("textToSpeech")}
      />

      {/* Close Button */}
      <RectButton
        width={130}
        height={40}
        x={width / 2 - 50}
        y={height - 30}
        text={"CLOSE"}
        fontColor={"red"}
        callback={onClose}
        fontWeight = {"bold"}
   
      />
    </Container>
  );
};

export default Settings;
