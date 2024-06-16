import { v4 as uuidv4 } from "uuid";
import WebSocket from "ws";
import { removePlayerFromGame } from "./game";
import { Room, User } from "./types";
import { addConnection } from "./websocket";

let room: Room = {
  id: "1",
  name: "Room 1",
  users: [],
};

export const getRoom = () => {
  return room
}

export const addPlayerToRoom = (connection: WebSocket, username?: string) => {
  let uuid = "";
  if (username) {
    console.log(`${username} connected`);
    uuid = uuidv4();
    addConnection(uuid, connection);
    let new_user: User = { id: uuid, username };
    room.users?.push(new_user);
  } else {
    console.log("No username in url");
  }
};

export const removePlayerFromRoom = (uuid: string) => {
  const user = room.users?.find((u: User) => u.id === uuid);
  removePlayerFromGame(uuid);
  room.users = room.users?.filter((u) => u.id == uuid);
  console.log(`user ${user?.username} disconeccted`);
};
