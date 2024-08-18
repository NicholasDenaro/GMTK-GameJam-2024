import { Engine, Scene, Sprite, SpriteEntity, SpritePainter } from 'game-engine';
import { Player } from './player.js';
import { distance } from './game.js';

export class Saw extends SpriteEntity {
  private angle: number = 0;
  constructor(x: number, y: number) {
    super(new SpritePainter(Sprite.Sprites['saw']), x, y);
  }
  
  tick(engine: Engine, scene: Scene): Promise<void> | void {
    this.angle += Math.PI / 3;

    const player = scene.entitiesByType(Player)[0];
    const playerPos = player.getPos();
    playerPos.y -= 4;
    if (distance(this.getPos(), playerPos) < 16) {
      player.explode();
    }
  }

  spriteTransform(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): { undo: () => void; } {
    const width = Sprite.Sprites['saw'].getOptions().spriteWidth;
    const height = Sprite.Sprites['saw'].getOptions().spriteHeight;
    ctx.scale(1 / width, 1 / height);
    ctx.translate(width / 2, height / 2);
    ctx.rotate(this.angle);
    ctx.translate(-width / 2, -height / 2);
    ctx.scale(width, height);

    return {
      undo: () => {
        ctx.scale(1 / width, 1 / height);
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-this.angle);
        ctx.translate(-width / 2, -height / 2);
        ctx.scale(width, height);
      }
    }
  }
}