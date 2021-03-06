// Imports
import Color from '../../Color';
import { ACTION, CLUE_TYPE } from '../../constants';
import * as arrows from './arrows';
import Clue from './Clue';
import ColorButton from './ColorButton';
import { colorToMsgColor, msgClueToClue } from './convert';
import globals from './globals';
import HanabiCard from './HanabiCard';
import MsgClue from './MsgClue';
import PlayerButton from './PlayerButton';
import RankButton from './RankButton';
import * as turn from './turn';

export const checkLegal = () => {
  let clueTargetButtonGroup;
  if (globals.hypothetical) {
    clueTargetButtonGroup = globals.elements.clueTargetButtonGroup2;
  } else {
    clueTargetButtonGroup = globals.elements.clueTargetButtonGroup;
  }
  const target = clueTargetButtonGroup!.getPressed() as PlayerButton;
  const { clueTypeButtonGroup } = globals.elements;
  const clueButton = clueTypeButtonGroup!.getPressed() as ColorButton | RankButton;

  if (
    !target // They have not selected a target player
    || !clueButton // They have not selected a clue type
  ) {
    globals.elements.giveClueButton!.setEnabled(false);
    return;
  }

  const who = (target as PlayerButton).targetIndex;
  if (who === globals.currentPlayerIndex) {
    // They are in a hypothetical and trying to give a clue to the current player
    globals.elements.giveClueButton!.setEnabled(false);
    return;
  }

  const touchedAtLeastOneCard = showClueMatch(who, clueButton.clue);

  // By default, only enable the "Give Clue" button if the clue "touched"
  // one or more cards in the hand
  const enabled = touchedAtLeastOneCard
        // Make an exception if they have the optional setting for "Empty Clues" turned on
        || globals.emptyClues
        // Make an exception for variants where color clues are always allowed
        || (globals.variant.colorCluesTouchNothing && clueButton.clue.type === CLUE_TYPE.COLOR)
        // Make an exception for variants where number clues are always allowed
        || (globals.variant.rankCluesTouchNothing && clueButton.clue.type === CLUE_TYPE.RANK)
        // Make an exception for certain characters
        || (globals.characterAssignments[globals.playerUs] === 'Blind Spot'
            && who === (globals.playerUs + 1) % globals.playerNames.length)
        || (globals.characterAssignments[globals.playerUs] === 'Oblivious'
            && who === (globals.playerUs - 1 + globals.playerNames.length)
            % globals.playerNames.length);

  globals.elements.giveClueButton!.setEnabled(enabled);
};

const showClueMatch = (target: number, clue: Clue) => {
  arrows.hideAll();

  let touchedAtLeastOneCard = false;
  const hand = globals.elements.playerHands[target].children;
  for (let i = 0; i < hand.length; i++) {
    const child = globals.elements.playerHands[target].children[i];
    const card = child.children[0];
    if (variantIsCardTouched(clue, card)) {
      touchedAtLeastOneCard = true;
      arrows.set(i, card, null, clue);
    }
  }

  return touchedAtLeastOneCard;
};

export const getTouchedCardsFromClue = (target: number, clue: MsgClue) => {
  const hand = globals.elements.playerHands[target];
  const cardsTouched: number[] = []; // An array of the card orders
  for (const child of hand.children.toArray()) {
    const card = child.children[0];
    if (variantIsCardTouched(msgClueToClue(clue, globals.variant), card)) {
      cardsTouched.push(card.order);
    }
  }

  return cardsTouched;
};

