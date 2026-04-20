(function () {
  var firebaseConfig = window.FIREBASE_CONFIG || null;
  var app = null;
  var db = null;
  var roomRef = null;
  var unsubs = [];

  var state = {
    enabled: false,
    connected: false,
    roomCode: "",
    isHost: false,
    playerId: localStorage.getItem("balanceit_player_id") || ("p_" + Math.random().toString(36).slice(2, 10)),
    playerName: localStorage.getItem("balanceit_player_name") || "Player",
    roomData: null
  };
  localStorage.setItem("balanceit_player_id", state.playerId);

  function initFirebase() {
    if (!firebaseConfig || !window.firebase) {
      return false;
    }
    if (!window.firebase.apps.length) {
      app = window.firebase.initializeApp(firebaseConfig);
    } else {
      app = window.firebase.app();
    }
    db = window.firebase.database(app);
    state.enabled = true;
    return true;
  }

  function randomCode() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
    var out = "";
    for (var i = 0; i < 4; i += 1) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }

  function scoreAttempt(target, answer) {
    var diff = Math.abs(target - answer);
    if (diff === 0) return { points: 10, label: "Perfect ✅" };
    if (diff <= 1) return { points: 7, label: "Very Close 🔥" };
    if (diff <= 3) return { points: 5, label: "Close 👍" };
    return { points: 0, label: "Wrong ❌" };
  }

  function cleanupListeners() {
    unsubs.forEach(function (u) {
      if (typeof u === "function") u();
    });
    unsubs = [];
  }

  function observeRoom(onUpdate) {
    cleanupListeners();
    if (!roomRef) return;
    var handler = function (snap) {
      state.roomData = snap.val();
      onUpdate(state.roomData);
    };
    roomRef.on("value", handler);
    unsubs.push(function () {
      roomRef.off("value", handler);
    });
  }

  async function createRoom(playerName) {
    if (!state.enabled) throw new Error("Firebase is not configured.");
    state.playerName = playerName || state.playerName;
    localStorage.setItem("balanceit_player_name", state.playerName);

    var code = randomCode();
    var ref = db.ref("rooms/" + code);
    var snapshot = await ref.get();
    while (snapshot.exists()) {
      code = randomCode();
      ref = db.ref("rooms/" + code);
      snapshot = await ref.get();
    }

    var players = {};
    players[state.playerId] = { id: state.playerId, name: state.playerName, score: 0, lastAnswer: -1 };
    await ref.set({
      code: code,
      hostId: state.playerId,
      status: "lobby",
      state: "lobby",
      createdAt: Date.now(),
      round: 0,
      totalRounds: 5,
      currentWeight: 0,
      roundEndAt: 0,
      players: players,
      submissions: {},
      roundResults: {},
      finalRanking: []
    });

    roomRef = ref;
    state.roomCode = code;
    state.isHost = true;
    state.connected = true;
    return code;
  }

  async function joinRoom(code, playerName) {
    if (!state.enabled) throw new Error("Firebase is not configured.");
    state.playerName = playerName || state.playerName;
    localStorage.setItem("balanceit_player_name", state.playerName);

    var normalized = (code || "").trim().toUpperCase();
    var ref = db.ref("rooms/" + normalized);
    var snap = await ref.get();
    if (!snap.exists()) throw new Error("Room not found.");
    var data = snap.val();
    var playerCount = Object.keys(data.players || {}).length;
    if (playerCount >= 4 && !(data.players && data.players[state.playerId])) {
      throw new Error("Room is full.");
    }
    if (data.status !== "lobby" && !data.players[state.playerId]) {
      throw new Error("Match already started.");
    }
    await ref.child("players/" + state.playerId).set({
      id: state.playerId,
      name: state.playerName,
      score: data.players && data.players[state.playerId] ? data.players[state.playerId].score || 0 : 0,
      lastAnswer: -1
    });
    roomRef = ref;
    state.roomCode = normalized;
    state.isHost = data.hostId === state.playerId;
    state.connected = true;
    return normalized;
  }

  async function startMatch() {
    if (!state.isHost) throw new Error("Only host can start.");
    var data = (await roomRef.get()).val();
    var players = data.players || {};
    if (Object.keys(players).length < 2) throw new Error("Need at least 2 players.");
    Object.keys(players).forEach(function (id) {
      players[id].score = 0;
      players[id].lastAnswer = -1;
    });
    console.log("[Firebase] Starting match", { room: state.roomCode, playersCount: Object.keys(players).length });
    await roomRef.update({ players: players, status: "playing", state: "playing", round: 0, finalRanking: [] });
    await nextRound();
  }

  async function nextRound() {
    if (!state.isHost) return;
    var snap = await roomRef.get();
    var data = snap.val();
    var next = (data.round || 0) + 1;
    var target = 3 + Math.floor(Math.random() * 18);
    var endAt = Date.now() + 10000;
    await roomRef.update({
      round: next,
      currentWeight: target,
      roundEndAt: endAt,
      submissions: {},
      roundResults: {}
    });
  }

  async function submitAnswer(total) {
    if (!roomRef) return;
    await roomRef.child("submissions/" + state.playerId).set({
      answer: total,
      at: Date.now()
    });
  }

  async function hostFinalizeRoundIfReady() {
    if (!state.isHost || !roomRef || !state.roomData || state.roomData.status !== "playing") return;
    if (Date.now() < (state.roomData.roundEndAt || 0)) return;

    var data = (await roomRef.get()).val();
    if (!data || data.status !== "playing") return;

    var players = data.players || {};
    var submissions = data.submissions || {};
    var results = {};
    var target = data.currentWeight;
    Object.keys(players).forEach(function (id) {
      var ans = submissions[id] ? Number(submissions[id].answer) : -999;
      var outcome = scoreAttempt(target, ans);
      players[id].score = Number(players[id].score || 0) + outcome.points;
      players[id].lastAnswer = ans;
      results[id] = { answer: ans, points: outcome.points, label: outcome.label };
    });

    var updates = { players: players, roundResults: results };
    if ((data.round || 0) >= (data.totalRounds || 5)) {
      var ranking = Object.values(players).sort(function (a, b) { return b.score - a.score; });
      updates.status = "finished";
      updates.finalRanking = ranking;
    }
    await roomRef.update(updates);
    if ((data.round || 0) < (data.totalRounds || 5)) {
      setTimeout(nextRound, 2200);
    }
  }

  async function leaveRoom() {
    if (roomRef && state.playerId) {
      var ref = roomRef;
      var isHost = state.isHost;
      var roomCode = state.roomCode;
      await ref.child("players/" + state.playerId).remove();
      if (isHost) {
        var snap = await ref.get();
        var data = snap.val();
        if (!data || !data.players || Object.keys(data.players).length === 0) {
          await db.ref("rooms/" + roomCode).remove();
        } else {
          var newHost = Object.keys(data.players)[0];
          await ref.update({ hostId: newHost });
        }
      }
    }
    cleanupListeners();
    roomRef = null;
    state.roomCode = "";
    state.isHost = false;
    state.connected = false;
    state.roomData = null;
  }

  window.MultiplayerManager = {
    state: state,
    initFirebase: initFirebase,
    observeRoom: observeRoom,
    createRoom: createRoom,
    joinRoom: joinRoom,
    startMatch: startMatch,
    nextRound: nextRound,
    submitAnswer: submitAnswer,
    hostFinalizeRoundIfReady: hostFinalizeRoundIfReady,
    leaveRoom: leaveRoom,
    scoreAttempt: scoreAttempt
  };
})();
