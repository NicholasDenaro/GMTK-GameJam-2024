import { ControllerState, Engine, MouseDetails, PainterContext, Rectangle, Scene, SpriteEntity, SpritePainter } from 'game-engine';
import { collisionPoint } from './game.js';

export class Text extends SpriteEntity {
  private width: number;
  constructor(x: number, y: number, private text: string, private action: () => void, private size: number = 12, private center: boolean = true) {
    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d');
    ctx.font = `${size}px game`;
    const width = ctx.measureText(text).width;
    super(new SpritePainter(ctx => this.draw(ctx), {spriteWidth: width, spriteHeight: size}), x, y);
    this.width = width;
    if (center) {
      this.bounds = new Rectangle(x - width / 2, y - size / 2, width, size);
    } else {
      this.bounds = new Rectangle(x , y, width, size);
    }
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {
    if (engine.isControl('interact1', ControllerState.Press)) {
      const details = engine.controlDetails('interact1', scene.getView()) as MouseDetails;

      if (this.action && collisionPoint(this.bounds, details)) {
        this.action();
      }
    }
  }

  draw(ctx: PainterContext) {
    ctx.font = `${this.size}px game`;
    ctx.fillStyle = 'black';
    ctx.textBaseline = 'top';
    const x = this.x - (this.center ? this.width / 2 : 0);
    const y = this.y - (this.center ? this.size / 2 : 0);
    ctx.fillText(this.text, x, y);
  }
}