let playerName = null;

const rules = [
  {
    action: ({ parsed, registerDamage }) => {
      if (parsed !== undefined) {
        const { amount } = parsed;
        registerDamage({
          amount,
        });
      }
    },
  },
];

function executeRuleWithContext(rule, context) {
  try {
    const parsed = JSON.parse(context.line.trim());
    rule.action({ ...context, parsed });
  } catch (ex) {
    console.error("Error executing rule with context", ex);
  }
}

/**
 * When this plugin is active, this function will be called on each new line received.
 * @param {PluginContext}
 * @returns {void}
 */
function plugin(context) {
  rules.forEach(rule => {
    executeRuleWithContext(rule, context);
  });
}

/**
 * Information about the plugin.
 * @param {PluginContext} context
 * @returns {PluginManifest}
 */
function manifest(context) {
  return {
    id: "test",
    name: "Test Parser",
    version: "0.1.0",
  };
}

/**
 * Plugin must export `manifest` and `plugin` at a minimum.
 */
module = {
  plugin,
  manifest,
};

/**
 * @typedef PluginContext
 * @type {object}
 * @property {string} line - the current line of data being processed by the plugin
 * @property {string} logFilePath - path to the currently monitored log file
 */

/**
 * @typedef PluginManifest
 * @type {object}
 * @property {string} id - unique ID that cannot be shared between plugins
 * @property {string} name - friendly name
 * @property {string} version - version string
 */
