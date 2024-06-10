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
}

export type Player = {
    public_player_info: PublicPlayerInfo,
    private_player_info: PrivatePlayerInfo
}

export type PublicPlayerInfo = {
    id: string,
    username: string,
    chips: number,
    current_bid: number
    folded: boolean
}

export type PrivatePlayerInfo = {
    id: string,
    username: string,
    hand?: Card[]
}

export type Game = {
    public_game_state: PublicGameState,
    players_state: {[id: string]: PrivatePlayerInfo}, // id to player info dict
    deck: Card[],
}

export type PublicGameState = {
    seats: (PublicPlayerInfo | null)[],
    playersTurnCount?: number,
    tableCards?: Card[],
    state: GameState,
    pot: number
    current_highest_bid: number
}

export enum GameState {
    Not_Started = "not_started",
    Game_Initalised = "game_initalised",
    Waiting = "waiting",
    Dealing = "dealing",
    In_Progress = "in_progress", // game being played
    Concluded = "concluded",
}

export type Room = {
    id: string,
    name: string,
    users?: User[],
    public_game_state: PublicGameState
}

export enum MessageType {
    JOIN_GAME = "JOIN_GAME",
    START_GAME = "START_GAME",
    LEAVE_GAME = "LEAVE_GAME",
    TURN_ACTION = "TURN_ACTION",
    INITAL_FETCH = "INITAL_FETCH"
}

export enum TurnAction {
    CALL = "CALL",
    FOLD = "FOLD",
    RAISE = "RAISE",
    ALL_IN = "ALL_IN"
}

export type EventMessage = {
    uuid: string,
    messageType: MessageType,
    action?: TurnAction,
    actionAmount?: number
}

export type WebSocketResponse = {
    room: Room,
    private_player_state: PrivatePlayerInfo
}