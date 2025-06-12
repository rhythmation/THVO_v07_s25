import PoseTestMatch from "./PoseTestMatch";
import Background from "../Background";
import { Graphics } from "@inlet/react-pixi";
import { darkGray, yellow } from "../../utils/colors";
import React, { useCallback } from "react";
import { send } from "xstate";
import usePoseData from "../utilities/PoseData";

const PoseTest = (props) => {
    const { height, width, columnDimensions, rowDimensions, editCallback, conjectureCallback,UUID } = props;
    const poseData = usePoseData();

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
        />
    </>
    );
};

export default PoseTest;