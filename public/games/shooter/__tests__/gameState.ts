import { GameState, GameStatus } from '../src/gameState';
import { IGameStateData } from '../src/main';
import { DEFAULT_SCORE, LIVES } from '../src/settings';

const initialGameState: IGameStateData = {
  gameStatus: GameStatus.initial,
  score: DEFAULT_SCORE,
  scoreChunk: DEFAULT_SCORE,
  scoreMultiplier: 1,
  lives: LIVES,
};

describe(`gameState`, () => {
  it(`should get default state`, () => {
    const gameState = new GameState(1, initialGameState);
    expect(gameState.get()).toEqual(initialGameState);
  });

  it(`should add new entry to the state`, () => {
    const gameState = new GameState(1, initialGameState);

    gameState.add({ score: 1 } as IGameStateData);
    expect(gameState.get()).toEqual({ ...initialGameState, score: 1 });
  });

  it(`should add new array entry to the state`, () => {
    const gameState = new GameState(1, [initialGameState]);
    const newState = {
      gameStatus: GameStatus.gameOver,
      score: 22,
      lives: 44,
      scoreChunk: 3,
      scoreMultiplier: 99,
    } as IGameStateData;

    gameState.add([newState]);
    expect(gameState.get()).toEqual([newState]);
  });

  it(`should return the latest entry`, () => {
    const gameState = new GameState(1, initialGameState);

    gameState.add({ score: 1 } as IGameStateData);
    gameState.add({ score: 55 } as IGameStateData);
    gameState.add({ score: 12 } as IGameStateData);

    expect(gameState.get()).toEqual({ ...initialGameState, score: 12 });
  });

  it(`should reset values`, () => {
    const gameState = new GameState(2, initialGameState);

    gameState.add({ score: 1 } as IGameStateData);
    gameState.add({ score: 55 } as IGameStateData);
    gameState.add({ score: 12 } as IGameStateData);
    gameState.reset();

    expect(gameState.values.length).toEqual(2);
    expect(gameState.get()).toEqual(initialGameState);
    expect(gameState.get(1)).toEqual(initialGameState);
  });

  it(`should handle pool overflow`, () => {
    const gameState = new GameState(2, initialGameState);

    gameState.add({ score: 1 } as IGameStateData);
    gameState.add({ score: 55 } as IGameStateData);
    gameState.add({ score: 12 } as IGameStateData);
    gameState.add({ score: 4 } as IGameStateData);

    expect(gameState.values.length).toBe(2);
    expect(gameState.get()).toEqual({ ...initialGameState, score: 4 });
  });

  it(`should mark used items`, () => {
    const gameState = new GameState(3, initialGameState);

    gameState.add({ score: 1 } as IGameStateData);
    gameState.add({ score: 55 } as IGameStateData);
    gameState.add({ score: 12 } as IGameStateData);
    gameState.add({ score: 4 } as IGameStateData);

    expect(gameState.values.length).toBe(3);
    expect(gameState.use()).toEqual({ ...initialGameState, score: 4 });
    expect(gameState.get()).toEqual({ ...initialGameState, score: 12 });

    gameState.add({ score: 66 } as IGameStateData);

    expect(gameState.use()).toEqual({ ...initialGameState, score: 66 });
  });

  it(`should mark selected used items`, () => {
    const gameState = new GameState(3, initialGameState);

    gameState.add({ score: 1 } as IGameStateData);
    gameState.add({ score: 55 } as IGameStateData);
    gameState.add({ score: 12 } as IGameStateData);
    gameState.add({ score: 4 } as IGameStateData);

    expect(gameState.values.length).toBe(3);
    expect(gameState.use(1)).toEqual({ ...initialGameState, score: 12 });
    expect(gameState.get()).toEqual({ ...initialGameState, score: 4 });

    gameState.add({ score: 66 } as IGameStateData);

    expect(gameState.use(1)).toEqual({ ...initialGameState, score: 4 });
  });

  it(`should return false in case useLatest all items have been used`, () => {
    const gameState = new GameState(2, initialGameState);

    gameState.add({ score: 1 } as IGameStateData);
    gameState.add({ score: 55 } as IGameStateData);

    gameState.use();
    gameState.use();

    expect(gameState.use()).toBe(false);
  });

  it(`should return the latest value even if all items have been used`, () => {
    const gameState = new GameState(3, initialGameState);

    gameState.add({ score: 1 } as IGameStateData);
    gameState.add({ score: 55 } as IGameStateData);
    gameState.add({ score: 11 } as IGameStateData);

    gameState.use();
    gameState.use();
    gameState.use();

    expect(gameState.get()).toEqual({ ...initialGameState, score: 1 });
  });

  it(`should return the value with given index`, () => {
    const gameState = new GameState(3, initialGameState);

    gameState.add({ score: 1 } as IGameStateData);
    gameState.add({ score: 55 } as IGameStateData);
    gameState.add({ score: 11 } as IGameStateData);

    gameState.use();
    gameState.use();
    gameState.use();

    expect(gameState.get(2)).toEqual({ ...initialGameState, score: 11 });
  });

  it(`should return the latest state in case requested index isn't available`, () => {
    const gameState = new GameState(3, initialGameState);
    expect(gameState.get(2)).toEqual(initialGameState);
  });

  it(`should update the latest state`, () => {
    const initialGameStateCopy = Object.assign({}, initialGameState);
    const gameState = new GameState(3, initialGameState);
    const newState = {
      score: 33,
    } as IGameStateData;

    gameState.replaceLatest(newState);

    expect(gameState.get()).toEqual(newState);
    expect(initialGameState).toEqual(initialGameStateCopy);

    gameState.add({ score: 55 } as IGameStateData);
    gameState.add({ score: 11 } as IGameStateData);

    gameState.replaceLatest(newState);

    expect(gameState.get()).toEqual(newState);
    expect(gameState.get(1)).toEqual({ ...initialGameState, score: 55 });
  });

  it(`should modify only selected item`, () => {
    const gameState = new GameState(2, initialGameState);

    const lastGameState = gameState.get() as IGameStateData;
    const prevGameState = gameState.get(1) as IGameStateData;

    lastGameState.gameStatus = GameStatus.gameOver;

    expect(prevGameState.gameStatus).toBe(GameStatus.initial);
  });

  describe(`align`, () => {
    it(`
    should align same properties in all states to selected value
    if at least one of the values matches the selected value
    for array of values
  `, () => {
      interface Item {
        a: number;
        b: number;
      }
      const initialGameState: Item[] = [
        {
          a: 1,
          b: 2,
        },
        {
          a: 33,
          b: 44,
        },
        {
          a: 22,
          b: 44,
        },
      ];

      const gameState = new GameState<Item[]>(44, initialGameState);
      const itemA = gameState.get(22);
      const itemC = gameState.get(10);

      itemA[0].a = 0;
      itemC[2].b = 11;

      gameState.align('a', 0);
      gameState.align('b', 11);

      const itemsA = gameState.values.map(value => value.data[0]);
      const itemsB = gameState.values.map(value => value.data[1]);
      const itemsC = gameState.values.map(value => value.data[2]);

      expect(itemsA.every((item: Item) => item.a === 0)).toBeTruthy();
      expect(
        itemsB.every((item: Item) => item.a === 33 && item.b === 44)
      ).toBeTruthy();
      expect(itemsC.every((item: Item) => item.b === 11)).toBeTruthy();
    });

    it(`
    should align same properties in all states to selected value
    if at least one of the values matches the selected value
    for objects
  `, () => {
      interface Item {
        a: number;
        b: number;
      }
      const initialGameState: Item = {
        a: 1,
        b: 2,
      };

      const gameState = new GameState(34, initialGameState);
      const itemA = gameState.get(22);

      itemA.b = -33;

      gameState.align('b', -33);

      const expected = gameState.values.every(value => {
        const data = value.data as Item;
        return data.b === -33;
      });

      expect(expected).toBeTruthy();
    });
  });
});
