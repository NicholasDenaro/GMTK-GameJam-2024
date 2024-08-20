import { Canvas2DView, ControllerState, Engine, PainterContext, Scene, SpriteEntity, SpritePainter } from 'game-engine';
import { nextStage, screenHeight, screenWidth } from './game.js';

export class DialogWindow extends SpriteEntity {
  private delay = 120;
  constructor(private text: string) {
    super(new SpritePainter(ctx => this.draw(ctx), {spriteWidth: screenWidth, spriteHeight: screenHeight}));
    this.zIndex = -20;
  }

  async tick(engine: Engine, scene: Scene): Promise<void> {
    const view = scene.getView() as Canvas2DView;
    this.x = view.getOffset().x;
    this.y = view.getOffset().y;
    this.delay--;
    if (this.delay <= 0) {
      if (engine.isControl('action', ControllerState.Press)) {
        await nextStage();
      }
    }
  }
  
  draw(ctx: PainterContext) {

    ctx.fillStyle = 'black';
    ctx.fillRect(this.x + screenWidth / 4, this.y + screenHeight / 4, screenWidth / 2, screenHeight / 2);
    ctx.font = '14px game';
    ctx.textBaseline = 'bottom';
    const lines = this.text.split('|');

    const baseX = this.x + screenWidth / 2;
    const baseY = this.y + screenHeight / 4 + 32 - 8;

    for (let i = 0; i < lines.length; i++) {
      const text = lines[i];
      ctx.strokeStyle = 'black';
      ctx.strokeText(text, baseX - ctx.measureText(text).width / 2, baseY + 16 * i);
      ctx.fillStyle = 'white';
      ctx.fillText(text, baseX - ctx.measureText(text).width / 2, baseY + 16 * i);
    }

    if (this.delay <= 0) {
      ctx.font = '10px game';
      ctx.fillText('Press X/Space to continue', baseX - ctx.measureText('Press X/Space to continue').width / 2, baseY + 8 + 16 * 4);
    }
  }
}