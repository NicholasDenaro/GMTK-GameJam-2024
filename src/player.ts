import { Scene, Sound, Sprite, SpriteEntity, SpritePainter, ControllerState, Engine, MouseDetails } from "game-engine";
import { clamp, distance, screenHeight, screenWidth } from './game.js';
import { Food } from './food.js';

export class Player extends SpriteEntity {
  private angle: number = 0;
  private target: Food = null;
  private eatenCount = 0;
  private state: 'waiting' | 'target' | 'rotate' | 'rotate' | 'move' = 'waiting';
  private stateTime = 0;
  private rotateSign: number;
  private hunger = 0;
  constructor(x: number, y: number, angle: number = 0) {
    super(new SpritePainter(Sprite.Sprites['bacteria']), x, y);
    this.angle = angle || (Math.random() * Math.PI * 2);
  }

  tick(engine: Engine, scene: Scene): Promise<void> | void {
    if (engine.isControl('button1', ControllerState.Press)) {
      Sound.Sounds['start']?.play();
    }
    const foods = scene.entitiesByType(Food);
    if (this.target && foods.indexOf(this.target) == -1) {
      this.target = null;
      this.state = 'waiting';
    }

    this.chooseState(foods);

    if (this.hunger > 100) {
      scene.removeEntity(this);
    }

    this.stateTime--;
    if (this.stateTime === 0 || this.state === 'waiting') {
      this.nextState();
    }
    
    if (this.state === 'rotate') {
      this.hunger += 0.1;
      this.angle += 0.1 * this.rotateSign;
    } else if (this.state === 'move') {
      this.hunger += 0.2;
      this.x += Math.cos(this.angle);
      this.y += Math.sin(this.angle);
    } else if (this.state === 'target') {
      this.stateTime = 1;
      const direction = (this.direction(this.target) + Math.PI * 2) % (Math.PI * 2);
      const diff = this.angle - direction;

      let sign = -Math.sign(diff);
      if (Math.abs(diff) > Math.PI) {
        if (diff < 0) {
          this.angle -= 0.1;
        } else {
          this.angle += 0.1;
        }
      } else if (Math.abs(diff) > 0.1) {
        this.angle += 0.1 * sign;
      } else {
        this.x += Math.cos(this.angle);
        this.y += Math.sin(this.angle);

        if (this.collision(this.target) && !this.target.eaten) {
          this.target.eat();
          this.eatenCount++;
          scene.removeEntity(this.target);
          this.hunger = clamp(0, this.hunger - 20, 100);
        }
      }
    }

    if (this.eatenCount > 5) {
      const rand = Math.random() * 0.2 - 0.1;
      scene.addEntity(new Player(this.x + Math.cos(this.angle) * 40, this.y + Math.sin(this.angle) * 40, this.angle + rand));
      this.eatenCount = 0;
    }

    this.angle = (this.angle + Math.PI * 2) % (Math.PI * 2);
    this.x += Math.random() * 0.5 - 0.25;
    this.y += Math.random() * 0.5 - 0.25;
  }

  chooseState(foods: Food[]) {
    if (!this.target) {
      for (let food of foods) {
        if (distance(this, food) < 50) {
          this.target = food;
          this.state = 'target';
          return;
        }
      }
    }
  }

  nextState() {
    switch(this.state) {
      case 'move':
        this.state = 'rotate';
        this.rotateSign = (Math.random() < 0.5) ? -1 : 1;
        this.stateTime = 2 + Math.floor(8 * Math.random());
        break;
      case 'rotate':
        this.state = 'move';
        this.stateTime = 2 + Math.floor(20 * Math.random());
        break;
      case 'waiting':
        this.state = 'move';
        this.stateTime = 2 + Math.floor(8 * Math.random());
        break;
    }
  }

  spriteTransform(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): { undo: () => void; } {
    const width = Sprite.Sprites['bacteria'].getOptions().spriteWidth;
    const height = Sprite.Sprites['bacteria'].getOptions().spriteHeight;
    ctx.scale(1 / width, 1 / height);
    ctx.translate(width / 2, height / 2);
    ctx.rotate(this.angle);
    ctx.translate(-width / 2, -height / 2);
    ctx.scale(width, height);

    return {
      undo: () => {
        ctx.scale(1 / width, 1 / height);
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-this.angle);
        ctx.translate(-width / 2, -height / 2);
        ctx.scale(width, height);
      }
    }
  }
}