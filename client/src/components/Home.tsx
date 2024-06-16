import useWebSocket from "react-use-websocket";
import { useEffect, useState } from "react";
import { Room, EventMessage, MessageType, WebSocketResponse, PrivatePlayerInfo, Game } from "../types";
import { renderGameState } from "./GameState";

export function Home({ username }: { username: string }) {
  const WS_URL = `ws://127.0.0.1:8080`;
  const { sendJsonMessage, lastJsonMessage: ws_response } =
    useWebSocket<WebSocketResponse>(WS_URL, {
      share: true,
      queryParams: { username },
    });

  let [roomInfo, setRoomInfo] = useState<Room>()
  let [gameInfo, setGameInfo] = useState<Game>()
  let [privatePlayerInfo, setPrivatePlayerInfo] = useState<PrivatePlayerInfo>()

  useEffect(() => {
    sendJsonMessage({
      uuid: "null",
      messageType: MessageType.TURN_ACTION,
    } as EventMessage);
  }, [sendJsonMessage]);

  useEffect(() => {
    if(ws_response){
      setRoomInfo(ws_response.room)
      setGameInfo(ws_response.game)
      setPrivatePlayerInfo(ws_response.private_player_state)
    }
  }, [ws_response]);



  if (roomInfo && gameInfo) {
    return <>{renderGameState(roomInfo, gameInfo, username, sendJsonMessage, privatePlayerInfo)}</>;
  }
  return <>Loading</>;
}
