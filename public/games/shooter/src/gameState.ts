const LAST = -1;

export enum GameStatus {
  initial,
  game,
  gameOver,
  autoRewind,
}

export interface IGameStateValue<T> {
  order: number;
  data: T;
}

export class GameState<T> {
  public values: Array<IGameStateValue<T | T[]>> = [];
  private counter = 0;

  constructor(private poolSize: number, private initialGameState: T | T[]) {
    this.reset();
  }

  public add(newData: T | T[]) {
    this.counter += 1;

    if (this.poolSize === this.values.length) {
      const prevValue = this.values[this.values.length - 1];
      const { data } = prevValue;

      if (this.isArrayType(data) && this.isArrayType(newData)) {
        data.forEach((item, index) => {
          Object.assign(item, newData[index]);
        });
      } else {
        Object.assign(data, newData);
      }
      prevValue.order = this.counter;

      this.values.sort((valA, valB) => valB.order - valA.order);
    } else {
      const newValue = {
        order: this.counter,
        data: newData,
      };

      this.values.unshift(newValue);
    }
  }

  public get(index = 0) {
    const value = this.values[index];

    if (!value) {
      return this.values[0].data as T;
    }

    return value.data as T;
  }

  public use(index = 0) {
    const value = this.values[index] ? this.values[index] : this.values[0];

    if (value.order === -1) {
      return false;
    }

    value.order = LAST;
    this.values.sort((valA, valB) => valB.order - valA.order);

    return value.data as T;
  }

  public replaceLatest(data: T) {
    this.values[0].data = data;
  }

  public reset() {
    this.counter = 0;
    this.values = [];

    for (let i = 0; i < this.poolSize; i += 1) {
      this.values.push({
        order: LAST,
        data: this.createInitialData(this.initialGameState),
      });
    }
  }

  public align(keyName: string, alignValue: any) {
    const { values } = this;
    const isArrays = values.some(value => this.isArrayType(value.data));

    if (isArrays) {
      const matchedItemIndexes = new Set();

      values.forEach(value => {
        const { data } = value;

        if (!this.isArrayType(data)) {
          return;
        }

        data.forEach((item: { [key: string]: any }, index) => {
          const itemValue = item[keyName];

          if (itemValue === alignValue) {
            matchedItemIndexes.add(index);
          }
        });
      });

      values.forEach(value => {
        const { data } = value;

        if (!this.isArrayType(data)) {
          return;
        }

        matchedItemIndexes.forEach(index => {
          const item = data[index] as { [key: string]: any };
          item[keyName] = alignValue;
        });
      });
    } else {
      const isAlignValuePresent = values.some(value => {
        const item = value.data as { [key: string]: any };
        return item[keyName] === alignValue;
      });

      if (isAlignValuePresent) {
        values.forEach(value => {
          const item = value.data as { [key: string]: any };
          item[keyName] = alignValue;
        });
      }
    }
  }

  private isArrayType(data: T | T[]): data is T[] {
    return Array.isArray(data as T);
  }

  private createInitialData(data: T | T[]) {
    if (this.isArrayType(data)) {
      return data.map((item, index) => {
        return Object.assign({}, item, data[index]) as T;
      });
    }

    return Object.assign({}, data) as T;
  }
}
