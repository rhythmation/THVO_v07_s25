import Button from "../Button";
import PlayGameMachine from "./PlayGameMachine";
import {white, red} from "../../utils/colors";
import { useMachine} from "@xstate/react";
import { useEffect, useState } from "react";
import LevelPlay from "../LevelPlayModule/LevelPlay";
import { getCurricularDataByUUID } from "../../firebase/database";
import { Curriculum } from "../CurricularModule/CurricularModule";


const PlayGame = (props) => {

    const [shownIntros, setShownIntros] = useState(new Set());
    const markIntroShown = (chapterIdx) => {
    setShownIntros(prev => new Set(prev).add(chapterIdx));
    };

const hasShownIntro = (chapterIdx) => shownIntros.has(chapterIdx);
    const { columnDimensions, rowDimensions, poseData, height, width, backCallback } = props;
    // Get UUID List and start index at zero
    const uuidsList = Curriculum.getCurrentConjectures();
    const [uuidIDX, setuuidIDX] = useState(0);
    // Send the UUID list to the playGameMachine for context
    const [state, send] = useMachine(PlayGameMachine, { 
        context: {
            uuids: uuidsList
        }
    });

    const curricularID = 

    useEffect(() => {
        setuuidIDX(state.context.uuidIndex)
    }, [state.context.uuidIndex]
    )

    return(
        <>
        {state.value === "idle" && uuidIDX < uuidsList.length && (
        <LevelPlay
        // Key is important here, as it differentiates what each level is
            key={uuidsList[uuidIDX]['UUID']}
            width={width}
            height={height}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            poseData={poseData}
            mainCallback={backCallback}
            UUID={uuidsList[uuidIDX]['UUID']}
            currentConjectureIdx={uuidIDX}
            onLevelComplete={() => {send("LOAD_NEXT")}}
            needBack={false}
            hasShownIntro={hasShownIntro}
            markIntroShown={markIntroShown}
        
        />)}
        {state.value === "end" && (
            <Button
            width={width * 0.20}
            x={width * 0.5}
            y={height * 0.5}
            color={red}
            fontSize={width * 0.02}
            fontColor={white}
            text={"Back"}
            fontWeight={800}
            callback={backCallback}
        />)}
        </>
    )

}

export default PlayGame