const Thumbnail = require('./media/thumbnail.png?lqip-colors');
import { GameMode } from 'gamesShared/definitions/mode';
import { IGameDef, IGameStatus } from 'gamesShared/definitions/game';
import instructions from './instructions.md';

export const estateBuyerGameDef: IGameDef = {
  code: 'estatebuyer',
  name: 'Estate Buyer',
  imageURL: Thumbnail,
  modes: [{ mode: GameMode.OnlineFriend }, { mode: GameMode.LocalFriend }],
  minPlayers: 2,
  maxPlayers: 6,
  description: 'Similar to For Sale',
  descriptionTag: `Play Estate Buyer, similar to For Sale, locally
  or online against friends!`,
  instructions: {
    videoId: 'OZ0RLgnBp6o',
    text: instructions,
  },
  status: IGameStatus.IN_DEVELOPMENT,
  config: () => import('./config'),
};

export default estateBuyerGameDef;
