import { Injectable } from '@angular/core';

import { SignalKService } from './signalk.service';

@Injectable()
export class SignalKFullService {

  constructor(private SignalKService: SignalKService,) { }


  processFullUpdate(data) {

    //set self urn
    this.SignalKService.setSelf(data.self)

    // set Sources
    //this.SignalKService.setDataFull(data);

    // so we will walk the array recusively
    this.findKeys(data);
  }

  findKeys(data, currentPath: string[] = []) {
    let path = currentPath.join('.');

    if (data === null) { //notifications don't have timestamp... hmmm TODO get notif into tree...
      return;
    }
    
    if ( (typeof(data) == 'string') || (typeof(data) == 'number') || (typeof(data) == 'boolean')) {  // is it a simple value?
      let timestamp = Date.now();
      let source = 'noSource'
      this.SignalKService.updatePathData(path, source, timestamp, data);
      this.SignalKService.setDefaultSource(path, source);
      return;
    }     
    else if ('timestamp' in data) { // is it a timestamped value?

      // try and get source
      let source: string;
      if (typeof(data['$source']) == 'string') {
        source = data['$source'];
      } else if (typeof(data['source']) == 'object') {
        source = data['source']['label'];
      } else {
        source = 'noSource';
      }
      
      let timestamp = Date.parse(data.timestamp);

      // try and get metadata.
      if (typeof(data['meta']) == 'object') {
        this.SignalKService.setMeta(path, data['meta']);

      // is it a normal value, or a compound value?
      if ('value' in data) {
        if (typeof(data['value']) == 'object' && (data['value'] !== null)) {
          // compound
          Object.keys(data['value']).forEach(key => {
            this.SignalKService.updatePathData(path+"."+key, source, timestamp, data.value[key]);
            this.SignalKService.setDefaultSource(path+"."+key, source);            
          });
        } else {
          //simple
          this.SignalKService.updatePathData(path, source, timestamp, data.value);
          this.SignalKService.setDefaultSource(path, source);      
          }
        }     
      }


      this.SignalKService.setDefaultSource(path, source);      

      return;
    }
    
    // it's not a value, dig deaper
    else {
      // process children
      let keys = Object.keys(data);
      let len = keys.length;
      for (let i = 0; i < len; i += 1) {
        let newPath = currentPath.slice();
        newPath.push(keys[i])
        this.findKeys(data[keys[i]], newPath);
      }
    }
  }
 

}
