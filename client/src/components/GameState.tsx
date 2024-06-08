import { EventMessage, MessageType, Room } from "../types"

export const renderGameState = (room_info: Room, username: string, sendJsonMessage: (em: EventMessage) => void) => {
    console.log(room_info)
    const user = room_info.public_game_state.players.find(u => u.username === username)
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
        return <p key={user.id}> {user.username} </p>
      })}
       <h2>Players in game</h2>
      {room_info.public_game_state.players.map(player => {
        return <p key={player.username}> {player.username} </p>
      })}
       <h2>Table cards</h2>
      {room_info.public_game_state.tableCards?.map(card => {
        return <p key={card.suit+card.value}> {card.suit} {card.value} </p>
      })}
      <h2>Public game state</h2>
      <p>Game state: {room_info.public_game_state.state}</p>
      <p>Players turn: {room_info.public_game_state.playersTurnCount}</p>
      
      {!user && <button onClick={() => sendJsonMessage({uuid, messageType: MessageType.JOIN_GAME} as EventMessage)}>Join Game</button>}
      {user && <button onClick={() => sendJsonMessage({uuid, messageType: MessageType.LEAVE_GAME} as EventMessage)}>Leave Game</button>}
      </>
    )
  }