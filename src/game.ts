import { Canvas2DView, ControllerBinding, Engine, FixedTickEngine, GamepadController, KeyboardController, Scene, MouseController, Sprite, Sound, ControllerState, SpriteEntity } from 'game-engine';
import { Player } from './player.js';
import { Food } from './food.js';

export const screenWidth = 1920;
export const screenHeight = 1080;
const scale = 1;
export const FPS = 60;

declare global {
  interface Window { steam: {
    send: (data: any) => void;
    receive: ((data: any) => void)
   }
  }
}

window.steam?.receive((data: any) => {
  console.log(`got data: ${data}`);
});

setTimeout(() => {
  window.steam?.send('name');
}, 2000);

const engine: Engine = new FixedTickEngine(FPS, true);

export const spriteAssets = require.context('../assets/', true, /\.png$/);
const wavAssets = require.context('../assets/', true, /\.ogg$/);

if (wavAssets('./premade/outputs/GAME_MENU_SCORE_SFX001416.ogg')) {
  new Sound('start', wavAssets('./premade/outputs/GAME_MENU_SCORE_SFX001416.ogg'));
}

new Sprite('bacteria', spriteAssets('./bacteria.png'), { spriteWidth: 80, spriteHeight: 32, spriteOffsetX: 40, spriteOffsetY: 16 });
new Sprite('food', spriteAssets('./food.png'), { spriteWidth: 8, spriteHeight: 8 });

async function init() {

  await Sprite.waitForLoad();

  await Sound.waitForLoad();

  engine.addController(new KeyboardController(keyMap));
  engine.addController(new MouseController(mouseMap));
  engine.addController(new GamepadController(gamepadMap));

  const view = new Canvas2DView(screenWidth, screenHeight, { scale: scale, bgColor: '#BBBBBB' });
  const scene = new Scene('main', view);
  const scenePause = new Scene('pause', view);

  engine.addScene(scene);
  engine.addScene(scenePause);

  engine.addActionPre('move-view', () => {
    const offset = view.getOffset();
    let dx = 0;
    let dy = 0;
    if (engine.isControl('left', ControllerState.Down)) {
      dx -= 1;
    }
    if (engine.isControl('right', ControllerState.Down)) {
      dx += 1;
    }
    if (engine.isControl('up', ControllerState.Down)) {
      dy -= 1;
    }
    if (engine.isControl('down', ControllerState.Down)) {
      dy += 1;
    }
    view.setOffset(offset.x + dx, offset.y + dy);

    if (engine.isControl('action', ControllerState.Down)) {
      (view as any).scale -= 0.03;
    }
  })

  const players = [];

  for (let i = 0; i < 4; i++) {
    players.push(new Player(screenWidth / 2, screenHeight / 2))
    scene.addEntity(players.at(-1));
  }

  for (let i = 0; i < 1000; i++) {
    let x = Math.random() * screenWidth;
    let y = Math.random() * screenHeight;
    while (players.some(player => dist(player.getPos(), {x, y}) < 80)) {
      x = Math.random() * screenWidth;
      y = Math.random() * screenHeight;
    }
    scene.addEntity(new Food(x, y));
  }

  engine.addScene(scene);

  engine.addScene(scenePause);

  // engine.addActionPre('pause', () => {
  //   if (engine.isControl('action', ControllerState.Press) || engine.isControl('interact1', ControllerState.Press)) {
  //     if (engine.getActivatedScenes().some(scene => scene.key === 'main')) {
  //       engine.switchToScene('pause');
  //       Sound.Sounds['start'].play();
  //     } else {
  //       engine.switchToScene('main');
  //     }
  //   }
  // });

  engine.switchToScene('main');

  Sound.setVolume(0.1);

  Sound.Sounds['start'].play();

  await engine.start();
}

const keyMap = [
  {
    binding: new ControllerBinding<undefined>('left'),
    keys: ['ArrowLeft', 'a', 'A'],
  },
  {
    binding: new ControllerBinding<undefined>('right'),
    keys: ['ArrowRight', 'd', 'D'],
  },
  {
    binding: new ControllerBinding<undefined>('up'),
    keys: ['ArrowUp', 'w', 'W'],
  },
  {
    binding: new ControllerBinding<undefined>('down'),
    keys: ['ArrowDown', 's', 'S'],
  },
  {
    binding: new ControllerBinding<undefined>('leftTurn'),
    keys: ['q', 'Q'],
  },
  {
    binding: new ControllerBinding<undefined>('rightTurn'),
    keys: ['e', 'E'],
  },
  {
    binding: new ControllerBinding<undefined>('run'),
    keys: ['Shift'],
  },
  {
    binding: new ControllerBinding<undefined>('action'),
    keys: [' '],
  },
];

const mouseMap = [
  {
    binding: new ControllerBinding<{ x: number, y: number, dx: number, dy: number }>('interact1'),
    buttons: [0],
  },
  {
    binding: new ControllerBinding<{ x: number, y: number, dx: number, dy: number }>('interact2'),
    buttons: [2],
  }
];

const gamepadMap = [
  {
    binding: new ControllerBinding<{value: number}>('button1'),
    buttons: [
      { type: 'buttons', index: 0 },
    ],
  },
  {
    binding: new ControllerBinding<{ value: number }>('button2'),
    buttons: [
      { type: 'buttons', index: 1 },
    ],
  },
  {
    binding: new ControllerBinding<{ value: number }>('axis1'),
    buttons: [
      { type: 'axes', index: 0 },
    ],
  },
  {
    binding: new ControllerBinding<{ value: number }>('axis2'),
    buttons: [
      { type: 'axes', index: 1 },
    ],
  }
];

init();

export function dist(a: { x: number, y: number }, b: { x: number, y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function distance(a: SpriteEntity, b: SpriteEntity) {
  return dist(a.getPos(), b.getPos());
}

export function clamp(low: number, val: number, high: number) {
  return Math.min(Math.max(low, val), high);
}