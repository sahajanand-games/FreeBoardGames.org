import React from 'react';
import { IGameArgs } from 'gamesShared/definitions/game';
import { GameLayout } from 'gamesShared/components/fbg/GameLayout';
import { Grid } from 'deprecated-bgio-ui';
import { Token } from 'deprecated-bgio-ui';
import { IG, getScoreBoard } from './game';
import { IScore, Scoreboard } from 'gamesShared/components/scores/Scoreboard';
import { Ctx } from 'boardgame.io';
import { GameMode } from 'gamesShared/definitions/mode';
import { PlayerBadges } from 'gamesShared/components/badges/PlayerBadges';
import { isSpectator } from 'gamesShared/helpers/GameUtil';
import css from './Board.module.css';

import red from '@material-ui/core/colors/red';
import yellow from '@material-ui/core/colors/yellow';
import green from '@material-ui/core/colors/lightGreen';
import blue from '@material-ui/core/colors/blue';
import grey from '@material-ui/core/colors/grey';

import ShjImg from './media/ShjSqr.png';
import GopImg from './media/GopSqr.png';
import NarNImg from './media/NarNSqr.png';
import HanuImg from './media/HanumSqr.png';

import Typography from '@material-ui/core/Typography';
import { isAIGame, isOnlineGame } from '../../gamesShared/helpers/gameMode';

export interface ICoords {
  x: number;
  y: number;
}

export interface IColorMap {
  [key: string]: string;
}

interface IBoardProps {
  G: IG;
  ctx: Ctx;
  moves: any;
  step?: any;
  playerID: string;
  gameArgs?: IGameArgs;
}

export class Board extends React.Component<IBoardProps, {}> {
  _onClick = this.onClick.bind(this);

  async onClick(coords: ICoords) {
    if (isAIGame(this.props.gameArgs) && this.props.ctx.currentPlayer === this.props.ctx.playerID) {
      return;
    }

    await this.props.moves.placePiece(coords.x, coords.y);
  }

  _getGameOver() {
    const scoreboard: IScore[] = this.props.ctx.gameover.scoreboard;
    if (scoreboard[0].score === scoreboard[scoreboard.length - 1].score) {
      return 'draw';
    } else {
      try {
        if (isOnlineGame(this.props.gameArgs) || isAIGame(this.props.gameArgs)) {
          if (isSpectator(this.props.playerID)) {
            return 'see scoreboard';
          }
          if (scoreboard[0].score === scoreboard.find((rank) => rank.playerID === this.props.playerID).score) {
            return 'you won';
          } else {
            return 'you lost';
          }
        } else {
          // local game
          if (scoreboard[0].score > scoreboard[1].score) {
            return 'Player 1 wins';
          } else {
            return 'Player 2 wins';
          }
        }
      } catch (err) {
        return 'See the Scorecard';
      }
    }
  }

  _getScoreBoard() {
    return (
      <Scoreboard
        scoreboard={this.props.ctx.gameover.scoreboard}
        playerID={this.props.playerID}
        players={this.props.gameArgs.players}
      />
    );
  }

  isLocalGame() {
    return this.props.gameArgs && this.props.gameArgs.mode === GameMode.LocalFriend;
  }

  _getStatus() {
    if (!this.props.gameArgs) {
      return;
    }

    let message = '';
    if (this.isLocalGame()) {
      let player;
      switch (this.props.ctx.currentPlayer) {
        case '0': {
          player = 'Red';
          break;
        }
        case '1': {
          player = 'Green';
          break;
        }
      }
      message = `${player}'s turn`;
    } else if (isAIGame(this.props.gameArgs)) {
      if (this.props.ctx.currentPlayer === this.props.playerID) {
        message = 'Place piece';
      } else {
        message = 'Waiting for opponent...';
      }
    } else if (isOnlineGame(this.props.gameArgs)) {
      const playerName = this.props.gameArgs.players[this.props.ctx.currentPlayer].name;
      if (this.props.ctx.currentPlayer === this.props.playerID) {
        message = 'Your turn';
      } else {
        if (isSpectator(this.props.playerID)) {
          message = `${playerName}'s turn`;
        } else {
          message = `Waiting for ${playerName}...`;
        }
      }
    }
    return message;
  }

  render() {
    if (this.props.ctx.gameover) {
      return (
        <GameLayout
          gameOver={this._getGameOver()}
          extraCardContent={this._getScoreBoard()}
          gameArgs={this.props.gameArgs}
        />
      );
    }

    const colors =
      this.props.ctx.numPlayers !== 2
        ? [red[500], yellow[500], green[500], blue[500]]
        : [red[500], green[500], yellow[500], blue[500]];
    const colorMap = this.getColorMap();

    const murti =
      this.props.ctx.numPlayers !== 2 ? [GopImg, NarNImg, ShjImg, HanuImg] : [GopImg, ShjImg, NarNImg, HanuImg];

    return (
      <GameLayout gameArgs={this.props.gameArgs}>
        <Typography variant="h5" style={{ textAlign: 'center', color: 'white', marginBottom: '16px' }}>
          {this._getStatus()}
        </Typography>
        <Grid rows={8} cols={8} onClick={this._onClick} colorMap={colorMap}>
          {this.props.G.points
            .map((point, i) => ({ player: point, position: i }))
            .filter((point) => point.player !== null)
            .map((point) => (
              <Token animate={false} key={point.position} x={point.position % 8} y={(point.position / 8) << 0}>
                <g>
                  <rect
                    width="0.8"
                    height="0.8"
                    x="0.1"
                    y="0.1"
                    style={{ fill: colors[point.player as any] }}
                    className={css.Piece}
                  ></rect>
                  <image x="0.1" y="0.1" width="0.8" height="0.8" href={murti[point.player as any]} />
                </g>
              </Token>
            ))}
        </Grid>
        <PlayerBadges
          scores={getScoreBoard(this.props.G, this.props.ctx)}
          playerID={this.props.playerID}
          players={this.props.gameArgs.players}
          colors={colors}
          ctx={this.props.ctx}
        />
      </GameLayout>
    );
  }

  getColorMap(): IColorMap {
    const colorMap = {} as IColorMap;
    for (let x = 0; x < 8; x++) {
      for (let y = 0; y < 8; y++) {
        const key = `${x},${y}`;
        let color: any = grey[800];
        if ((x + y) % 2 === 0) {
          color = grey[900];
        }
        colorMap[key] = color;
      }
    }
    return colorMap;
  }
}
