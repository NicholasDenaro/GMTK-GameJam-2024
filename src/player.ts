import { Scene, Sound, Sprite, SpriteEntity, SpritePainter, ControllerState, Engine, Rectangle, PainterContext, Canvas2DView } from "game-engine";
import { Solid } from './solid.js';
import { clamp, SaveData, screenHeight, screenWidth } from './game.js';
import { Platform } from './platform.js';
import { MovingSolid } from './moving-solid.js';
import { DialogWindow } from './dialog-window.js';

const COYOTE_TIME = 6;
const JUMP_TIME = 6; //5; //5;
const GRAVITY = 0.2; //0.3; //0.5;
const REJUMP_GRACE = 4;
const JUMP_SPEED = -2; //-3; //-4;
const JUMP_FLOAT_SPEED = -0.2; //-0.4;// -0.6;
const MAX_HORIZONTAL = 1.3; //1.5;
const FRICTION = 0.28;
const HORIZONTAL_PUSH = 0.5;

type AnimationData = {
  start: number;
  end: number;
  animationDuration: number;
  nextAnimation?: Animation;
}

const _animations = {
  stand: { start: 0, end: 0, animationDuration: 10 },
  walk: { start: 0, end: 1, animationDuration: 10 },
  jump: { start: 4, end: 6, animationDuration: 10 },
  land: { start: 8, end: 11, animationDuration: 3, nextAnimation: 'stand' },
  explode: { start: 12, end: 15, animationDuration: 5 },
} as const;

const animations: Record<string, AnimationData> = _animations;

type Animation = keyof typeof _animations;

export const playerAbilities = {
  unSquish: false,
  squishDown: false,
  squishUp: false,
  slowFall: false,
  highJump: false,
}

export class Player extends SpriteEntity {

  private moveSound: {stop: () => void};
  private inAirLastFrame: boolean = false;
  private resetSpawn: boolean = false;
  private spawnX: number;
  private spawnY: number;
  private exploding: boolean = false;
  public viewOffsetY = 0;
  private viewScrollDirection: number = 0;
  private scrollTime: number = 0;

  private myPainter: SpritePainter;
  private coyoteTime = COYOTE_TIME;
  private coyotePlatform: MovingSolid;
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

  private justSpawned: boolean;

