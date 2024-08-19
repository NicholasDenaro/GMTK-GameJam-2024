import { Canvas2DView, ControllerBinding, Engine, FixedTickEngine, GamepadController, KeyboardController, Scene, MouseController, Sprite, Sound, ControllerState, Rectangle, TiledLoader, View, SpriteEntity, Entity } from 'game-engine';
import { Player, playerAbilities } from './player.js';
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

new Sound('start', wavAssets('./premade/outputs/GAME_MENU_SCORE_SFX001416.ogg'));
new Sound('key', wavAssets('./premade/outputs/GAME_MENU_SCORE_SFX001410.ogg'));
new Sound('lock', wavAssets('./premade/outputs/sfxE09.ogg'));
new Sound('stage', wavAssets('./premade/outputs/sfxX09.ogg'));

//new Sound('spring', wavAssets('./premade/outputs/freesound/663831__efindlay__springy-jump.ogg')); // https://freesound.org/people/EFindlay/sounds/663831/
new Sound('spring', wavAssets('./premade/outputs/Pixabay/Pixabay/toy-button-105724.ogg'));

new Sound('slime-move', wavAssets('./premade/outputs/Pixabay/Pixabay/slime-2-30099.ogg'));
new Sound('slime-jump', wavAssets('./premade/outputs/Pixabay/Pixabay/slimejump-6913.ogg'));
new Sound('slime-land', wavAssets('./premade/outputs/Pixabay/floraphonic/slime-splatter-4-220263.ogg'));
new Sound('slime-saw', wavAssets('./premade/outputs/Pixabay/floraphonic/goopy-slime-28-229644.ogg'));

new Sound('button', wavAssets('./premade/outputs/Pixabay/Pixabay/button-press-85188.ogg'))

let _mute: boolean = true;
export function mute() {
  _mute = true;
  Music?.volume(0);
}
export function unmute() {
  _mute = false;
  Music?.volume(1);
}

export function isMuted() {
  return _mute;
}

export let Music: {
  stop: () => void;
  volume: (val: number) => void;
};

export function PlayLoop(loop: string) {
  Music?.stop();
  Music = Sound.Sounds[loop].play();
  if(isMuted()) {
    mute();
  }
}

new Sound('loop1', wavAssets('./outputs/BeepBox-Song.ogg'), true);
new Sound('loop2', wavAssets('./outputs/BeepBox-Song2.ogg'), true);

