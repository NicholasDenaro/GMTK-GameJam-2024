import { Engine, Rectangle, Scene, Sound, Sprite, SpriteEntity, SpritePainter } from "game-engine";
import { Player } from './player.js';

export class Button extends SpriteEntity {

  private pressed: boolean = false;
  constructor(bounds: Rectangle, public button: string) {
    super(new SpritePainter(Sprite.Sprites['button']), bounds.x, bounds.y);
    this.bounds = bounds;
    this.zIndex = -2;
  }

  tick(engine: Engine, scene: Scene): void | Promise<void> {
    if (!this.pressed) {
      const player = scene.entitiesByType(Player)[0];
      if (this.collision(player)) {
        if (player.isFalling()) {
          this.pressed = true;
          this.imageIndex = 1;
          Sound.Sounds['button'].play();
        }
      }
    }
  }

  isPressed() {
    return this.pressed;
  }
}