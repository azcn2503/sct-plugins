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

function plugin(context) {
  tests.forEach(test => {
    if (!test.quick.some(quick => context.line.includes(quick))) return;
    if (!test.expr) {
      test.action(context);
      return;
    }
    const match = test.expr.exec(context.line);
    if (!match) return;
    test.action({ ...context, match });
  });
}

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
      defaultValue: playerName
    },
    {
      id: "playerPetName",
      type: "string",
      label: "Pet name",
      description: "The name of your pet, so damage can be attributed to you.",
      defaultValue: playerName
    },
    {
      id: "encounterTimeout",
      type: "number",
      label: "Encounter timeout (ms)",
      description:
        "The amount of time between the last combat hit being registered and the encounter ending.",
      defaultValue: "4000"
    }
  ];
}

function manifest(context) {
  return {
    id: "eq2-parser-english",
    name: "EQ2 Parser (English)",
    version: "0.1.0"
  };
}

module = {
  plugin,
  settingsSchema,
  manifest
};
