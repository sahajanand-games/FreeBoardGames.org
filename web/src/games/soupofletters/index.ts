const Thumbnail = require('./media/thumbnail.png');
import { GameMode } from 'gamesShared/definitions/mode';
import { IGameDef, IGameStatus } from 'gamesShared/definitions/game';
import instructions from './instructions.md';

export const soupOfLettersGameDef: IGameDef = {
  code: 'soupofletters',
  name: 'Soup of Letters',
  imageURL: Thumbnail,
  modes: [{ mode: GameMode.LocalFriend }, { mode: GameMode.OnlineFriend }],
  minPlayers: 2,
  maxPlayers: 4,
  description: 'આધ્યાત્મિક શબ્દો થી ભરપૂર આડી-ઉભી ચાવી',
  descriptionTag: `Soup of letters, Alphabet soup, Crosswords. Find words in puzzle game.`,
  instructions: {
    // videoId: '_XVs7CmSXTw',
    text: instructions,
  },
  status: IGameStatus.PUBLISHED,
  config: () => import('./config'),
  // aiConfig: () => import('./ai'),
};

export default soupOfLettersGameDef;
