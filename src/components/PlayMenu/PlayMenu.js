import { useEffect, useState } from "react";
import Background from "../Background"
import Button from "../Button";
import { red, yellow, purple, babyBlue, powderBlue, cornflowerBlue, steelBlue, dodgerBlue, royalBlue, white } from "../../utils/colors";
import { useMachine } from "@xstate/react";
import {PlayMenuMachine} from "./PlayMenuMachine";
import ConjectureModule , {getEditLevel, setEditLevel, getGoBackFromLevelEdit, setGoBackFromLevelEdit} from "../ConjectureModule/ConjectureModule";
import CurricularModule from "../CurricularModule/CurricularModule.js";
import ConjectureSelectorModule, { getAddToCurricular, setAddtoCurricular } from "../ConjectureSelector/ConjectureSelectorModule.js";
import CurricularSelectorModule, { getPlayGame, setPlayGame } from "../CurricularSelector/CurricularSelector.js";
import StoryEditorModule from "../StoryEditorModule/StoryEditorModule.js"; 
import { getUserRoleFromDatabase } from "../../firebase/userDatabase";
import firebase from "firebase/compat";
import { Curriculum } from "../CurricularModule/CurricularModule.js";
import Settings from "../Settings";
import UserManagementModule from "../AdminHomeModule/UserManagementModule";
import NewUserModule from "../AdminHomeModule/NewUserModule";
import PoseAuthoring from "../PoseAuth/PoseAuthoring";
import PlayGame from "../PlayGameModule/PlayGame";
import PoseTest from "../ConjectureModule/PoseTest";
import DataMenu from "./DataMenu.js";

