const angularConfig = require('../project.json');
const packageJson = require('../package.json');
const semverParse = require('semver/functions/parse');
const { run } = require('./gh-pages.js');

let project = undefined;
if (!project) {
  project = angularConfig.defaultProject;
}

const dir = angularConfig.targets.build.options.outputPath;
const dest = `v${semverParse(packageJson.version).major}`;

run({
  dir,
  dest,
});
