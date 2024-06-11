import { IncomingMessage } from "http";
import WebSocket from "ws";
import url from "url";
import {
  EventMessage,
  MessageType,
  PublicPlayerInfo,
  TurnAction,
  User,
} from "./types";
import { wsServer } from "./index";
import {
  handlePlayerAction,
  nextRound,
  game,
  addPlayerToGame,
  removePlayerFromGame,
} from "./game";
import { addPlayerToRoom, removePlayerFromRoom, room } from "./room";

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
      }
      break;
    case MessageType.LEAVE_GAME:
      await leaveGame(uuid);
      break;
    case MessageType.START_GAME:

    case MessageType.TURN_ACTION:
      if (action) {
        await handleAction(uuid, action, actionAmount);
        break;
      } else {
        // handle exception
      }
    case MessageType.INITAL_FETCH:
      await initialFetch(uuid);
      break;
  }
};

const checkGameState = () => {
  let intervalId = setInterval(() => nextRound(game), 10000);

  clearInterval(intervalId);
};

const initialFetch = async (uuid: string) => {
  broadcast();
};

const joinGame = async (uuid: string, seat_number: number) => {
  const user = room.users!.find((u: User) => u.id === uuid);
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
  handlePlayerAction(game, uuid, action, actionAmount);
};

const handleClose = async (uuid: string) => {
  removePlayerFromRoom(uuid);
  broadcast();
};

const broadcast = () => {
  Object.keys(connections).forEach((uuid) => {
    const connection = connections[uuid];
    const private_player_state = game.players_state[uuid];
    const message = JSON.stringify({ room, private_player_state });
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
