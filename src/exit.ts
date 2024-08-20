import { Engine, Scene, Sound, Sprite, SpriteEntity, SpritePainter } from 'game-engine';
import { Player } from './player.js';
import { distance, nextStage } from './game.js';

export class Exit extends SpriteEntity {
  constructor(x: number, y: number) {
    super(new SpritePainter(Sprite.Sprites['ladder']), x, y);
  }

  async tick(engine: Engine, scene: Scene): Promise<void> {
    const player = scene.entitiesByType(Player)[0];
    const playerPos = player.getPos();
    playerPos.y -= 4;
    if (distance(this.getPos(), playerPos) < 16) {
      Sound.Sounds['stage'].play();
      await nextStage();
    }
  }
  
}