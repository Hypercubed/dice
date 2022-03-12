const path = require('path');
const engine = require('angular-cli-ghpages/engine/engine');
const angularConfig = require('./angular.json');
const packageJson = require('./package.json');
const semverParse = require('semver/functions/parse');

let project = undefined;
if (!project) {
  project = angularConfig.defaultProject;
}

const consoleLogger = {
  createChild: () => consoleLogger,
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
  fatal: console.error
};

const options = {
  dir: angularConfig.projects[project].architect.build.options.outputPath,
  repo: undefined,
  message: 'Auto-generated commit [ci skip]',
  branch: 'gh-pages',
  name: undefined,
  email: undefined,
  silent: true,
  dotfiles: true,
  cname: undefined,
  dryRun: false,
  remote: 'origin',
  git: 'git',
  dest: `v${semverParse(packageJson.version).major}`,
}

const dir = path.join(process.cwd(), options.dir);
engine.run(dir, options, consoleLogger).catch(function (error) {
  consoleLogger.error('❌ An error occurred when trying to deploy:');
  consoleLogger.error(error.message);
  process.exit(1);
});