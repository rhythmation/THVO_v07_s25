import React, { useState, useCallback } from "react";
import { Container, Graphics, Text } from "@inlet/react-pixi";
import RectButton from "./RectButton";
import SettingRow from "./SettingRow";



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
      // Card metrics
      const margin      = 20;
      const cardWidth   = width  - margin * 2;
      const cardHeight  = height - margin * 2;      
      const radius      = 12;

      g.beginFill(0x000000, 0.15);
      g.drawRoundedRect(
        margin + 4,       // x offset
        margin + 4,       // y offset
        cardWidth,        // same size
        cardHeight,
        radius
      );
     g.endFill();

      // 2) draw the ivory card on top
      g.beginFill(0xfffffa);
      g.drawRoundedRect(margin, margin, cardWidth, cardHeight, radius);
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
        y={40}
        anchor={0.5}
      />

      {/* Left Column Settings */}
       {/* Audio part  */}
      <Text text={"Audio"} style={{ fontSize: 12, fill: "black" }} x={20} y={40} />
      <SettingRow
    label="Sound:"
    value={settings.sound}
    x={20}
    y={50}
    onToggle={() => toggleSetting("sound")}
  />


<SettingRow
  label="Music:"
  value={settings.music}
  x={20}
  y={80}
  onToggle={() => toggleSetting("music")}
/>

      {/* Narrative  part  */}
      <Text text={"Narrative"} style={{ fontSize: 12, fill: "black" }} x={20} y={120} />
      <SettingRow
  label="Story:"
  value={settings.story}
  x={20}
  y={130}
  onToggle={() => toggleSetting("story")}
/>
      {/* Motion part  */}
      <Text text={"Motion"} style={{ fontSize: 12, fill: "black" }} x={20} y={160} />

      <SettingRow
  label="M-Clips:"
  value={settings.mclips}
  x={20}
  y={170}
  onToggle={() => toggleSetting("mclips")}
/>

     
      <SettingRow
  label="Tween:"
  value={settings.tween}
  x={20}
  y={200}
  onToggle={() => toggleSetting("tween")}
/>

          {/* Scaffolds part  */}
      <Text text={"Scaffolds"} style={{ fontSize: 12, fill: "black" }} x={20} y={230} /> 

      <SettingRow
  label="Calibration:"
  value={settings.calibration}
  x={20}
  y={240}
  onToggle={() => toggleSetting("calibration")}
/>


     <SettingRow
  label="Hints:"
  value={settings.Hints}
  x={20}
  y={260}
  onToggle={() => toggleSetting("Hints")}
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
      <SettingRow
  label="Audio Recording:"
  value={settings.audioRecording}
  x={width/2 + 20}
  y={60}
  onToggle={() => toggleSetting("audioRecording")}
/>

      <SettingRow
  label="Video Recording:"
  value={settings.videoRecording}
  x={width/2 + 20}
  y={85}
  onToggle={() => toggleSetting("videoRecording")}
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
      <SettingRow
  label="Research:"
  value={settings.research}
  x={width/2 + 20}
  y={150}
  onToggle={() => toggleSetting("research")}
/>


      <SettingRow
  label="Teaching:"
  value={settings.teaching}
  x={width/2 + 20}
  y={170}
  onToggle={() => toggleSetting("teaching")}
/>


       {/* access part  */}
       <Text text={"access"} style={{ fontSize: 12, fill: "black" }} x={width / 2 + 20} y={220} />

       <SettingRow
  label="Closed-Captions:"
  value={settings.closedCaptions}
  x={width/2 + 20}
  y={230}
  onToggle={() => toggleSetting("closedCaptions")}
/>


      <SettingRow
  label="Visual Assist:"
  value={settings.visualAssist}
  x={width/2 + 20}
  y={250}
  onToggle={() => toggleSetting("visualAssist")}
/>


      <SettingRow
  label="Text to Speech:"
  value={settings.textToSpeech}
  x={width/2 + 20}
  y={270}
  onToggle={() => toggleSetting("textToSpeech")}
/>

      <RectButton
        width={160}
        height={48}
        x={width / 2 - 80}
        y={height - 60}
        text="CLOSE"
        color="red"          
        fontColor="white"
        fontWeight="bold"
        callback={onClose}
      />

    </Container>
  );
};

export default Settings;
