import { Engine, PainterContext, Rectangle, Scene } from 'game-engine';
import { Solid } from './solid.js';
import { Player } from './player.js';

export class MovingSolid extends Solid {
  private forwards: boolean = true;
  private sectionIndex: number = 0;
  private step: number = 0;
  constructor(bounds: Rectangle, private path: {x: number, y: number}[], private steps: number) {
    super(bounds);
    this.color = 'darkred';
    this.x = path[0].x;
    this.y = path[0].y;
    this.bounds.x = this.x;
    this.bounds.y = this.y;
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {
    this.step++;

    if (this.step > this.steps) {
      if (this.forwards) {
        this.sectionIndex++;
      } else {
        this.sectionIndex--;
      }
      this.step = 0;
      if (this.sectionIndex === this.path.length - 1) {
        this.forwards = false;
      }
      if (this.sectionIndex === 0) {
        this.forwards = true;
      }
    }

    if (this.forwards) {
      const sectionStart = this.path[this.sectionIndex];
      const sectionEnd = this.path[this.sectionIndex + 1];
      const t = this.step / this.steps;

      const x = sectionStart.x * (1 - t) + sectionEnd.x * (t);
      const y = sectionStart.y * (1 - t) + sectionEnd.y * (t);
      this.moveDelta(scene, x - this.x, y - this.y);
    } else {
      const sectionStart = this.path[this.sectionIndex];
      const sectionEnd = this.path[this.sectionIndex - 1];
      const t = this.step / this.steps;

      const x = sectionStart.x * (1 - t) + sectionEnd.x * (t);
      const y = sectionStart.y * (1 - t) + sectionEnd.y * (t);
      this.moveDelta(scene, x - this.x, y - this.y);
    }
  }

  private moveDelta(scene: Scene, dx: number, dy: number) {
    const player = scene.entitiesByType(Player)[0];
    const solids = scene.entitiesByType(Solid);

    if (player.onSolid([this])) {
      player.moveDelta(dx, dy);
      if (player.inSolid(solids)) {
        player.moveDelta(-dx, -dy);

        player.moveDelta(dx, 0);
        if (player.inSolid(solids)) {
          player.moveDelta(-dx, 0);
        }

        player.moveDelta(0, dy);
        if (player.inSolid(solids)) {
          if (dy < 0) {
            // crush on top
            player.scaleDown(solids);
            if (player.inSolid(solids)) {
              // crush?
              console.log('CRUSHING UP');
            }
          }
        }
      }
    }

    this.x += dx;
    this.y += dy;
    this.bounds.x = this.x;
    this.bounds.y = this.y;

    if (player.inSolid([this])) {
      // push player?
      player.moveDelta(dx, 0);
      if (player.inSolid(solids)) {
        player.moveDelta(-dx / 2, 0);
        player.scaleUp(solids);
        if (player.inSolid(solids)) {
          player.moveDelta(-dx / 2, 0);
          // crush?
          console.log('CRUSHING LEFT/RIGHT');
        }
      }

      player.moveDelta(0, dy);
      if (player.inSolid(solids)) {
        player.moveDelta(0, -dy);
        player.scaleDown(solids);
        if (player.inSolid(solids)) {
          // crush?
          console.log('CRUSHING DOWN');
        }
      }
    }
  }

  protected draw(ctx: PainterContext) {
    ctx.beginPath();
    ctx.strokeStyle = 'crimson';
    ctx.setLineDash([5, 5]);
    ctx.moveTo(this.path[0].x, this.path[0].y);
    for (let i = 1; i < this.path.length; i++) {
      ctx.lineTo(this.path[i].x, this.path[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    for (let i = 0; i < this.path.length; i++) {
      ctx.beginPath();
      ctx.fillStyle = 'black';
      ctx.arc(this.path[i].x, this.path[i].y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    super.draw(ctx);
  }
}