import { Engine, Entity, Scene, Sprite, SpriteEntity, SpritePainter } from 'game-engine';

export class ImageEntity extends SpriteEntity {
  constructor(sprite: Sprite, x: number, y: number) {
    super(new SpritePainter(sprite), x, y);
  }
  
  tick(engine: Engine, scene: Scene): Promise<void> | void {
  }
}