import { Engine, Scene, Sprite, SpriteEntity, SpritePainter } from 'game-engine';
import { clamp } from './game.js';
import { Player } from './player.js';
import { DialogWindow } from './dialog-window.js';

const ORB_RADIUS = 6;

export class Orb extends SpriteEntity {
  constructor(x: number, y: number, private text: string) {
    super(new SpritePainter(Sprite.Sprites['orb']), x, y);
  }
  
  tick(engine: Engine, scene: Scene): Promise<void> | void {
    const player = scene.entitiesByType(Player)[0];
    if (this.checkCollisionWithPlayer(player) && scene.entitiesByType(DialogWindow).length === 0) {
      scene.addEntity(new DialogWindow(this.text));
    }
  }

  checkCollisionWithPlayer(player: Player): boolean {
    const cx = clamp(this.x, player.bounds.x, player.bounds.x + player.bounds.width);
    const cy = clamp(this.y, player.bounds.y, player.bounds.y + player.bounds.height);

    return Math.sqrt((this.x - cx) ** 2 + (this.y - cy) ** 2) < ORB_RADIUS;
  }
}