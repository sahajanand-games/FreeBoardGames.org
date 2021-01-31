import React from 'react';
import { Client } from 'boardgame.io/react';
import { GAMES_MAP } from 'games';
import { IGameDef, IGameConfig, IAIConfig, IGameArgs } from 'gamesShared/definitions/game';
import { gameBoardWrapper } from './GameBoardWrapper';
import { GameMode } from 'gamesShared/definitions/mode';
import getMessagePage from '../common/components/alert/MessagePage';
import MessagePageClass from '../common/components/alert/MessagePageClass';
import { applyMiddleware } from 'redux';
import DEFAULT_ENHANCERS from '../common/enhancers';
import { IPlayerInRoom } from 'gamesShared/definitions/player';
import ReactGA from 'react-ga';
import { SocketIO, Local } from 'boardgame.io/multiplayer';
import { GetMatch_match } from 'gqlTypes/GetMatch';
import { Debug } from 'boardgame.io/debug';
import { withSettingsService, SettingsService } from 'infra/settings/SettingsService';

interface IGameProps {
  // FIXME: fix which props are req
  history?: { push: (url: string) => void };
  match?: GetMatch_match;
  matchCode?: string;
  gameCode?: string;
  mode?: string;
  playerID?: string;
  settingsService: SettingsService;
}

interface IGameState {
  loading: boolean;
  config?: IGameConfig;
  ai?: IAIConfig;
}

export class GameInternal extends React.Component<IGameProps, IGameState> {
  mode: GameMode;
  loadAI: boolean;
  gameCode: string;
  serverUrl: string;
  gameDef: IGameDef;
  promise: any; // for testing

  constructor(props: IGameProps) {
    super(props);
    this.state = {
      loading: true,
    };
    if (this.props.match) {
      this.mode = GameMode.OnlineFriend;
      this.gameCode = this.props.match.gameCode;
      this.serverUrl = this.props.match.bgioServerUrl;
    } else {
      this.mode = this.props.mode as GameMode;
      this.loadAI = this.mode === GameMode.AI && typeof window !== 'undefined';
      this.gameCode = this.props.gameCode;
    }
    this.gameDef = GAMES_MAP[this.gameCode];
  }

  clear() {
    this.setState({
      loading: true,
    });
  }

  load() {
    if (this.gameDef) {
      let aiPromise = Promise.resolve({});
      if (this.loadAI) {
        aiPromise = this.gameDef.aiConfig();
      }
      return Promise.all([this.gameDef.config(), aiPromise]).then(
        (promises: any) => {
          this.setState(() => ({
            config: promises[0].default as IGameConfig,
            ai: this.loadAI ? (promises[1].default as IAIConfig) : null,
            loading: false,
          }));
        },
        () => {
          this.setState({
            loading: false,
          });
          // throw(e);
        },
      );
    } else {
      this.setState({
        loading: false,
      });
      return Promise.resolve();
    }
  }

  componentDidMount() {
    if (this.gameDef) {
      this.promise = this.load();
    }
  }

  componentWillUnmount() {
    this.clear();
  }

  render() {
    let matchCode, playerID, credentials;
    if (this.props.match) {
      credentials = this.props.match.bgioSecret;
      matchCode = this.props.match.bgioMatchId;
      playerID = this.props.match.bgioPlayerId;
    } else {
      matchCode = this.props.matchCode;
      playerID = this.mode === GameMode.AI ? '1' : this.props.playerID;
    }
    if (!this.gameDef) {
      return <MessagePageClass type={'error'} message={'Game Not Found'} />;
    }
    const validGameModes = this.gameDef.modes.map((mode) => mode.mode.toLowerCase());
    if (!validGameModes.includes(this.mode.toLowerCase())) {
      return <MessagePageClass type={'error'} message={'Invalid Game Mode'} />;
    }
    if (!this.state.loading && this.state.config) {
      const gameArgs = {
        gameCode: this.gameCode,
        mode: this.mode,
        credentials,
        matchCode,
        players: this._getPlayers(),
      } as IGameArgs;
      const clientConfig: any = {
        game: this.injectSetupData(this.state.config.bgioGame),
        debug: this.state.config.debug ? { impl: Debug } : false,
        loading: getMessagePage('loading', 'Connecting...'),
        board: gameBoardWrapper({
          board: this.state.config.bgioBoard,
          gameArgs,
        }),
        credentials,
        matchID: matchCode,
      };
      const allEnhancers = this.state.config.enhancers
        ? this.state.config.enhancers.concat(DEFAULT_ENHANCERS)
        : DEFAULT_ENHANCERS;
      const enhancers = allEnhancers.map((enhancer: any) => enhancer(gameArgs));
      clientConfig.enhancer = applyMiddleware(...enhancers);
      const ai = this.state.ai;
      if (this.loadAI && ai) {
        const gameAIConfig = ai.bgioAI(this.getSetupData());
        const gameAI = gameAIConfig.ai || gameAIConfig.bot || gameAIConfig;
        const gameAIType = gameAIConfig.type || gameAI;

        clientConfig.multiplayer = Local({
          bots: { '0': gameAIType },
        });
        clientConfig.game.ai = gameAI;
      }
      if (this.mode === GameMode.OnlineFriend) {
        clientConfig.multiplayer = SocketIO({ server: this.serverUrl });
      }
      const App = Client(clientConfig) as any;
      ReactGA.event({
        category: 'Game',
        label: gameArgs.gameCode,
        action: `Started ${this.mode} game`,
      });
      if (this.mode === GameMode.OnlineFriend) {
        return <App matchID={matchCode} playerID={playerID} credentials={credentials} />;
      } else {
        return <App matchID={matchCode} playerID={playerID} />;
      }
    } else if (this.state.loading) {
      const LoadingPage = getMessagePage('loading', `Downloading ${this.gameDef.name}...`);
      return <LoadingPage />;
    } else {
      const ErrorPage = getMessagePage('error', `Failed to download ${this.gameDef.name}.`);
      return <ErrorPage />;
    }
  }

  private getSetupData() {
    return (this.props.settingsService.getGameSetting('customization', this.gameCode) || {})[this.mode];
  }

  private injectSetupData(bgioGame: any) {
    // See https://github.com/boardgameio/boardgame.io/issues/555#issuecomment-749800592
    if (this.mode === GameMode.OnlineFriend) {
      // BGIO injects this correctly for online games.
      return bgioGame;
    }
    const setupData = this.getSetupData();
    const setup = bgioGame.setup ? (ctx) => bgioGame.setup(ctx, setupData) : undefined;
    return { ...bgioGame, setup };
  }

  _getPlayers(): IPlayerInRoom[] {
    switch (this.mode) {
      case GameMode.OnlineFriend:
        return this.props.match.playerMemberships.map((membership, index) => ({
          playerID: index,
          name: membership.user.nickname,
        }));
      case GameMode.AI:
        return [
          { playerID: 0, name: 'Computer' },
          { playerID: 1, name: 'You' },
        ];
      case GameMode.LocalFriend:
        return [
          { playerID: 0, name: 'Player 1' },
          { playerID: 1, name: 'Player 2' },
        ];
    }
  }
}

export default withSettingsService(GameInternal);