// This mirrors the function in "variants.go"
const variantIsCardTouched = (clue: Clue, card: HanabiCard) => {
  // Some detrimental characters are not able to see other people's hands
  if (card.suit === null) {
    return false;
  }

  if (clue.type === CLUE_TYPE.COLOR) {
    if (globals.variant.colorCluesTouchNothing) {
      return false;
    }

    if (card.suit.allClueColors) {
      return true;
    }
    if (card.suit.noClueColors) {
      return false;
    }

    if (
    // Checking for "Rainbow-" also checks for "Muddy-Rainbow-"
      (globals.variant.name.includes('Rainbow-Ones') && card.rank === 1)
      || (globals.variant.name.includes('Omni-Ones') && card.rank === 1)
      || (globals.variant.name.includes('Rainbow-Fives') && card.rank === 5)
      || (globals.variant.name.includes('Omni-Fives') && card.rank === 5)
    ) {
      return true;
    }
    if (
      (globals.variant.name.includes('White-Ones') && card.rank === 1)
      || (globals.variant.name.includes('Null-Ones') && card.rank === 1)
      || (globals.variant.name.includes('Light-Pink-Ones') && card.rank === 1)
      || (globals.variant.name.includes('White-Fives') && card.rank === 5)
      || (globals.variant.name.includes('Null-Fives') && card.rank === 5)
      || (globals.variant.name.includes('Light-Pink-Fives') && card.rank === 5)
    ) {
      return false;
    }

    return card.suit.clueColors.includes(clue.value as Color);
  }

  if (clue.type === CLUE_TYPE.RANK) {
    if (globals.variant.rankCluesTouchNothing) {
      return false;
    }

    if (card.suit.allClueRanks) {
      return true;
    }
    if (card.suit.noClueRanks) {
      return false;
    }

    if (
    // Checking for "Pink-" also checks for "Light-Pink-"
      (globals.variant.name.includes('Pink-Ones') && card.rank === 1)
      || (globals.variant.name.includes('Omni-Ones') && card.rank === 1)
      || (globals.variant.name.includes('Pink-Fives') && card.rank === 5)
      || (globals.variant.name.includes('Omni-Fives') && card.rank === 5)
    ) {
      return true;
    }
    if (
      (globals.variant.name.includes('Brown-Ones') && card.rank === 1)
      || (globals.variant.name.includes('Null-Ones') && card.rank === 1)
      || (globals.variant.name.includes('Muddy-Rainbow-Ones') && card.rank === 1)
      || (globals.variant.name.includes('Brown-Fives') && card.rank === 5)
      || (globals.variant.name.includes('Null-Fives') && card.rank === 5)
      || (globals.variant.name.includes('Muddy-Rainbow-Fives') && card.rank === 5)
    ) {
      return false;
    }

    return clue.value === card.rank;
  }

  return false;
};

export const give = () => {
  let clueTargetButtonGroup;
  if (globals.hypothetical) {
    clueTargetButtonGroup = globals.elements.clueTargetButtonGroup2;
  } else {
    clueTargetButtonGroup = globals.elements.clueTargetButtonGroup;
  }
  const target = clueTargetButtonGroup!.getPressed() as PlayerButton;
  const { clueTypeButtonGroup } = globals.elements;
  const clueButton = clueTypeButtonGroup!.getPressed() as ColorButton | RankButton;
  if (
    (!globals.ourTurn && !globals.hypothetical) // We can only give clues on our turn
    || globals.clues === 0 // We can only give a clue if there is one available
    || !target // We might have not selected a clue recipient
    || !clueButton // We might have not selected a type of clue
    // We might be trying to give an invalid clue (e.g. an Empty Clue)
    || !globals.elements.giveClueButton!.enabled
    // Prevent the user from accidentally giving a clue
    || (Date.now() - globals.UIClickTime < 1000)
  ) {
    return;
  }

  let type: number;
  let value: number;
  if (clueButton.clue.type === CLUE_TYPE.COLOR) {
    type = ACTION.COLOR_CLUE;
    value = colorToMsgColor((clueButton.clue.value as Color), globals.variant);
  } else if (clueButton.clue.type === CLUE_TYPE.RANK) {
    type = ACTION.RANK_CLUE;
    value = (clueButton.clue.value as number);
  } else {
    throw new Error('The clue button has an invalid clue type.');
  }

  // Send the message to the server
  turn.end({
    type,
    target: target.targetIndex,
    value,
  });
};
