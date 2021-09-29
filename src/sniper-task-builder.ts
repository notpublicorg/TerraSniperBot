import { SniperTask } from './sniper-task';

class SniperTaskBuilder {
  private task: SniperTask = {
    contract: 'token contract',
    conditions: [{ denom: 'uluna', greaterOrEqual: '100', buy: '10' }],
    maxTokenPrice: '25',
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
