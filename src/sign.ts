import { Engine, PainterContext, Rectangle, Scene, Sprite, SpriteEntity, SpritePainter } from 'game-engine';
import { screenWidth } from './game.js';
import { Player } from './player.js';

export class Sign extends SpriteEntity {
  private fadeDirection: number = 0;
  private myPainter: SpritePainter;
  private textAlpha: number = 0;
  constructor(x: number, y: number, private text: string) {
    super(new SpritePainter(ctx => this.draw(ctx), {spriteWidth: screenWidth, spriteHeight: 48}), x, y);
    this.myPainter = new SpritePainter(Sprite.Sprites['sign']);
    this.myPainter.setEid(this.getId());

    this.bounds = new Rectangle(this.x - 8, this.y - 16, 16, 16);
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {
    const player = scene.entitiesByType(Player)[0];

    if (player.collision(this)) {
      this.fadeDirection = 1;
    } else {
      this.fadeDirection = -1;
    }

    if (this.fadeDirection > 0 && this.textAlpha < 1) {
      this.textAlpha += 0.125;
      if (this.textAlpha === 1) {
        this.fadeDirection = 0;
      }
    } else if (this.fadeDirection < 0 && this.textAlpha > 0) {
      this.textAlpha -= 0.125;
      if (this.textAlpha === 0) {
        this.fadeDirection = 0;
      }
    }
  }
  
  draw(ctx: PainterContext) {
    this.myPainter.paint(ctx);
    ctx.globalAlpha = this.textAlpha;
    ctx.textBaseline = 'bottom';
    ctx.fillText(this.text, this.x - ctx.measureText(this.text).width / 2, this.y - 16 - 4);
    ctx.globalAlpha = 1;
  }
}