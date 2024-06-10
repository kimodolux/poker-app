
import http from "http"
import WebSocket from "ws"
import { Game, GameState, PublicPlayerInfo, Room } from "./types"
import { constructNewDeck } from "./poker"
import { declareWSConnections } from "./websocket"


const server = http.createServer()
export const wsServer = new WebSocket.Server({ server })
const port = 8080

let room_size = 4

export let game: Game = {
  public_game_state: {
    seats: Array(room_size).fill(null) as (PublicPlayerInfo | null)[],
    playersTurnCount: undefined,
    tableCards: undefined,
    state: GameState.Not_Started,
    pot: 0,
    current_highest_bid: 0
  },
  players_state: {},
  deck: constructNewDeck(),
}

export let room: Room = {
  id: "1",
  name: "Room 1",
  users: [],
  public_game_state: game.public_game_state
}

server.listen(port, () => {
  declareWSConnections()
  console.log(`WebSocket server is running on port ${port}`)
})

