const path = require('path');
const engine = require('angular-cli-ghpages/engine/engine');
const angularConfig = require('../angular.json');

const consoleLogger = {
  createChild: () => consoleLogger,
  log: console.log,
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
  fatal: console.error,
};

module.exports.run = function run(options) {
  const _options = {
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
    ...options,
  };

  const dir = path.join(process.cwd(), _options.dir);
  engine.run(dir, _options, consoleLogger).catch(function (error) {
    consoleLogger.error('❌ An error occurred when trying to deploy:');
    consoleLogger.error(error.message);
    process.exit(1);
  });
};
