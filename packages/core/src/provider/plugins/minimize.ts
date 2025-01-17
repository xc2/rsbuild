import { CHAIN_ID, type RspackBuiltinsConfig } from '@rsbuild/shared';
import type { RsbuildPlugin, NormalizedConfig } from '../../types';

const getJsMinimizerOptions = (config: NormalizedConfig) => {
  const options: RspackBuiltinsConfig['minifyOptions'] = {};

  const { removeConsole } = config.performance;

  if (removeConsole === true) {
    options.dropConsole = true;
  } else if (Array.isArray(removeConsole)) {
    const pureFuncs = removeConsole.map((method) => `console.${method}`);
    options.pureFuncs = pureFuncs;
  }

  switch (config.output.legalComments) {
    case 'inline':
      options.comments = 'some';
      options.extractComments = false;
      break;
    case 'linked':
      options.extractComments = true;
      break;
    case 'none':
      options.comments = false;
      options.extractComments = false;
      break;
    default:
      break;
  }

  options.asciiOnly = config.output.charset === 'ascii';

  return options;
};

export const pluginMinimize = (): RsbuildPlugin => ({
  name: 'rsbuild:minimize',

  setup(api) {
    api.modifyBundlerChain(async (chain, { isProd }) => {
      const config = api.getNormalizedConfig();
      const isMinimize = isProd && !config.output.disableMinimize;

      // set minimize to allow users to disable minimize
      chain.optimization.minimize(isMinimize);

      if (!isMinimize) {
        return;
      }

      const { SwcJsMinimizerRspackPlugin, SwcCssMinimizerRspackPlugin } =
        await import('@rspack/core');

      chain.optimization
        .minimizer(CHAIN_ID.MINIMIZER.JS)
        .use(SwcJsMinimizerRspackPlugin, [getJsMinimizerOptions(config)])
        .end()
        .minimizer(CHAIN_ID.MINIMIZER.CSS)
        .use(SwcCssMinimizerRspackPlugin, [])
        .end();
    });
  },
});
