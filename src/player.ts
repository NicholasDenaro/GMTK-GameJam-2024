import { Scene, Sound, Sprite, SpriteEntity, SpritePainter, ControllerState, Engine, Rectangle, PainterContext, Canvas2DView } from "game-engine";
import { Solid } from './solid.js';
import { clamp, screenHeight, screenWidth } from './game.js';

const COYOTE_TIME = 10;
const JUMP_TIME = 10;
const GRAVITY = 0.7;
const REJUMP_GRACE = 4;
const JUMP_SPEED = -4;
const JUMP_FLOAT_SPEED = -0.6;
const MAX_HORIZONTAL = 1.5;
const FRICTION = 0.28;
const HORIZONTAL_PUSH = 0.5;

type AnimationData = {
  start: number;
  end: number;
  animationDuration: number;
  nextAnimation?: Animation;
}

const animations: { [key: string]: AnimationData } = {
  stand: { start: 0, end: 0, animationDuration: 10 },
  walk: { start: 0, end: 1, animationDuration: 10 },
  jump: { start: 4, end: 6, animationDuration: 10 },
  land: { start: 8, end: 11, animationDuration: 3, nextAnimation: 'stand' },
};

type Animation = keyof typeof animations;

export class Player extends SpriteEntity {
  private myPainter: SpritePainter;
  private coyoteTime = COYOTE_TIME;
  private bottomLeft: Rectangle;
  private bottomRight: Rectangle;
  private topLeft: Rectangle;
  private topRight: Rectangle;

  private xVelocity: number = 0;
  private yVelocity: number = 0;

  private maxJumps: number = 1;
  private jumps: number = 1;

  private jumpingTime = JUMP_TIME;
  private jump = false;
  private rejumpTime = REJUMP_GRACE;
  private rejump = false;

  private animation: Animation = 'stand';
  private animationTime = 10;
  private animationIndex: number = 0;

