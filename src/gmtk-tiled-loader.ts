import { Canvas2DView, Rectangle, Scene, Sprite, TiledLoader } from 'game-engine';
import { Solid } from './solid.js';
import { Player } from './player.js';
import { Platform } from './platform.js';
import { MovingSolid } from './moving-solid.js';
import { ViewStart } from './view-start.js';
import { Sign } from './sign.js';
import { Saw } from './saw.js';
import { MusicMuter } from './music-muter.js';

export class GmtkTiledLoder extends TiledLoader {
  constructor(private _mapData: __WebpackModuleApi.RequireContext, private _spriteData: __WebpackModuleApi.RequireContext) {
    super();
  }

  spriteData(path: string): string {
    return this._spriteData(path);
  }
  
  mapData(path: string): string {
    return this._mapData(path);
  }

  loadObject(scene: Scene, bounds: Rectangle, gid: number, object: Element): void {
    const type = object.getAttribute('type');
    switch(type) {
      case 'Player':
        scene.addEntity(new Player(bounds.x, bounds.y - 1));
        break;
      case 'Solid':
        scene.addEntity(new Solid(bounds));
        break;
      case 'Platform':
        scene.addEntity(new Platform(bounds));
        break;
      case 'MovingSolid':
        const pathId = this.getProperty(object, 'path');
        const path = object.parentNode.querySelector(`[id='${pathId}']`);
        const baseX = Number(path.getAttribute('x'));
        const baseY = Number(path.getAttribute('y'));
        const polyline = path.querySelector('polyline');
        const points = polyline.getAttribute('points').split(' ').map(point => point.split(',')).map(point => ({ x: baseX + Number(point[0]), y: baseY + Number(point[1])}));
        const steps = Number(this.getProperty(path, 'steps'));
        const delay = Number(this.getProperty(path, 'delay') ?? 0);
        const launch = this.getProperty(object, 'launch') === 'true';
        scene.addEntity(new MovingSolid(bounds, points, steps, delay, launch));
        break;
      case 'ViewStart':
        scene.addEntity(new ViewStart(bounds.x, bounds.y));
        break;
      case 'Sign':
        scene.addEntity(new Sign(bounds.x, bounds.y, this.getProperty(object, 'text')));
        break;
      case 'Saw':
        scene.addEntity(new Saw(bounds.x, bounds.y));
        break;
      case 'Music':
        const music = new MusicMuter(Sprite.Sprites['music'], bounds.x, bounds.y);
        scene.addEntity(music);
        music.zIndex = -100;
        break;
    }
  }
  
}