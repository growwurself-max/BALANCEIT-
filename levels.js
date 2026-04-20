(function () {
  function buildLevels() {
    var levels = [];
    var i;

    for (i = 1; i <= 10; i += 1) {
      levels.push({
        id: i,
        target: 2 + i,
        difficulty: "simple",
        label: "Exact match"
      });
    }

    var mediumValues = [8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 10, 7, 6];
    for (i = 0; i < mediumValues.length; i += 1) {
      levels.push({
        id: 11 + i,
        target: mediumValues[i],
        difficulty: "combo",
        label: "Use combinations"
      });
    }

    var hardValues = [17, 14, 19, 12, 20, 18, 11, 16, 15, 13, 9, 7, 10, 8, 6, 5, 4, 3, 20, 19, 18, 17, 16, 15, 14];
    for (i = 0; i < hardValues.length; i += 1) {
      levels.push({
        id: 26 + i,
        target: hardValues[i],
        difficulty: "tricky",
        label: "Tricky values"
      });
    }

    return levels;
  }

  function getDailyChallenge() {
    var now = new Date();
    var stamp = now.getUTCFullYear() + "-" + (now.getUTCMonth() + 1) + "-" + now.getUTCDate();
    var seed = 0;
    var idx;
    for (idx = 0; idx < stamp.length; idx += 1) {
      seed = (seed * 31 + stamp.charCodeAt(idx)) % 9973;
    }
    var target = 3 + (seed % 18);
    return { dateKey: stamp, target: target };
  }

  window.Levels = {
    all: buildLevels(),
    getDailyChallenge: getDailyChallenge
  };
})();
