import { Game, GameState, TurnAction } from "./types"

export const initialiseGame = (game: Game, blind: number) => {
    let pot = 0
    game.public_game_state.seats.forEach(p => {
        if(p){
            p.chips -= blind
            pot += blind
        }
    })
    game.public_game_state.pot = pot
    game.public_game_state.state = GameState.Waiting
}

export const initialiseRound = (game: Game) => {
    let deck = game.deck
    // first card
    game.public_game_state.seats.forEach(p => {
        if(p){
            game.players_state[p.id].hand = []
            game.players_state[p.id].hand!.push(deck!.pop()!)
        }
    })
    // second card
    game.public_game_state.seats.forEach(p => {
        if(p){
            game.players_state[p.id].hand!.push(deck!.pop()!)
        }
    })
    game.public_game_state.playersTurnCount = 0
    game.public_game_state.state = GameState.In_Progress
}

export const nextRound = (game: Game) => {
    let pot = game.public_game_state.pot
    let current_highest_bid = game.public_game_state.current_highest_bid
    pot += current_highest_bid
    current_highest_bid = 0
    let deck = game.deck
    // 0 table cards, deal 3
    if(!game.public_game_state.tableCards || game.public_game_state.tableCards.length === 0){
        game.public_game_state.tableCards = []
        game.public_game_state.tableCards.push(deck!.pop()!)
        game.public_game_state.tableCards.push(deck!.pop()!)
        game.public_game_state.tableCards.push(deck!.pop()!)
    }
    // 3 or 4 table cards, deal 1
    else if(game.public_game_state.tableCards.length <= 4){
        game.public_game_state.tableCards.push(game.deck!.pop()!)
    }
    // 5 table cards, resolve and split pot
    else{
        game.public_game_state.seats.forEach(p => {
            if(p){
                let player_hand = game.players_state[p.id]
            }
        })
        
        // resolveWinner()
    }
}

export const playerAction = (game: Game, uuid: string, action: TurnAction, actionAmount?: number) => {
    if(!game.public_game_state.playersTurnCount){
        return
    }
    let player = game.public_game_state.seats[game.public_game_state.playersTurnCount]
    if(player?.id !== uuid){
        return // not your go
    }
    switch(action){
        case TurnAction.CALL:
            if(player.current_bid !== game.public_game_state.current_highest_bid){
                player.current_bid = game.public_game_state.current_highest_bid
                player.chips -= game.public_game_state.current_highest_bid - player.current_bid
            }
            game.public_game_state.playersTurnCount++
            break
        case TurnAction.FOLD:
            player.folded = true
            game.public_game_state.playersTurnCount++
            break
        case TurnAction.RAISE:
            if(actionAmount && actionAmount > game.public_game_state.current_highest_bid){
                player.chips -= actionAmount - player.current_bid
                player.current_bid = actionAmount
                game.public_game_state.current_highest_bid = actionAmount
                game.public_game_state.playersTurnCount++
            }
            else{
                //bad action, still their go
            }
            
            break
        case TurnAction.ALL_IN:
            // not enough chips
            if(player.chips + player.current_bid < game.public_game_state.current_highest_bid){
                // TODO
            }
            else{
                game.public_game_state.pot += player.chips
                game.public_game_state.current_highest_bid = player.chips
                player.chips = 0
                game.public_game_state.playersTurnCount++
            }
            break
    }
}

