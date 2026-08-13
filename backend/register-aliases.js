const moduleAlias = require('module-alias');

// Register all path aliases to point to the dist/ folder
moduleAlias.addAliases({
  '@config': __dirname + '/dist/config',
  '@controllers': __dirname + '/dist/controllers',
  '@services': __dirname + '/dist/services',
  '@middleware': __dirname + '/dist/middleware',
  '@routes': __dirname + '/dist/routes',
  '@repositories': __dirname + '/dist/repositories',
  '@lib': __dirname + '/dist/lib',
  '@models': __dirname + '/dist/types',
  '@utils': __dirname + '/dist/utils',
});
