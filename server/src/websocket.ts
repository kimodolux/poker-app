import { IncomingMessage } from "http";
import WebSocket from "ws";
import url from "url";
import {
  EventMessage,
  Game,
  GameState,
  MessageType,
  PublicPlayerInfo,
  TurnAction,
  User,
} from "./types";
import { wsServer } from "./index";
import {
  handlePlayerAction,
  nextRound,
  getGame,
  addPlayerToGame,
  removePlayerFromGame,
  initialiseGame,
  finaliseRound,
  decrementTimer,
} from "./game";
import { addPlayerToRoom, removePlayerFromRoom, getRoom } from "./room";

const connections: { [id: string]: WebSocket } = {}; // users id to private connection

export const addConnection = (uuid: string, connection: WebSocket) => {
  connections[uuid] = connection;
};

export const removeConnection = (uuid: string) => {
  delete connections[uuid];
};

const handleMessage = async (bytes: EventMessage) => {
  let event_message = JSON.parse(bytes.toString()) as EventMessage;
  let { uuid, messageType, action, actionAmount } = event_message;
  switch (messageType) {
    case MessageType.JOIN_GAME:
      if (actionAmount) {
        await joinGame(uuid, actionAmount);
        broadcast();
      }
      break;
    case MessageType.LEAVE_GAME:
      await leaveGame(uuid);
      broadcast();
      break;
    case MessageType.START_GAME:
      await initialiseGame(10);
      broadcast();
      break;
    case MessageType.TURN_ACTION:
      if (action) {
        await handleAction(uuid, action, actionAmount);
        broadcast();
        break;
      } else {
        // handle exception
      }
    case MessageType.INITAL_FETCH:
      await initialFetch(uuid);
      broadcast();
      break;
  }
};

export const checkGameState = async () => {
  setInterval( async() => {
    let game = getGame()
    let {seats, seatNumbersTurn, state, timeLeft } = game.public_game_state
    console.log(state)
    if([GameState.Not_Started, GameState.Concluded].includes(state)){
      return
    }
    
    let player_length = game.public_game_state.seats.length
    let last_seat_in_play = 0
    for(let i = player_length-1; i>0; i--){
      if(seats[i] && seats[i]?.folded === false){
        last_seat_in_play = i
      }
    }
    if(last_seat_in_play === 0){
      console.log("only one player")
    }
    if(seatNumbersTurn > last_seat_in_play){
      await nextRound()
    }
    let current_player = game.public_game_state.seats[seatNumbersTurn]
    if(!current_player){
      console.log("no current_player")
      return
    }

    if(timeLeft <= 0){
      await handlePlayerAction(current_player.id, TurnAction.FOLD)
    }
    else{
      decrementTimer()
    }
    let hand_rankings  = game.public_game_state.seats.map(s => s?.hand_ranking)
    if(game.public_game_state.seats.some(s => !!s?.hand_ranking)){
      console.log(hand_rankings)
      await finaliseRound()
    }
    broadcast()
  }, 1000);
};

const initialFetch = async (uuid: string) => {
  broadcast();
};

const joinGame = async (uuid: string, seat_number: number) => {
  let room = getRoom()
  const user = room.users.find((u: User) => u.id === uuid);
  let player = {
    id: uuid,
    username: user?.username,
    chips: 1000,
    folded: false,
    current_bid: 0,
  } as PublicPlayerInfo;
  addPlayerToGame(player, seat_number);
  broadcast();
};

const leaveGame = async (uuid: string) => {
  removePlayerFromGame(uuid);
  broadcast();
};

const handleAction = async (
  uuid: string,
  action: TurnAction,
  actionAmount?: number,
) => {
  handlePlayerAction(uuid, action, actionAmount);
};

const handleClose = async (uuid: string) => {
  removePlayerFromRoom(uuid);
  broadcast();
};

const broadcast = () => {
  Object.keys(connections).forEach((uuid) => {
    const connection = connections[uuid];
    let game = getGame()
    let room = getRoom()
    const private_player_state = game.players_state[uuid];
    const message = JSON.stringify({ room, game, private_player_state });
    connection.send(message);
  });
};

export const declareWSConnections = () => {
  wsServer.on(
    "connection",
    async (connection: WebSocket, request: IncomingMessage) => {
      if (request.url) {
        let { username } = url.parse(request.url, true).query;
        if (Array.isArray(username)) username = username[0];
        addPlayerToRoom(connection, username);
      } else {
        console.log("No url in request");
      }
      connection.on(
        "message",
        async (message: EventMessage) => await handleMessage(message),
      );
      connection.on("close", async (uuid: string) => await handleClose(uuid));
    },
  );
};
