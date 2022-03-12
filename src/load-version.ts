import { environment } from './environments/environment';
import semverParse from 'semver/functions/parse';

if (environment.production) {
  const majorVersion = semverParse(environment.version)?.major;
  const verUrl = `./v${majorVersion}/`;
  if (fileExists(verUrl)) {
    console.log(`redirecting to latest version: v${verUrl}`);
    window.location.replace(verUrl);
  }
}

function fileExists(url: string) {
  if(url){
    try {
      var req = new XMLHttpRequest();
      req.open('GET', url, false);
      req.send();
    } catch (err) {
      return false;
    }
    return req.status==200;
  } else {
    return false;
  }
}