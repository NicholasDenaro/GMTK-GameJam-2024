import { Engine, PainterContext, Rectangle, Scene, SpriteEntity, SpritePainter } from 'game-engine';
import { Geometry } from './geometry.js';

export class Platform extends SpriteEntity implements Geometry {
  constructor(bounds: Rectangle) {
    super(new SpritePainter((ctx) => this.draw(ctx), {spriteWidth: bounds.width, spriteHeight: bounds.height}));
    this.bounds = bounds;
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {
  }

  private draw(ctx: PainterContext) {
    ctx.fillStyle = 'grey';
    ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
  }
}