import { Engine, Entity, Scene, Sprite, SpriteEntity, SpritePainter, UIPainter } from "game-engine";
import { screenHeight, screenWidth } from './game.js';
import { Player } from './player.js';

export class Food extends SpriteEntity {
  public eaten = false;

  constructor(x: number, y: number) {
    super(new UIPainter(Sprite.Sprites['food']), x, y);
  }

  tick(engine: Engine, scene: Scene): void | Promise<void> {
    this.x += Math.random() * 0.5 - 0.25;
    this.y += Math.random() * 0.5 - 0.25;
  }

  eat() {
    this.eaten = true;
  }
}