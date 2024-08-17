import { Rectangle, Scene, TiledLoader } from 'game-engine';
import { Solid } from './solid.js';
import { Player } from './player.js';

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
        scene.addEntity(new Player(bounds.x + 8, bounds.y + 15));
        break;
      case 'Solid':
        scene.addEntity(new Solid(bounds));
        break;
    }
  }
  
}