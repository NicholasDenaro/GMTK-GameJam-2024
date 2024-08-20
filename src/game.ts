import { Canvas2DView, ControllerBinding, Engine, FixedTickEngine, GamepadController, KeyboardController, Scene, MouseController, Sprite, Sound, ControllerState, Rectangle, TiledLoader, View, SpriteEntity, Entity, SpritePainter } from 'game-engine';
import { Player, playerAbilities } from './player.js';
import { GmtkTiledLoder } from './gmtk-tiled-loader.js';
import { ViewStart } from './view-start.js';
import { Text } from './text.js';
import { Timer } from './timer.js';
import { ImageEntity } from './image-entity.js';
import { MusicMuter } from './music-muter.js';

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
const loader = new GmtkTiledLoder(mapAssets, spriteAssets);

new Sound('start', wavAssets('./premade/outputs/GAME_MENU_SCORE_SFX001416.ogg'));
new Sound('key', wavAssets('./premade/outputs/GAME_MENU_SCORE_SFX001410.ogg'));
new Sound('lock', wavAssets('./premade/outputs/sfxE09.ogg'));
new Sound('stage', wavAssets('./premade/outputs/sfxX09.ogg'));

new Sound('spring', wavAssets('./premade/outputs/Pixabay/Pixabay/toy-button-105724.ogg'));

new Sound('slime-move', wavAssets('./premade/outputs/Pixabay/Pixabay/slime-2-30099.ogg'));
new Sound('slime-jump', wavAssets('./premade/outputs/Pixabay/Pixabay/slimejump-6913.ogg'));
new Sound('slime-land', wavAssets('./premade/outputs/Pixabay/floraphonic/slime-splatter-4-220263.ogg'));
new Sound('slime-saw', wavAssets('./premade/outputs/Pixabay/floraphonic/goopy-slime-28-229644.ogg'));

new Sound('button', wavAssets('./premade/outputs/Pixabay/Pixabay/button-press-85188.ogg'))

let _mute: boolean = false;
export function mute() {
  _mute = true;
  Music?.volume(0);
  SaveData.mute = true;
  saveData();
}
export function unmute() {
  _mute = false;
  Music?.volume(1);
  SaveData.mute = false;
  saveData();
}

export function isMuted() {
  return _mute;
}

export let Music: {
  song: string;
  stop: () => void;
  volume: (val: number) => void;
};

export function PlayLoop(loop: string) {
  if (Music?.song !== loop) {
    Music?.stop();
    Music = {
      song: loop,
      ...Sound.Sounds[loop].play()
    };
    Music.volume(bgmVolume / 100);
    if (isMuted()) {
      mute();
    }
  }
}

export function PlaySFX(sfx: string) {
  const playing = Sound.Sounds[sfx].play();

  playing.volume(sfxVolume);
  return playing;
}

new Sound('title', wavAssets('./outputs/BeepBox-Title.ogg'), true);
new Sound('loop1', wavAssets('./outputs/BeepBox-Song.ogg'), true);
new Sound('loop2', wavAssets('./outputs/BeepBox-Song2.ogg'), true);
new Sound('loop3', wavAssets('./outputs/BeepBox-Song3.ogg'), true);
new Sound('loop4', wavAssets('./outputs/BeepBox-Victory.ogg'), true);

