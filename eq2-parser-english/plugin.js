let playerName = null;

function playerOrPet(name, plugin) {
  let resolved = { name: name, pet: false };
  if (name === "YOU" || name === "YOUR") {
    resolved.name = plugin.settings.playerName;
  } else if (name === plugin.settings.playerPetName) {
    resolved.name = plugin.settings.playerName;
    resolved.pet = true;
  }
  return resolved;
}

const rules = [
  {
    scanReverse: true,
    quick: ["You have entered"],
    expr: /\(([0-9]+)\)\[[\S]{3} [\S]{3}  ?[0-9]{1,2} [0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2} [0-9]{4}\] You have entered (.+?)\./,
    action: ({ match, setZoneName, setPluginReady }) => {
      const [, timestamp, zoneName] = match || [];
      setZoneName(zoneName);
      setPluginReady();
    }
  },

  // Something hits a player?
  {
    quick: ["hits"],
    expr: /\(([0-9]+)\)\[[\S]{3} [\S]{3}  ?[0-9]{1,2} [0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2} [0-9]{4}\] (.+?)(?:\'s (.+?))? hits (YOU|[A-Za-z]+?) for ([0-9]+?) ([a-z]+?) damage\./,
    action: ({ match, registerDamage, plugin }) => {
      let [, timestamp, sourceName, abilityName, targetName, amount, type] =
        match || [];
      const { name: resolvedTargetName, pet } = playerOrPet(targetName, plugin);
      registerDamage({
        sourceName,
        abilityName,
        targetName: resolvedTargetName,
        type,
        timestamp,
        amount,
        pet
      });
    }
  },

  // You, your pet, or another player hit something
  {
    quick: ["hit", "hits"],
    expr: /\(([0-9]+)\)\[[\S]{3} [\S]{3}  ?[0-9]{1,2} [0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2} [0-9]{4}\] (YOUR?|[\S]{4,}?)('s)? (.+?)?hits? (.+?) ((for (a (Legendary|Fabled|Mythical)? ?critical of)? ?([0-9]+?) ([a-z]+?) damage)|(but fails to inflict any damage))\./,
    action: ({ match, registerDamage, plugin }) => {
      let [
        ,
        timestamp, // 1
        sourceName, // 2 // 3
        ,
        abilityName, // 4
        targetName, // 5
        damageOrFailString, // 6
        damageString, // 7
        critical, // 8
        criticalType, // 9
        amount, // 10
        type, // 11
        fail // 12
      ] = match || [];
      const { name: resolvedSourceName, pet: resolvedPet } = playerOrPet(
        sourceName,
        plugin
      );
      registerDamage({
        sourceName: resolvedSourceName,
        abilityName,
        targetName,
        amount: fail ? 0 : +amount,
        type,
        timestamp,
        critical: Boolean(critical),
        criticalType,
        fail: Boolean(fail),
        pet: resolvedPet
      });
    }
  }
];

const scanReverseRules = rules.filter(rule => rule.scanReverse);

function executeRuleWithContext(rule, context) {
  // Fail fast, do a quick string check
  if (!rule.quick.some(quick => context.line.includes(quick))) return;
  // If there's no expression to match against, just process the action
  if (!rule.expr) {
    return rule.action(context);
  }
  // Otherwise match against the expression and process the action with the match
  const match = rule.expr.exec(context.line);
  if (!match) return;
  return rule.action({ ...context, match });
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
    },
    {
      id: "zoneName",
      type: "string",
      label: "Zone name",
      description: "The zone name",
      hidden: true
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

function scanReverse(context) {
  if (!scanReverseRules) return;
  scanReverseRules.forEach(rule => {
    executeRuleWithContext(rule, context);
  });
}

function init(context) {
  context.initScanReverse();
}

/**
 * Plugin must export `manifest` and `plugin` at a minimum.
 */
module = {
  plugin,
  settingsSchema,
  manifest,
  scanReverse,
  init
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
