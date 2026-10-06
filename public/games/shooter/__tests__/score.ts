import { updateHiScore, updateScore } from '../src/score';

it(`allows to set 0`, () => {
  const scoreEl = document.createElement('div');

  updateScore(scoreEl, 0);

  expect(scoreEl.textContent).toEqual('0000');
});

describe(`hi score function`, () => {
  it(`sets value in case of new hi score`, () => {
    const hiScoreEl = document.createElement('div');

    localStorage.setItem('hi-score', String(20));
    updateHiScore(hiScoreEl, 21);

    expect(hiScoreEl.textContent).toEqual('0021');
  });

  it(`preserves hi score`, () => {
    const hiScoreEl = document.createElement('div');

    localStorage.setItem('hi-score', String(999));
    updateHiScore(hiScoreEl, 1);

    expect(hiScoreEl.textContent).toEqual('0999');
  });
});
