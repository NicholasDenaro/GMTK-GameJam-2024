import { Canvas2DView, ControllerBinding, Engine, FixedTickEngine, GamepadController, KeyboardController, Scene, MouseController, Sprite, Sound, ControllerState, Rectangle, TiledLoader, View, SpriteEntity, Entity } from 'game-engine';
import { Player } from './player.js';
import { GmtkTiledLoder } from './gmtk-tiled-loader.js';
import { ViewStart } from './view-start.js';
import { Text } from './text.js';
import { Timer } from './timer.js';
import { ImageEntity } from './image-entity.js';

export const screenWidth = 320;
export const screenHeight = 192;
const scale = 4;
export const FPS = 60;

const rfont = require.context('../assets/premade', false, /\.ttf$/);
const sfont = rfont('./BetterPixels.ttf');
console.log(sfont);
const font = new FontFace('game', `url(${sfont})`);
font.load().then(() => {
  console.log('loaded font');
  document.fonts.add(font);
},
  (err) => {
    console.error(err);
  }
);

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

export let Music: {
  stop: () => void;
  volume: (val: number) => void;
};

new Sound('loop1', wavAssets('./outputs/BeepBox-Song.ogg'), true);

new Sprite('slime', spriteAssets('./slime.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 8, spriteOffsetY: 15 });
new Sprite('sign', spriteAssets('./sign.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 8, spriteOffsetY: 15 });
new Sprite('platform', spriteAssets('./platform.png'), { spriteWidth: 16, spriteHeight: 5, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('movingblock', spriteAssets('./movingblock.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('saw', spriteAssets('./saw.png'), { spriteWidth: 32, spriteHeight: 32, spriteOffsetX: 16, spriteOffsetY: 16 });
new Sprite('gmtk-splash', spriteAssets('./premade/gmtk-splash.png'), { spriteWidth: 320, spriteHeight: 240, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('music', spriteAssets('./music.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 0, spriteOffsetY: 0 });

async function init() {

  await Sprite.waitForLoad();

  await Sound.waitForLoad();

  const loader = new GmtkTiledLoder(mapAssets, spriteAssets);

  engine.addController(new KeyboardController(keyMap));
  engine.addController(new MouseController(mouseMap));
  engine.addController(new GamepadController(gamepadMap));

  const view = new Canvas2DView(screenWidth, screenHeight, { scale: scale, bgColor: '#BBBBBB' });
  engine.addScene(await loader.createSceneFromTMX(engine, './dev-room.tmx', 'dev-room', view));
  engine.addScene(await loader.createSceneFromTMX(engine, './w1s1.tmx', 'w1s1', view));

  const scenePause = new Scene('pause', view);
  engine.addScene(scenePause);

  engine.addScene(createTitleScreen(view));
  engine.addScene(createGMTKSplashScreen(view));
  engine.addScene(createMainMenu(view));
  engine.addScene(createCredits(view));

  engine.addActionPre('pause', () => {
    if (engine.isControl('pause', ControllerState.Press) ) {
      if (!engine.getActivatedScenes().some(scene => scene.key === 'main-menu')) {
        engine.switchToScene('main-menu');
        Music?.stop();
        Music = null;
      }
    }
  });

  // const nextScene = engine.getScene('dev-room');
  // nextScene.entitiesByType(Player)[0].viewOffsetX = nextScene.entitiesByType(ViewStart)[0].x;
  // nextScene.entitiesByType(Player)[0].viewOffsetY = nextScene.entitiesByType(ViewStart)[0].y;

  engine.switchToScene('title');
  Sound.setVolume(0.3);

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
  {
    binding: new ControllerBinding<undefined>('pause'),
    keys: ['Escape', 'Enter'],
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

function createTitleScreen(view: View): Scene {
  const scene = new Scene('title', view);
  scene.addEntity(new Text(screenWidth / 2, screenHeight / 2, 'node-game-engine', null, 16));
  scene.addEntity(new Timer(60, () => engine.switchToScene('gmtk-splash')));
  return scene;
}

function createGMTKSplashScreen(view: View): Scene {
  const scene = new Scene('gmtk-splash', view);
  scene.addEntity(new ImageEntity(Sprite.Sprites['gmtk-splash'], 0, 0));
  scene.addEntity(new Timer(60, () => {
    engine.switchToScene('main-menu');
  }));
  return scene;
}

function createMainMenu(view: View): Scene {
  const scene = new Scene('main-menu', view);
  scene.addEntity(new Text(screenWidth / 2, screenHeight / 4, 'Slimb Climb', null, 16));

  scene.addEntity(new Text(screenWidth / 2, screenHeight * 3 / 4, 'Start', () => {
    engine.switchToScene('w1s1');
    Music = Sound.Sounds['loop1'].play();
  }, 16));
  scene.addEntity(new Text(screenWidth / 2, screenHeight * 3 / 4 + 16, 'Options', null, 16));
  scene.addEntity(new Text(screenWidth / 2, screenHeight * 3 / 4 + 16 + 16, 'Credits', null, 16));
  return scene;
}

function createCredits(view: View): Scene {
  const scene = new Scene('credits', view);

  return scene;
}

export type Point = {x: number, y: number};

export function clamp(low: number, val: number, high: number) {
  return Math.min(Math.max(low, val), high);
}

export function distance(a: Point, b: Point) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function collisionPoint(bounds: Rectangle, point: { x: number, y: number }) {
  return !(point.x < bounds.x || point.y < bounds.y || point.x > bounds.x + bounds.width || point.y > bounds.y + bounds.height);
}

window.addEventListener("click", function (e) {
  window.focus();
  console.log('focus');
}, false);

window.addEventListener("keydown", function (e) {
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
    e.preventDefault();
  }
}, false);