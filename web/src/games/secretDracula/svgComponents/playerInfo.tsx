import * as React from 'react';
import { grey } from '@material-ui/core/colors';
import textCSS from './textStyles.module.css';
import * as CNST from '../constants';

export interface IPlayerInfo {
  id: number;
  me: boolean;
  renderForVampire: boolean;
  playerName: string;
  playerActive: boolean;
  dead: boolean;
  vampire: boolean;
  dracula: boolean;
  mayor: boolean;
  priest: boolean;
  totalPlayers: number;
  phaseName: string;
  isInvestigated: boolean;
  wasLastPreist: boolean;
  wasLastMayor: boolean;
  numAlivePlayers: number;
  isGameOver: boolean;
  isSpectator: boolean;
  chose: (pInfo: any) => void;
}

function getPhaseRelatedInfoSymbol(pInfo: IPlayerInfo) {
  switch (pInfo.phaseName) {
    case 'phaseChosePriest':
      if (!pInfo.mayor && !pInfo.dead && !pInfo.wasLastPreist) {
        if (pInfo.wasLastMayor && pInfo.numAlivePlayers > 5) {
          return null;
        }
        return CNST.SY_CANDIDATE;
      }
      break;
    case 'phaseVotePriest':
      if (pInfo.priest) {
        return CNST.SY_CANDIDATE;
      }
      break;
    case 'phaseInvestigate1':
      if (!pInfo.mayor && !pInfo.dead) {
        return CNST.SY_SEARCH;
      }
      break;
    case 'phaseInvestigate2':
      if (pInfo.isInvestigated) {
        return CNST.SY_SEARCH;
      }
      break;
    case 'phaseSpecialElection':
    case 'phaseExecution':
      if (!pInfo.mayor && !pInfo.dead) {
        return CNST.SY_CANDIDATE;
      }
      break;
  }

  return null;
}

export function PlayerInfo(props: IPlayerInfo) {
  const xLen = Math.ceil(props.totalPlayers / 2);
  const boxWidth = CNST.B_WIDTH / xLen;
  const xPos = Math.floor(props.id / 2) * boxWidth;

  const yLen = 2;
  const boxHeight = CNST.PI_AREA_HEIGHT / yLen;
  const yPos = (props.id % yLen) * boxHeight;
  const strokeWidth = 0.125 / boxWidth;
  const margin = strokeWidth;

  // setup profile pic
  const humanPic = CNST.SY_HUMANS[props.id % CNST.SY_HUMANS.length];
  let profilePic = props.me
    ? props.vampire
      ? CNST.SY_VAMPIRE
      : humanPic
    : props.renderForVampire && props.vampire
    ? CNST.SY_VAMPIRE
    : humanPic;

  if (props.isGameOver) {
    if (props.vampire) {
      profilePic = CNST.SY_VAMPIRE;
    }
  } else {
    if (props.isSpectator) {
      profilePic = humanPic;
    }
  }

  let showDracula = !props.isSpectator && props.dracula && props.renderForVampire;
  if (props.isGameOver && props.dracula) {
    showDracula = true;
    profilePic = CNST.SY_VAMPIRE;
  }

  // setup additional symbols
  const symbols = [];
  if (props.playerActive) {
    symbols.push('🕒');
  }
  const phaseSymbol = getPhaseRelatedInfoSymbol(props);
  if (phaseSymbol) {
    symbols.push(phaseSymbol);
  }
  if (props.mayor) {
    symbols.push(CNST.SY_MAYOR);
  } else if (props.priest) {
    symbols.push(CNST.SY_PRIEST);
  }
  if (props.dead) {
    symbols.push(CNST.SY_DEAD);
  }

  // trim name if required
  const nameLength = Math.ceil((CNST.PI_MIN_NAME_SIZE * 5) / Math.ceil(props.totalPlayers / 2));
  let playerName = props.playerName;
  if (playerName.length > nameLength) {
    playerName = playerName.slice(0, nameLength) + '.';
  }
  const profileTranslate = `translate(${boxWidth * (symbols.length > 0 ? -0.17 : 0)},0)`;
  const profileStyle = { transition: '0.6s' };

  return (
    <g
      key={`sd_player_info_group_${props.id}`}
      onClick={() => {
        props.chose(props);
      }}
    >
      <rect
        key={`sd_player_info_rect_${props.id}`}
        x={xPos + margin}
        y={yPos + margin}
        width={boxWidth - 2 * margin}
        height={boxHeight - 2 * margin}
        rx={strokeWidth * 1.25}
        style={{
          stroke: 'white',
          strokeWidth,
          fill: grey[500],
          fillOpacity: props.dead ? 0.5 : 0,
        }}
      />

      <text
        key={`sd_player_pic_${props.id}`}
        className={textCSS.noselect}
        x={xPos + boxWidth * 0.5}
        y={yPos + boxHeight * 0.55}
        fontSize={0.9}
        textAnchor="middle"
        transform={profileTranslate}
        style={profileStyle}
      >
        {profilePic}
      </text>

      {showDracula ? (
        <text
          key={`sd_p_${props.id}_crone`}
          className={textCSS.noselect}
          x={xPos + boxWidth * 0.5}
          y={yPos + boxHeight * 0.28}
          fontSize={boxHeight * 0.18}
          textAnchor="middle"
          transform={profileTranslate}
          style={profileStyle}
        >
          {CNST.SY_DRACULA}
        </text>
      ) : null}

      <text
        key={`sd_pName_${props.id}`}
        className={textCSS.noselect}
        x={xPos + boxWidth / 2}
        y={yPos + boxHeight * 0.85}
        fontSize={0.4}
        textAnchor="middle"
        fill="white"
      >
        {props.me ? 'You' : playerName}
      </text>

      {symbols.map((s, sID) => (
        <text
          key={`sd_p_${props.id}_symbol_${sID}`}
          className={textCSS.noselect}
          x={xPos + boxWidth * 0.75}
          y={yPos + boxHeight * 0.25 * (1.25 + sID)}
          fontSize={boxHeight * 0.18}
          textAnchor="middle"
        >
          {s}
        </text>
      ))}
    </g>
  );
}
