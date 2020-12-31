import React from 'react';
import { GameLayout } from 'gamesShared/components/fbg/GameLayout';
import { IGameArgs } from 'gamesShared/definitions/game';
import { isOnlineGame, isLocalGame } from 'gamesShared/helpers/gameMode';
import { isFirstPersonView } from 'gamesShared/helpers/GameUtil';
import { IPlayerInRoom } from 'gamesShared/definitions/player';
import { PlayerBadges } from 'gamesShared/components/badges/PlayerBadges';
import { IScore, Scoreboard } from 'gamesShared/components/scores/Scoreboard';
import { Ctx } from 'boardgame.io';
import { Modal, Button, Typography, List, ListItem, ListItemText } from '@material-ui/core';
import Timer from 'react-compound-timer';
import { TIME_OUT, TIME_BUFF, playerColors } from './constants';
import { IG, ISolvedWord } from './game';
import { Soup } from './soup';
import soupCSS from './soup.module.css';

interface IBoardProps {
  G: IG;
  ctx: Ctx;
  moves: any;
  playerID: string;
  gameArgs?: IGameArgs;
}

interface IBoardState {
  showWords: boolean;
}

export const localPlayerNames = { '0': 'red', '1': 'blue' };

export class Board extends React.Component<IBoardProps, IBoardState> {
  constructor(props) {
    super(props);
    // initialize state
    this.state = {
      showWords: false,
    };
  }

  _isFirstPerson = () => isFirstPersonView(this.props.gameArgs, this.props.playerID);

  _isAllowedToMakeMove = () => {
    const { gameArgs, playerID, ctx } = this.props;
    return (this._isFirstPerson() && playerID === ctx.currentPlayer) || isLocalGame(gameArgs);
  };

  _wordFound = (solvedWord: ISolvedWord) => {
    if (this._isAllowedToMakeMove()) {
      this.props.moves.wordFound(solvedWord);
    }
  };

  _playerInRoom(): IPlayerInRoom {
    return this.props.gameArgs.players[this.props.ctx.currentPlayer];
  }

  _getStatus() {
    if (!this.props.gameArgs) {
      return;
    }

    if (isOnlineGame(this.props.gameArgs)) {
      if (this._isFirstPerson()) {
        return 'Online Game';
      } else {
        return 'Spectator View';
      }
    }
    return `Turn Player ${parseInt(this.props.ctx.currentPlayer) + 1}`;
  }

  _getTimeRemaining = (considerBuffer: boolean = false) => {
    let timeLeft = (TIME_OUT + TIME_BUFF) * 1000 - (Date.now() - this.props.G.timeRef);
    if (considerBuffer && !this._isAllowedToMakeMove() && this._isFirstPerson()) {
      // after some buffer everyone can claim turn end for current player
      timeLeft = timeLeft + 2000 + 1000 * parseInt(this.props.playerID);
    }
    timeLeft = Math.floor(timeLeft / 1000);
    return timeLeft > TIME_OUT ? TIME_OUT : timeLeft < 0 ? 0 : timeLeft;
  };

  _changeTurn = (strict: boolean = true) => {
    this.props.moves.changeTurn(strict);
  };

  _renderTimeRemaining() {
    // check time every second
    const secondlyCallback = [];
    for (let i = 0; i < TIME_OUT * 1.5; i++) {
      secondlyCallback.push({
        time: i * 1000,
        callback: () => {
          if (this._isFirstPerson() || isLocalGame(this.props.gameArgs)) {
            if (this._getTimeRemaining(true) === 0 && !this.props.ctx.gameover) {
              this._changeTurn(true);
            }
          }
        },
      });
    }
    return (
      <Timer key={`sol_timer_${this.props.G.timeRef}`} checkpoints={secondlyCallback}>
        <Timer.Seconds
          formatValue={() =>
            this._isAllowedToMakeMove()
              ? `You have ${this._getTimeRemaining(false)} seconds.`
              : `${this._playerInRoom().name} has ${this._getTimeRemaining(false)} seconds.`
          }
        />
      </Timer>
    );
  }

