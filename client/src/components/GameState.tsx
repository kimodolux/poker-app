import { EventMessage, Game, MessageType, PrivatePlayerInfo, Room } from "../types";

export const renderGameState = (
  room_info: Room,
  game_info: Game,
  username: string,
  sendJsonMessage: (em: EventMessage) => void,
  private_info?: PrivatePlayerInfo,
) => {
  const current_users_seat_index = game_info.public_game_state.seats.findIndex(
    (u) => u?.username === username,
  );

  let player_count = game_info.public_game_state.seats.filter((p) => p).length;
  if (!game_info.public_game_state || !room_info.users) {
    return <></>;
  }
  let uuid = room_info.users.find((u) => u.username === username)!.id;
  return (
    <>
      <h1>Room name: {room_info.name}</h1>
      <h1>Room id: {room_info.id}</h1>
      <h2>Users connected to socket</h2>
      {room_info.users.map((user) => {
        return <p key={user.id}> {user.username} </p>;
      })}
      <h2>Players in game</h2>
      {game_info.public_game_state.seats.map((player, index) => {
        if (!player) {
          return (
            <>
              <p>Seat {index + 1}: Empty</p>
              {current_users_seat_index === -1 && (
                <button
                  onClick={() =>
                    sendJsonMessage({
                      uuid,
                      messageType: MessageType.JOIN_GAME,
                      actionAmount: index + 1,
                    } as EventMessage)
                  }
                >
                  Join Game at seat {index + 1}
                </button>
              )}
            </>
          );
        }
        return (
          <>
            <p key={player?.id}>
              Seat {index + 1}: {player.username}{" "}
            </p>
            {current_users_seat_index === index && (
              <button
                onClick={() =>
                  sendJsonMessage({
                    uuid,
                    messageType: MessageType.LEAVE_GAME,
                  } as EventMessage)
                }
              >
                Leave Game
              </button>
            )}
          </>
        );
      })}
      <button
        onClick={() => sendJsonMessage({ uuid, messageType: MessageType.START_GAME })}
        disabled={player_count < 2}
      >
        Start Game
      </button>
      <h2>Table cards</h2>
      {game_info.public_game_state.tableCards?.map((card) => {
        return (
          <p key={card.suit + card.value}>
            {" "}
            {card.suit} {card.value}{" "}
          </p>
        );
      })}
      <h2>My cards</h2>
      {private_info?.hand?.map((card) => {
        return (
          <p key={card.suit + card.value}>
            {" "}
            {card.suit} {card.value}{" "}
          </p>
        );
      })}
      <h2>Hand rankings</h2>
      {game_info.public_game_state.seats.map((card, i) => {
          return  (
            <p>Seat {i+1}: {card?.hand_ranking}</p>
          )
        })
      }
      <h2>Public game state</h2>
      <p>Game state: {game_info.public_game_state.state}</p>
      <p>Seat's turn: {game_info.public_game_state.seatNumbersTurn + 1}</p>
      <p>Time left: {game_info.public_game_state.timeLeft} seconds</p>
    </>
  );
};
