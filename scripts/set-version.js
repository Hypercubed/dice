const { join } = require('path');
const angularConfig = require('../angular.json');
const packageJson = require('../package.json');
const semverParse = require('semver/functions/parse');
const fs = require('fs');
const { run } = require('./gh-pages.js');

let project = undefined;
if (!project) {
  project = angularConfig.defaultProject;
}

const version = `v${semverParse(packageJson.version).major}`;
const source =
  angularConfig.projects[project].architect.build.options.outputPath;

const dir = source + '_' + version;
const target = join(process.cwd(), dir);

try {
  fs.mkdirSync(target);
} catch (e) {
  if (e.code !== 'EEXIST') {
    throw e;
  }
}

const html = ` <html xmlns="http://www.w3.org/1999/xhtml">    
<head>      
  <title>DICE</title>      
  <meta http-equiv="refresh" content="0; URL=./${version}/" />   
</head>    
<body> 
  <p>If you are not redirected in five seconds, <a href="./${version}/">click here</a>.</p> 
</body>  
</html> `;

fs.writeFileSync(join(target, 'index.html'), html);

run({
  dir,
  add: true,
});
