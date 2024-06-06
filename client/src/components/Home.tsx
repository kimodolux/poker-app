import useWebSocket from "react-use-websocket"
import { useEffect, useRef } from "react"
import throttle from "lodash.throttle"
import {PublicGameState, Room} from "../types"

const renderGameState = (room_info: Room, username: string) => {
  return (
    <>
    <h1>Room name: {room_info.name}</h1>
    <h1>Room id: {room_info.id}</h1>
    <h2>Users connected to socket</h2>
    {room_info.users.map(user => {
      return <p> {user.username} </p>
    })}
     <h2>Players in game</h2>
    {room_info.game?.public_game_state.players.map(player => {
      return <p> {player.username} </p>
    })}
     <h2>Table cards</h2>
    {room_info.game?.public_game_state.tableCards?.map(card => {
      return <p> {card.suit} {card.value} </p>
    })}
    <h2>Public game state</h2>
    <p>Game state: {room_info.game?.public_game_state.state}</p>
    <p>Players tunr: {room_info.game?.public_game_state.playersTurnCount}</p>
    
    </>
  )
}

export function Home({ username }: {username: string}) {
  const WS_URL = `ws://127.0.0.1:8080`
  const { sendJsonMessage, lastJsonMessage: room_info } = useWebSocket<Room>(WS_URL, {
    share: true,
    queryParams: { username },
  })

  const THROTTLE = 50
  const sendJsonMessageThrottled = useRef(throttle(sendJsonMessage, THROTTLE))

  useEffect(() => {
    sendJsonMessage({
      x: 0,
      y: 0,
    })
    window.addEventListener("mousemove", (e) => {
      sendJsonMessageThrottled.current({
        x: e.clientX,
        y: e.clientY,
      })
    })
  }, [sendJsonMessage])

  if (room_info) {
    return <>{renderGameState(room_info, username)}</>
  }
  return <></>
}