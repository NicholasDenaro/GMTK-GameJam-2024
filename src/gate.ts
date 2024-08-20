import { Engine, Rectangle, Scene, Sound, Sprite } from 'game-engine';
import { Solid } from './solid.js';
import { Key } from './key.js';
import { PlaySFX } from './game.js';

export class Gate extends Solid {
  constructor(bounds: Rectangle, private keys: string) {
    super(bounds, Sprite.Sprites['lock']);
    this.x = bounds.x;
    this.y = bounds.y;
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {
    const keys = scene.entitiesByType(Key).filter(key => key.key === this.keys);

    if (keys.length === 0) {
      PlaySFX('lock');
      scene.removeEntity(this);
    }
  }

}