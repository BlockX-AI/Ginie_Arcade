import { range } from 'lodash';

const isLocalStorage = checkIfLocalStorageAvailable();

export function updateScore(scoreEl: Element | null, score: number) {
  if (scoreEl) {
    scoreEl.textContent = _formatScore(score);
  }
}

export function updateHiScore(hiScoreEl: Element | null, score: number) {
  const DEFAULT_HI_SCORE = '0000';
  const HI_SCORE_KEY = 'hi-score';
  const scoreString = isLocalStorage
    ? String(localStorage.getItem(HI_SCORE_KEY))
    : DEFAULT_HI_SCORE;
  const hiScore = parseInt(scoreString, 10) || 0;

  if (isLocalStorage && hiScore < score) {
    localStorage.setItem(HI_SCORE_KEY, String(score));
    updateElement(hiScoreEl, score);
  } else {
    updateElement(hiScoreEl, hiScore);
  }
}

function updateElement(hiScoreEl: Element | null, score: number) {
  if (hiScoreEl) {
    hiScoreEl.textContent = _formatScore(score);
  }
}

function _formatScore(score: number) {
  const MAX_WIDTH = 4;
  const scoreString = String(score);
  const zeros = range(MAX_WIDTH - scoreString.length)
    .map(() => 0)
    .join('');

  return zeros + scoreString;
}

function checkIfLocalStorageAvailable() {
  const LS_TEST_NAME = 'ls-test';

  try {
    localStorage.setItem(LS_TEST_NAME, LS_TEST_NAME);
    localStorage.removeItem(LS_TEST_NAME);
    return true;
  } catch (e) {
    return false;
  }
}
