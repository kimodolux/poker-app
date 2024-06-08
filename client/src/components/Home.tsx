import useWebSocket from "react-use-websocket"
import { MouseEventHandler, useEffect } from "react"
import {PublicGameState, Room, EventMessage, MessageType} from "../types"

const renderGameState = (room_info: Room, username: string, sendJsonMessage: (em: EventMessage) => void) => {
  console.log(room_info)
  if(!room_info.public_game_state || !room_info.users){
    return <></>
  }
  let uuid = room_info.users.find(u => u.username === username)?.id
  return (
    <>
    <h1>Room name: {room_info.name}</h1>
    <h1>Room id: {room_info.id}</h1>
    <h2>Users connected to socket</h2>
    {room_info.users.map(user => {
      return <p> {user.username} </p>
    })}
     <h2>Players in game</h2>
    {room_info.public_game_state.players.map(player => {
      return <p> {player.username} </p>
    })}
     <h2>Table cards</h2>
    {room_info.public_game_state.tableCards?.map(card => {
      return <p> {card.suit} {card.value} </p>
    })}
    <h2>Public game state</h2>
    <p>Game state: {room_info.public_game_state.state}</p>
    <p>Players turn: {room_info.public_game_state.playersTurnCount}</p>
    
    {!(username in room_info.public_game_state.players) && <button onClick={() => sendJsonMessage({uuid, messageType: MessageType.JOIN_GAME} as EventMessage)}>Join Game</button>}
    {username in room_info.public_game_state.players && <button onClick={() => sendJsonMessage({uuid, messageType: MessageType.LEAVE_GAME} as EventMessage)}>Leave Game</button>}
    </>
  )
}

export function Home({ username }: {username: string}) {
  const WS_URL = `ws://127.0.0.1:8080`
  const { sendJsonMessage, lastJsonMessage: room_info } = useWebSocket<Room>(WS_URL, {
    share: true,
    queryParams: { username },
  })

  useEffect(() => {
    sendJsonMessage({uuid: "null", messageType: MessageType.TURN_ACTION} as EventMessage)
  }, [sendJsonMessage])

  if (room_info) {
    return <>{renderGameState(room_info, username, sendJsonMessage)}</>
  }
  return <></>
}