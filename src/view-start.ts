import { Engine, Entity, Scene } from 'game-engine';

export class ViewStart extends Entity {
  constructor ( public x: number, public y: number) {
    super({paint: () => {}});
  }
  
  tick(engine: Engine, scene: Scene): Promise<void> | void {
  }
}