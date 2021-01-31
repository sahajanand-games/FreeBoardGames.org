const Thumbnail = require('./media/thumbnail.jpg');
import { GameMode } from 'gamesShared/definitions/mode';
import { IGameDef, IGameStatus } from 'gamesShared/definitions/game';
import instructions from './instructions.md';

export const memoryMatchDef: IGameDef = {
  code: 'memorymatch',
  name: 'Hari Smruti',
  urlName: 'hari-smruti',
  contributors: ['gk-patel'],
  minPlayers: 2,
  maxPlayers: 2,
  imageURL: Thumbnail,
  modes: [
    {
      mode: GameMode.OnlineFriend,
      // extraInfo: { type: 'dropdown', options: ['Easy', 'Hard'] } as IGameModeExtraInfoDropdown,
    },
    {
      mode: GameMode.LocalFriend,
      // extraInfo: { type: 'dropdown', options: ['Easy', 'Hard'] } as IGameModeExtraInfoDropdown,
    },
  ],
  description: 'હરિની સ્મૃતિ સાથે યાદશક્તિ વધારો',
  descriptionTag: `Play hari smruti for free online. You can either play a multi-player game against a friend online, or share your device and play locally against a friend.`,
  instructions: {
    // videoId: 'leW9ZotUVYo',
    text: instructions,
  },
  config: () => import('./config'),
  status: IGameStatus.PUBLISHED,
};

export default memoryMatchDef;
