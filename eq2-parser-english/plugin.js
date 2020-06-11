let playerName = null;

const tests = [
  {
    quick: ["sct"],
    expr: /sct/,
    action: context => {
      console.log("~ plugin match", context);
    }
  },
  {
    quick: ["hit", "hits"],
    expr: /(YOU|YOUR (.+?)) (hits?|multi attack) (.+?) for (a (.+?)?critical of)? ([0-9]+?) ([a-z]+?) damage./,
    action: ({ match, registerDamage }) => {
      let [, sourceName, abilityName, , targetName, , , amount, type] = match;
      if (sourceName === "YOU" && playerName) {
        sourceName = playerName;
      }
      registerDamage({ sourceName, abilityName, targetName, amount, type });
    }
  }
];

/**
 * When this plugin is active, this function will be called on each new line received.
 * @param {PluginContext}
 * @returns {void}
 */
function plugin(context) {
  tests.forEach(test => {
    // Fail fast, do a quick string check
    if (!test.quick.some(quick => context.line.includes(quick))) return;
    // If there's no expression to match against, just process the action
    if (!test.expr) {
      test.action(context);
      return;
    }
    // Otherwise match against the expression and process the action with the match
    const match = test.expr.exec(context.line);
    if (!match) return;
    test.action({ ...context, match });
  });
}

/**
 * Provides a schema that the plugin settings form will use.
 * @param {PluginContext}
 * @returns {object[]}
 */
function settingsSchema(context) {
  const [, inferredPlayerName] =
    /eq2log_(.+?)\.txt/.exec(context.logFilePath) || [];
  playerName = inferredPlayerName;
  return [
    {
      id: "playerName",
      type: "string",
      label: "Character name",
      description: "The name of your character.",
      defaultValue: playerName,
      updateOn: ["logFilePath"]
    },
    {
      id: "playerPetName",
      type: "string",
      label: "Pet name",
      description: "The name of your pet, so damage can be attributed to you.",
      defaultValue: playerName,
      updateOn: ["logFilePath"]
    },
    {
      id: "encounterTimeout",
      type: "number",
      label: "Encounter timeout (ms)",
      description:
        "The amount of time between the last combat hit being registered and the encounter ending.",
      defaultValue: 4000
    }
  ];
}

/**
 * Information about the plugin.
 * @param {PluginContext} context
 * @returns {PluginManifest}
 */
function manifest(context) {
  return {
    id: "eq2-parser-english",
    name: "EQ2 Parser (English)",
    version: "0.1.0"
  };
}

/**
 * Plugin must export `manifest` and `plugin` at a minimum.
 */
module = {
  plugin,
  settingsSchema,
  manifest
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
