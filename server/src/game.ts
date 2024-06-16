import { calculateHandRanking, constructNewDeck } from "./poker";
import { Game, GameState, PublicPlayerInfo, TurnAction } from "./types";

const room_size = 4;

const turn_time = 10

let game: Game = {
  public_game_state: {
    seats: Array(room_size).fill(null) as (PublicPlayerInfo | null)[],
    seatNumbersTurn: 0,
    tableCards: [],
    state: GameState.Not_Started,
    pot: 0,
    blind: 0,
    current_highest_bid: 0,
    timeLeft: 0,
  },
  players_state: {},
  deck: constructNewDeck(),
};

export const getGame = () => {
  return game
}

export const addPlayerToGame = (
  player: PublicPlayerInfo,
  seat_number: number,
) => {
  game.players_state[player.id] = {
    id: player.id,
    username: player.username,
    hand: undefined,
  };
  game.public_game_state.seats[seat_number - 1] = player;
};

export const removePlayerFromGame = (uuid: string) => {
  delete game.players_state[uuid];
  for (let seat_index in game.public_game_state.seats) {
    if (game.public_game_state.seats[seat_index]?.id === uuid) {
      game.public_game_state.seats[seat_index] = null;
    }
  }
  // TODO: handle if it was their turn
};

export const setTurnToFirstPlayer = () => {
  const seats = game.public_game_state.seats
  const first_player_seat = seats.findIndex(s => s?.id)
  if(first_player_seat === -1){
    console.log("no players")
    return
  }
  game.public_game_state.timeLeft = turn_time
  game.public_game_state.seatNumbersTurn = first_player_seat
}

export const initialiseGame = async (blind: number) => {
  game.deck = constructNewDeck()
  let pot = 0;
  game.public_game_state.seats.forEach((p) => {
    if (p) {
      p.chips -= blind;
      pot += blind;
      p.hand_ranking = undefined
    }
  });
  setTurnToFirstPlayer()
  let deck = game.deck;
  // first card
  game.public_game_state.seats.forEach((p) => {
    if (p) {
      game.players_state[p.id].hand = [];
      game.players_state[p.id].hand!.push(deck!.pop()!);
    }
  });
  // second card
  game.public_game_state.seats.forEach((p) => {
    if (p) {
      game.players_state[p.id].hand!.push(deck!.pop()!);
    }
  });
  game.public_game_state = {
    ...game.public_game_state,
    pot,
    blind,
    state: GameState.In_Progress,
    timeLeft: turn_time,
    tableCards: [],
    current_highest_bid: 0
  }
};

export const finaliseRound = async () => {
  game.public_game_state.state = GameState.Concluded
  game.public_game_state.timeLeft = turn_time
  let intervalId = setInterval(() => {
    if(game.public_game_state.timeLeft  <= 0){
      clearInterval(intervalId)
      initialiseGame(game.public_game_state.blind)
    }
    game.public_game_state.timeLeft -= 1
  }, 1000)
}


export const nextRound = async () => {
  setTurnToFirstPlayer()
  let pot = game.public_game_state.pot;
  let current_highest_bid = game.public_game_state.current_highest_bid;
  pot += current_highest_bid;
  current_highest_bid = 0;
  let deck = game.deck;
  // 0 table cards, deal 3
  if (
    !game.public_game_state.tableCards ||
    game.public_game_state.tableCards.length === 0
  ) {
    game.public_game_state.tableCards = [];
    game.public_game_state.tableCards.push(deck!.pop()!);
    game.public_game_state.tableCards.push(deck!.pop()!);
    game.public_game_state.tableCards.push(deck!.pop()!);
  }
  // 3 or 4 table cards, deal 1
  else if (game.public_game_state.tableCards.length <= 4) {
    game.public_game_state.tableCards.push(game.deck!.pop()!);
  }
  // 5 table cards, resolve and split pot
  else {
    let community_cards = game.public_game_state.tableCards;
    game.public_game_state.seats.forEach((p) => {
      if (p) {
        let player_hand = game.players_state[p.id].hand;
        p.hand_ranking = calculateHandRanking(
          community_cards,
          player_hand!,
        );
        console.log(p.hand_ranking)
      }
    });
  }
};


const incrementTurn = () => {
  game.public_game_state.seatNumbersTurn++;
  let seats_length = game.public_game_state.seats.length
  for(let i = game.public_game_state.seatNumbersTurn; i < seats_length; i++){
    let seat = game.public_game_state.seats[i]
    if(seat && !seat.folded){
      break
    }
  }
  game.public_game_state.timeLeft = 10;
}

export const decrementTimer = () => {
  game.public_game_state.timeLeft -= 1;
}

export const handlePlayerAction = async (
  uuid: string,
  action: TurnAction,
  actionAmount?: number,
) => {
  let players = game.public_game_state.seats
  let player = players[game.public_game_state.seatNumbersTurn]
  if (player?.id !== uuid) {
    console.log("not your turn")
    return;
  }
  switch (action) {
    case TurnAction.CALL:
      if (player.current_bid !== game.public_game_state.current_highest_bid) {
        player.current_bid = game.public_game_state.current_highest_bid;
        player.chips -=
          game.public_game_state.current_highest_bid - player.current_bid;
      }
      incrementTurn()
      break;
    case TurnAction.FOLD:
      player.folded = true;
      incrementTurn()
      break;
    case TurnAction.RAISE:
      if (
        actionAmount &&
        actionAmount > game.public_game_state.current_highest_bid
      ) {
        player.chips -= actionAmount - player.current_bid;
        player.current_bid = actionAmount;
        game.public_game_state.current_highest_bid = actionAmount;
        incrementTurn()
      } else {
        //bad action, still their go
      }
      break;
    case TurnAction.ALL_IN:
      // not enough chips
      if (
        player.chips + player.current_bid <
        game.public_game_state.current_highest_bid
      ) {
        // TODO
      } else {
        game.public_game_state.pot += player.chips;
        game.public_game_state.current_highest_bid = player.chips;
        player.chips = 0;
        incrementTurn()
      }
      break;
  }
};
