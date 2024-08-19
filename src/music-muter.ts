import { Canvas2DView, ControllerState, Engine, MouseDetails, Scene, SpriteEntity } from 'game-engine';
import { ImageEntity } from './image-entity.js';
import { collisionPoint, isMuted, Music, mute, screenHeight, screenWidth, unmute } from './game.js';

export class MusicMuter extends ImageEntity {
  tick(engine: Engine, scene: Scene): Promise<void> | void {
    const view = scene.getView() as Canvas2DView;
    if (engine.isControl('interact1', ControllerState.Press)) {
      const details = engine.controlDetails('interact1', scene.getView()) as MouseDetails;
      details.y += view.getOffset().y;

      if (collisionPoint(this.bounds, details)) {
        if (isMuted()) {
          unmute();
        } else {
          mute();
        }
      }
    }

    if (isMuted()) {
      this.imageIndex = 1;
    } else {
      this.imageIndex = 0;
    }

    this.x = view.getOffset().x + screenWidth - 16;
    this.y = view.getOffset().y + screenHeight - 16;
    this.bounds.x = this.x;
    this.bounds.y = this.y;
  }
}