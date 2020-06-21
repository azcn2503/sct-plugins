const plugin = require("./plugin.js");

const playerReceivesDamageRule = plugin.rules.find(
  ({ testId }) => testId === "player-receives-damage"
);
const playerDealsDamageRule = plugin.rules.find(
  ({ testId }) => testId === "player-deals-damage"
);

const context = {
  registerDamage: () => null,
  plugin: {
    settings: {
      playerName: "TestPlayerName",
      playerPetName: "TestPlayerPetName"
    }
  }
};

describe("rules", () => {
  describe("player receives damage", () => {
    test("player receives typed damage from an enemy ability", () => {
      expect(
        plugin.executeRuleWithContext(playerReceivesDamageRule, {
          ...context,
          line:
            "(1592548572)[Fri Jun 19 07:36:12 2020] an eternal sentry's Prismatic Aura hits YOU for 4908406 divine damage."
        }).enriched
      ).toEqual({
        abilityName: "Prismatic Aura",
        amount: 4908406,
        sourceName: "an eternal sentry",
        targetName: context.plugin.settings.playerName,
        timestamp: "1592548572",
        type: "divine"
      });
    });
  });

  describe("player deals damage", () => {
    test("player deals critical damage to enemy with an ability", () => {
      expect(
        plugin.executeRuleWithContext(playerDealsDamageRule, {
          ...context,
          line:
            "(1592548575)[Fri Jun 19 07:36:15 2020] YOUR Healing Barrage hits an eternal sentry for a critical of 569895173 piercing damage."
        }).enriched
      ).toMatchObject({
        abilityName: "Healing Barrage",
        amount: 569895173,
        critical: true,
        fail: false,
        pet: false,
        sourceName: context.plugin.settings.playerName,
        targetName: "an eternal sentry",
        timestamp: "1592548575",
        type: "piercing"
      });
    });

    test("player deals legendary critical damage to enemy with an ability", () => {
      expect(
        plugin.executeRuleWithContext(playerDealsDamageRule, {
          ...context,
          line:
            "(1592548575)[Fri Jun 19 07:36:15 2020] YOUR Healing Barrage hits an eternal sentry for a Legendary critical of 569895173 piercing damage."
        }).enriched
      ).toMatchObject({
        abilityName: "Healing Barrage",
        amount: 569895173,
        critical: true,
        criticalType: "Legendary",
        targetName: "an eternal sentry"
      });
    });

    test("YOU is enriched to players configured name", () => {
      expect(
        plugin.executeRuleWithContext(playerDealsDamageRule, {
          ...context,
          line:
            "(1592548575)[Fri Jun 19 07:36:15 2020] YOUR Healing Barrage hits an eternal sentry for a Legendary critical of 569895173 piercing damage."
        }).enriched
      ).toMatchObject({
        sourceName: context.plugin.settings.playerName
      });
    });
  });
});
