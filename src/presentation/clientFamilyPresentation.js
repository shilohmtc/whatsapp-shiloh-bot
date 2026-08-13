const { applyClientFamilyCopy } = require('../config/clientFamilyCopy');

function presentClientFamilyResult(result) {
  if (!result?.interactive?.body) return result;
  return {
    ...result,
    interactive: {
      ...result.interactive,
      body: applyClientFamilyCopy(result.interactive.body),
    },
  };
}

module.exports = { presentClientFamilyResult };
