const { join } = require('path');
const angularConfig = require('./angular.json');
const packageJson = require('./package.json');
const semverParse = require('semver/functions/parse');
const fs = require('fs');

let project = undefined;
if (!project) {
  project = angularConfig.defaultProject;
}

const version = `v${semverParse(packageJson.version).major}`;
const source =
  angularConfig.projects[project].architect.build.options.outputPath;

const original = join(__dirname, source);
const temp = join(__dirname, source + '_' + version);
const target = join(__dirname, source, version);

fs.renameSync(original, temp);
fs.mkdirSync(original);
fs.renameSync(temp, target);

const content = `<meta http-equiv="refresh" content="0; URL=./${version}/" />`;

fs.writeFileSync(join(original, 'index.html'), content);
fs.writeFileSync(join(original, '404.html'), content);
