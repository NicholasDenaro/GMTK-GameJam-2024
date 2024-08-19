import { Engine, Scene, Sound, Sprite, SpriteEntity, SpritePainter } from 'game-engine';
import { Player } from './player.js';
import { clamp, distance } from './game.js';

const SAW_RADIUS = 10;

export class Saw extends SpriteEntity {

  private playSawSound: number = 0;
  private angle: number = 0;
  constructor(x: number, y: number) {
    super(new SpritePainter(Sprite.Sprites['saw']), x, y);
  }
  
  tick(engine: Engine, scene: Scene): Promise<void> | void {
    this.angle += Math.PI / 3;
    this.playSawSound--;

    const player = scene.entitiesByType(Player)[0];
    if (this.checkCollisionWithPlayer(player)) {
      player.explode();
      if (this.playSawSound < 0) {
        Sound.Sounds['slime-saw'].play();
        this.playSawSound = 120;
      }
    }
  }

  checkCollisionWithPlayer(player: Player): boolean {
    const cx = clamp(this.x, player.bounds.x, player.bounds.x + player.bounds.width);
    const cy = clamp(this.y, player.bounds.y, player.bounds.y + player.bounds.height);

    return Math.sqrt((this.x - cx) ** 2 + (this.y - cy) ** 2) < SAW_RADIUS;
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