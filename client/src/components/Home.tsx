import useWebSocket from "react-use-websocket"
import { useEffect } from "react"
import { Room, EventMessage, MessageType } from "../types"
import { renderGameState } from "./GameState"

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