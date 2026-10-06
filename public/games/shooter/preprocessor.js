const tsc = require('typescript');
const tsConfig = require('./tsconfig.json');

module.exports = {
  process (src, path) {
    const isTsFile = path.endsWith('.ts');

    if (isTsFile) {
      return tsc.transpile(
        src,
        tsConfig.compilerOptions,
        path,
        []
      );
    }
    return src;
  }
};
