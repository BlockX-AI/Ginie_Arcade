import Observer from '../src/utils/observer';

it(`adds new observer`, () => {
  const observer = new Observer();

  observer.subscribe('some name', () => null);
  observer.subscribe('action', () => null);

  expect(observer.getObservers().length).toBe(2);
});

it(`notifies observers`, () => {
  const observer = new Observer();
  const fn1 = jest.fn();
  const fn2 = jest.fn();

  observer.subscribe('some name', fn1);
  observer.subscribe('action', fn2);

  observer.notify('some name');
  observer.notify('action');
  observer.notify('action');

  expect(fn1).toHaveBeenCalledTimes(1);
  expect(fn2).toHaveBeenCalledTimes(2);
});
