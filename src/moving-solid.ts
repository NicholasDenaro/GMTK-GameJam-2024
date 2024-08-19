import { Engine, PainterContext, Rectangle, Scene, Sprite } from 'game-engine';
import { Solid } from './solid.js';
import { Player } from './player.js';
import { Button } from './button.js';

const VELOCITY_DELAY = 6;

export class MovingSolid extends Solid {
  private forwards: boolean = true;
  private sectionIndex: number = 0;
  private step: number = 0;
  private delayTimer: number = 0;

  public xVelocity: number = 0;
  public yVelocity: number = 0;
  public velocityDelay: number = 0;
  constructor(bounds: Rectangle, private path: {x: number, y: number}[], private steps: number, private delay: number = 0, private launch: boolean = false, private button: string = undefined) {
    super(bounds, Sprite.Sprites['movingblock']);
    this.color = 'darkred';
    this.x = path[0].x;
    this.y = path[0].y;
    this.bounds.x = this.x;
    this.bounds.y = this.y;

    this.zIndex = -3;

    this.scaleX = this.bounds.width / 16;
    this.scaleY = this.bounds.height / 16;
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {

    if (this.button) {
      const buttons = scene.entitiesByType(Button).filter(button => button.button === this.button);

      if (!buttons.every(button => button.isPressed())) {
        return;
      }
    }

    if (this.delayTimer > 0) {
      this.delayTimer--;
      this.velocityDelay--;
      if (this.velocityDelay < 0) {
        this.yVelocity = 0;
        this.xVelocity = 0;
      }
      return;
    }

    this.step++;

    if (this.step > this.steps) {
      if (this.forwards) {
        this.sectionIndex++;
      } else {
        this.sectionIndex--;
      }
      this.delayTimer = this.delay;
      this.step = 0;
      if (this.sectionIndex === this.path.length - 1) {
        this.forwards = false;
      }
      if (this.sectionIndex === 0) {
        this.forwards = true;
      }

      if (this.launch) {
        const player = scene.entitiesByType(Player)[0];
        if (player.onSolid([this])) {
          player.launch(this.xVelocity, this.yVelocity);
        }
      }
    }

    if (this.delayTimer > 0) {
      this.velocityDelay = VELOCITY_DELAY;
      return;
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
    const solidsNotThis = solids.filter(solid => solid !== this);

    if (player.onSolid([this])) {
      player.moveDelta(dx, dy);
      if (player.inSolid(solids)) {
        player.moveDelta(-dx, -dy);

        player.moveDelta(dx, 0);
        if (player.inSolid(solids)) {
          player.moveDelta(-dx, 0);
        }

        player.moveDelta(0, dy);
        const inSolid = player.inSolid(solidsNotThis);
        if (inSolid) {
          console.log('in solid up/down');
          console.log(inSolid);
          if (dy < 0) {
            console.log('in solid up');
            // crush on top
            player.scaleDown(solidsNotThis);
            if (player.inSolid(solidsNotThis)) {
              // crush?
              console.log('CRUSHING UP');
              player.explode();
            }
          }
        }
      }
    }

    const playerOnPlatform = player.onSolid([this], 3)
    this.yVelocity = dy;
    this.xVelocity = dx;

    this.x += dx;
    this.bounds.x = this.x;

    if (player.inSolid([this]) && !playerOnPlatform) {
      // LEFT/RIGHT
      player.moveDelta(dx, 0);
      if (player.inSolid(solidsNotThis)) {
        player.moveDelta(-dx, 0);

        // slide to wall
        let ddx = Math.abs(dx);
        while (ddx > 0) {
          const change = Math.min(ddx, 1);
          ddx -= change;
          player.scaleUp([]);
          player.moveDelta(change * Math.sign(dx), 0);
          if (player.inSolid(solidsNotThis)) {
            player.moveDelta(change * -Math.sign(dx), 0);
            if (!player.scaleUp([])) {
              //console.log('CRUSHED LEFT/RIGHT');
              player.explode();
              break;
            }
          }
        }
      }
    }

    this.y += dy;
    this.bounds.y = this.y;

    if (player.inSolid([this])) {
      // DOWN
      if (dy > 0) {
        player.moveDelta(0, dy);
        if (player.inSolid(solidsNotThis)) {
          player.moveDelta(0, -dy);

          // move player down to ground
          let ddy = Math.abs(dy);
          while (ddy > 0) {
            const change = Math.min(ddy, 1);
            ddy -= change;
            player.moveDelta(0, change);
            const inSolid = player.inSolid(solidsNotThis);
            if (inSolid) {
              player.snapToSolid(inSolid);
              console.log(`player squished into ground`);
              console.log(player.bounds);
              break;
            }
          }

          let scaleOp: boolean = true;
          // now squish the player
          while (player.inSolid([this]) && (scaleOp = player.scaleDown(solidsNotThis))) {
          }

          if (!scaleOp) {
            player.explode();
          }

          // // slide to wall
          // let ddy = Math.abs(dy);
          // while (ddy > 0) {
          //   const change = Math.min(ddy, 1);
          //   ddy -= change;
          //   if (player.scaleDown([])) {
          //     if (player.inSolid(solidsNotThis)) {
          //       player.scaleUp([]);
          //       if (player.scaleDown(solidsNotThis)) {
          //       } else {
          //         player.explode();
          //         break;
          //       }
          //     }
          //   } else {
          //     player.explode();
          //     break;
          //   }
            

          //   // player.moveDelta(0, change * Math.sign(dy));
          //   // if (player.inSolid(solidsNotThis)) {
          //   //   player.moveDelta(0, change * -Math.sign(dy));
          //   //   if (!player.scaleDown([])) {
          //   //     //console.log('CRUSHED DOWN');
          //   //     player.explode();
          //   //     break;
          //   //   }
          //   // }
          // }
        }
      }
    }


    // if (player.inSolid([this])) {
    //   // push player?
    //   player.moveDelta(dx, 0);
    //   if (player.inSolid([this])) {
    //     console.log()
    //   }
    //   if (player.inSolid(solids)) {
    //     player.moveDelta(-dx / 2, 0);
    //     // player.scaleUp(solids);
    //     for (let i = 0; i < Math.abs(dx); i++) {
    //       console.log('scaling up');
    //       player.scaleUp(solids.filter(solid => solid !== this));
    //     }
    //     if (player.inSolid(solids.filter(solid => solid !== this))) {
    //       player.moveDelta(-dx / 2, 0);
    //       // crush?
    //       console.log('CRUSHING LEFT/RIGHT');
    //     }
    //   }

    //   player.moveDelta(0, dy);
    //   if (player.inSolid(solids.filter(solid => solid !== this))) {
    //     player.moveDelta(0, -dy);
    //     for (let i = 0; i < dy; i++) {
    //       player.scaleDown(solids.filter(solid => solid !== this));
    //     }
    //     if (player.inSolid(solids.filter(solid => solid !== this))) {
    //       // crush?
    //       console.log('CRUSHING DOWN');
    //     }
    //   }
    // }
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