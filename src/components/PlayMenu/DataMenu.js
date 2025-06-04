import React from 'react'
import { Container, Text, Graphics } from '@inlet/react-pixi';
import { powderBlue, navyBlue, cornflowerBlue, green, neonGreen, black, blue, white, pink, orange, red, transparent, turquoise, yellow, gold, goldenRod, midnightBlue, royalBlue, lightGray, darkGray} from "../../utils/colors";
import RectButton from "../RectButton";
import { useCallback } from "react";
import { TextStyle } from "@pixi/text";
import InputBox from "../InputBox";
import { Input } from 'postcss';
import { useEffect, useRef, useState, } from 'react';
import { getUserEmailFromDatabase,  } from "../../firebase/userDatabase"
import { getFromDatabaseByGame, convertDateFormat, checkDateFormat, checkGameAuthorization, getAuthorizedGameList, } from "../../firebase/database"

import { set } from 'firebase/database';

const DataMenu = (props) => {
  const {
    menuWidth,
    menuHeight,
    x,
    y,
    trigger
  } = props;

  const [all_data, setAllData] = useState(false);
  const [save_csv, setSaveCSV] = useState(false);
  const [save_json, setSaveJSON] = useState(false);
  const [game_name, setGameName] = useState('');
  const [start_date, setStartDate] = useState('');
  const [end_date, setEndDate] = useState('');
  const [game_list, setGameList] = useState([]);


  // For fetching email when componenet first mounts
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const innerRectWidth = menuWidth * 0.94;
  const innerRectHeight = menuHeight * 0.8; 
  const innerRectMargins = (menuWidth - innerRectWidth) / 2;
  const fieldTextMarginsFromInnerRect = menuHeight * 0.07;
  const fieldTextMarginsFromEachOther = menuHeight * 0.11;
  const fieldHeight = menuWidth * 0.028;
  const inputBoxHeight = fieldHeight * 3;
  const inputBoxTextSize = menuWidth * 0.02;
  const distanceFromFieldTextToField = menuWidth * 0.3;
  const checkButtonWidth = menuWidth * 0.07;
  const checkButtonFont = menuWidth * 0.03;
  const fieldText = new TextStyle({
    align: "center",                    
    fontFamily: "Arial",                 
    fontSize: fieldHeight,                    
    fontWeight: 1000,                 
    fill: [black],                      
  })

  // When component mounts, user email is either loading, fetched, or reached an error
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        setIsLoading(true);
        const email = await getUserEmailFromDatabase();
        //const gameList = await getAuthorizedGameList();
        // console.log("data received:", gameList);
        setUserEmail(email);
        //setGameList(gameList);
      } catch (error) {
        console.error('Error fetching email:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmail();
  }, []);


  const draw = useCallback(
    (g) => {
      g.clear();
      g.beginFill(cornflowerBlue);
      g.drawRect(x, y, menuWidth, menuHeight);
      g.endFill();
      g.beginFill(white);
      g.drawRoundedRect(
        x + innerRectMargins, 
        y + menuHeight - innerRectMargins - innerRectHeight,
        innerRectWidth, 
        innerRectHeight);
      g.endFill();
    },
    [menuHeight, menuWidth, x, y]
  );


  if (trigger) {
    return (
    <Container>
      <Graphics
        draw={draw}
        interactive={true}
      />
      <Text
        text={"DOWNLOAD DATA"}                                
        style={                                
          new TextStyle({
            align: "center",                      
            fontFamily: "Arial",                  
            fontSize: menuWidth * 0.03,                     
            fontWeight: 1000,                
            fill: [white],                     
          })
        }
        x={x + menuWidth / 2} // Center in menu
        y={y + (menuHeight - innerRectMargins - innerRectHeight) / 2} //Center in top margins
        anchor={0.5}
      />
      
      <Text
        text={"USER ID"}
        style={fieldText}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect}
        anchor={0}
      />
      <InputBox //Box for user ID
        height={inputBoxHeight}
        width={(innerRectWidth - distanceFromFieldTextToField - fieldTextMarginsFromInnerRect * 2) / 0.4}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + distanceFromFieldTextToField}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect}
        color={lightGray}
        fontSize={inputBoxTextSize}  //  Dynamically modify font size based on screen width
        fontColor={black}
        text={isLoading ? 'Loading...' : error ? 'Error loading email' : userEmail}
        fontWeight={600}
      />
      <Text
        text={"GAME NAME"}                             
        style={fieldText}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther}
        anchor={0}
      />
      <InputBox //Box for game name
        height={inputBoxHeight}
        width={(innerRectWidth - distanceFromFieldTextToField - fieldTextMarginsFromInnerRect * 2) / 0.4}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + distanceFromFieldTextToField}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther}
        color={white}
        fontSize={inputBoxTextSize}  //  Dynamically modify font size based on screen width
        fontColor={black}
        text={game_name} // change this out to game_name after testing
        fontWeight={600}
        callback={async () => {
          const game_list = await getAuthorizedGameList();
          let gameOptions;
          if (game_list != null) {
            gameOptions = game_list.join('\n');
          } else {
            gameOptions = "No games found";
          }
          
          //let promptVal = prompt("Please Enter the Game Name", game_name);
          let promptVal = prompt(`Please Enter a Game from the following list\n\n${gameOptions}\n\n`, game_name);
          let gameValid = await checkGameAuthorization(promptVal);
         // console.log(gameValid);
          while (promptVal != null && gameValid != true) {
            promptVal = prompt(`Invalid Game Name. Please try again. Enter a Game from the following list\n\n${gameOptions}\n\n`, game_name);
            gameValid = await checkGameAuthorization(promptVal);
            //console.log(gameValid);
          }
          if (promptVal != null) {
            setGameName(promptVal)
          }
        }}
      />
      <Text
        text={"START DATE"}                             
        style={fieldText}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 2}
        anchor={0}
      />
      <InputBox //Box for Start Date
        height={inputBoxHeight}
        width={(innerRectWidth - distanceFromFieldTextToField - fieldTextMarginsFromInnerRect * 2) / 0.4}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + distanceFromFieldTextToField}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 2}
        color={(all_data) ? lightGray : white}
        fontSize={inputBoxTextSize}
        fontColor={black}
        text={start_date}
        fontWeight={600}
        callback={() => {
          if (!all_data) { // If all data is not selected, allow user to input start date
            let promptVal = prompt("Please Enter the Start Date in the format mm/dd/yyyy", start_date);
            while (promptVal != null && checkDateFormat(promptVal) == false) {
              promptVal = prompt("Invalid Date Format. Please Enter the Start Date in the format mm/dd/yyyy", start_date);
            }
            if (promptVal != null) {
              setStartDate(promptVal)
            }
          }
          
        }}
      />
      <Text
        text={"END DATE"}              
        style={fieldText}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 3}
        anchor={0}
      />
      <InputBox //Box for End Date
        height={inputBoxHeight}
        width={(innerRectWidth - distanceFromFieldTextToField - fieldTextMarginsFromInnerRect * 2) / 0.4}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + distanceFromFieldTextToField}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 3}
        color={(all_data) ? lightGray : white}
        fontSize={inputBoxTextSize}
        fontColor={black}
        text={end_date}
        fontWeight={600}
        callback={() => {
          if (!all_data) { // If all data is not selected, allow user to input end date
            let promptVal = prompt("Please Enter the End Date in the format mm/dd/yyyy", end_date);
            while (promptVal != null && checkDateFormat(promptVal) == false) {
              promptVal = prompt("Invalid Date Format. Please Enter the End Date in the format mm/dd/yyyy", end_date);
            }
            if (promptVal != null) {
              setEndDate(promptVal)
            }
          }
        }}
      />
        
      <InputBox //Check box for downloading all the data for the user
        height={checkButtonWidth}
        width={checkButtonWidth}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 4}
        color={white}
        fontSize={checkButtonFont}
        fontColor={black}
        fontWeight={600}
        text={all_data ? "X" : ""}
        callback = {() => { setAllData(!all_data) } }
      />

      <Text
        text={"Download all Data Files for this Game"}              
        style={new TextStyle({
          align: "center",
          fontFamily: "Arial",
          fontSize: fieldHeight * 0.9,
          fontWeight: 1000,
          fill: [black],
        })}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + checkButtonWidth * 0.5} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 3 + fieldTextMarginsFromEachOther }
        anchor={0}
        callback = {() => { setAllData(!all_data) } }
      />

      <InputBox //Check box for downloading as CSV
        height={checkButtonWidth}
        width={checkButtonWidth}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 5}
        color={white}
        fontSize={checkButtonFont}
        fontColor={black}
        fontWeight={600}
        text={save_csv ? "X" : ""}
        callback = {() => { setSaveCSV(!save_csv) } }
      />

      <Text
        text={"CSV \n(broken)"}              
        style={new TextStyle({
          align: "left",
          fontFamily: "Arial",
          fontSize: fieldHeight * 0.9,
          fontWeight: 1000,
          fill: [black],
        })}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + checkButtonWidth * 0.8} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 5}
        anchor={0}
      />

      <InputBox //Check box for downloading as JSON
        height={checkButtonWidth}
        width={checkButtonWidth}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + checkButtonWidth * 3}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 5}
        color={white}
        fontSize={checkButtonFont}
        fontColor={black}
        fontWeight={600}
        text={save_json ? "X" : ""}
        callback = {() => { setSaveJSON(!save_json) } }
      />

      <Text
        text={"JSON"}
        style={new TextStyle({
          align: "center",
          fontFamily: "Arial",
          fontSize: fieldHeight * 0.9,
          fontWeight: 1000,
          fill: [black],
        })}
        x={x + innerRectMargins + fieldTextMarginsFromInnerRect + + checkButtonWidth * 3 + checkButtonWidth * 0.8} 
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 5}
        anchor={0}
      />

      <RectButton //Button for downloading the data
        height={menuHeight * 0.3}
        width={menuWidth* 0.4}
        x={x + innerRectMargins + innerRectWidth - menuWidth* 0.2 - fieldTextMarginsFromInnerRect}
        y={y + menuHeight - innerRectMargins - innerRectHeight + fieldTextMarginsFromInnerRect + fieldTextMarginsFromEachOther * 4}
        color={(save_csv || save_json) ? royalBlue : lightGray}
        text={"SAVE"}
        fontSize={menuWidth * 0.02}
        fontColor={white}
        fontWeight={600}
        callback={() => {
          // getFromDatabaseByGame('sittingquicktest', '2024-11-11', '2024-12-11'); //game, start date, end date
          if (all_data && save_json){
            getFromDatabaseByGame(game_name, '2000-01-01', new Date().toISOString().split('T')[0]); //game, start date, end date
          }
          else if (save_json) {
            getFromDatabaseByGame(game_name, convertDateFormat(start_date), convertDateFormat(end_date)); //game, start date, end date
          }
          if (all_data && save_csv){
            getFromDatabaseByGameCSV(game_name, '2000-01-01', new Date().toISOString().split('T')[0]); //game, start date, end date
          }
          else if (save_csv) {
            getFromDatabaseByGameCSV(game_name, convertDateFormat(start_date), convertDateFormat(end_date)); //game, start date, end date
          }
        }}
      />
    </Container>
    )
} else {
    return <Container/>;
  }
}

export default DataMenu