  _getWordModal() {
    return (
      <div>
        <Modal
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
          BackdropProps={{ invisible: true }}
          open={this.state.showWords}
          onClose={() => this.setState({ showWords: false })}
          style={{
            marginTop: '20px',
            width: '250px',
            height: '450px',
            marginLeft: 'auto',
            marginRight: 'auto',
            backgroundColor: 'white',
          }}
        >
          <div>
            <Typography style={{ padding: '10px' }} variant="h5">
              Words
            </Typography>
            <List style={{ maxHeight: '382px', overflow: 'auto' }}>
              {this.props.G.solution.map((s) => (
                <ListItem
                  key={'list-item-' + s.word}
                  // add a strike style is word is found
                  style={{ textDecoration: s.solvedBy ? 'line-through' : 'none' }}
                >
                  <ListItemText primary={s.word} />
                </ListItem>
              ))}
            </List>
          </div>
        </Modal>
      </div>
    );
  }

  _getPlayerScores = () => {
    const scores: IScore[] = this.props.gameArgs.players.map((player) => {
      return {
        playerID: `${player.playerID}`,
        score: this.props.G.solution.filter((s) => s.solvedBy === player.playerID.toString()).length,
      };
    });
    scores.sort((a, b) => b.score - a.score);
    return scores;
  };

  _renderPlayerBadges = () => {
    const colors = Object.values(playerColors);
    return (
      <PlayerBadges
        playerID={this.props.playerID}
        players={this.props.gameArgs.players}
        colors={colors}
        ctx={{ ...this.props.ctx, activePlayers: null }}
        scores={this._getPlayerScores()}
      />
    );
  };

  _renderFooter() {
    return (
      <>
        {this._renderPlayerBadges()}
        <Button
          variant="contained"
          onClick={() => {
            this.setState({ showWords: true });
          }}
          style={{ float: 'right', marginRight: '4px' }}
        >
          Words
        </Button>
      </>
    );
  }

  _getGameOver() {
    if (this.props.ctx.gameover.draw) {
      return 'draw';
    }
    if (isOnlineGame(this.props.gameArgs)) {
      if (this.props.ctx.gameover.winner === this.props.playerID) {
        return 'you won';
      } else {
        if (!this._isFirstPerson()) {
          return 'see scoreboard';
        }
        return 'you lost';
      }
    } else {
      if (this.props.ctx.gameover.winner) {
        return `Player ${parseInt(this.props.ctx.currentPlayer) + 1} (${
          localPlayerNames[this.props.ctx.gameover.winner]
        }) won`;
      }
    }
  }

  _getBoard() {
    // score board to be shown at the end of the game
    let scoreBoard = this.props.ctx.gameover ? (
      <Scoreboard
        scoreboard={this._getPlayerScores()}
        players={this.props.gameArgs.players}
        playerID={this.props.ctx.playerID}
      />
    ) : null;

    return (
      <div style={{ marginTop: '10px' }}>
        <Soup
          puzzle={this.props.G.puzzle}
          solution={this.props.G.solution}
          isActivePlayer={this._isAllowedToMakeMove()}
          currentPlayer={this.props.ctx.currentPlayer}
          wordFoundCallback={this._wordFound}
          isGameOver={this.props.ctx.gameover}
        />
        {scoreBoard}
      </div>
    );
  }

  render() {
    if (this.props.ctx.gameover) {
      return (
        <GameLayout gameOver={this._getGameOver()} extraCardContent={this._getBoard()} gameArgs={this.props.gameArgs} />
      );
    }
    return (
      <GameLayout gameArgs={this.props.gameArgs} avoidOverscrollReload>
        <Typography className={soupCSS.noselect} variant="h5" style={{ color: 'white', textAlign: 'center' }}>
          {this._getStatus()}
        </Typography>
        <Typography className={soupCSS.noselect} variant="h6" style={{ color: 'white', textAlign: 'center' }}>
          {this._renderTimeRemaining()}
        </Typography>
        {this._getBoard()}
        {this._renderFooter()}
        {this._getWordModal()}
      </GameLayout>
    );
  }
}
