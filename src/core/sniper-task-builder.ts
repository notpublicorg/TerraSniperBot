import { SniperTask } from './sniper-task';

class SniperTaskBuilder {
  private task: SniperTask = {
    tokenContract: 'token contract',
    conditions: [{ currency: 'uluna', greaterOrEqual: '100', buy: '10' }],
    maxTokenPrice: '25',
    maxSpread: '1',
    id: 'default',
    status: 'active',
  };

  with<Prop extends keyof SniperTask>(prop: Prop, value: SniperTask[Prop]) {
    this.task[prop] = value;
    return this;
  }

  build(): SniperTask {
    return this.task;
  }
}

export const aSniperTask = () => new SniperTaskBuilder();
