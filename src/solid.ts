import { Engine, PainterContext, Rectangle, Scene, SpriteEntity, SpritePainter } from 'game-engine';

export class Solid extends SpriteEntity {
  protected color: string = 'black';
  constructor(bounds: Rectangle) {
    super(new SpritePainter((ctx) => this.draw(ctx), {spriteWidth: bounds.width, spriteHeight: bounds.height}));
    this.bounds = bounds;
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {
  }

  protected draw(ctx: PainterContext) {
    ctx.fillStyle = this.color;
    ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
  }
}