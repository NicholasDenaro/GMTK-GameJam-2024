import { Engine, Rectangle, Scene, Sprite, SpriteEntity, SpritePainter } from 'game-engine';

export class ImageEntity extends SpriteEntity {
  constructor(sprite: Sprite, x: number, y: number) {
    super(new SpritePainter(sprite), x, y);
    this.bounds = new Rectangle(x, y, sprite.getOptions().spriteWidth, sprite.getOptions().spriteHeight);
  }
  
  tick(engine: Engine, scene: Scene): Promise<void> | void {
  }
}