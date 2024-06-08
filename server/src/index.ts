import WebSocket from "ws"
import http, { IncomingMessage } from "http"
import url from "url"
import { v4 as uuidv4 } from "uuid"
import { Game, GameState, PublicPlayerInfo, Room, User, EventMessage, TurnAction } from "./types"
import { constructNewDeck } from "./game"

const server = http.createServer()
const wsServer = new WebSocket.Server({ server })

const port = 8080
const connections: {[id: string]: WebSocket} = {} // users id to private connection

let game: Game = {
  public_game_state: {
    players: [] as PublicPlayerInfo[],
    playersTurnCount: undefined,
    tableCards: undefined,
    state: GameState.Not_Started,
  },
  players_state: {},
  deck: constructNewDeck()
}

let room: Room = {
  id: "1",
  name: "Room 1",
  users: [],
  public_game_state: game.public_game_state
}

const handleMessage = async (bytes: EventMessage) => {
  let event_message = JSON.parse(bytes.toString()) as EventMessage
  let {uuid, messageType, action} = event_message
  switch(messageType){
    case "JOIN_GAME":
      await joinGame(uuid)
      break
    case "LEAVE_GAME":
      await leaveGame(uuid)
      break
    case "TURN_ACTION":
      if(action){
        await handleAction(uuid, action)
        break
      }
      else{
        // handle exception
      }
    case "INITAL_FETCH":
      await initialFetch(uuid)
      break
  }
}

const initialFetch = async (uuid: string) => {
  broadcastPublic()
}

const joinGame = async (uuid: string) => {
  const user = room.users!.find((u: User) => u.id === uuid)
  game.players_state[uuid] = {hand: undefined}
  let player = {username: user?.username, seatNumber: 1, chips: 1000 } as PublicPlayerInfo
  game.public_game_state.players.push(player)
  broadcastPublic()
}

const leaveGame = async (uuid: string) => {
  const user = room.users!.find((u: User) => u.id === uuid)
  
  delete game.players_state[uuid]
  game.public_game_state.players = game.public_game_state.players.filter(p => p.username !== user?.username)
  broadcastPublic()
}

const handleAction = async (uuid: string, action: TurnAction) => {
  console.log("got here")
}

const handleClose = async (uuid: string) => {
  const user = room.users?.find((u: User) => u.id === uuid)
  room.users = room.users?.filter(u => u.id == uuid)
  delete game.players_state[uuid]
  game.public_game_state.players = game.public_game_state.players.filter(p => p.username !== user?.username)
  console.log(`user ${user?.username} disconeccted`)
  broadcastPublic()
}

const broadcastPublic = () => {
  Object.keys(connections).forEach((uuid) => {
    const connection = connections[uuid]
    // const message = JSON.stringify(game.public_game_state)
    const message = JSON.stringify(room)
    connection.send(message)
  })
}

const broadcastPrivate = (uuid: string) => {
  let connection = connections[uuid]
  const message = JSON.stringify(game?.players_state[uuid])
  connection.send(message)
}

wsServer.on("connection", async (connection: WebSocket, request: IncomingMessage) => {
  let uudi = ""
  if(request.url){
    let { username } = url.parse(request.url, true).query
    if(Array.isArray(username)) username = username[0]
    if(username){
      console.log(`${username} connected`)
      uudi = uuidv4()
      connections[uudi] = connection
      let new_user: User = {id: uudi, username}
      room.users?.push(new_user)
    }
    else{
      console.log("No username in url")
    }
  }
  else{
    console.log("No url in request")
  }

  connection.on("message", async (message: EventMessage) => await handleMessage(message))
  connection.on("close", async (uuid: string) => await handleClose(uuid))
})


server.listen(port, () => {
  console.log(`WebSocket server is running on port ${port}`)
})

