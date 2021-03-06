// These are helper functions that convert objects to the integers that the server expects and
// vice versa

// Imports
import Color from '../../Color';
import { CLUE_TYPE } from '../../constants';
import Suit from '../../Suit';
import Variant from '../../Variant';
import Clue from './Clue';
import MsgClue from './MsgClue';

// Convert a clue from the format used by the server to the format used by the client
// On the client, the color is a rich object
// On the server, the color is a simple integer mapping
export const msgClueToClue = (msgClue: MsgClue, variant: Variant) => {
  let clueValue;
  if (msgClue.type === CLUE_TYPE.COLOR) {
    clueValue = variant.clueColors[msgClue.value]; // This is a Color object
  } else if (msgClue.type === CLUE_TYPE.RANK) {
    clueValue = msgClue.value;
  } else {
    throw new Error('Unknown clue type given to the "msgClueToClue()" function.');
  }
  return new Clue(msgClue.type, clueValue);
};

export const msgSuitToSuit = (
  msgSuit: number,
  variant: Variant,
) => variant.suits[msgSuit] || null;

export const suitToMsgSuit = (
  suit: Suit,
  variant: Variant,
) => variant.suits.indexOf(suit);

export const msgColorToColor = (
  msgColor: number,
  variant: Variant,
) => variant.clueColors[msgColor] || null;

export const colorToMsgColor = (
  color: Color,
  variant: Variant,
) => variant.clueColors.findIndex(
  (variantColor) => variantColor === color,
);
