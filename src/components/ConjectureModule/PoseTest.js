import PoseTestMatch from "./PoseTestMatch";
import Background from "../Background";
import { Graphics } from "@inlet/react-pixi";
import { darkGray, yellow } from "../../utils/colors";
import React, { useCallback } from "react";
import { send } from "xstate";
import usePoseData from "../utilities/PoseData";
import { Text, Container } from "@inlet/react-pixi";
import { green, black, white } from "../../utils/colors";
import RectButton from "../RectButton";

const PoseTest = (props) => {
    const { height, width, columnDimensions, rowDimensions, editCallback, conjectureCallback, UUID, gameID } = props;
    const {poseData, cameraStatus, error, retryInitialization} = usePoseData();

    if (error) {
        // Show error + retry button
        return (
            <Container>
                <Text
                    text={error}
                    x={width / 2}
                    y={height / 2 - 30}
                    anchor={0.5}
                    style={{
                    fill: 0xff5555,
                    fontSize: 24,
                    fontWeight: "bold",
                    fontFamily: "Arial",
                    align: "center",
                    }}
                />
                <RectButton
                    x={width / 2 - 100}
                    y={height / 2 + 10}
                    width={500}
                    height={100}
                    color={green}
                    alpha={0.8}
                    text="Retry"
                    fontSize={18}
                    fontColor={0xffffff}
                    fontWeight="bold"
                    callback={retryInitialization}
                />
                <RectButton
                    x={width / 2 - 100}
                    y={height / 2 + 75}
                    width={500}
                    height={100}
                    color={black}
                    alpha={0.8}
                    text="Back"
                    fontSize={18}
                    fontColor={white}
                    fontWeight="bold"
                    callback={conjectureCallback}
                />
            </Container>
        );
    } else if (!cameraStatus === "initialized") {
        // Show initializing / loading message
        return (
            <Container>
                <PixiLoader width={width} height={height} />
                <Text
                    text="Trying to initialize devices..."
                    x={width / 2}
                    y={height / 2 + 100}
                    anchor={0.5}
                    style={{
                    fill: 0xffffff,
                    fontSize: 24,
                    fontWeight: "bold",
                    fontFamily: "Arial",
                    align: "center",
                    }}
                />
            </Container>
        );
    }

    // Use background and then initiate PoseTestMatch
    return (
    <>
        <Background height={height * 1.1} width={width} />
        <PoseTestMatch
            height={height}
            width={width}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            conjectureCallback={conjectureCallback}
            poseData = {poseData}
            gameID={gameID}
        />
    </>
    );
};

export default PoseTest;