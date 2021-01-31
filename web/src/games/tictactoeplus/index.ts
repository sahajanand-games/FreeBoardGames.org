const Thumbnail = require('./media/thumbnail.png');
import { GameMode } from 'gamesShared/definitions/mode';
import { IGameDef, IGameStatus } from 'gamesShared/definitions/game';
import instructions from './instructions.md';

export const tictactoeplusGameDef: IGameDef = {
  urlName: 'tictactoe',
  code: 'tictactoeplus',
  name: 'Tic-Tac-Toe',
  contributors: ['gk-patel'],
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
  description: 'નવી શૂન્ય-ચોકડી જેમાં શ્રીજી પધારશે',
  descriptionTag: `Play Tic-Tac-Toe for \
 free online. You can either play a single-player game against the computer,\
 a multi-player game against a friend online, or share your device and play\
 locally against a friend.`,
  instructions: {
    text: instructions,
  },
  status: IGameStatus.PUBLISHED,
  config: () => import('./config'),
  aiConfig: () => import('./ai'),
  customization: () => import('./customization'),
};

export default tictactoeplusGameDef;
