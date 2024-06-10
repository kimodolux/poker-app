
import { IncomingMessage } from "http"
import WebSocket from "ws"
import url from "url"
import { v4 as uuidv4 } from "uuid"
import { EventMessage, MessageType, PublicPlayerInfo, TurnAction, User } from "./types"
import {wsServer, room, game} from "./index"

const connections: {[id: string]: WebSocket} = {} // users id to private connection

const handleMessage = async (bytes: EventMessage) => {
    let event_message = JSON.parse(bytes.toString()) as EventMessage
    let {uuid, messageType, action, actionAmount: seat_number} = event_message
    switch(messageType){
      case MessageType.JOIN_GAME:
        if(seat_number){
          await joinGame(uuid, seat_number)
        }
        break
      case MessageType.LEAVE_GAME:
        await leaveGame(uuid)
        break
      case MessageType.START_GAME:

      case MessageType.TURN_ACTION:
        if(action){
          await handleAction(uuid, action)
          break
        }
        else{
          // handle exception
        }
      case MessageType.INITAL_FETCH:
        await initialFetch(uuid)
        break
    }
  }
  
  const initialFetch = async (uuid: string) => {
    broadcast()
  }
  
  const joinGame = async (uuid: string, seat_number: number) => {
    const user = room.users!.find((u: User) => u.id === uuid)
    game.players_state[uuid] = { id: uuid, username: user!.username, hand: undefined }
    let player = {id: uuid, username: user?.username, chips: 1000, folded: false, current_bid: 0 } as PublicPlayerInfo
    game.public_game_state.seats[seat_number-1] = player
    broadcast()
  }
  
  const leaveGame = async (uuid: string) => {
    delete game.players_state[uuid]
    for(let seat_index in game.public_game_state.seats){
      if(game.public_game_state.seats[seat_index]?.id === uuid){
        game.public_game_state.seats[seat_index] = null
      }
    }
    broadcast()
  }
  
  const handleAction = async (uuid: string, action: TurnAction) => {
    console.log("got here")
  }
  
  const handleClose = async (uuid: string) => {
    const user = room.users?.find((u: User) => u.id === uuid)
    console.log(`user ${user?.username} disconeccted`)
    room.users = room.users?.filter(u => u.id == uuid)
    delete game.players_state[uuid]
    game.public_game_state.seats = game.public_game_state.seats.filter(p => p?.username !== user?.username)
    broadcast()
  }
  
  const broadcast = () => {
    Object.keys(connections).forEach((uuid) => {
      const connection = connections[uuid]
      const private_player_state = game.players_state[uuid]
      const message = JSON.stringify({room, private_player_state})
      connection.send(message)
    })
  }
  
  export const declareWSConnections = () => {
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
  }
  