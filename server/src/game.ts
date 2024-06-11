import { calculateHandRanking, constructNewDeck } from "./poker";
import { Game, GameState, PublicPlayerInfo, TurnAction } from "./types";

let room_size = 4;

export let game: Game = {
  public_game_state: {
    seats: Array(room_size).fill(null) as (PublicPlayerInfo | null)[],
    playersTurnCount: undefined,
    tableCards: undefined,
    state: GameState.Not_Started,
    pot: 0,
    current_highest_bid: 0,
  },
  players_state: {},
  deck: constructNewDeck(),
};

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
};

export const initialiseGame = (game: Game, blind: number) => {
  let pot = 0;
  game.public_game_state.seats.forEach((p) => {
    if (p) {
      p.chips -= blind;
      pot += blind;
    }
  });
  game.public_game_state.pot = pot;
  game.public_game_state.state = GameState.Waiting;
};

export const initialiseRound = (game: Game) => {
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
  game.public_game_state.playersTurnCount = 0;
  game.public_game_state.state = GameState.In_Progress;
  game.public_game_state.hand_rankings = undefined;
};

export const nextRound = (game: Game) => {
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
    let player_rankings = {} as { [id: string]: number };
    game.public_game_state.seats.forEach((p) => {
      if (p) {
        let player_hand = game.players_state[p.id].hand;
        player_rankings[p.id] = calculateHandRanking(
          community_cards,
          player_hand!,
        );
      }
    });
    game.public_game_state.hand_rankings = player_rankings;
  }
};

const timer = (seconds: number) => {
  var timeleft = seconds;
  var downloadTimer = setInterval(() => {

    if (timeleft == 0) {
      clearInterval(downloadTimer);
    }
    timeleft -= 1;
  }, 1000);
}

const incrementTurn = () => {
  game.public_game_state.playersTurnCount!++;
}

export const handlePlayerAction = (
  game: Game,
  uuid: string,
  action: TurnAction,
  actionAmount?: number,
) => {
  if (!game.public_game_state.playersTurnCount) {
    return;
  }
  let player =
    game.public_game_state.seats[game.public_game_state.playersTurnCount];
  if (player?.id !== uuid) {
    return; // not your go
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