  constructor(x: number, y: number) {
    super(new SpritePainter((ctx: PainterContext) => this.draw(ctx), Sprite.Sprites['slime'].getOptions()), x, y);
    this.myPainter = new SpritePainter(Sprite.Sprites['slime']);
    this.myPainter.setEid(this.getId());
    this.bottomLeft = new Rectangle(this.x - 5, this.y - 1, 1, 1);
    this.bottomRight = new Rectangle(this.x + 5, this.y - 1, 1, 1);
    this.topLeft = new Rectangle(this.x - 5, this.y - 8, 1, 1);
    this.topRight = new Rectangle(this.x + 5, this.y - 8, 1, 1);

    this.zIndex = -1;
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {
    if (engine.isControl('button1', ControllerState.Press)) {
      Sound.Sounds['start']?.play();
    }

    const solids = scene.entitiesByType(Solid);

    const moveLeft = this.moveLeft(engine);
    const moveRight = this.moveRight(engine);
    const move = moveLeft || moveRight;

    this.xVelocity = clamp(-MAX_HORIZONTAL, this.xVelocity, MAX_HORIZONTAL);

    let xVelocityUsed = 0;
    for (let i = 0; i < this.xVelocity; i++) {
      const toMove = clamp(0, this.xVelocity - i, 1);
      //xVelocityUsed += toMove;
      this.moveDelta(toMove, 0);
      if (this.checkCollisions(solids)) {
        this.moveDelta(-toMove, 0);
        // TODO: bump up to wall
        this.xVelocity = 0;
        break;
      }
    }

    for (let i = 0; i > this.xVelocity; i--) {
      const toMove = clamp(-1, this.xVelocity - i, 0);
      //xVelocityUsed += toMove;
      this.moveDelta(toMove, 0);
      if (this.checkCollisions(solids)) {
        this.moveDelta(-toMove, 0);
        // TODO: bump up to wall
        this.xVelocity = 0;
        break;
      }
    }

    // const xVelocityDiff = this.xVelocity - xVelocityUsed;
    // this.moveDelta(xVelocityDiff, 0);
    // if (this.checkCollisions(solids)) {
    //   const wall = solids.find(solid => this.checkCollisions([solid]));
    //   this.moveDelta(-xVelocityDiff, 0);
    //   this.xVelocity = 0;
    //   if (xVelocityDiff < 0) {
    //     this.moveDelta(this.x - (wall.bounds.x + wall.bounds.width), 0);
    //   }
    //   if (xVelocityDiff > 0) {
    //     this.moveDelta(this.x + this.bottomRight.x + 1 - wall.bounds.x, 0);
    //   }
    // }
    

    if (this.onGround(solids)) {
      if (this.xVelocity > 0) {
        this.xVelocity -= clamp(0, this.xVelocity, FRICTION);
      } else if (this.xVelocity < 0) {
        this.xVelocity += clamp(0, -this.xVelocity, FRICTION);
      }
    }

    if (move && this.onGround(solids)) {
      if (this.animation !== 'land') {
        this.setAnimation('walk');
      }
    } else if (this.onGround(solids)) {
      if (this.animation !== 'land') {
        this.setAnimation('stand');
      }
    }

    this.fall(solids);

    this.yVelocity = clamp(-10, this.yVelocity, 10);

    for (let i = 0; i < this.yVelocity; i++) {
      this.moveDelta(0, 1);
      if (this.checkCollisions(solids)) {
        this.moveDelta(0, -1);
        this.yVelocity = 0;
        this.setAnimation('land');
        break;
      }
    }

    const onGround = this.onGround(solids);

    if (onGround) {
      this.coyoteTime = COYOTE_TIME;
      this.jumps = this.maxJumps;
    }

    const scaleUp = this.doScaleUp(engine, solids);
    const scaleDown = this.doScaleDown(engine, solids);

    if (!scaleUp && !scaleDown) {
      this.scaleBack(engine, solids);
    }

    this.rejumpTime--;

    if ((engine.isControl('action', ControllerState.Press) || (this.rejump && this.rejumpTime > 0))) {
      if (this.jumps > 0 && (onGround || this.coyoteTime > 0)) {
        this.yVelocity = JUMP_SPEED;
        this.jump = true;
        this.jumps--;
        this.setAnimation('jump');
      } else if (!this.rejump) {
        this.rejumpTime = REJUMP_GRACE;
        this.rejump = true;
      }
    }

    if (this.jump) {
      if (engine.isControl('action', ControllerState.Down) && this.jumpingTime > 0) {
        this.yVelocity += JUMP_FLOAT_SPEED;
        this.jumpingTime--;
      } else {
        this.jump = false;
        this.jumpingTime = JUMP_TIME;
      }
    }

    if (this.jumpingTime <= 0) {
      this.jump = false;
      this.jumpingTime = JUMP_TIME;
    }

    for (let i = 0; i > this.yVelocity; i--) {
      this.moveDelta(0, -1);
      if (this.checkCollisions(solids)) {
        this.moveDelta(0, 1);
        this.yVelocity = 0;
        break;
      }
    }

    this.animationTime--;
    if (this.animationTime <= 0) {
      this.animationIndex++;

      if (this.animationIndex === (animations[this.animation].end - animations[this.animation].start) && animations[this.animation].nextAnimation) {
        this.setAnimation(animations[this.animation].nextAnimation);
      }

      this.animationTime = animations[this.animation].animationDuration;
    }
    
    this.imageIndex = animations[this.animation].start + (this.animationIndex % (animations[this.animation].end - animations[this.animation].start + 1));

    const view = scene.getView() as Canvas2DView;

    view.setOffset(clamp(0, this.x - screenWidth / 2, 1000), clamp(0, this.y - screenHeight / 2, 1000));
  }

  private scaleBack(engine: Engine, solids: Solid[]): boolean {
    if (engine.isControl('down', ControllerState.Up) && engine.isControl('up', ControllerState.Up)) {
      let scaled = false;
      if (this.scaleX < 1) {
        scaled ||= this.scaleDown(solids);
      } else if (this.scaleX > 1) {
        scaled ||= this.scaleUp(solids);
      }
      if (this.scaleX < 1) {
        scaled ||= this.scaleDown(solids);
      } else if (this.scaleX > 1) {
        scaled ||= this.scaleUp(solids);
      }
      return scaled;
    }

    return false;
  }

  private doScaleDown(engine: Engine, solids: Solid[]): boolean {
    if (engine.isControl('down', ControllerState.Down)) {
      this.scaleDown(solids);
      return true;
    }

    return false;
  }

  private doScaleUp(engine: Engine, solids: Solid[]): boolean {
    if (engine.isControl('up', ControllerState.Down)) {
      this.scaleUp(solids);
      return true;
    }

    return false;
  }

  private scaleUp(solids: Solid[]): boolean {
    if (this.scaleY < 1.8) {
      this.scaleX -= 0.1;
      this.scaleY += 0.1;

      this.topLeft.x += 0.5;
      this.bottomLeft.x += 0.5;
      this.topRight.x -= 0.5;
      this.bottomRight.x -= 0.5;

      this.topLeft.y -= 1;
      this.topRight.y -= 1;

      if (this.checkCollisions(solids)) {
        this.scaleX += 0.1;
        this.scaleY -= 0.1;
        this.topLeft.x -= 0.5;
        this.bottomLeft.x -= 0.5;
        this.topRight.x += 0.5;
        this.bottomRight.x += 0.5;

        this.topLeft.y += 1;
        this.topRight.y += 1;
        return false;
      }
      return true;
    }

    return false;
  }

  private scaleDown(solids: Solid[], retry: boolean = true): boolean {
    if (this.scaleX < 1.6) {
      this.scaleX += 0.1;
      this.scaleY -= 0.1;
      this.topLeft.x -= 0.5;
      this.bottomLeft.x -= 0.5;
      this.topRight.x += 0.5;
      this.bottomRight.x += 0.5;

      this.topLeft.y += 1;
      this.topRight.y += 1;

      if (this.checkCollisions(solids)) {
        this.scaleX -= 0.1;
        this.scaleY += 0.1;
        this.topLeft.x += 0.5;
        this.bottomLeft.x += 0.5;
        this.topRight.x -= 0.5;
        this.bottomRight.x -= 0.5;

        this.topLeft.y -= 1;
        this.topRight.y -= 1;

        if (retry) {
          // try again, but shift left
          this.moveDelta(-0.5, 0);
          if (this.scaleDown(solids, false)) {
            return true;
          } else {
            this.moveDelta(0.5, 0);
            // try again, but shift right
            this.moveDelta(0.5, 0);
            if (this.scaleDown(solids, false)) {
              return true;
            } else {
              this.moveDelta(-0.5, 0);
              return false;
            }
          }
        }
        return false;
      }
      return true;
    }

    return false;
  }

  private moveLeft(engine: Engine): boolean {
    if (engine.isControl('left', ControllerState.Down)) {
      this.xVelocity -= HORIZONTAL_PUSH;
      return true;
    }
    return false;
  }

  private moveRight(engine: Engine): boolean {
    if (engine.isControl('right', ControllerState.Down)) {
      this.xVelocity += HORIZONTAL_PUSH;
      return true;
    }
    return false;
  }

  private setAnimation(key: Animation) {
    if (this.animation !== key) {
      this.animation = key;
      this.animationTime = animations[key].animationDuration;
      this.animationIndex = 0;
    }
  }

  private moveDelta(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
    this.topLeft.x += dx;
    this.topLeft.y += dy;
    this.topRight.x += dx;
    this.topRight.y += dy;
    this.bottomLeft.x += dx;
    this.bottomLeft.y += dy;
    this.bottomRight.x += dx;
    this.bottomRight.y += dy;
  }

  private fall(solids: Solid[]): void {
    if (!this.onGround(solids)) {
      this.yVelocity += GRAVITY;
      this.coyoteTime--;
    } else {
      this.yVelocity = 0;
      // this.moveDelta(0, 1);
      // const floor = solids.find(solid => this.checkCollisions([solid]));
      // const floorPos = floor.bounds;
      // this.moveDelta(0, -1);
      // this.moveDelta(0, floorPos.y - this.y - 1);
    }
  }

  private onGround(solids: Solid[]): boolean {
    this.moveDelta(0, 1);
    const onGround = this.checkCollisions(solids);
    this.moveDelta(0, -1);
    return onGround;
  }

  private checkCollisions(solids: Solid[]): boolean {
    return solids.some(solid => 
      solid.bounds.intersects(this.bottomLeft)
      || solid.bounds.intersects(this.bottomRight)
      || solid.bounds.intersects(this.topLeft)
      || solid.bounds.intersects(this.topRight));
  }

  private draw(ctx: PainterContext) {
    // TODO: jank hack. Fix how scaling works with sprite offsets in engine
    const startY = this.y;
    const startX = this.x;
    const changeY = 1 - this.scaleY;
    const changeX = 1 - this.scaleX;
    this.y += changeY * 16;
    this.x += changeX * 8;
    this.myPainter.paint(ctx);

    this.y = startY;
    this.x = startX;
  }
}