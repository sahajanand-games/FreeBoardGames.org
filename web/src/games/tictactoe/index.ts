const Thumbnail = require('./media/thumbnail.jpg');
import { GameMode } from 'gamesShared/definitions/mode';
import { IGameDef, IGameStatus } from 'gamesShared/definitions/game';
import instructions from './instructions.md';

export const tictactoeGameDef: IGameDef = {
  code: 'tictactoe',
  name: 'Tic-Tac-Toe',
  contributors: ['jasonharrison'],
  minPlayers: 2,
  maxPlayers: 2,
  imageURL: Thumbnail,
  modes: [
    {
      mode: GameMode.AI,
    },
    { mode: GameMode.OnlineFriend },
    { mode: GameMode.LocalFriend },
  ],
  description: 'A Classic Game',
  descriptionTag: `Play Tic-Tac-Toe (also called Noughts and Crosses) for\
 free online. You can either play a single-player game against the computer,\
 a multi-player game against a friend online, or share your device and play\
 locally against a friend.`,
  instructions: {
    videoId: 'USEjXNCTvcc',
    text: instructions,
  },
  status: IGameStatus.IN_DEVELOPMENT,
  config: () => import('./config'),
  aiConfig: () => import('./ai'),
  customization: () => import('./customization'),
};

export default tictactoeGameDef;
