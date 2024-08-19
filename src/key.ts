import { Engine, Rectangle, Scene, Sound, Sprite, SpriteEntity, SpritePainter } from 'game-engine';
import { Player } from './player.js';

export class Key extends SpriteEntity {

  constructor(x: number, y: number, public key: string) {
    super(new SpritePainter(Sprite.Sprites['key']), x, y);
    this.bounds = new Rectangle(x + 4, y + 2, 8, 12);
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {
    const player = scene.entitiesByType(Player)[0];
    if (player.collision(this)) {
      // Sound.Sounds['key'].play();
      scene.removeEntity(this);
    }
  }
}