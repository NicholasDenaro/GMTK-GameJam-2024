import { ControllerState, Engine, MouseDetails, Scene, SpriteEntity } from 'game-engine';
import { ImageEntity } from './image-entity.js';
import { collisionPoint, Music } from './game.js';

export class MusicMuter extends ImageEntity {
  private mute: boolean = false;
  tick(engine: Engine, scene: Scene): Promise<void> | void {
    if (engine.isControl('interact1', ControllerState.Press)) {
      const details = engine.controlDetails('interact1', scene.getView()) as MouseDetails;

      if (collisionPoint(this.bounds, details)) {
        if (this.mute) {
          Music?.volume(1);
          this.mute = false;
          this.imageIndex = 0;
        } else {
          Music?.volume(0);
          this.mute = true;
          this.imageIndex = 1;
        }
      }
    }
  }
}