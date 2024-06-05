export enum Action {
    Raise = "raise",
    Check = "check",
    Call = "call",
    Fold = "fold",
}

export enum Suit {
    Heart = "Heart",
    Diamond = "Diamond",
    Spade = "Spade",
    Club = "Club"
}

export enum Value {
    Two = 2,
    Three = 3,
    Four = 4,
    Five = 5,
    Six = 6,
    Seven = 7,
    Eight = 8,
    Nine = 9,
    Ten = 10,
    Jack = 11,
    Queen = 12,
    King = 13,
    Ace = 14
}

export type Card = {
    suit: Suit,
    value: Value
}

export type Duplicate = {
    value: Value,
    count: number
}

export type User = {
    id: string,
    username: string,
    email: string,
    password: string,
    bank: number
}

export type Player = {
    username: string,  
    id: string,
    chips: number,
    hand: Card[]
}

export type Game = {
    players: Player[],
    playersTurnCount: number,
    tableCards: Card[],
    state: GameState,
    deck: Card[]
}

export enum GameState {
    Not_Started = "not_started",
    Waiting = "waiting", // started but waiting for blinds
    In_Progress = "in_progress", // game being played
    Dealing = "dealing"
}

export type Room = {
    id: string,
    name: string,
    players?: Player[],
    game?: Game
}