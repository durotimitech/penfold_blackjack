import {   useState } from "react";
import {
  Card,
  CardRank,
  CardDeck,
  CardSuit,
  GameState,
  Hand,
  GameResult,
} from "./types";

//UI Elements
const CardBackImage = () => (
  <img alt="back.png" src={process.env.PUBLIC_URL + `/SVG-cards/png/1x/back.png`} />
);

const CardImage = ({ suit, rank }: Card) => {
  const card = rank === CardRank.Ace ? 1 : rank;
  return (
    <img
    alt={"card"}
      src={
        process.env.PUBLIC_URL +
        `/SVG-cards/png/1x/${suit.slice(0, -1)}_${card}.png`
      }
    />
  );
};

//Setup
const newCardDeck = (): CardDeck =>
  Object.values(CardSuit)
    .map((suit) =>
      Object.values(CardRank).map((rank) => ({
        suit,
        rank,
      }))
    )
    .reduce((a, v) => [...a, ...v]);

const shuffle = (deck: CardDeck): CardDeck => {
  return deck.sort(() => Math.random() - 0.5);
};

const takeCard = (deck: CardDeck): { card: Card; remaining: CardDeck } => {
  const card = deck[deck.length - 1];
  const remaining = deck.slice(0, deck.length - 1);
  return { card, remaining };
};

const setupGame = (): GameState => {
  const cardDeck = shuffle(newCardDeck());

  return {
    playerHand: cardDeck.slice(cardDeck.length - 2, cardDeck.length),
    dealerHand: cardDeck.slice(cardDeck.length - 4, cardDeck.length - 2),
    cardDeck: cardDeck.slice(0, cardDeck.length - 4), // remaining cards after player and dealer have been give theirs
    turn: "player_turn",
  };
};

//Scoring
const calculateHandScore = (hand: Hand): number => {

  let score = 0
  let numOfAcesInDeck = 0

  for (const card of hand){
    const {suit, rank} = card

    if (Number(rank) > 1 && Number(rank) < 10){
      score = score + Number(rank)
    }else if (rank === CardRank.Ten || rank === CardRank.Jack || rank === CardRank.Queen || rank === CardRank.King ){
      score = score + 10
    }else if (rank === CardRank.Ace){
      numOfAcesInDeck++
    }
  }

  while (numOfAcesInDeck > 0){
    let newAceScore = score + 11

    if(numOfAcesInDeck > 1 || newAceScore > 21){
      score++
    }else{
      score = newAceScore
    }

    numOfAcesInDeck--
  }

  return score;
};

const hasCardRank = (hand: Card[], ranks: CardRank[]): boolean =>
  hand.some((card) => ranks.includes(card.rank));

const determineGameResult = (state: GameState): GameResult => {
  let result: GameResult = "no_result"

  const aceIsOnDeckForPlayer = hasCardRank(state.playerHand, [CardRank.Ace]);
  const tenIsOnDeckForPlayer = hasCardRank(state.playerHand, [CardRank.Ten, CardRank.Jack, CardRank.Queen, CardRank.King]);
  const aceIsOnDeckForDealer = hasCardRank(state.dealerHand, [CardRank.Ace]);
  const tenIsOnDeckForDealer = hasCardRank(state.dealerHand, [CardRank.Ten, CardRank.Jack, CardRank.Queen, CardRank.King]);


  const playerHasBlackJack = aceIsOnDeckForPlayer && tenIsOnDeckForPlayer
  const dealerHasBlackJack = aceIsOnDeckForDealer && tenIsOnDeckForDealer

  const playerScore = calculateHandScore(state.playerHand)
  const dealerScore = calculateHandScore(state.dealerHand)

  if (playerScore > 21){
    result = 'dealer_win'
  }else if (dealerScore > 21){
result = "player_win"
  }
  else if ( playerHasBlackJack && dealerHasBlackJack){
    result = 'draw'
  } else if ( (playerHasBlackJack && !dealerHasBlackJack) || (playerScore > dealerScore)){
    result = 'player_win'
  } else if ( (!playerHasBlackJack && dealerHasBlackJack) || (dealerScore > playerScore)){
    result = 'dealer_win'
  } else if (playerScore === dealerScore){
    result = 'draw'
  }

  return result;
};

//Player Actions
const playerStands = (state: GameState): GameState => {
  if (calculateHandScore(state.dealerHand) <= 16){
    const { card, remaining } = takeCard(state.cardDeck);

    return {
      ...state,
      cardDeck: remaining,
      dealerHand: [...state.dealerHand, card],
      turn: "player_turn"
    };
  }else{

    return {
      ...state,
      turn: "dealer_turn",
    };
  }
};

const playerHits = (state: GameState): GameState => {
  const { card, remaining } = takeCard(state.cardDeck);
  return {
    ...state,
    cardDeck: remaining,
    playerHand: [...state.playerHand, card],
    turn: "dealer_turn"
  };
};

//UI Component
const Game = (): JSX.Element => {
  const [state, setState] = useState(setupGame());
  
  return (
    <>
      <div>
        {}
      {state.turn === "dealer_turn" &&
      determineGameResult(state) !== "no_result" ? (
        <b><p>{determineGameResult(state)}</p></b>
      ) : (
        <b><p>{state.turn}</p></b>
      )}

        <p>There are {state.cardDeck.length} cards left in deck</p>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerHits)}
        >
          Hit
        </button>
        <button
          disabled={state.turn === "dealer_turn"}
          onClick={(): void => setState(playerStands)}
        >
          Stand
        </button>
        <button onClick={(): void => setState(setupGame())}>Reset</button>
      </div>
      <p>Player Cards</p>
      <div>
        {state.playerHand.map(CardImage)}
        <p>Player Score {calculateHandScore(state.playerHand)}</p>
      </div>
      <p>Dealer Cards</p>
      {state.turn === "player_turn" && state.dealerHand.length > 0 ? (
        <div>
          <CardBackImage />
          <CardImage {...state.dealerHand[1]} />
        </div>
      ) : (
        <div>
          {state.dealerHand.map(CardImage)}
          <p>Dealer Score {calculateHandScore(state.dealerHand)}</p>
        </div>
      )}

    </>
  );
};

export {
  Game,
  playerHits,
  playerStands,
  determineGameResult,
  calculateHandScore,
  setupGame,
};
