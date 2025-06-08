import Background from "./Background";
import Button from "./Button";
import { Text } from "@inlet/react-pixi";
import { TextStyle } from "@pixi/text";
import { yellow, blue, green, white, red,turquoise } from "../utils/colors";

import React, { useState, useEffect } from 'react';
import { writeToDatabaseNewUser, getUserRoleFromDatabase, getUserNameFromDatabase } from "../firebase/userDatabase";
import UserManagementModule from '../components/AdminHomeModule/UserManagementModule';
import { onAuthStateChanged } from "firebase/auth";



const Home = (props) => {
  const { height, width, startCallback, logoutCallback } = props;
  const [userName, setUserName] = useState('Loading...');

  useEffect(() => {
    
    const fetchData = async () => {
      try {
        console.log('Fetching user name...');
        const name = await getUserNameFromDatabase();
        console.log('Fetched user name:', name);
  
        if (name !== null && name !== "USER NOT FOUND") {
          setUserName(name);
          console.log('User found. Set user name.');
        } else if (name === "USER NOT FOUND") {
          console.log('User not found. Stop trying but we will continue.');
          fetchData();  // Retry the fetch
        } else {
          console.log('User name is null. Retrying...');
          fetchData();  // Retry the fetch
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    setTimeout(() => {
      
      fetchData();//wait 5 seconds and then proceed
    }, 5000);
    
  }, [onAuthStateChanged]);

  return (
    <>
      <Background height={height} width={width} />
      <Button
        height={height * 0.5}
        width={width * 0.33}
        x={width * 0.5}
        y={height * 0.7}
        color={blue}
        fontSize={120}
        fontColor={yellow}
        text={"Start"}
        fontWeight={800}
        callback={startCallback}
      />
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
        callback={logoutCallback}
      />
      <Text
        text={"Hidden Village"}
        x={width * 0.5}
        y={height * 0.25}
        style={
          new TextStyle({
            align: "center",
            fontFamily: "Futura",
            fontSize: 146,
            fontWeight: 800,
            fill: [blue],
            letterSpacing: -5,
          })
        }
        anchor={0.5}
      />
      <Text
        text={`Playing as: ${userName}`}
        x={width * 0.5}
        y={height * 0.05}
        style={
          new TextStyle({
            align: "center",
            fontFamily: "Futura",
            fontSize: 20,
            fontWeight: 800,
            fill: [blue],
            letterSpacing: 0,
          })
        }
        anchor={0.5}
      />
    </>
  );
};

export default Home;
