import { Game } from 'boardgame.io';
import { ActivePlayers, INVALID_MOVE } from 'boardgame.io/core';
import { IGameState } from './definitions';
import {
  GRID_SIZE,
  COL_DELTA,
  WILDCARD_NUM,
  MAX_BINGO_CALLS,
  INITIAL_WAIT_REF_NUM,
  TIME_OUT,
  NUM_MURTIS,
} from './constants';
import { shuffleArray, inferActivePlayers } from './utils';

export const BingoGame: Game<IGameState> = {
  name: 'bingo',
  setup: (ctx) => {
    const players = {};
    for (let i = 0; i < ctx.numPlayers; i++) {
      // generate the grid numbers
      let gridNumbers = [];
      for (let s = 0; s < GRID_SIZE; s++) {
        gridNumbers = [
          ...gridNumbers,
          ...shuffleArray(new Array(COL_DELTA).fill(0).map((n, idx) => idx + 1 + s * COL_DELTA)).slice(0, GRID_SIZE),
        ];
      }
      // assign number to players
      players[i] = {
        numbers: gridNumbers.map((n, idx) => ({
          id: idx,
          value: idx === 12 ? WILDCARD_NUM : n,
          marked: false,
        })),
        shoutCount: MAX_BINGO_CALLS,
        isWinner: false,
      };
    }

    return {
      players,
      callQueue: [
        INITIAL_WAIT_REF_NUM,
        ...shuffleArray(new Array(COL_DELTA * GRID_SIZE).fill(0).map((n, idx) => idx + 1)),
      ],
      callRef: 0,
      timeRef: Date.now(),
      activePlayers: ['0', '1'],
      murtisRef: shuffleArray(new Array(NUM_MURTIS).fill(0).map((_, idx) => idx)),
    };
  },
  moves: {
    incrementCallRef: (G: IGameState, _, playerID: string, strict: boolean = true) => {
      // if call is made too early, then reject
      if (strict && G.timeRef + TIME_OUT > Date.now()) {
        return INVALID_MOVE;
      }

      G.callRef = G.callRef + 1;
      G.timeRef = Date.now();
      G.activePlayers = inferActivePlayers(G, playerID);
      return G;
    },
    playerShouted: (G: IGameState, _, playerID: string, idNumbersSelected: number[]) => {
      if (G.players[playerID].shoutCount <= 0) {
        return G;
      }

      const numbersShown = G.callQueue.slice(0, G.callRef + 1);
      const numbers = G.players[playerID].numbers.map((n) => ({
        ...n,
        marked: idNumbersSelected.includes(n.id),
      }));

      // check if any columns (5), rows (5) or diagonals (2) are complete
      let found, xPos, yPos, marked;
      found = new Array(12).fill(0);
      for (let n of numbers) {
        xPos = Math.floor(n.id / GRID_SIZE);
        yPos = n.id % GRID_SIZE;
        marked = (n.marked && numbersShown.includes(n.value)) || n.value === WILDCARD_NUM;
        // columns
        for (let xi = 0; xi < GRID_SIZE; xi++) {
          found[xi] = found[xi] + (xPos === xi && marked);
        }
        // rows
        for (let yi = 0; yi < GRID_SIZE; yi++) {
          found[yi + GRID_SIZE] = found[yi + GRID_SIZE] + (yPos === yi && marked);
        }
        // diagonal
        found[10] = found[10] + (xPos === yPos && marked);
        found[11] = found[11] + (xPos + yPos === GRID_SIZE - 1 && marked);
      }

      if (found.includes(GRID_SIZE)) {
        G.players[playerID].numbers = numbers;
        G.players[playerID].isWinner = true;
      } else {
        G.players[playerID].shoutCount -= 1;
      }
      return G;
    },
  },
  turn: {
    activePlayers: ActivePlayers.ALL,
  },
  endIf: (G: IGameState, ctx) => {
    // if the callRef exceeds the length of callQueue
    if (G.callRef >= G.callQueue.length) {
      return { draw: true };
    }
    // if someone is marked as winner
    for (let p = 0; p < ctx.numPlayers; p++) {
      if (G.players[p].isWinner) {
        return { winner: p.toString() };
      }
    }
    // if one or more players have a shoutCount, then let them play
    for (let p = 0; p < ctx.numPlayers; p++) {
      if (G.players[p].shoutCount > 0) {
        return null;
      }
    }
    return { draw: true }; // else declare draw
  },
};
