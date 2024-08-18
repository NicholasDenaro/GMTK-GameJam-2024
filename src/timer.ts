import { Engine, Entity, Scene } from 'game-engine';

export class Timer extends Entity {
  constructor(private time: number, private action: () => void) {
    super({paint: () => {}});
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {
    this.time--;
    if (this.time <= 0) {
      scene.removeEntity(this);
      this.action();
    }
  }
}