new Sprite('slime', spriteAssets('./slime.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 8, spriteOffsetY: 15 });
new Sprite('sign', spriteAssets('./sign.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 8, spriteOffsetY: 15 });
new Sprite('platform', spriteAssets('./platform.png'), { spriteWidth: 16, spriteHeight: 5, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('movingblock', spriteAssets('./movingblock.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('saw', spriteAssets('./saw.png'), { spriteWidth: 32, spriteHeight: 32, spriteOffsetX: 16, spriteOffsetY: 16 });
new Sprite('gmtk-splash', spriteAssets('./premade/gmtk-splash.png'), { spriteWidth: 320, spriteHeight: 240, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('music', spriteAssets('./music.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('ladder', spriteAssets('./ladder.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('key', spriteAssets('./key.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 8, spriteOffsetY: 8 });
new Sprite('lock', spriteAssets('./lock.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('button', spriteAssets('./button.png'), { spriteWidth: 16, spriteHeight: 5, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('orb', spriteAssets('./orb.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 8, spriteOffsetY: 8 });

async function init() {

  await Sprite.waitForLoad();

  await Sound.waitForLoad();

  const loader = new GmtkTiledLoder(mapAssets, spriteAssets);

  engine.addController(new KeyboardController(keyMap));
  engine.addController(new MouseController(mouseMap));
  engine.addController(new GamepadController(gamepadMap));

  const view = new Canvas2DView(screenWidth, screenHeight, { scale: scale, bgColor: '#BBBBBB' });

  for (let world of WorldStages) {
    for (let stage of world.stages) {
      engine.addScene(await loader.createSceneFromTMX(engine, `./world${world.world}/${stage.key}.tmx`, stage.key, view));
    }
  }

  const scenePause = new Scene('pause', view);
  engine.addScene(scenePause);

  loadSaveData();
  engine.addScene(createTitleScreen(view));
  engine.addScene(createGMTKSplashScreen(view));
  engine.addScene(createMainMenu(view));
  engine.addScene(createOptions(view));
  engine.addScene(createWorldSelect(view));
  engine.addScene(createCredits(view));
  engine.addScene(createVictory(view));

  engine.addActionPost('pause', () => {
    if (engine.isControl('pause', ControllerState.Press) ) {
      if (!engine.getActivatedScenes().some(scene => scene.key === 'main-menu')) {
        engine.switchToScene('main-menu');
        view.setOffset(0, 0);
        Music?.stop();
        Music = null;
      }
    }
  });

  const hashCheats = (window.location.hash ?? '').split(';');
  const worldCheat = hashCheats.find(cheat => cheat.includes('world='));
  const positionCheat = hashCheats.find(cheat => cheat.includes('position='));
  if (worldCheat) {
    const world = worldCheat.split('=')[1];
    const nextScene = engine.getScene(world);
    const player = nextScene.entitiesByType(Player)[0];
    player.viewOffsetY = nextScene.entitiesByType(ViewStart)[0].y;


    if (world[1] === '1') {
      playerAbilities.squishUp = false;
      playerAbilities.squishDown = false;
      playerAbilities.unSquish = false;
    }
    if (world[1] === '2') {
      playerAbilities.squishUp = true;
      playerAbilities.squishDown = true;
      playerAbilities.unSquish = true;
    }

    if (positionCheat) {
      const position = positionCheat.split('=')[1].split(',').map(coord => Number(coord));
      player.moveDelta(-player.getPos().x + position[0], -player.getPos().y + position[1]);
    }

    engine.switchToScene(nextScene.key);
  } else {
    engine.switchToScene('title');
  }

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
  {
    binding: new ControllerBinding<undefined>('reset'),
    keys: ['r', 'R'],
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

const WorldStages = [
  {
    world: 1,
    name: 'The Basics',
    stages: [
      {
        stage: 1,
        key: 'w1s1',
      },
      {
        stage: 2,
        key: 'w1s2',
      },
      {
        stage: 3,
        key: 'w1s3',
      },
      {
        stage: 4,
        key: 'w1s4',
      }
    ]
  },
  {
    world: 2,
    name: 'Self Control',
    stages: [
      {
        stage: 1,
        key: 'w2s1',
      },
      {
        stage: 2,
        key: 'w2s2',
      },
      {
        stage: 3,
        key: 'w2s3',
      },
      {
        stage: 4,
        key: 'w2s4',
      }
    ]
  },
  {
    world: 3,
    name: 'The Climb',
    stages: [
      {
        stage: 1,
        key: 'w3s1',
      },
      {
        stage: 2,
        key: 'w3s2',
      },
    ]
  },
]
let World = 1;
let Stage = 1;
export function nextStage(stage: string = undefined) {

  if (World === 1) {
    playerAbilities.squishUp = false;
    playerAbilities.squishDown = false;
    playerAbilities.unSquish = false;
  }
  if (World === 2) {
    playerAbilities.squishUp = true;
    playerAbilities.squishDown = true;
    playerAbilities.unSquish = true;
  }

  let nextScene: Scene;
  if (stage) {
    nextScene = engine.getScene(stage);
    nextScene.entitiesByType(Player)[0].viewOffsetY = nextScene.entitiesByType(ViewStart)[0].y;
    engine.switchToScene(stage);
    saveData();
    return;
  }

  const nextStage = Stage + 1;

  if (WorldStages.find(world => world.world === World).stages.find(stage => stage.stage === nextStage)) {
    if (!SaveData.unlocked.find(world => world.world === World).stages.find(stage => stage === nextStage)) {
      SaveData.unlocked.find(world => world.world === World).stages.push(nextStage);
    }
    Stage = nextStage;
    console.log(`next stage: ${Stage}`);
  } else if (WorldStages.find(world => world.world === World + 1)) {
    World += 1;
    Stage = 1;
    if (!SaveData.unlocked.find(world => world.world === World)) {
      SaveData.unlocked.push({
        stages: [Stage],
        world: World
      });
    }
    console.log(`next world: ${World}`);
  } else {
    nextScene = engine.getScene(`victory`);
    saveData();
    engine.switchToScene(nextScene.key);
    return;
  }

  if (World === 1) {
    playerAbilities.squishUp = false;
    playerAbilities.squishDown = false;
    playerAbilities.unSquish = false;
  }
  if (World === 2) {
    playerAbilities.squishUp = true;
    playerAbilities.squishDown = true;
    playerAbilities.unSquish = true;
  }

  // TODO: reset the state of the level
  nextScene = engine.getScene(WorldStages.find(world => world.world === World).stages.find(stage => stage.stage === Stage).key);
  nextScene.entitiesByType(Player)[0].viewOffsetY = nextScene.entitiesByType(ViewStart)[0].y;
  SaveData.lastStage = {world: World, stage: Stage};
  saveData();
  engine.switchToScene(nextScene.key);
}

export const SaveData = {
  unlocked: <{world: number, stages: number[]}[]>[{
    world: 1,
    stages: [1]
  }],
  lastStage: <{world: number, stage: number}>undefined,
};
function loadSaveData() {
  const unlockedString = window.localStorage.getItem('unlocked');
  if (unlockedString) {
    SaveData.unlocked = JSON.parse(unlockedString);
  }
  const lastStageString = window.localStorage.getItem('lastStage');
  if (lastStageString) {
    SaveData.lastStage = JSON.parse(lastStageString);
  }
}

function saveData() {
  window.localStorage.setItem('unlocked', JSON.stringify(SaveData.unlocked));
  window.localStorage.setItem('lastStage', JSON.stringify(SaveData.lastStage));
}

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

  let i = 0;
  const baseY = screenHeight * 3 / 4 - 32;

  scene.addEntity(new Text(screenWidth / 2, baseY + i++, 'Start', () => {
    engine.switchToScene('world-select');
  }, 16));

  if (SaveData.lastStage) {
    scene.addEntity(new Text(screenWidth / 2, baseY + i++ * 16, 'Continue', () => {
      Stage = SaveData.lastStage.stage;
      World = SaveData.lastStage.world;
      const key = `w${SaveData.lastStage.world}s${SaveData.lastStage.stage}`;
      nextStage(key);
    }, 16));
  }

  scene.addEntity(new Text(screenWidth / 2, baseY + i++ * 16, 'Options', () => {
    engine.switchToScene('options');
  }, 16));
  scene.addEntity(new Text(screenWidth / 2, baseY + i++ * 16, 'Credits', () => {
    engine.switchToScene('credits');
  }, 16));
  return scene;
}

function createWorldSelect(view: View): Scene {
  const scene = new Scene('world-select', view);

  for (let w = 1; w < 4; w++) {
    if (SaveData.unlocked.find(unlock => unlock.world === w)) {
      scene.addEntity(new Text(32, 32 + (w - 1) * 32, `Chapter ${w} - ${WorldStages.find(world => world.world === w).name}`, () => { }, 16, false));
      for (let s = 1; s < 5; s++) {
        if (SaveData.unlocked.find(unlock => unlock.world === w).stages.find(st => st === s)) {
          const world = w;
          const stage = s;
          scene.addEntity(new Text(32 + (s - 1) * 64, 48 + (w - 1) * 32, `Stage ${s}`, () => {
            SaveData.lastStage = {world, stage};
            World = world;
            Stage = stage;
            nextStage(`w${world}s${stage}`);
            PlayLoop('loop1');
          }, 13, false));
        }
      }
    }
  }
  
  return scene;
}
function createOptions(view: View): Scene {
  const scene = new Scene('options', view);
  scene.addEntity(new Text(screenWidth / 2, screenHeight / 4, 'Options', null, 16));
  return scene;
}

function createCredits(view: View): Scene {
  const scene = new Scene('credits', view);
  scene.addEntity(new Text(screenWidth / 2, screenHeight / 4, 'Credits', null, 16));
  return scene;
}

function createVictory(view: View): Scene {
  const scene = new Scene('victory', view);
  scene.addEntity(new Text(screenWidth / 2, screenHeight / 4, 'Victory', null, 16));
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
}, false);

window.addEventListener("keydown", function (e) {
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
    e.preventDefault();
  }
}, false);