import { Canvas2DView, ControllerBinding, Engine, FixedTickEngine, GamepadController, KeyboardController, Scene, MouseController, Sprite, Sound, ControllerState, Rectangle, TiledLoader } from 'game-engine';
import { Player } from './player.js';
import { Solid } from './solid.js';
import { GmtkTiledLoder } from './gmtk-tiled-loader.js';
import { ViewStart } from './view-start.js';

export const screenWidth = 320;
export const screenHeight = 208;
const scale = 5;
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

const engine: Engine = new FixedTickEngine(FPS);

export const spriteAssets = require.context('../assets/', true, /\.png$/);
const wavAssets = require.context('../assets/', true, /\.ogg$/);
const mapAssets = require.context('../assets/tiled', true, /\.tmx$|\.tsx$/);

if (wavAssets('./premade/outputs/GAME_MENU_SCORE_SFX001416.ogg')) {
  new Sound('start', wavAssets('./premade/outputs/GAME_MENU_SCORE_SFX001416.ogg'));
}

new Sprite('slime', spriteAssets('./slime.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 8, spriteOffsetY: 15 });
new Sprite('sign', spriteAssets('./sign.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 8, spriteOffsetY: 15 });
new Sprite('platform', spriteAssets('./platform.png'), { spriteWidth: 16, spriteHeight: 5, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('movingblock', spriteAssets('./movingblock.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('saw', spriteAssets('./saw.png'), { spriteWidth: 32, spriteHeight: 32, spriteOffsetX: 16, spriteOffsetY: 16 });

async function init() {

  await Sprite.waitForLoad();

  await Sound.waitForLoad();

  const loader = new GmtkTiledLoder(mapAssets, spriteAssets);

  engine.addController(new KeyboardController(keyMap));
  engine.addController(new MouseController(mouseMap));
  engine.addController(new GamepadController(gamepadMap));

  const view = new Canvas2DView(screenWidth, screenHeight, { scale: scale, bgColor: '#BBBBBB' });
  const devRoom = await loader.createSceneFromTMX(engine, './dev-room.tmx', 'dev-room', view);
  engine.addScene(devRoom);

  const scene = new Scene('main', view);
  const scenePause = new Scene('pause', view);

  engine.addScene(scene);
  engine.addScene(scenePause);

  scene.addEntity(new Player(screenWidth / 2, 32));

  scene.addEntity(new Solid(new Rectangle(16, screenHeight * 3 / 4, screenWidth - 32, 16)));

  scene.addEntity(new Solid(new Rectangle(16, screenHeight * 1 / 4, 16, screenHeight / 2)));

  scene.addEntity(new Solid(new Rectangle(screenWidth - 32, screenHeight * 1 / 4, 16, screenHeight / 2)));

  scene.addEntity(new Solid(new Rectangle(16, screenHeight * 3 / 4 - 32, 32, 16)));

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

  const nextScene = engine.getScene('dev-room');
  // nextScene.entitiesByType(Player)[0].viewOffsetX = nextScene.entitiesByType(ViewStart)[0].x;
  nextScene.entitiesByType(Player)[0].viewOffsetY = nextScene.entitiesByType(ViewStart)[0].y;

  console.log(`yoffset to start: ${nextScene.entitiesByType(Player)[0].viewOffsetY}`);

  engine.switchToScene('dev-room');

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
    binding: new ControllerBinding<undefined>('run'),
    keys: ['Shift', 'z', 'Z'],
  },
  {
    binding: new ControllerBinding<undefined>('action'),
    keys: [' ', 'x', 'X'],
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


export function clamp(low: number, val: number, high: number) {
  return Math.min(Math.max(low, val), high);
}

export function distance(a: {x: number, y: number}, b: {x: number, y: number}) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

window.addEventListener("keydown", function (e) {
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
    e.preventDefault();
  }
}, false);