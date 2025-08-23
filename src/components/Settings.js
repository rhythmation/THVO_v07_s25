import React, { useState, useCallback } from "react";
import { Container, Graphics, Text } from "@inlet/react-pixi";
import RectButton from "./RectButton";
import SettingRow from "./SettingRow";

// Typography
const TITLE_STYLE = {
  fontFamily: "Arial",
  fontSize: 26,
  fontWeight: "900",
  fill: 0x1e3a8a, // blue-900
  letterSpacing: 1.5,
};
const SECTION_STYLE = {
  fontFamily: "Arial",
  fontSize: 13,
  fontWeight: "800",
  fill: 0x6b7280, // gray-500
  letterSpacing: 1.2,
};
const LABEL_STYLE = {
  fontFamily: "Arial",
  fontSize: 16,
  fill: 0x111827, // gray-900
};

const Settings = ({ width, height, x, y, onClose }) => {
  // Layout constants
  const MARGIN = 20;           // outer card margin
  const PAD = 20;              // inner content padding
  const COL_GAP = 56;          // space between columns
  const COL_W = (width - MARGIN * 2 - COL_GAP - PAD * 2) / 2;

  const leftColX = MARGIN + PAD;
  const rightColX = leftColX + COL_W + COL_GAP;

  const firstRowY = 96;        // first toggle row y
  const rowSpacing = 40;       // vertical spacing between rows

  // State
  const [settings, setSettings] = useState({
    sound: true,
    music: true,
    story: true,
    mclips: true,
    tween: true,
    calibration: true,
    Hints: true,
    NumberOfhints: 4,
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

  const toggleSetting = (key) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const updateNumberOfhints = (increment) =>
    setSettings((prev) => ({
      ...prev,
      NumberOfhints: Math.max(0, prev.NumberOfhints + increment),
    }));

  const updateLanguage = () =>
    setSettings((prev) => ({
      ...prev,
      language: prev.language === "English" ? "Spanish" : "English",
    }));

  // Background & card
  const drawBackground = useCallback(
    (g) => {
      g.clear();

      // soft background
      g.beginFill(0xf9fafb); // gray-50
      g.drawRect(0, 0, width, height);
      g.endFill();

      // drop shadow
      const cardWidth = width - MARGIN * 2;
      const cardHeight = height - MARGIN * 2;
      const radius = 14;

      g.beginFill(0x000000, 0.08);
      g.drawRoundedRect(MARGIN + 4, MARGIN + 6, cardWidth, cardHeight, radius);
      g.endFill();

      // foreground card
      g.beginFill(0xffffff);
      g.drawRoundedRect(MARGIN, MARGIN, cardWidth, cardHeight, radius);
      g.endFill();

      // top divider line (under title)
      g.lineStyle(1, 0xe5e7eb, 1);
      g.moveTo(MARGIN + PAD, 72);
      g.lineTo(width - MARGIN - PAD, 72);
      g.lineStyle(0);
    },
    [width, height]
  );

  return (
    <Container position={[x, y]} zIndex={100}>
      <Graphics draw={drawBackground} />

      {/* Title */}
      <Text
        text="SETTINGS"
        style={TITLE_STYLE}
        x={width / 2}
        y={36}
        anchor={0.5}
      />

      {/* LEFT COLUMN */}
      {/* Audio */}
      <Text text="AUDIO" style={SECTION_STYLE} x={leftColX} y={firstRowY - 24} />
      <SettingRow
        label="Sound:"
        value={settings.sound}
        x={leftColX}
        y={firstRowY + rowSpacing * 0}
        onToggle={() => toggleSetting("sound")}
      />
      <SettingRow
        label="Music:"
        value={settings.music}
        x={leftColX}
        y={firstRowY + rowSpacing * 1}
        onToggle={() => toggleSetting("music")}
      />

      {/* Narrative */}
      <Text
        text="NARRATIVE"
        style={SECTION_STYLE}
        x={leftColX}
        y={firstRowY + rowSpacing * 2 - 24}
      />
      <SettingRow
        label="Story:"
        value={settings.story}
        x={leftColX}
        y={firstRowY + rowSpacing * 2}
        onToggle={() => toggleSetting("story")}
      />

      {/* Motion */}
      <Text
        text="MOTION"
        style={SECTION_STYLE}
        x={leftColX}
        y={firstRowY + rowSpacing * 3 - 24}
      />
      <SettingRow
        label="M-Clips:"
        value={settings.mclips}
        x={leftColX}
        y={firstRowY + rowSpacing * 3}
        onToggle={() => toggleSetting("mclips")}
      />
      <SettingRow
        label="Tween:"
        value={settings.tween}
        x={leftColX}
        y={firstRowY + rowSpacing * 4}
        onToggle={() => toggleSetting("tween")}
      />

      {/* Scaffolds */}
      <Text
        text="SCAFFOLDS"
        style={SECTION_STYLE}
        x={leftColX}
        y={firstRowY + rowSpacing * 5 - 24}
      />
      <SettingRow
        label="Calibration:"
        value={settings.calibration}
        x={leftColX}
        y={firstRowY + rowSpacing * 5}
        onToggle={() => toggleSetting("calibration")}
      />
      <SettingRow
        label="Hints:"
        value={settings.Hints}
        x={leftColX}
        y={firstRowY + rowSpacing * 6}
        onToggle={() => toggleSetting("Hints")}
      />

      {/* Number of Hints (inline, cleaner) */}
      <Container position={[leftColX, firstRowY + rowSpacing * 7 - 2]}>
        <Text text="No. of Hints:" style={LABEL_STYLE} />
        <RectButton
          width={30}
          height={28}
          x={160}
          y={-4}
          text="-"
          color="#ef4444"
          fontColor="white"
          callback={() => updateNumberOfhints(-1)}
        />
        <Text
          text={`${settings.NumberOfhints}`}
          style={{ fontFamily: "Arial", fontSize: 16, fill: 0x111827 }}
          x={200}
          y={0}
        />
        <RectButton
          width={30}
          height={28}
          x={240}
          y={-4}
          text="+"
          color="#22c55e"
          fontColor="white"
          callback={() => updateNumberOfhints(1)}
        />
      </Container>

      {/* Language */}
      <Text
        text="LANGUAGE"
        style={SECTION_STYLE}
        x={leftColX}
        y={firstRowY + rowSpacing * 8 - 24}
      />
      <RectButton
        width={128}
        height={36}
        x={leftColX}
        y={firstRowY + rowSpacing * 8 - 4}
        text={settings.language}
        color="#2563eb"
        fontColor="white"
        callback={updateLanguage}
      />

      {/* RIGHT COLUMN */}
      {/* Data */}
      <Text
        text="DATA"
        style={SECTION_STYLE}
        x={rightColX}
        y={firstRowY - 24}
      />
      <SettingRow
        label="Audio Recording:"
        value={settings.audioRecording}
        x={rightColX}
        y={firstRowY + rowSpacing * 0}
        onToggle={() => toggleSetting("audioRecording")}
      />
      <SettingRow
        label="Video Recording:"
        value={settings.videoRecording}
        x={rightColX}
        y={firstRowY + rowSpacing * 1}
        onToggle={() => toggleSetting("videoRecording")}
      />
      {/* FPS (label + value) */}
      <Container position={[rightColX, firstRowY + rowSpacing * 2]}>
        <Text text="FPS:" style={LABEL_STYLE} y={0} />
        <Text
          text={`${settings.fps}`}
          style={LABEL_STYLE}
          x={120}
          y={0}
        />
      </Container>

      {/* Mode */}
      <Text
        text="MODE"
        style={SECTION_STYLE}
        x={rightColX}
        y={firstRowY + rowSpacing * 3 - 24}
      />
      <SettingRow
        label="Research:"
        value={settings.research}
        x={rightColX}
        y={firstRowY + rowSpacing * 3}
        onToggle={() => toggleSetting("research")}
      />
      <SettingRow
        label="Teaching:"
        value={settings.teaching}
        x={rightColX}
        y={firstRowY + rowSpacing * 4}
        onToggle={() => toggleSetting("teaching")}
      />

      {/* Accessibility */}
      <Text
        text="ACCESSIBILITY"
        style={SECTION_STYLE}
        x={rightColX}
        y={firstRowY + rowSpacing * 5 - 24}
      />
      <SettingRow
        label="Closed Captions:"
        value={settings.closedCaptions}
        x={rightColX}
        y={firstRowY + rowSpacing * 5}
        onToggle={() => toggleSetting("closedCaptions")}
      />
      <SettingRow
        label="Visual Assist:"
        value={settings.visualAssist}
        x={rightColX}
        y={firstRowY + rowSpacing * 6}
        onToggle={() => toggleSetting("visualAssist")}
      />
      <SettingRow
        label="Text to Speech:"
        value={settings.textToSpeech}
        x={rightColX}
        y={firstRowY + rowSpacing * 7}
        onToggle={() => toggleSetting("textToSpeech")}
      />

      {/* Close */}
      <RectButton
        width={180}
        height={48}
        x={width / 2 - 90}
        y={height - MARGIN - 56}
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