const PlayMenu = (props) => {
    const {width, height, poseData, columnDimensions, rowDimensions, role, logoutCallback} = props;
    const [buttonList, setButtonList] = useState([]);
    const [distanceBetweenButtons, setDistanceBetweenButtons] = useState();
    const [startingX, setStartingX] = useState();
    const [state, send] = useMachine(PlayMenuMachine);
    const [userRole, setUserRole] = useState(null);
    const [isDataMenuVisable, setdataMenuVisable] = useState(false);
    
    // On render get user role
    const fetchData = async () => {
        try {
          const role = await getUserRoleFromDatabase();
          setUserRole(role);
    
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
    
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        // Calculate the distance for buttons
        const totalAvailableWidth = width * 0.85 * (buttonList.length/7);
        const startingX = (width * 0.5) - (totalAvailableWidth * 0.5);
        setStartingX(startingX);
        const spaceInBetween = totalAvailableWidth / (buttonList.length-1);
        setDistanceBetweenButtons(spaceInBetween);

    }, [buttonList, width, height]);
    
    useEffect(() => {
        //get user role
        // TODO: Make this more efficient and dynamic, changing based on what the org wants
        let role = userRole;
        let list = [];
        if(role === "Admin" || role === "Developer"){ // if user is not a student
            list.push(
                {text: "Admin", callback: () => send("ADMIN"), color: babyBlue},
                {text: "New Game", callback: () => send("NEWGAME"), color: purple},
                {text: "Edit Game", callback: () => (setPlayGame(false), send("GAMESELECT")), color: powderBlue},
                {text: "Play Game", callback: () => (setPlayGame(true), send("GAMESELECT")), color: royalBlue},
                {text: "New Level", callback: () => (setEditLevel(true), send("NEWLEVEL")), color: dodgerBlue},
                {text: "Edit Level", callback: () => (setAddtoCurricular(false),send("LEVELSELECT")), color: steelBlue},
                {text: "Settings", callback: () => console.log("Settings clicked"), color: cornflowerBlue},
            );
        } else if (role === "Student"){
            list.push({text: "Play", callback: () => (setPlayGame(true), send("GAMESELECT")), color: royalBlue}, {text: "Settings", callback: () => console.log("Settings clicked"), color: cornflowerBlue})
        } else if (role === "Teacher"){
            list.push(
                {text: "New Game", callback: () => send("NEWGAME"), color: purple},
                {text: "Edit Game", callback: () => (setPlayGame(false), send("GAMESELECT")), color: powderBlue},
                {text: "Play", callback: () => send("PLAY"), color: royalBlue},
                {text: "New Level", callback: () => (setEditLevel(true), send("NEWLEVEL")), color: dodgerBlue},
                {text: "Edit Level", callback: () => (setAddtoCurricular(false),send("LEVELSELECT")), color: steelBlue},
                {text: "Settings", callback: () => console.log("Settings clicked"), color: cornflowerBlue},
            );
        }
            setButtonList(list);
    }, [userRole]);

    return (
        <>
        {state.value === "main" && ( // if the state is main, show the log out button and background
          <>
            <Background height={height} width= {width}/>
            <Button
            height={height * 0.01}
            width={width * 0.05}
            x={width * 0.05}
            y={height * 0.1}
            color={red}
            fontSize={14}
            fontColor={white}
            text={"Log Out"}
            fontWeight={800}
            callback={() => firebase.auth().signOut()}
          />
        </>
        )}
        {state.value === "main" && buttonList.map((button, idx) => ( //if the state is main, show the buttons
            <Button
                fontColor={yellow}
                key = {idx}
                width = {width * 0.1}
                color = {button.color}
                fontSize = {width * 0.02}
                fontWeight = {600}
                text={button.text}
                x={startingX + (idx * distanceBetweenButtons)}
                y={height * 0.5}
                callback={button.callback}
            />
        ))}
        {state.value === "main" && ( // if the state is main, show the data button and the data menu
          <>
          <Button
            height={height * 0.01}
            width={width * 0.05}
            x={width - (width * 0.05)}
            y={height - (height * 0.1)}
            color={red}
            fontSize={14}
            fontColor={white}
            text={"Data"}
            fontWeight={800}
            callback={() => setdataMenuVisable(!isDataMenuVisable)}
          />
          <DataMenu 
            trigger={isDataMenuVisable} 
            menuWidth={width * 0.4}
            menuHeight={height * 0.5}
            x={width * 0.5 - (width * 0.4 * 0.5)}
            y={height * 0.5 - (height * 0.5 * 0.5)}
            onClose={() => setdataMenuVisable(false)}
          />
        </>
        )}
        {state.value === "test" && ( //if the state is test, show the test module
          <PoseTest
            width={width}
            height={height}
            poseData={poseData}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            conjectureCallback={() => send("NEWLEVEL")}
          />
        )}
        {state.value === "newLevel" && ( //if the state is newLevel, show the Conjecture Module
            <ConjectureModule
                width={width}
                height={height}
                columnDimensions={columnDimensions}
                rowDimensions={rowDimensions}
                editCallback={() => send("EDIT")}
                // getGoBackFromLevelEdit should be "MAIN", "LEVELSELECT", or "NEWGAME"
                backCallback={() => send(getGoBackFromLevelEdit())}
                testCallback={() => send("TEST")}
            />
        )}
        {state.value === "edit" && ( //if the state is edit, show the Conjecture Module
            <PoseAuthoring
            width={width}
            height={height}
            poseData={poseData}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            conjectureCallback={() => send("NEWLEVEL")}  // goes to the Conjecture Module
          />
        )
        }
        {state.value === "play" && (
            <PlayGame
                width={width}
                height={height}
                backCallback={()=> send("MAIN")}
                columnDimensions={columnDimensions}
                rowDimensions={rowDimensions}
                poseData={poseData}
                gameUUID={Curriculum.getCurrentUUID()}
            /> 
        )}
        {state.value === "settings" && (
            <Settings
        />)}
        {state.value === "admin" && (
            <UserManagementModule
            width={width}
            height={height}
            mainCallback={() => send("MAIN")} // goes to Home
            addNewUserCallback={() => send("ADDNEWUSER")} // goes to add new user section
        />
        )}
        {state.value === "addNewUser" && (
            <NewUserModule  
            width={width}
            height={height}
            UserManagementCallback={() => {
              send("ADMIN");
              }}// goes to user management
        />
        )}
        {state.value === "newGame" && (
          <CurricularModule
            width={width}
            height={height}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            mainCallback={() => send("MAIN")} // goes to Home
            conjectureSelectCallback={() => send("LEVELSELECT")}
            conjectureCallback={() => send("NEWLEVEL")}  // preview a level in the game editor
            storyEditorCallback={() => {

              console.log("Sending STORYEDITOR...");
              send("STORYEDITOR")}
            }
          />
        )}
        {state.value === "storyEditor" && (
          console.log("Entered storyEditor state"),
          <StoryEditorModule
            width={width}
            height={height}
            mainCallback={() => send("MAIN")}
            gameUUID={Curriculum.getCurrentUUID()}
          />
        )}
        {state.value === "levelSelect" && (
          <ConjectureSelectorModule
            width={width}
            height={height}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            conjectureCallback={() => send("NEWLEVEL")} // goes to the Conjecture Module
            curricularCallback={() => send("NEWGAME")}
            backCallback={() => {
              if(getAddToCurricular()) // if selecting a level to add to a game, go back to the game screen
                send("NEWGAME");
              else
                send("MAIN") // if selecting a level to edit, go to main menu
            }}
          />
        )}
        {state.value === "gameSelect" && (
          <CurricularSelectorModule
            width={width}
            height={height}
            columnDimensions={columnDimensions}
            rowDimensions={rowDimensions}
            curricularCallback={() => {
              if (!getPlayGame()) // edit game
                send("NEWGAME");
              else
                send("PLAY");
            }}
            mainCallback={() => {send("MAIN")}}
          />
        )}
        
        </>
    );
};

export default PlayMenu;