  constructor(x: number, y: number) {
    super(new SpritePainter((ctx: PainterContext) => this.draw(ctx), Sprite.Sprites['slime'].getOptions()), x, y);
    this.myPainter = new SpritePainter(Sprite.Sprites['slime']);
    this.myPainter.setEid(this.getId());
    this.bottomLeft = new Rectangle(Math.round(this.x - 5), Math.round(this.y - 1), 5, 1);
    this.bottomRight = new Rectangle(Math.round(this.x), Math.round(this.y - 1), 5, 1);
    this.topLeft = new Rectangle(Math.round(this.x - 5), Math.round(this.y - 8), 1, 8);
    this.topRight = new Rectangle(Math.round(this.x + 5), Math.round(this.y - 8), 1, 8);

    this.zIndex = -10;
    this.bounds = new Rectangle(this.x - 6, this.y - 12, 12, 12);

    this.spawnX = x;
    this.spawnY = y;

    this.justSpawned = true;
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {

    if (SaveData.colorblind) {
      this.myPainter.setSprite(Sprite.Sprites['slime-colorblind']);
    } else {
      this.myPainter.setSprite(Sprite.Sprites['slime']);
    }

    if (this.justSpawned) {
      this.justSpawned = false;
      const solids = scene.entitiesByType(Solid);
      let inSolid;
      while (inSolid = this.inSolid(solids)) {
        if (this.x > inSolid.bounds.x) {
          this.moveDelta(1, 0)
        } else {
          this.moveDelta(-1, 0);
        }
      }
    }

    if (!this.exploding && engine.isControl('reset', ControllerState.Down) && this.viewScrollDirection === 0) {
      this.explode();
    }

    if (scene.entitiesByType(DialogWindow).length > 0) {
      this.moveSound?.stop();
      this.moveSound = null;
      return;
    }

    this.inAirLastFrame = false;
    if (this.exploding) {
    } else {

      if (engine.isControl('button1', ControllerState.Press)) {
        Sound.Sounds['start']?.play();
      }

      const solids = scene.entitiesByType(Solid);
      const platforms = scene.entitiesByType(Platform);
      const movingSolids = scene.entitiesByType(MovingSolid);

      const moveLeft = this.moveLeft(engine);
      const moveRight = this.moveRight(engine);
      const move = moveLeft || moveRight;

      for (let i = 0; i < this.xVelocity; i++) {
        const toMove = clamp(0, this.xVelocity - i, 1);
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
        this.moveDelta(toMove, 0);
        if (this.checkCollisions(solids)) {
          this.moveDelta(-toMove, 0);
          // TODO: bump up to wall
          this.xVelocity = 0;
          break;
        }
      }

      // if (this.onGround(solids, platforms)) {
      //   if (this.xVelocity > 0) {
      //     this.xVelocity -= clamp(0, this.xVelocity, FRICTION);
      //   } else if (this.xVelocity < 0) {
      //     this.xVelocity += clamp(0, -this.xVelocity, FRICTION);
      //   }
      // }

      if (this.onGround(solids, platforms)) {
        if (this.xVelocity > 0) {
          this.xVelocity -= clamp(0, FRICTION * (Math.abs(this.xVelocity) ** 0.5), Math.abs(this.xVelocity));
        } else if (this.xVelocity < 0) {
          this.xVelocity += clamp(0, FRICTION * (Math.abs(this.xVelocity) ** 0.5), Math.abs(this.xVelocity));
        }
      } else if (!engine.isControl('left', ControllerState.Down) && !engine.isControl('right', ControllerState.Down)) {
        // apply friction in air if let go of movement
        if (this.xVelocity > 0) {
          this.xVelocity -= clamp(0, FRICTION * 0.2 * (Math.abs(this.xVelocity) ** 0.5), Math.abs(this.xVelocity));
        } else if (this.xVelocity < 0) {
          this.xVelocity += clamp(0, FRICTION * 0.2 * (Math.abs(this.xVelocity) ** 0.5), Math.abs(this.xVelocity));
        }
      }

      if (move && this.onGround(solids, platforms)) {
        if (this.animation !== 'land') {
          this.setAnimation('walk');
        }
      } else if (this.onGround(solids, platforms)) {
        if (this.animation !== 'land') {
          this.setAnimation('stand');
        }
      }

      this.fall(solids, platforms);

      this.yVelocity = clamp(-10, this.yVelocity, 10);

      // move down
      let dy = this.yVelocity;
      for (let i = 0; i < this.yVelocity; i++) {
        const change = clamp(0, dy, 1);
        dy -= change;
        this.moveDelta(0, change);
        const collision = this.checkCollisions(solids);
        const collisionBottom = this.checkBottomCollisions(platforms);
        const onGround = this.onSolid([...solids, ...platforms]);
        const collided = collision ?? collisionBottom ?? onGround;
        if (collided) {
          this.moveDelta(0, -change);
          //this.moveDelta(0, collided.bounds.y - this.y - 1);
          this.snapToSolid(collided);
          this.yVelocity = 0;
          this.setAnimation('land');
          Sound.Sounds['slime-land'].play();
          // console.log(`landed on ground`);
          // console.log(this.bounds);
          // console.log(this.y);
          break;
        }
      }

      const onGround = this.onGround(solids, platforms);
      const onPlatform = this.onSolid(platforms);
      const onMovingSolid = this.onSolid(movingSolids);
      this.coyotePlatform = onMovingSolid ?? this.coyotePlatform;

      if (this.checkBottomCollisions(platforms) && this.yVelocity >= 0 && !onMovingSolid) {
        // move to top of platform
        const platform = platforms.find(platform => this.checkBottomCollisions([platform]));
        this.moveDelta(0, this.y - platform.bounds.y);
      }

      if (onGround) {
        this.coyoteTime = COYOTE_TIME;
        this.jumps = this.maxJumps;

        if (this.resetSpawn) {
          this.spawnX = this.x;
          this.spawnY = this.y;
          this.resetSpawn = false;
        }

        if (move) {
          if (!this.moveSound) {
            this.moveSound = Sound.Sounds['slime-move'].play();
          }
        } else {
          if (this.moveSound) {
            this.moveSound.stop();
            this.moveSound = null;
          }
        }
      } else {
        this.moveSound?.stop();
        this.moveSound = null;
      }

      const scaleUp = playerAbilities.squishUp && this.doScaleUp(engine, solids);
      const scaleDown = playerAbilities.squishDown && this.doScaleDown(engine, solids);

      if (!scaleUp && !scaleDown) {
        if (playerAbilities.unSquish) {
          this.scaleBack(engine, solids);
        }
      }

      this.rejumpTime--;

      if ((engine.isControl('action', ControllerState.Press) || (this.rejump && this.rejumpTime > 0))) {
        if (engine.isControl('down', ControllerState.Down) && (onPlatform && !this.onSolid(solids))) {
          this.jumps--;
          this.yVelocity += GRAVITY;
          this.moveDelta(0, onPlatform.bounds.height);
        } else {
          if (this.jumps > 0 && (onGround || onMovingSolid || this.coyoteTime > 0)) {
            this.yVelocity = JUMP_SPEED;
            this.jump = true;
            this.jumps--;
            this.setAnimation('jump');
            Sound.Sounds['slime-jump'].play();
            const platformKick = onGround ? onMovingSolid : this.coyotePlatform;
            if (platformKick) {
              this.xVelocity += platformKick.xVelocity;
              this.yVelocity += platformKick.yVelocity;
              this.coyotePlatform = null;
              if (platformKick.yVelocity < -0.5) {
                Sound.Sounds['spring'].play();
              }
            }
          } else if (!this.rejump) {
            this.rejumpTime = REJUMP_GRACE;
            this.rejump = true;
          }
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

      // move up
      for (let i = 0; i > this.yVelocity; i--) {
        this.moveDelta(0, -1);
        if (this.checkCollisions(solids)) {
          this.moveDelta(0, 1);
          this.yVelocity = 0;
          break;
        }
      }
    }

    this.animationTime--;
    if (this.animationTime <= 0) {
      this.animationIndex++;

      if (this.animationIndex === (animations[this.animation].end - animations[this.animation].start) && animations[this.animation].nextAnimation) {
        this.setAnimation(animations[this.animation].nextAnimation);
      }

      this.animationTime = animations[this.animation].animationDuration;

      if (this.animation === 'explode') {
        scene.removeEntity(this);
        const player = new Player(this.spawnX, this.spawnY);
        scene.addEntity(player);
        player.viewOffsetY = this.viewOffsetY;
        player.viewScrollDirection = this.viewScrollDirection;
        player.scrollTime = this.scrollTime;
        return;
      }
    }

    this.updateBounds();
    
    this.imageIndex = animations[this.animation].start + (this.animationIndex % (animations[this.animation].end - animations[this.animation].start + 1));

    const view = scene.getView() as Canvas2DView;

    // view.setOffset(clamp(0, this.x - screenWidth / 2, 1000), clamp(0, this.y - screenHeight / 2, 1000));

    view.setOffset(0, this.viewOffsetY);
    if (this.y > view.getOffset().y + screenHeight && this.viewScrollDirection === 0) {
      console.log(`y: ${this.y}, view.y: ${view.getOffset().y}, view.y+H: ${view.getOffset().y + screenHeight}`);
      this.viewScrollDirection = 1;
      this.scrollTime = screenHeight / 8;
      this.resetSpawn = true;
    } else if (this.y < view.getOffset().y && this.viewScrollDirection === 0) {
      this.viewScrollDirection = -1;
      this.scrollTime = screenHeight / 8;
      this.resetSpawn = true;
    }

    if (this.viewScrollDirection !== 0) {
      this.viewOffsetY += this.viewScrollDirection * 8;
      this.scrollTime--;
      if (this.scrollTime === 0) {
        this.viewScrollDirection = 0;
      }
    }

    view.setOffset(0, this.viewOffsetY);
  }

  public snapToSolid(solid: Solid | Platform) {
    this.moveDelta(0, solid.bounds.y - this.y - 1);

    // nudge to integer
    if (Math.abs(Math.round(this.bounds.height) - this.bounds.height) < 0.00001) {
      this.topLeft.y += Math.round(this.bounds.height) - this.bounds.height;
      this.topRight.y += Math.round(this.bounds.height) - this.bounds.height;
    }

    //console.log('snap to solid');
  }

  private updateBounds() {
    this.bounds.x = this.topLeft.x;
    this.bounds.y = this.topLeft.y;
    this.bounds.width = this.topRight.x - this.topLeft.x;
    this.bounds.height = this.bottomLeft.y - this.topLeft.y;
  }

  public launch(dxVelocity: number, dyVelocity: number) {
    this.xVelocity += dxVelocity;
    this.yVelocity += dyVelocity;
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

  public scaleUp(solids: Solid[]): boolean {
    if (this.scaleY < 1.8) {
      this.scaleX -= 0.1;
      this.scaleY += 0.1;
      console.log(`scale: ${this.scaleX}, ${this.scaleY}`);

      this.topLeft.x += 0.5;
      this.bottomLeft.x += 0.5;
      this.topRight.x -= 0.5;
      this.bottomRight.x -= 0.5;

      this.topLeft.y -= 1;
      this.topRight.y -= 1;

      this.topLeft.height += 1;
      this.topRight.height += 1;

      this.bottomLeft.width -= 0.5;
      this.bottomRight.x += 0.5;
      this.bottomRight.width -= 0.5;

      if (this.checkCollisions(solids)) {
        this.scaleX += 0.1;
        this.scaleY -= 0.1;
        this.topLeft.x -= 0.5;
        this.bottomLeft.x -= 0.5;
        this.topRight.x += 0.5;
        this.bottomRight.x += 0.5;

        this.topLeft.y += 1;
        this.topRight.y += 1;

        this.topLeft.height -= 1;
        this.topRight.height -= 1;

        this.bottomLeft.width += 0.5;
        this.bottomRight.x -= 0.5;
        this.bottomRight.width += 0.5;
        return false;
      }

      this.updateBounds();
      console.log(this.bounds);
      return true;
    }

    return false;
  }

  public scaleDown(solids: Solid[], retry: boolean = true): boolean {
    if (this.scaleX < 1.8) {
      this.scaleX += 0.1;
      this.scaleY -= 0.1;
      console.log(`scale: ${this.scaleX}, ${this.scaleY}`);
      console.log(this.bounds);

      this.topLeft.x -= 0.5;
      this.bottomLeft.x -= 0.5;
      this.topRight.x += 0.5;
      this.bottomRight.x += 0.5;

      this.topLeft.y += 1;
      this.topRight.y += 1;

      this.topLeft.height -= 1;
      this.topRight.height -= 1;

      this.bottomLeft.width += 0.5;
      this.bottomRight.x -= 0.5;
      this.bottomRight.width += 0.5;

      if (this.checkCollisions(solids)) {
        this.scaleX -= 0.1;
        this.scaleY += 0.1;
        this.topLeft.x += 0.5;
        this.bottomLeft.x += 0.5;
        this.topRight.x -= 0.5;
        this.bottomRight.x -= 0.5;

        this.topLeft.y -= 1;
        this.topRight.y -= 1;

        this.topLeft.height += 1;
        this.topRight.height += 1;

        this.bottomLeft.width -= 0.5;
        this.bottomRight.x += 0.5;
        this.bottomRight.width -= 0.5;

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
      if (this.xVelocity > -MAX_HORIZONTAL) {
        this.xVelocity -= HORIZONTAL_PUSH;
        if (!this.jump) {
          this.xVelocity = clamp(-MAX_HORIZONTAL, this.xVelocity, MAX_HORIZONTAL);
        }
      }
      this.flipHorizontal = true;
      return true;
    }
    return false;
  }

  private moveRight(engine: Engine): boolean {
    if (engine.isControl('right', ControllerState.Down)) {
      if (this.xVelocity < MAX_HORIZONTAL) {
        this.xVelocity += HORIZONTAL_PUSH;
        if (!this.jump) {
          this.xVelocity = clamp(-MAX_HORIZONTAL, this.xVelocity, MAX_HORIZONTAL);
        }
      }
      this.flipHorizontal = false;
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

  public moveDelta(dx: number, dy: number) {
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

    this.updateBounds();
  }

  public explode() {
    this.setAnimation('explode');
    this.exploding = true;
    this.moveSound?.stop();
  }

  public isFalling() {
    return this.yVelocity > 0 || this.inAirLastFrame;
  }

  private fall(solids: Solid[], platforms: Platform[]): void {
    if (!this.onGround(solids, platforms)) {
      this.inAirLastFrame = true;
      // air friction
      let airFriction = clamp(-0.2, this.scaleX - 1, 1) * GRAVITY * 0.9 * Math.sign(this.yVelocity); // good

      if (this.yVelocity > 0 && this.scaleX > 1) {
        airFriction = clamp(0, airFriction + this.scaleX - 1, GRAVITY * 0.9);
      }

      // let airFriction = 0;
      // if (this.scaleX >= 1) {
      //   airFriction = clamp(0, this.scaleX - 1, 1) * GRAVITY * 0.9 * Math.sign(this.yVelocity);
      // } else {
      //   airFriction = clamp(-0.2, -0.2 + (1 - this.scaleX) * 0.2, 0) * GRAVITY * 0.9 * -Math.sign(this.yVelocity);
      // }

      this.yVelocity += GRAVITY - airFriction;
      this.coyoteTime--;
      if (this.coyoteTime <= 0) {
        this.coyotePlatform = null;
      }
    } else {
      this.yVelocity = 0;
    }
  }

  private onGround(solids: Solid[], platforms: Platform[]): boolean {
    const onGround = this.onSolid(solids);
    const onPlatform = this.onSolid(platforms);
    return !!onGround || !!onPlatform;
  }

  public inSolid(solids: Solid[]): Solid {
    const inSolid = this.checkCollisions(solids);
    return inSolid;
  }

  public topInSolid(solids: Solid[]): Solid {
    const inSolid = this.checkTopCollisions(solids);
    return inSolid;
  }

  public bottomInSolid(solids: Solid[]): Solid {
    const inSolid = this.checkBottomCollisions(solids);
    return inSolid;
  }

  public onSolid<T extends SpriteEntity>(platforms: T[], amount: number = 1): T {
    amount += Number.EPSILON * 100000;
    if (this.yVelocity >= 0) {
      this.moveDelta(0, amount);
      const onGround = this.checkBottomCollisions(platforms);
      this.moveDelta(0, -amount);

      return onGround;
    }



    return null;
  }

  private checkCollisions(solids: Solid[]): Solid {
    return solids.find(solid => 
      solid.bounds.intersects(this.bottomLeft)
      || solid.bounds.intersects(this.bottomRight)
      || solid.bounds.intersects(this.topLeft)
      || solid.bounds.intersects(this.topRight));
  }

  private checkBottomCollisions<T extends SpriteEntity>(solids: T[]): T {
    return solids.find(solid => solid.bounds.intersects(this.bottomLeft) || solid.bounds.intersects(this.bottomRight));
  }

  private checkTopCollisions<T extends SpriteEntity>(solids: T[]): T {
    return solids.find(solid => solid.bounds.intersects(this.topLeft) || solid.bounds.intersects(this.topRight));
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

    // ctx.fillStyle = 'green';
    // ctx.fillRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);

    // ctx.fillStyle = 'lightblue';
    // ctx.fillRect(this.topLeft.x, this.topLeft.y, this.topLeft.width, this.topLeft.height);
    // ctx.fillStyle = 'pink';
    // ctx.fillRect(this.topRight.x, this.topRight.y, this.topRight.width, this.topRight.height);

    // ctx.fillStyle = 'blue';
    // ctx.fillRect(this.bottomLeft.x, this.bottomLeft.y, this.bottomLeft.width, this.bottomLeft.height);
    // ctx.fillStyle = 'purple';
    // ctx.fillRect(this.bottomRight.x, this.bottomRight.y, this.bottomRight.width, this.bottomRight.height);
  }

  override spriteTransform(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): { undo: () => void; } {
    ctx.save();
    // ctx.transform(
    //   (this.flipHorizontal ? -1 : 1) * this.scaleX, 0,
    //   0, 1 * this.scaleY,
      
    //   0, 0);
    ctx.transform(this.flipHorizontal ? -this.scaleX : this.scaleX, 0, 0, this.flipVertical ? -this.scaleY : this.scaleY, this.flipHorizontal ? this.scaleX : 0, this.flipVertical ? this.scaleY : 0);

    return {
      undo: () => {
        ctx.restore();
      }
    }
  }
}