new Sprite('slime', spriteAssets('./slime.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 8, spriteOffsetY: 15 });
new Sprite('slime-colorblind', spriteAssets('./slime-colorblind.png'), { spriteWidth: 16, spriteHeight: 16, spriteOffsetX: 8, spriteOffsetY: 15 });
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

new Sprite('title', spriteAssets('./title.png'), { spriteWidth: 320, spriteHeight: 192, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('world-select', spriteAssets('./world-select.png'), { spriteWidth: 320, spriteHeight: 192, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('options', spriteAssets('./options.png'), { spriteWidth: 320, spriteHeight: 192, spriteOffsetX: 0, spriteOffsetY: 0 });
new Sprite('credits', spriteAssets('./credits.png'), { spriteWidth: 320, spriteHeight: 192, spriteOffsetX: 0, spriteOffsetY: 0 });

async function init() {

  await Sprite.waitForLoad();

  await Sound.waitForLoad();

  engine.addController(new KeyboardController(keyMap));
  engine.addController(new MouseController(mouseMap));
  engine.addController(new GamepadController(gamepadMap));

  const view = new Canvas2DView(screenWidth, screenHeight, { scale: scale, bgColor: '#BBBBBB' });

  for (let world of WorldStages) {
    for (let stage of world.stages) {
      engine.addScene(await loader.createSceneFromTMX(engine, `./world${world.world}/${stage.key}.tmx`, stage.key, view));
    }
  }

  const loadingIndicator = document.querySelector(`#loading`);

  if (loadingIndicator) {
    document.body.removeChild(loadingIndicator);
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
        PlayLoop('title');
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
    if (world[1] === '3') {
      playerAbilities.squishUp = true;
      playerAbilities.squishDown = true;
      playerAbilities.unSquish = true;
    }
    if (world[1] === '4') {
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

  Sound.setVolume(mainVolume / 100);

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
  {
    world: 4,
    name: 'The Pinacle',
    stages: [
      {
        stage: 1,
        key: 'w4s1',
      },
    ]
  },
]
let World = 1;
let Stage = 1;
export async function nextStage(worldNumber?: number, stageNumber?: number) {

  const view = engine.getActivatedScenes()[0].getView();

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
  if (World === 3) {
    playerAbilities.squishUp = true;
    playerAbilities.squishDown = true;
    playerAbilities.unSquish = true;
  }
  if (World === 4) {
    playerAbilities.squishUp = true;
    playerAbilities.squishDown = true;
    playerAbilities.unSquish = true;
  }
  PlayLoop(`loop${World}`);

  let nextScene: Scene;
  if (worldNumber && stageNumber) {
    console.log(`worldNumber: ${worldNumber}`);
    console.log(`stageNumber: ${stageNumber}`);
    const world = WorldStages.find(world => world.world === worldNumber);
    const stage = world.stages.find(stage => stage.stage === stageNumber);
    const scene = await loader.createSceneFromTMX(engine, `./world${world.world}/${stage.key}.tmx`, stage.key, view);
    scene.entitiesByType(Player)[0].viewOffsetY = scene.entitiesByType(ViewStart)[0].y;
    engine.addScene(scene);
    nextScene = engine.getScene(stage.key);
    engine.switchToScene(nextScene.key);
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
    (nextScene.getView() as Canvas2DView).setOffset(0, 0);
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
  if (World === 3) {
    playerAbilities.squishUp = true;
    playerAbilities.squishDown = true;
    playerAbilities.unSquish = true;
  }
  if (World === 4) {
    playerAbilities.squishUp = true;
    playerAbilities.squishDown = true;
    playerAbilities.unSquish = true;
  }

  // hack to reset the state of the level
  const world = WorldStages.find(world => world.world === World);
  const stage = world.stages.find(stage => stage.stage === Stage);
  const scene = await loader.createSceneFromTMX(engine, `./world${world.world}/${stage.key}.tmx`, stage.key, view);
  scene.entitiesByType(Player)[0].viewOffsetY = scene.entitiesByType(ViewStart)[0].y;
  engine.addScene(scene);

  nextScene = engine.getScene(scene.key);
  SaveData.lastStage = {world: World, stage: Stage};
  PlayLoop(`loop${World}`);
  saveData();
  engine.switchToScene(nextScene.key);
}

export const SaveData = {
  unlocked: <{world: number, stages: number[]}[]>[{
    world: 1,
    stages: [1]
  }],
  lastStage: <{world: number, stage: number}>undefined,
  mute: false,
  colorblind: false,
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
  const colorblindString = window.localStorage.getItem('colorblind');
  if (colorblindString) {
    SaveData.colorblind = JSON.parse(colorblindString);
  }

  const mainVolumeString = window.localStorage.getItem('mainVolume');
  if (mainVolumeString) {
    mainVolume = Number(mainVolumeString);
    Sound.setVolume(mainVolume);
  }
  const bgmVolumeString = window.localStorage.getItem('bgmVolume');
  if (bgmVolumeString) {
    bgmVolume = Number(bgmVolumeString);
  }
  const sfxVolumeString = window.localStorage.getItem('sfxVolume');
  if (sfxVolumeString) {
    sfxVolume = Number(sfxVolumeString);
  }

  const muteString = window.localStorage.getItem('mute');
  if (lastStageString) {
    const muteValue = JSON.parse(muteString);
    if (muteValue) {
      mute();
    }
  }
}

function saveData() {
  window.localStorage.setItem('unlocked', JSON.stringify(SaveData.unlocked));
  window.localStorage.setItem('lastStage', JSON.stringify(SaveData.lastStage));
  window.localStorage.setItem('mainVolume', `${mainVolume}`);
  window.localStorage.setItem('bgmVolume', `${bgmVolume}`);
  window.localStorage.setItem('sfxVolume', `${sfxVolume}`);
  window.localStorage.setItem('mute', `${SaveData.mute}`);
  window.localStorage.setItem('colorblind', `${SaveData.colorblind}`);
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
    PlayLoop('title');
  }));
  return scene;
}

function createMainMenu(view: View): Scene {
  const scene = new Scene('main-menu', view);
  scene.addEntity(new ImageEntity(Sprite.Sprites['title'], 0, 0));
  // scene.addEntity(new Text(screenWidth / 2, screenHeight / 4, 'Slimb Climb', null, 16));

  let i = 0;
  const baseY = screenHeight * 3 / 4 - 32;

  scene.addEntity(new Text(screenWidth / 2, baseY + i++, 'Start', () => {
    engine.switchToScene('world-select');
  }, 16));

  scene.addEntity(new Text(screenWidth / 2, baseY + i++ * 16, 'Continue', () => {
    if (SaveData.lastStage) {
      Stage = SaveData.lastStage.stage;
      World = SaveData.lastStage.world;
      const key = `w${SaveData.lastStage.world}s${SaveData.lastStage.stage}`;
      console.log(`going to stage: ${key}`)
      nextStage(World, Stage);
    }
  }, 16, true, SaveData.lastStage ? 'black' : 'grey'));

  scene.addEntity(new Text(screenWidth / 2, baseY + i++ * 16, 'Options', () => {
    engine.switchToScene('options');
  }, 16));
  scene.addEntity(new Text(screenWidth / 2, baseY + i++ * 16, 'Credits', () => {
    engine.switchToScene('credits');
  }, 16));

  scene.addEntity(new MusicMuter());
  return scene;
}

function createWorldSelect(view: View): Scene {
  const scene = new Scene('world-select', view);
  scene.addEntity(new ImageEntity(Sprite.Sprites['world-select'], 0, 0));
  scene.addEntity(new Text(16, 16, 'X', () => {
    engine.switchToScene('main-menu');
  }, 16));

  for (let w = 1; w < 5; w++) {
    if (SaveData.unlocked.find(unlock => unlock.world === w)) {
      scene.addEntity(new Text(32, 32 + (w - 1) * 32, `Chapter ${w} - ${WorldStages.find(world => world.world === w).name}`, () => { }, 16, false));
      for (let s = 1; s < 5; s++) {
        if (SaveData.unlocked.find(unlock => unlock.world === w).stages.find(st => st === s)) {
          const world = w;
          const stage = s;
          scene.addEntity(new Text(32 + (s - 1) * 64, 48 + (w - 1) * 32, `Stage ${s}`, async () => {
            SaveData.lastStage = {world, stage};
            World = world;
            Stage = stage;
            await nextStage(world, stage);
            PlayLoop(`loop${world}`);
          }, 13, false));
        }
      }
    }
  }

  scene.addEntity(new MusicMuter());
  
  return scene;
}

let mainVolume: number = 30;
let bgmVolume: number = 100;
let sfxVolume: number = 100;
function createOptions(view: View): Scene {
  const scene = new Scene('options', view);
  scene.addEntity(new ImageEntity(Sprite.Sprites['options'], 0, 0));
  scene.addEntity(new Text(16, 16, 'X', () => {
    engine.switchToScene('main-menu');
  }, 16));

  const baseY = screenHeight / 4 - 32;

  scene.addEntity(new Text(screenWidth / 2, baseY, 'Options', null, 16));

  scene.addEntity(new Text(48, baseY + 32, 'Main Volume:', null, 16, false));
  const volumeEntity = new Text(screenWidth * 3 / 4, baseY + 32, `${mainVolume}%`, null, 16, false);
  scene.addEntity(volumeEntity);
  scene.addEntity(new Text(screenWidth * 3 / 4 - 16, baseY + 32, '-', () => {
    if (mainVolume > 0) {
      mainVolume -= 10;
      volumeEntity.setText(`${mainVolume}%`);
      Sound.setVolume(mainVolume / 100);
      Music.volume(mainVolume / 100 * bgmVolume / 100);
      saveData();
    }
  }, 16, false));
  scene.addEntity(new Text(screenWidth * 3 / 4 + 32, baseY + 32, '+', () => {
    if (mainVolume < 100) {
      mainVolume += 10;
      volumeEntity.setText(`${mainVolume}%`);
      Sound.setVolume(mainVolume / 100);
      Music.volume(mainVolume / 100 * bgmVolume / 100);
      saveData();
    }
  }, 16, false));



  scene.addEntity(new Text(48, baseY + 32 + 32, 'BGM Volume:', null, 16, false));
  const volumeBGMEntity = new Text(screenWidth * 3 / 4, baseY + 32 + 32, `${bgmVolume}%`, null, 16, false);
  scene.addEntity(volumeBGMEntity);
  scene.addEntity(new Text(screenWidth * 3 / 4 - 16, baseY + 32 + 32, '-', () => {
    if (bgmVolume > 0) {
      bgmVolume -= 10;
      volumeBGMEntity.setText(`${bgmVolume}%`);
      Sound.setVolume(bgmVolume / 100);
      Music.volume(mainVolume / 100 * bgmVolume / 100);
      saveData();
    }
  }, 16, false));
  scene.addEntity(new Text(screenWidth * 3 / 4 + 32, baseY + 32 + 32, '+', () => {
    if (bgmVolume < 100) {
      bgmVolume += 10;
      volumeBGMEntity.setText(`${bgmVolume}%`);
      Sound.setVolume(bgmVolume / 100);
      Music.volume(mainVolume / 100 * bgmVolume / 100);
      saveData();
    }
  }, 16, false));


  scene.addEntity(new Text(48, baseY + 32 + 32 + 32, 'SFX Volume:', null, 16, false));
  const volumeSFXEntity = new Text(screenWidth * 3 / 4, baseY + 32 + 32 + 32, `${sfxVolume}%`, null, 16, false);
  scene.addEntity(volumeSFXEntity);
  scene.addEntity(new Text(screenWidth * 3 / 4 - 16, baseY + 32 + 32 + 32, '-', () => {
    if (sfxVolume > 0) {
      sfxVolume -= 10;
      volumeSFXEntity.setText(`${sfxVolume}%`);
      Sound.setVolume(sfxVolume / 100);
      saveData();
    }
  }, 16, false));
  scene.addEntity(new Text(screenWidth * 3 / 4 + 32, baseY + 32 + 32 + 32, '+', () => {
    if (sfxVolume < 100) {
      sfxVolume += 10;
      volumeSFXEntity.setText(`${sfxVolume}%`);
      Sound.setVolume(sfxVolume / 100);
      saveData();
    }
  }, 16, false));



  scene.addEntity(new Text(48, baseY + 32 + 32 + 32 + 32, 'Colorblind Slime:', null, 16, false));
  const colorblindImage = new ImageEntity(Sprite.Sprites[SaveData.colorblind ? 'slime-colorblind' : 'slime'], screenWidth * 3 / 4  + 36, baseY + 32 + 32 + 32 + 32 + 10);
  const colorblindEntity = new Text(screenWidth * 3 / 4 - 4, baseY + 32 + 32 + 32 + 32, `${SaveData.colorblind ? 'on' : 'off'}`, () => {
    SaveData.colorblind = !SaveData.colorblind;
    saveData();
    colorblindEntity.setText(`${SaveData.colorblind ? 'on' : 'off'}`);
    (colorblindImage.painter as SpritePainter).setSprite(Sprite.Sprites[SaveData.colorblind ? 'slime-colorblind' : 'slime']);
  }, 16, false);
  scene.addEntity(colorblindEntity);
  scene.addEntity(colorblindImage);

  scene.addEntity(new MusicMuter());

  return scene;
}

function createCredits(view: View): Scene {
  const scene = new Scene('credits', view);
  scene.addEntity(new ImageEntity(Sprite.Sprites['credits'], 0, 0));
  scene.addEntity(new Text(16, 16, 'X', () => {
    engine.switchToScene('main-menu');
  }, 16));
  let i = 0;
  scene.addEntity(new Text(screenWidth / 2, 32 + i++ * 16, 'Credits', null, 16));

  scene.addEntity(new Text(16, 32 + i++ * 16, `Code - Nicholas Denaro`, null, 16, false));
  scene.addEntity(new Text(16, 32 + i++ * 16, `Art - Nicholas Denaro`, null, 16, false));
  scene.addEntity(new Text(16, 32 + i++ * 16, `Audio Loops - Nicholas Denaro`, null, 16, false));
  scene.addEntity(new Text(16, 32 + i++ * 16, `SFX`, null, 16, false));
  scene.addEntity(new Text(16, 32 + i++ * 16, `Pixabay on Pixabay - various slime sounds`, null, 13, false));
  scene.addEntity(new Text(16, 32 + i++ * 16, `floaphonic on Pixabay - various slime sounds`, null, 13, false));
  scene.addEntity(new Text(16, 32 + i++ * 16, `Interface SFX - vairous jingles`, null, 13, false));
  scene.addEntity(new Text(16, 32 + i++ * 16, `Tools: BeepBox, Aseprite, Tiled, VSCode, Audacity, Github, FFmpeg`, null, 12, false));
  scene.addEntity(new Text(16, 32 + i++ * 16, `Source code: https://github.com/NicholasDenaro/GMTK-GameJam-2024`, () => {
    window.open('https://github.com/NicholasDenaro/GMTK-GameJam-2024', '_blank');
  }, 10, false));

  scene.addEntity(new MusicMuter());
  return scene;
}

function createVictory(view: View): Scene {
  const scene = new Scene('victory', view);
  scene.addEntity(new Text(screenWidth / 2, screenHeight / 4, 'Victory!', null, 16));
  scene.addEntity(new Text(screenWidth / 2, screenHeight / 4 + 32, 'Thank you for playing', null, 16));

  scene.addEntity(new Text(screenWidth / 2, screenHeight  - 32, 'Continue', () => {
    engine.switchToScene('credits');
  }, 16));
  scene.addEntity(new MusicMuter());
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

// This needs to be last for some things, like loading save data
init();