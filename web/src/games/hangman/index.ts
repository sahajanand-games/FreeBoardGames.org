const Thumbnail = require('./media/thumbnail.png');
import { GameMode } from 'gamesShared/definitions/mode';
import { IGameDef, IGameStatus } from 'gamesShared/definitions/game';
import instructions from './instructions.md';

export const hangmanGameDef: IGameDef = {
  urlName: 'guess-the-word',
  code: 'hangman',
  name: 'Guess the Word',
  minPlayers: 2,
  maxPlayers: 2,
  imageURL: Thumbnail,
  modes: [{ mode: GameMode.OnlineFriend }, { mode: GameMode.LocalFriend }],
  description: 'સામે વાળાએ આપેલો શબ્દ શોધી કાઢો',
  descriptionTag: `Play Guess the Word for free online. You can either play a multi-player game against a friend online, or share your device and play locally against a friend.`,
  instructions: {
    // videoId: 'leW9ZotUVYo',
    text: instructions,
  },
  status: IGameStatus.PUBLISHED,
  config: () => import('./config'),
};

export default hangmanGameDef;
