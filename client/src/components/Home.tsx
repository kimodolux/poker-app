import useWebSocket from "react-use-websocket"
import { useEffect } from "react"
import { Room, EventMessage, MessageType, WebSocketResponse } from "../types"
import { renderGameState } from "./GameState"

export function Home({ username }: {username: string}) {
  const WS_URL = `ws://127.0.0.1:8080`
  const { sendJsonMessage, lastJsonMessage: ws_response } = useWebSocket<WebSocketResponse>(WS_URL, {
    share: true,
    queryParams: { username },
  })

  useEffect(() => {
    sendJsonMessage({uuid: "null", messageType: MessageType.TURN_ACTION} as EventMessage)
  }, [sendJsonMessage])

  if (ws_response) {
    let {room, private_player_state} = ws_response
    return <>{renderGameState(room, username, sendJsonMessage)}</>
  }
  return <></>
}