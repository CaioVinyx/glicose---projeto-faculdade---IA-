(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const W = canvas.width;
  const H = canvas.height;
  ctx.imageSmoothingEnabled = false;

  const keys = new Set();
  const pressed = new Set();
  let mouseX = 0, mouseY = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const state = {
    mode: "title",
    scene: 0,
    level: -1,
    cameraX: 0,
    cameraY: 0,
    shake: 0,
    flash: 0,
    time: 0,
    transition: 0,
    dialogue: null,
    particles: [],
    floatText: [],
    projectiles: [],
    enemies: [],
    hazards: [],
    ants: 0,
    storyStage: 0,
    storyCue: "door",
    carOverTimer: 0,
    cardSelect: null,
    cardsDone: new Set(),
    sugarPulse: 0,
    audio: null,
    audioOn: false,
    pausedForDialogue: false
  };

  const player = {
    x: 90,
    y: 370,
    w: 42,
    h: 64,
    vx: 0,
    vy: 0,
    hp: 8,
    maxHp: 8,
    onGround: false,
    face: 1,
    attack: 0,
    inv: 0,
    sugar: 100,
    slow: 0,
    dropThrough: 0,
    shield: 0,
    shieldCd: 0,
    attackBonus: 0
  };

  const levels = [
    {
      name: "CONSULTÓRIO DA NUTRICIONISTA",
      short: "Fase 1",
      theme: "clinic",
      length: 2300,
      floor: 430,
      colors: ["#eff7ef", "#badbd8", "#6baaa4"],
      boss: "DOUTORA FITNESSA",
      bossHp: 42,
      bossColor: "#63ff85",
      portalX: 2070,
      intro: [
        ["Velho", "Primeiro andar: consultório. A guardiã não gosta de açúcar."],
        ["Protagonista", "Eu só preciso passar..."],
        ["Velho", "Vá com cuidado."]
      ],
      bossTalk: [
        ["Doutora Fitnessa", "Açúcar? Aqui não se passa."],
        ["Protagonista", "Eu preciso continuar!"],
        ["Doutora Fitnessa", "NINGUÉM passa com carboidrato na minha guarda!"]
      ],
      death: "A Doutora Fitnessa é derrotada. O caminho está aberto."
    },
    {
      name: "REINO DE CARAMELO",
      short: "Fase 2",
      theme: "candy",
      length: 2500,
      floor: 420,
      colors: ["#ff9ed7", "#ffd166", "#8f4bd8"],
      boss: "LORDE PIRULATRIX",
      bossHp: 55,
      bossColor: "#ff4fb8",
      portalX: 2230,
      intro: [
        ["Bala de Canela", "Cuidado. Aqui tudo é adocicado... e perigoso."],
        ["Protagonista", "Que lugar estranho..."],
        ["Bala de Canela", "Ninguém atravessa o reino do Lorde Pirulatrix facilmente."]
      ],
      bossTalk: [
        ["Lorde Pirulatrix", "Você ousou entrar no meu reino!"],
        ["Protagonista", "Só quero sair daqui."],
        ["Lorde Pirulatrix", "Isso não vai acontecer!"]
      ],
      death: "O Lorde Pirulatrix derrete. O reino de caramelo se acalma."
    },
    {
      name: "NAVIO DO CAPITÃO BARBA-MELAÇO",
      short: "Fase 3",
      theme: "ship",
      length: 2600,
      floor: 405,
      colors: ["#37202a", "#c87535", "#ffcf73"],
      boss: "ALMIRANTE BARBA-MELAÇO",
      bossHp: 62,
      bossColor: "#d36b31",
      portalX: 2340,
      intro: [
        ["Pirata Doce", "Bem-vindo ao mar de melaço. Não há saída daqui."],
        ["Protagonista", "Sempre há uma saída."],
        ["Pirata Doce", "O Almirante vai te mostrar o contrário."]
      ],
      bossTalk: [
        ["Almirante Barba-Melaço", "ESSE AÇÚCAR É MEU TESOURO!"],
        ["Protagonista", "Preciso dele para voltar para casa."],
        ["Almirante Barba-Melaço", "ENTÃO VOCÊ TERÁ QUE ME VENCER!"]
      ],
      death: "O Almirante Barba-Melaço afunda com seu navio."
    },
    {
      name: "FORMIGUEIRO INFINITO",
      short: "Fase 4",
      theme: "ant",
      length: 2400,
      floor: 425,
      colors: ["#120d17", "#38243e", "#d6f77a"],
      boss: "IMPERADOR MANDIBULON",
      bossHp: 66,
      bossColor: "#9fe870",
      portalX: 2140,
      intro: [
        ["Olhos no Escuro", "...tik tik tik..."],
        ["Protagonista", "Que lugar sombrio..."],
        ["Formiga", "AÇÚCAR DETECTADO. PREPARE-SE."]
      ],
      bossTalk: [
        ["Imperador Mandibulon", "IRMÃS... O BANQUETE COMEÇOU."],
        ["Protagonista", "Eu não sou comida!"],
        ["Imperador Mandibulon", "PARA NÓS... VOCÊ É."]
      ],
      death: "O Imperador Mandibulon cai. As formigas recuam."
    },
    {
      name: "CIDADE DA MASMORRA",
      short: "Fase 5",
      theme: "city",
      length: 2700,
      floor: 415,
      colors: ["#263a7a", "#ffcf59", "#5dd7c8"],
      boss: "MESTRE PACOQUINHO",
      bossHp: 72,
      bossColor: "#f0b64b",
      portalX: 2430,
      intro: [
        ["Beka", "Você parece exausto."],
        ["Protagonista", "Estou tentando voltar para casa."],
        ["Beka", "Eu conheço o caminho. Vou com você."]
      ],
      bossTalk: [
        ["Mestre Pacoquinho", "VOCÊ NÃO VAI PASSAR!"],
        ["Protagonista", "Precisamos continuar."],
        ["Beka", "Vamos enfrentá-lo juntos!"]
      ],
      death: "Mestre Pacoquinho é vencido. A passagem está livre."
    },
    {
      name: "O AÇÚCAR AMALDIÇOADO",
      short: "Final",
      theme: "void",
      length: 2100,
      floor: 410,
      colors: ["#ffffff", "#ffd6ef", "#6e42ff"],
      boss: "O REI GLICOSE",
      bossHp: 96,
      bossColor: "#fff5a8",
      portalX: 1900,
      intro: [
        ["Pacote de Açúcar", "pip... pip... pip..."],
        ["Velho", "Era ele. O açúcar manipulou tudo desde o início."],
        ["Protagonista", "Preciso acabar com isso."],
        ["Beka", "Estamos juntos até o fim."]
      ],
      bossTalk: [
        ["O Rei Glicose", "VOCÊ ME CONSUMIU POR ANOS..."],
        ["O Rei Glicose", "AGORA EU CONSUMIREI VOCÊ!"],
        ["Protagonista", "Isso acaba aqui."]
      ],
      death: "O Rei Glicose se dissolve. A maldição é quebrada."
    }
  ];

  const titleLines = [
    ["Mãe", "Vai ao mercado comprar açúcar."],
    ["Protagonista", "Tá bom..."],
    ["Narrador", "No mercado, algo estranho acontece."],
    ["Funcionário", "Tem um açúcar especial aqui. Bem mais barato."],
    ["Protagonista", "Esse pacote está... se mexendo?"],
    ["Narrador", "Um portal se abre. A criança é sugada para dentro."],
    ["Velho", "Você foi parar na dimensão do açúcar amaldiçoado."],
    ["Protagonista", "Eu só queria comprar açúcar!"],
    ["Velho", "Atravesse seis andares, vença os guardiões e volte para casa."]
  ];

  const prologueScenes = [
    {
      name: "CASA DO PROTAGONISTA",
      theme: "home",
      width: 1180,
      height: 720,
      spawnX: 180,
      spawnY: 480,
      goal: { x: 1010, y: 60, w: 130, h: 550 },
      hint: "Saia pela porta iluminada à direita",
      intro: [
        ["Mãe", "Vai ao mercado comprar açúcar."],
        ["Protagonista", "Tá bom, mãe."],
        ["Mãe", "Leva o dinheiro. E volta logo."]
      ]
    },
    {
      name: "RUA DO MERCADO",
      theme: "street",
      width: 1680,
      height: 880,
      spawnX: 120,
      spawnY: 500,
      goal: { x: 1470, y: 290, w: 110, h: 210 },
      hint: "Atravesse a rua até o mercado",
      intro: [
        ["Protagonista", "O mercado fica por aqui..."],
        ["Narrador", "A rua está estranhamente quieta hoje."]
      ]
    },
    {
      name: "MERCADO LIMINAL",
      theme: "market",
      width: 1320,
      height: 760,
      spawnX: 120,
      spawnY: 610,
      employee: { x: 660, y: 270, w: 80, h: 100 },
      sugar: { x: 1050, y: 280, w: 80, h: 100 },
      hint: "Fale com o funcionário e pegue o açúcar",
      intro: [
        ["Protagonista", "Que mercado esquisito..."],
        ["Narrador", "As luzes piscam. Algo parece muito errado aqui."]
      ]
    },
    {
      name: "FLORESTA DO VELHO",
      theme: "forest",
      width: 1220,
      height: 780,
      spawnX: 170,
      spawnY: 575,
      goal: { x: 960, y: 280, w: 110, h: 160 },
      hint: "Vá até o portal depois do velho",
      intro: [
        ["Velho", "Você foi parar na dimensão do açúcar amaldiçoado."],
        ["Protagonista", "O quê? Eu só vim ao mercado!"],
        ["Velho", "Para voltar, atravesse seis andares e vença os guardiões."],
        ["Protagonista", "E se eu não conseguir?"],
        ["Velho", "Você consegue. Entre pelo portal."]
      ]
    }
  ];

  const endingLines = [
    ["Mãe", "Finalmente! Demorou tanto..."],
    ["Protagonista", "Aconteceu muita coisa, mãe."],
    ["Mãe", "Trouxe o açúcar?"],
    ["Protagonista", "...sim."],
    ["Narrador", "O pacote pulsa suavemente dentro do armário."]
  ];

  function makeAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext || state.audio) return;
    const ac = new AudioContext();
    const master = ac.createGain();
    master.gain.value = 0.055;
    master.connect(ac.destination);
    state.audio = { ac, master, beat: 0, next: ac.currentTime };
  }

  function beep(freq, dur = 0.08, type = "square", gain = 0.05) {
    if (!state.audioOn || !state.audio) return;
    const { ac, master } = state.audio;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.connect(g);
    g.connect(master);
    osc.start();
    osc.stop(ac.currentTime + dur);
  }

  function music() {
    if (!state.audioOn || !state.audio) return;
    const { ac } = state.audio;
    while (state.audio.next < ac.currentTime + 0.08) {
      const scale = [196, 233, 262, 311, 349, 392, 466, 523];
      const i = (state.audio.beat + Math.max(0, state.level) * 2) % scale.length;
      const bass = scale[i] / 2;
      beep(state.audio.beat % 4 === 0 ? bass : scale[(i + 2) % scale.length], 0.045, state.audio.beat % 8 === 0 ? "sawtooth" : "square", 0.025);
      state.audio.beat++;
      state.audio.next += state.mode === "boss" ? 0.15 : 0.22;
    }
  }

  function startDialogue(lines, after) {
    state.dialogue = { lines, i: 0, chars: 0, after };
    state.pausedForDialogue = true;
    beep(330, 0.05);
  }

  function advanceDialogue() {
    const d = state.dialogue;
    if (!d) return false;
    const text = d.lines[d.i][1];
    if (d.chars < text.length) {
      d.chars = text.length;
      return true;
    }
    d.i++;
    d.chars = 0;
    beep(420, 0.04);
    if (d.i >= d.lines.length) {
      const after = d.after;
      state.dialogue = null;
      state.pausedForDialogue = false;
      if (after) after();
    }
    return true;
  }

  function resetPlayer(x = 90) {
    player.x = x;
    player.y = 300;
    player.vx = 0;
    player.vy = 0;
    player.hp = player.maxHp;
    player.sugar = 40;
    player.inv = 0;
    player.slow = 0;
    player.dropThrough = 0;
    player.shield = 0;
    player.shieldCd = 0;
  }

  function startPrologue() {
    state.level = -1;
    state.mode = "prologue";
    state.storyStage = 0;
    state.enemies = [];
    state.hazards = [];
    state.projectiles = [];
    state.particles = [];
    state.floatText = [];
    state.boss = null;
    state.cardSelect = null;
    state.cardsDone = new Set();
    player.attackBonus = 0;
    player.maxHp = 8;
    enterPrologueStage(0);
  }

  function enterPrologueStage(index) {
    const scene = prologueScenes[index];
    state.storyStage = index;
    state.cameraX = 0;
    state.cameraY = 0;
    state.storyCue = index === 2 ? "employee" : index === 3 ? "oldman" : "goal";
    resetPlayer(scene.spawnX);
    player.y = scene.spawnY;
    player.vy = 0;
    player.onGround = true;
    statusEl.textContent = `Prologo: ${scene.name}`;
    startDialogue(scene.intro, null);
  }

  function startLevel(i) {
    state.level = i;
    state.mode = "play";
    state.enemies = [];
    state.hazards = [];
    state.projectiles = [];
    state.particles = [];
    state.floatText = [];
    state.ants = 0;
    state.cardSelect = null;
    resetPlayer();
    spawnLevel(i);
    if ((i === 2 || i === 5) && !state.cardsDone.has(i)) {
      state.cardSelect = { hovered: 0, cooldown: 0.35 };
    } else {
      startDialogue(levels[i].intro, null);
    }
    statusEl.textContent = `${levels[i].short}: ${levels[i].name}`;
  }

  function applyCard(choice) {
    state.cardsDone.add(state.level);
    if (choice === 0) {
      player.attackBonus += 1;
      addText(player.x, player.y - 32, "+1 ATAQUE!", "#ff8844");
    } else {
      player.maxHp += 2;
      player.hp = Math.min(player.hp + 2, player.maxHp);
      addText(player.x, player.y - 32, "+2 HP!", "#44ee66");
    }
    state.cardSelect = null;
    startDialogue(levels[state.level].intro, null);
  }

  function spawnLevel(i) {
    const level = levels[i];
    const names = {
      clinic: ["Mini Nutri", "Laser de Couve", "Balanca Julgadora"],
      candy: ["Bala de Canela", "Chiclete Mutante", "Marshmallow Briguento"],
      ship: ["Pirata Jujuba", "Barril Recheado", "Gaivota de Calda"],
      ant: ["Formiga Ladra", "Tunel Vivo", "Olho Acucarado"],
      city: ["Forno Vivo", "Pao Voador", "Marmita Dramatica"],
      void: ["Eco Fitnessa", "Eco Pirulatrix", "Erro de Sobremesa"]
    }[level.theme];
    const enemyCount = i === 0 ? 3 : 7;
    for (let n = 0; n < enemyCount; n++) {
      state.enemies.push(makeEnemy(360 + n * 245, level.floor - 48, names[n % names.length], i, n));
    }
    const platPositions = [320, 620, 920, 1220, 1520, 1800];
    platPositions.forEach((px, idx) => {
      state.hazards.push({ x: px, y: level.floor - 105, w: 110, h: 14, kind: idx % 3 });
    });
  }

  function makeEnemy(x, y, name, levelIndex, variant = 0) {
    return {
      x,
      y,
      w: 48,
      h: 48,
      vx: Math.random() > 0.5 ? 0.8 : -0.8,
      hp: 8 + levelIndex * 2,
      name,
      hurt: 0,
      stun: 0,
      shoot: rnd(0.8, 2.5),
      type: ["shooter", "bouncer", "charger"][variant % 3],
      color: ["#68e36f", "#ff6666", "#cc8cff", "#ffc947", "#65dbff", "#ffffff"][levelIndex]
    };
  }

  function startBoss() {
    const level = levels[state.level];
    state.mode = "boss";
    state.enemies = [];
    state.projectiles = [];
    state.boss = {
      x: player.x + 500,
      y: level.floor - 122,
      w: state.level === 5 ? 154 : 118,
      h: state.level === 5 ? 142 : 116,
      hp: level.bossHp,
      maxHp: level.bossHp,
      phase: 1,
      timer: 0,
      pattern: 0,
      special: 0,
      hurt: 0,
      face: -1
    };
    const heal = Math.floor(player.maxHp * 0.5);
    player.hp = Math.min(player.maxHp, player.hp + heal);
    addText(player.x, player.y - 32, `+${heal} HP`, "#6aff78");
    startDialogue(level.bossTalk, null);
    statusEl.textContent = `BOSS: ${level.boss}`;
    state.flash = 0.55;
    state.shake = 14;
  }

  function completeBoss() {
    const level = levels[state.level];
    explode(state.boss.x + state.boss.w / 2, state.boss.y + state.boss.h / 2, level.bossColor, 80);
    state.shake = 24;
    state.flash = 0.75;
    startDialogue([["Narrador", level.death]], () => {
      if (state.level === levels.length - 1) {
        state.mode = "ending";
        startDialogue(endingLines, () => {
          state.mode = "credits";
          statusEl.textContent = "Fim... por enquanto.";
        });
      } else {
        startLevel(state.level + 1);
      }
    });
  }

  function spawnProjectile(x, y, vx, vy, kind, fromBoss = false, friendly = false) {
    state.projectiles.push({ x, y, w: 16, h: 16, vx, vy, kind, fromBoss, friendly, life: 5 });
  }

  function hurtPlayer(dmg = 1) {
    if (player.inv > 0 || player.shield > 0) return;
    player.hp -= dmg;
    player.inv = 2.0;
    state.shake = 10;
    state.flash = 0.25;
    beep(90, 0.12, "sawtooth", 0.07);
    addText(player.x, player.y - 18, "AI!", "#ff5d73");
    if (player.hp <= 0) {
      startDialogue([
        ["Protagonista", "Fui derrotado..."],
        ["Velho", "Levante-se. Você ainda não terminou."]
      ], () => startLevel(Math.max(0, state.level)));
    }
  }

  function addText(x, y, text, color = "#fff") {
    state.floatText.push({ x, y, text, color, life: 1 });
  }

  function explode(x, y, color, count = 24) {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x,
        y,
        vx: rnd(-180, 180),
        vy: rnd(-220, 80),
        size: rnd(2, 7),
        color,
        life: rnd(0.35, 1.2)
      });
    }
  }

  function drawRect(x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function pixelBlock(x, y, gx, gy, gw, gh, color, scale = 4) {
    drawRect(x + gx * scale, y + gy * scale, gw * scale, gh * scale, color);
  }

  function drawPixelBoy(x, y, flip = 1, blink = false) {
    const walk = Math.abs(player.vx) > 18 && player.onGround ? Math.sin(state.time * 13) : 0;
    const armSwing = Math.round(walk * 2);
    ctx.save();
    ctx.translate(Math.round(x + player.w / 2), Math.round(y));
    ctx.scale(flip, 1);
    const sx = -32;
    const sy = 0;
    drawRect(sx + 10, sy + 58, 44, 7, "rgba(0,0,0,0.22)");
    pixelBlock(sx, sy, 4, 1, 8, 1, "#201525");
    pixelBlock(sx, sy, 3, 2, 10, 2, "#2c1728");
    pixelBlock(sx, sy, 4, 4, 8, 4, "#f6c585");
    pixelBlock(sx, sy, 3, 4, 2, 2, "#2c1728");
    pixelBlock(sx, sy, 11, 4, 2, 2, "#2c1728");
    pixelBlock(sx, sy, 5, 6, 1, 1, blink ? "#f6c585" : "#11111d");
    pixelBlock(sx, sy, 10, 6, 1, 1, blink ? "#f6c585" : "#11111d");
    pixelBlock(sx, sy, 7, 8, 2, 1, "#9b4050");
    pixelBlock(sx, sy, 5, 9, 6, 1, "#3b2f6f");
    pixelBlock(sx, sy, 4, 10, 8, 5, "#4169ff");
    pixelBlock(sx, sy, 5, 10, 6, 1, "#6ac7ff");
    pixelBlock(sx, sy, 3, 11 + armSwing, 2, 4, "#f6c585");
    pixelBlock(sx, sy, 11, 11 - armSwing, 2, 4, "#f6c585");
    pixelBlock(sx, sy, 5, 15, 3, 1, "#18182c");
    pixelBlock(sx, sy, 8, 15, 3, 1, "#18182c");
    pixelBlock(sx, sy, 5, 16, 2, 1, "#ffe27a");
    pixelBlock(sx, sy, 9, 16, 2, 1, "#ffe27a");
    if (player.attack > 0) {
      // Swing: espada horizontal com arco de corte
      ctx.globalAlpha = 0.28;
      drawRect(10, 16, 62, 40, "#c8e8ff");
      ctx.globalAlpha = 0.6;
      drawRect(14, 22, 56, 3, "#ffffff");
      drawRect(12, 48, 58, 3, "#ffffff");
      ctx.globalAlpha = 1;
      drawRect(7, 36, 13, 7, "#7a5c3a");
      drawRect(6, 28, 8, 24, "#888888");
      drawRect(18, 37, 52, 8, "#d8d8d8");
      drawRect(66, 35, 7, 12, "#f4f4f4");
    } else {
      // Idle: espada apontando para cima na mão da frente
      drawRect(17, 5, 5, 39, "#d8d8d8");
      drawRect(18, 3, 3, 5, "#f4f4f4");
      drawRect(9, 42, 22, 6, "#888888");
      drawRect(15, 46, 8, 16, "#7a5c3a");
    }
    ctx.restore();
  }

  function drawBeka(x, y) {
    const bob = Math.sin(state.time * 9) * 2;
    drawRect(x + 10, y + 58, 44, 7, "rgba(0,0,0,0.2)");
    pixelBlock(x, y + bob, 4, 1, 8, 1, "#26112f");
    pixelBlock(x, y + bob, 3, 2, 10, 3, "#2f163e");
    pixelBlock(x, y + bob, 4, 4, 8, 4, "#f5b0ff");
    pixelBlock(x, y + bob, 5, 6, 1, 1, "#101020");
    pixelBlock(x, y + bob, 10, 6, 1, 1, "#101020");
    pixelBlock(x, y + bob, 6, 8, 4, 1, "#ff4f8f");
    pixelBlock(x, y + bob, 4, 9, 8, 6, "#ff4f8f");
    pixelBlock(x, y + bob, 2, 10, 2, 4, "#f5b0ff");
    pixelBlock(x, y + bob, 12, 10, 2, 4, "#f5b0ff");
    pixelBlock(x, y + bob, 5, 15, 2, 2, "#202040");
    pixelBlock(x, y + bob, 9, 15, 2, 2, "#202040");
  }

  function drawMom(x, y) {
    pixelBlock(x, y, 4, 1, 8, 2, "#5b2b45");
    pixelBlock(x, y, 5, 3, 6, 4, "#eebf88");
    pixelBlock(x, y, 5, 5, 1, 1, "#101020");
    pixelBlock(x, y, 10, 5, 1, 1, "#101020");
    pixelBlock(x, y, 6, 7, 4, 1, "#8e314c");
    pixelBlock(x, y, 4, 8, 8, 7, "#f0577a");
    pixelBlock(x, y, 2, 9, 2, 5, "#eebf88");
    pixelBlock(x, y, 12, 9, 2, 5, "#eebf88");
    pixelBlock(x, y, 5, 15, 2, 2, "#4b2540");
    pixelBlock(x, y, 9, 15, 2, 2, "#4b2540");
  }

  function drawEmployee(x, y) {
    const twitch = Math.sin(state.time * 30) > 0.85 ? 2 : 0;
    pixelBlock(x, y + twitch, 4, 1, 8, 2, "#1f2233");
    pixelBlock(x, y + twitch, 4, 3, 8, 4, "#d8d0bd");
    pixelBlock(x, y + twitch, 5, 5, 1, 2, "#15151f");
    pixelBlock(x, y + twitch, 10, 5, 1, 2, "#15151f");
    pixelBlock(x, y + twitch, 6, 7, 4, 1, "#6a1f39");
    pixelBlock(x, y + twitch, 3, 8, 10, 7, "#2fbc6b");
    pixelBlock(x, y + twitch, 6, 9, 4, 2, "#fff6d0");
    pixelBlock(x, y + twitch, 2, 10, 2, 5, "#d8d0bd");
    pixelBlock(x, y + twitch, 12, 10, 2, 5, "#d8d0bd");
    pixelBlock(x, y + twitch, 5, 15, 2, 2, "#191927");
    pixelBlock(x, y + twitch, 9, 15, 2, 2, "#191927");
  }

  function drawOldMan(x, y) {
    pixelBlock(x, y, 3, 3, 10, 2, "#ffe27a");
    pixelBlock(x, y, 5, 4, 6, 4, "#d8b077");
    pixelBlock(x, y, 4, 6, 8, 3, "#ffffff");
    pixelBlock(x, y, 5, 5, 1, 1, "#15151f");
    pixelBlock(x, y, 10, 5, 1, 1, "#15151f");
    pixelBlock(x, y, 4, 9, 8, 5, "#7c62ff");
    pixelBlock(x, y, 2, 11, 2, 3, "#d8b077");
    pixelBlock(x, y, 12, 11, 2, 3, "#d8b077");
    pixelBlock(x, y, 2, 14, 12, 1, "#ff7b54");
    pixelBlock(x, y, 1, 15, 2, 2, "#68d8ff");
    pixelBlock(x, y, 13, 15, 2, 2, "#68d8ff");
  }

  function drawSugarBag(x, y) {
    const pulse = Math.sin(state.time * 8) * 2;
    drawRect(x + 11 - pulse, y + 8 - pulse, 42 + pulse * 2, 54 + pulse * 2, "#fff4d1");
    drawRect(x + 16, y + 20, 32, 18, "#ffde59");
    drawRect(x + 20, y + 25, 24, 4, "#25172c");
    drawRect(x + 22, y + 33, 20, 4, "#25172c");
    if (state.storyCue === "sugar") {
      drawRect(x + 5, y + 2, 54, 66, "rgba(255, 79, 184, 0.22)");
    }
  }

  function drawEnemy(e) {
    const bob = Math.sin(state.time * 7 + e.x) * 3;
    const stunBlink = e.stun > 0 && Math.floor(state.time * 14) % 2 === 0;
    const c = (e.hurt > 0 || stunBlink) ? "#ffffff" : e.color;
    const ex = e.x - 8;
    const ey = e.y - 8 + bob;
    drawRect(e.x + 4, e.y + 44 + bob, 40, 5, "rgba(0,0,0,0.18)");

    if (e.type === "shooter") {
      // Olho voador: corpo oval com olhao e canhao
      pixelBlock(ex, ey, 3, 3, 11, 7, c);
      pixelBlock(ex, ey, 2, 4, 13, 5, c);
      pixelBlock(ex, ey, 4, 2, 9, 1, c);
      // Olho central grande
      pixelBlock(ex, ey, 4, 3, 9, 6, "#0a0a10");
      pixelBlock(ex, ey, 5, 4, 7, 4, "#4af3ff");
      pixelBlock(ex, ey, 7, 5, 3, 2, "#ffffff");
      pixelBlock(ex, ey, 8, 5, 1, 1, "#0a0a10");
      // Canhao vira com direcao
      const fr = player.x + player.w / 2 >= e.x + e.w / 2;
      if (fr) {
        pixelBlock(ex, ey, 14, 6, 4, 2, "#888888");
        pixelBlock(ex, ey, 17, 7, 2, 1, "#444");
      } else {
        pixelBlock(ex, ey, -1, 6, 4, 2, "#888888");
        pixelBlock(ex, ey, -2, 7, 2, 1, "#444");
      }
      // Tentaculos
      pixelBlock(ex, ey, 5, 10, 1, 3, c);
      pixelBlock(ex, ey, 8, 10, 2, 2, c);
      pixelBlock(ex, ey, 11, 10, 1, 3, c);
    } else if (e.type === "bouncer") {
      // Monstro gordo: largo, boca enorme com dentes, atira em arco
      pixelBlock(ex, ey, 1, 1, 15, 11, c);
      pixelBlock(ex, ey, 2, 0, 13, 1, c);
      pixelBlock(ex, ey, 0, 2, 1, 9, c);
      pixelBlock(ex, ey, 16, 2, 1, 9, c);
      // Dois olhos pequenos hostis
      pixelBlock(ex, ey, 3, 2, 3, 2, "#0a0a10");
      pixelBlock(ex, ey, 11, 2, 3, 2, "#0a0a10");
      pixelBlock(ex, ey, 4, 2, 1, 1, "#ff5555");
      pixelBlock(ex, ey, 12, 2, 1, 1, "#ff5555");
      // Boca larga com dentes
      pixelBlock(ex, ey, 2, 7, 13, 5, "#0a0a10");
      pixelBlock(ex, ey, 3, 8, 2, 3, c);
      pixelBlock(ex, ey, 7, 8, 3, 3, c);
      pixelBlock(ex, ey, 12, 8, 2, 3, c);
      // Pezinhos
      pixelBlock(ex, ey, 3, 12, 2, 2, c);
      pixelBlock(ex, ey, 12, 12, 2, 2, c);
    } else {
      // Besta cornuda: corpo robusto, chifres na direcao do movimento, olhos irritados
      pixelBlock(ex, ey, 3, 4, 11, 8, c);
      // Chifres (viram com direcao)
      const gr = e.vx >= 0;
      if (gr) {
        pixelBlock(ex, ey, 12, 2, 4, 2, c);
        pixelBlock(ex, ey, 14, 1, 3, 1, "#ff5555");
        pixelBlock(ex, ey, 12, 6, 4, 2, c);
        pixelBlock(ex, ey, 14, 5, 3, 1, "#ff5555");
      } else {
        pixelBlock(ex, ey, 1, 2, 4, 2, c);
        pixelBlock(ex, ey, 0, 1, 3, 1, "#ff5555");
        pixelBlock(ex, ey, 1, 6, 4, 2, c);
        pixelBlock(ex, ey, 0, 5, 3, 1, "#ff5555");
      }
      // Olhos vermelhos irritados
      pixelBlock(ex, ey, 4, 5, 3, 2, "#0a0a10");
      pixelBlock(ex, ey, 10, 5, 3, 2, "#0a0a10");
      pixelBlock(ex, ey, 4, 5, 2, 1, "#ff4444");
      pixelBlock(ex, ey, 11, 5, 2, 1, "#ff4444");
      // Boca fechada raivosa
      pixelBlock(ex, ey, 5, 9, 7, 1, "#0a0a10");
      // Pernas robustas
      pixelBlock(ex, ey, 4, 12, 3, 2, c);
      pixelBlock(ex, ey, 10, 12, 3, 2, c);
    }

    if (state.level === 0) {
      drawRect(e.x - 12, e.y + 2 + bob, 8, 20, "#eafff0");
      drawRect(e.x - 10, e.y + 6 + bob, 4, 4, "#ff4f4f");
    }
    if (state.level === 3) {
      drawRect(e.x + 10, e.y - 14 + bob, 3, 12, "#d6f77a");
      drawRect(e.x + 28, e.y - 14 + bob, 3, 12, "#d6f77a");
      drawRect(e.x + 7, e.y - 17 + bob, 8, 5, "#d6f77a");
      drawRect(e.x + 25, e.y - 17 + bob, 8, 5, "#d6f77a");
    }
  }

  function drawBoss(b) {
    const level = levels[state.level];
    const pulse = Math.sin(state.time * 8) * 5;
    const angry = b.phase === 2;
    const bc = b.hurt > 0 ? "#ffffff" : level.bossColor;
    const shadow = b.hurt > 0 ? "#ffffff" : "#141420";
    // Sombra no chao
    drawRect(b.x + 10, b.y + b.h + pulse + 4, b.w - 20, 10, "rgba(0,0,0,0.22)");
    // Corpo principal
    drawRect(b.x, b.y + pulse, b.w, b.h, bc);
    // Borda interna (da profundidade)
    drawRect(b.x + 4, b.y + 4 + pulse, b.w - 8, b.h - 8, b.hurt > 0 ? "#ffffffaa" : "rgba(0,0,0,0.18)");
    // Olhos (dinamicos: se irritado os olhos sao maiores e vermelhos)
    const eyeW = angry ? 22 : 18;
    const eyeCol = angry ? "#ff2222" : shadow;
    const pupilCol = angry ? "#ffffff" : "#6af3ff";
    drawRect(b.x + 16, b.y + 22 + pulse, eyeW, eyeW, eyeCol);
    drawRect(b.x + b.w - 16 - eyeW, b.y + 22 + pulse, eyeW, eyeW, eyeCol);
    drawRect(b.x + 20, b.y + 26 + pulse, eyeW - 8, eyeW - 8, pupilCol);
    drawRect(b.x + b.w - 12 - eyeW, b.y + 26 + pulse, eyeW - 8, eyeW - 8, pupilCol);
    // Boca
    const mouthY = angry ? b.y + 68 + pulse : b.y + 72 + pulse;
    const mouthH = angry ? 14 : 10;
    drawRect(b.x + 28, mouthY, b.w - 56, mouthH, shadow);
    if (angry) drawRect(b.x + 32, mouthY + 4, b.w - 64, 6, "#ff5555");
    // Decoracoes por fase
    if (state.level === 0) {
      drawRect(b.x - 28, b.y + 32 + pulse, 36, 52, "#eafff0");
      drawRect(b.x - 20, b.y + 44 + pulse, 20, 6, "#ff5d73");
      drawRect(b.x + b.w - 8, b.y + 24 + pulse, 42, 56, "#eafff0");
    }
    if (state.level === 1) {
      for (let i = 0; i < 6; i++) {
        const hw = angry ? 14 : 10;
        drawRect(b.x + 18 + i * 14, b.y - 20 + pulse + Math.sin(state.time * 6 + i) * 4, hw, 24, ["#ff3f7f", "#ffe85c", "#5ce7ff"][i % 3]);
      }
    }
    if (state.level === 2) {
      drawRect(b.x + b.w - 14, b.y + 48 + pulse, 62, 22, "#4b251c");
      drawRect(b.x + b.w + 40, b.y + 50 + pulse, 10, 10, "#c87535");
    }
    if (state.level === 4 && angry) drawRect(b.x + 18, b.y - 22 + pulse, b.w - 36, 18, "#e43b44");
    if (state.level === 5) {
      const orbs = angry ? 12 : 8;
      for (let i = 0; i < orbs; i++) {
        const ax = b.x + b.w / 2 + Math.cos(state.time * 2.2 + i * ((Math.PI * 2) / orbs)) * (100 + i * 4);
        const ay = b.y + b.h / 2 + Math.sin(state.time * 2.2 + i * ((Math.PI * 2) / orbs)) * (50 + i * 3);
        ctx.globalAlpha = 0.5;
        drawRect(ax - 3, ay - 3, 24, 24, "#ffffff");
        ctx.globalAlpha = 1;
        drawRect(ax, ay, 18, 18, "#ffffff");
        drawRect(ax + 5, ay + 5, 8, 8, angry ? "#ff2222" : "#6e42ff");
      }
    }
  }

  function drawBackground(level) {
    const c = level ? level.colors : ["#1a1730", "#35204a", "#ffde59"];
    const theme = level ? level.theme : "home";
    const t = state.time;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, c[0]);
    grad.addColorStop(0.58, c[1]);
    grad.addColorStop(1, "#12121e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (theme === "clinic") {
      for (let x = -80; x < W + 120; x += 130) {
        drawRect(x - (state.cameraX * 0.25) % 130, 70, 70, 28, "#dff5f2");
        drawRect(x - (state.cameraX * 0.45) % 130, 150, 100, 14, "#ffffff");
        drawRect(x - (state.cameraX * 0.55) % 130, 260, 78, 52, "#b9d9d6");
      }
      drawRect(60, 118 + Math.sin(t * 18) * 2, 92, 8, "#78fff0");
    } else if (theme === "candy") {
      for (let x = -60; x < W + 140; x += 120) {
        drawRect(x - (state.cameraX * 0.2) % 120, 300, 18, 90, "#8f4bd8");
        drawRect(x + 4 - (state.cameraX * 0.2) % 120, 242, 70, 70, "#ff4fb8");
        drawRect(x + 18 - (state.cameraX * 0.2) % 120, 256, 42, 42, "#fff06b");
      }
      drawRect(0, 448, W, 34, "#6b2b7a");
    } else if (theme === "ship") {
      for (let x = -100; x < W + 180; x += 180) drawRect(x - (state.cameraX * 0.2) % 180, 250 + Math.sin(t + x) * 12, 130, 22, "#f2aa57");
      drawRect(0, 435, W, 70, "#3c1721");
    } else if (theme === "ant") {
      for (let i = 0; i < 90; i++) {
        const x = (i * 97 - state.cameraX * 0.35) % (W + 80) - 40;
        const y = 60 + (i * 43) % 290;
        drawRect(x, y, 5, 5, i % 3 ? "#d6f77a" : "#fff7a8");
      }
    } else if (theme === "city") {
      for (let x = -80; x < W + 160; x += 120) {
        drawRect(x - (state.cameraX * 0.35) % 120, 190, 82, 220, "#263a7a");
        drawRect(x + 14 - (state.cameraX * 0.35) % 120, 218, 16, 16, "#ffcf59");
        drawRect(x + 50 - (state.cameraX * 0.35) % 120, 270, 16, 16, "#5dd7c8");
      }
    } else if (theme === "void") {
      for (let i = 0; i < 36; i++) {
        drawRect((i * 83 + Math.sin(t + i) * 20 - state.cameraX * 0.1) % W, (i * 59 + t * 18) % H, 42, 4, i % 2 ? "#6e42ff" : "#ff4fb8");
      }
    } else {
      drawRect(60, 250, 180, 150, "#422b36");
      drawRect(280, 220, 190, 180, "#734b3b");
      drawRect(640, 250, 110, 145, "#1c1b2e");
    }
  }

  function prologueObstacles(scene) {
    if (scene.theme === "home") {
      return [
        { x: 80, y: 82, w: 1030, h: 28 },
        { x: 80, y: 642, w: 1030, h: 28 },
        { x: 70, y: 82, w: 28, h: 588 },
        { x: 1082, y: 82, w: 28, h: 190 },
        { x: 1082, y: 455, w: 28, h: 215 },
        { x: 130, y: 250, w: 210, h: 118 },
        { x: 390, y: 155, w: 180, h: 110 },
        { x: 650, y: 370, w: 250, h: 70 },
        { x: 710, y: 145, w: 130, h: 120 }
      ];
    }
    if (scene.theme === "street") {
      return [
        { x: 0, y: 0, w: 1680, h: 70 },
        { x: 0, y: 810, w: 1680, h: 70 },
        { x: 250, y: 145, w: 170, h: 170 },
        { x: 620, y: 115, w: 200, h: 190 },
        { x: 1030, y: 130, w: 190, h: 170 },
        { x: 1470, y: 88, w: 170, h: 170 }
      ];
    }
    if (scene.theme === "market") {
      return [
        { x: 0, y: 0, w: 1320, h: 70 },
        { x: 0, y: 0, w: 60, h: 760 },
        { x: 1260, y: 0, w: 60, h: 760 },
        { x: 120, y: 120, w: 210, h: 120 },
        { x: 420, y: 120, w: 210, h: 120 },
        { x: 820, y: 120, w: 210, h: 120 },
        { x: 150, y: 420, w: 240, h: 100 },
        { x: 470, y: 420, w: 240, h: 100 },
        { x: 810, y: 420, w: 190, h: 100 }
      ];
    }
    return [
      { x: 0, y: 0, w: 1220, h: 60 },
      { x: 0, y: 720, w: 1220, h: 60 },
      { x: 0, y: 0, w: 55, h: 780 },
      { x: 1165, y: 0, w: 55, h: 780 },
      { x: 185, y: 170, w: 120, h: 110 },
      { x: 420, y: 500, w: 170, h: 120 },
      { x: 770, y: 145, w: 130, h: 105 },
      { x: 710, y: 620, w: 150, h: 90 }
    ];
  }

  function drawTopHero(x, y) {
    const walk = Math.abs(player.vx) + Math.abs(player.vy) > 35 ? Math.sin(state.time * 12) : 0;
    const bob = Math.round(Math.abs(walk) * 2);
    drawRect(x + 3, y + 57, 48, 8, "rgba(0,0,0,0.24)");
    pixelBlock(x - 5, y - bob, 4, 1, 8, 1, "#201525");
    pixelBlock(x - 5, y - bob, 3, 2, 10, 2, "#2c1728");
    pixelBlock(x - 5, y - bob, 4, 4, 8, 4, "#f6c585");
    pixelBlock(x - 5, y - bob, 5, 6, 1, 1, "#11111d");
    pixelBlock(x - 5, y - bob, 10, 6, 1, 1, "#11111d");
    pixelBlock(x - 5, y - bob, 7, 8, 2, 1, "#9b4050");
    pixelBlock(x - 5, y - bob, 4, 9, 8, 5, "#4169ff");
    pixelBlock(x - 5, y - bob, 3, 10 + Math.round(walk), 2, 4, "#f6c585");
    pixelBlock(x - 5, y - bob, 11, 10 - Math.round(walk), 2, 4, "#f6c585");
    pixelBlock(x - 5, y - bob, 5, 14, 2, 3, "#18182c");
    pixelBlock(x - 5, y - bob, 9, 14, 2, 3, "#18182c");
    pixelBlock(x - 5, y - bob, 5, 16, 2, 1, "#ffe27a");
    pixelBlock(x - 5, y - bob, 9, 16, 2, 1, "#ffe27a");
  }

  function drawTopMap(scene) {
    const t = state.time;
    if (scene.theme === "home") {
      drawRect(0, 0, scene.width, scene.height, "#1a1327");
      drawRect(80, 82, 1030, 588, "#7c4b5c");
      for (let x = 96; x < 1100; x += 40) {
        for (let y = 100; y < 650; y += 40) drawRect(x, y, 22, 22, "#8f5a68");
      }
      drawRect(130, 250, 210, 118, "#45263b");
      drawRect(152, 270, 166, 34, "#ff7b9a");
      drawRect(390, 155, 180, 110, "#15151f");
      drawRect(410, 174, 140, 70, Math.sin(t * 10) > 0 ? "#65dbff" : "#263a7a");
      drawRect(650, 370, 250, 70, "#3a2434");
      drawRect(710, 145, 130, 120, "#503651");
      drawMom(690, 290);
      drawRect(scene.goal.x, scene.goal.y, scene.goal.w, scene.goal.h, "#26182f");
      const dX = scene.goal.x + 8, dY = 450, dW = 78, dH = 220;
      ctx.globalAlpha = 0.22 + Math.sin(t * 2.5) * 0.08;
      drawRect(dX - 12, dY - 12, dW + 24, dH + 12, "#ffe9a8");
      ctx.globalAlpha = 1;
      drawRect(dX - 6, dY - 6, dW + 12, dH + 6, "#2a1210");
      drawRect(dX, dY, dW, dH, "#7a4230");
      drawRect(dX + 8, dY + 10, dW - 16, 85, "#8f5238");
      drawRect(dX + 8, dY + 105, dW - 16, dH - 120, "#8f5238");
      drawRect(dX + dW - 18, dY + 120, 10, 10, "#ffd76d");
    } else if (scene.theme === "street") {
      drawRect(0, 0, scene.width, scene.height, "#2b2a4a");
      drawRect(0, 330, scene.width, 250, "#3e3f51");
      for (let x = 0; x < scene.width; x += 150) drawRect(x + 30, 448, 80, 12, "#ffe9a8");
      drawRect(0, 580, scene.width, 150, "#415d4d");
      drawRect(0, 190, scene.width, 105, "#6b4a75");
      for (let x = 120; x < 1340; x += 250) {
        drawRect(x, 130, 140, 160, "#4d334d");
        drawRect(x + 18, 170, 24, 24, "#ffd76d");
        drawRect(x + 82, 214, 24, 24, "#7bf5ff");
      }
      for (let x = 240; x < 1260; x += 340) {
        const carX = x + Math.sin(t * 1.7 + x) * 70;
        drawRect(carX, 372, 100, 52, "#ff4f8f");
        drawRect(carX + 18, 350, 58, 28, "#7bf5ff");
        drawRect(carX + 10, 420, 18, 18, "#11111f");
        drawRect(carX + 72, 420, 18, 18, "#11111f");
      }
      drawRect(scene.goal.x - 50, scene.goal.y - 135, 230, 340, "#4d334d");
      drawRect(scene.goal.x - 28, scene.goal.y - 108, 184, 52, "#ffde59");
      ctx.fillStyle = "#1b1523";
      ctx.font = "20px monospace";
      ctx.fillText("MERCADO", scene.goal.x + 6, scene.goal.y - 76);
      drawRect(scene.goal.x, scene.goal.y, scene.goal.w, scene.goal.h, "#151722");
    } else if (scene.theme === "market") {
      drawRect(0, 0, scene.width, scene.height, "#111723");
      for (let x = 80; x < scene.width; x += 80) {
        for (let y = 80; y < scene.height; y += 80) drawRect(x, y, 42, 42, "#182437");
      }
      const flicker = Math.sin(t * 28) > 0.18;
      for (let x = 110; x < scene.width - 80; x += 260) drawRect(x, 82, 150, 14, flicker ? "#d7fff9" : "#58656c");
      const shelves = prologueObstacles(scene).filter((r) => r.y > 80 && r.w > 120);
      shelves.forEach((s, i) => {
        drawRect(s.x, s.y, s.w, s.h, "#263244");
        drawRect(s.x + 14, s.y + 16, s.w - 28, 14, i % 2 ? "#ffde59" : "#ff4f8f");
        drawRect(s.x + 14, s.y + 54, s.w - 28, 14, "#65dbff");
      });
      drawEmployee(scene.employee.x, scene.employee.y);
      drawSugarBag(scene.sugar.x, scene.sugar.y);
      if (state.storyCue === "portal") drawPortal(scene.sugar.x + 42, scene.sugar.y - 52, "#ff4fb8");
    } else {
      drawRect(0, 0, scene.width, scene.height, "#142024");
      for (let i = 0; i < 120; i++) {
        const x = (i * 137) % scene.width;
        const y = (i * 91) % scene.height;
        drawRect(x, y, 36, 16, i % 2 ? "#2a6f6c" : "#285e65");
      }
      for (let x = 120; x < scene.width; x += 210) {
        drawRect(x, 185 + Math.sin(t + x) * 7, 58, 60, "#6fd6a2");
        drawRect(x + 22, 228, 16, 120, "#172a32");
      }
      drawRect(392, 476, 170, 18, "#ff7b54");
      drawRect(418, 430, 112, 52, "#68d8ff");
      drawOldMan(442, 374);
      drawPortal(scene.goal.x + 54, scene.goal.y - 22, "#6e42ff");
    }
  }

  function drawSideFloor(level) {
    const styles = {
      clinic: { base: "#e7fff8", stripe: "#79d7cd", trim: "#ffffff" },
      candy: { base: "#7b2f8f", stripe: "#ffde59", trim: "#ff9ed7" },
      ship: { base: "#4b251c", stripe: "#c87535", trim: "#ffcf73" },
      ant: { base: "#22112a", stripe: "#d6f77a", trim: "#38243e" },
      city: { base: "#263a7a", stripe: "#ffcf59", trim: "#5dd7c8" },
      void: { base: "#f8f4ff", stripe: "#6e42ff", trim: "#ff4fb8" }
    }[level.theme];
    drawRect(-120, level.floor, level.length + 360, 130, styles.base);
    if (level.theme === "clinic") {
      for (let x = -100; x < level.length + 260; x += 72) {
        drawRect(x, level.floor + 10, 52, 28, x % 144 === 0 ? "#d4f3ef" : "#ffffff");
        drawRect(x + 10, level.floor - 8, 40, 8, styles.stripe);
      }
    } else if (level.theme === "candy") {
      for (let x = -100; x < level.length + 260; x += 86) {
        drawRect(x, level.floor - 16, 70, 16, styles.trim);
        drawRect(x + 12, level.floor + 24, 46, 10, styles.stripe);
        drawRect(x + 27, level.floor - 38, 16, 22, "#ff4fb8");
      }
    } else if (level.theme === "ship") {
      for (let x = -120; x < level.length + 260; x += 100) {
        drawRect(x, level.floor, 80, 16, styles.stripe);
        drawRect(x + 6, level.floor + 38, 68, 6, "#2b1311");
        drawRect(x + 76, level.floor, 4, 105, "#2b1311");
      }
    } else if (level.theme === "ant") {
      for (let x = -120; x < level.length + 260; x += 92) {
        drawRect(x, level.floor + 12, 76, 22, "#120d17");
        drawRect(x + 14, level.floor - 6, 40, 6, styles.stripe);
        drawRect(x + 28, level.floor + 48, 18, 18, "#38243e");
      }
    } else if (level.theme === "city") {
      for (let x = -120; x < level.length + 260; x += 76) {
        drawRect(x, level.floor - 12, 52, 12, styles.stripe);
        drawRect(x + 6, level.floor + 24, 40, 18, "#1b2a5d");
        drawRect(x + 20, level.floor - 48, 16, 36, "#ff8f70");
      }
    } else {
      for (let x = -120; x < level.length + 260; x += 64) {
        drawRect(x + Math.sin(state.time * 5 + x) * 8, level.floor + 10, 46, 8, styles.stripe);
        drawRect(x + 12, level.floor - 30 + Math.cos(state.time * 4 + x) * 8, 26, 26, styles.trim);
      }
    }
  }

  function drawPrologueWorld() {
    const scene = prologueScenes[state.storyStage];
    const bg = scene.theme === "market" ? "#070a13" : scene.theme === "forest" ? "#0b1718" : "#120f20";
    drawRect(0, 0, W, H, bg);
    ctx.save();
    const shakeX = rnd(-state.shake, state.shake);
    const shakeY = rnd(-state.shake, state.shake);
    ctx.translate(-Math.round(state.cameraX) + shakeX, -Math.round(state.cameraY) + shakeY);
    drawTopMap(scene);
    state.particles.forEach((p) => drawRect(p.x, p.y, p.size, p.size, p.color));
    drawTopHero(player.x, player.y);
    state.floatText.forEach((f) => {
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "#000000";
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.restore();
    drawPrologueHud(scene);
  }

  function drawPrologueHud(scene) {
    drawRect(24, 22, 360, 50, "#11111c");
    drawRect(30, 28, 348, 38, "#26192e");
    ctx.fillStyle = "#ffde59";
    ctx.font = "14px monospace";
    ctx.fillText(`PROLOGO - ${scene.name}`, 42, 45);
    ctx.fillStyle = "#fff7d7";
    ctx.fillText(scene.hint, 42, 62);
  }

  function drawWorld() {
    const level = levels[state.level] || null;
    if (state.mode === "prologue") {
      drawPrologueWorld();
      if (state.dialogue) drawDialogue();
      if (state.flash > 0) {
        ctx.globalAlpha = clamp(state.flash, 0, 0.8);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      return;
    }
    drawBackground(level);
    ctx.save();
    const shakeX = rnd(-state.shake, state.shake);
    const shakeY = rnd(-state.shake, state.shake);
    ctx.translate(-Math.round(state.cameraX) + shakeX, shakeY);

    if (level) {
      drawSideFloor(level);
      state.hazards.forEach((p) => {
        const hc = ["#ffde59", "#71fff0", "#ff5d73", "#63ff85", "#ff4fb8", "#d36b31", "#d6f77a", "#65dbff"][p.kind % 8];
        drawRect(p.x, p.y, p.w, p.h, hc);
        if (p.kind >= 3) drawRect(p.x + 4, p.y + 4, Math.max(2, p.w - 8), Math.max(2, p.h - 8), "rgba(255,255,255,0.34)");
      });
      if (state.level === 4) {
        for (let x = 280; x < level.length; x += 360) {
          drawRect(x, level.floor - 88, 70, 80, "#ffcf59");
          drawRect(x + 9, level.floor - 58, 16, 16, "#261928");
          drawRect(x + 42, level.floor - 58, 16, 16, "#261928");
        }
        drawBeka(player.x - 64, player.y + 3 + Math.sin(state.time * 6) * 2);
      }
      drawPortal(level.portalX, level.floor - 104, level.colors[2]);
    }

    state.enemies.forEach(drawEnemy);
    if (state.boss && state.mode === "boss") drawBoss(state.boss);
    state.projectiles.forEach((p) => {
      const colors = ["#6aff78", "#ff4fb8", "#ffde59", "#d6f77a", "#61f7ff", "#ffffff"];
      const col = p.friendly ? "#ffd700" : colors[p.kind % colors.length];
      ctx.globalAlpha = 0.28;
      drawRect(p.x - 5, p.y - 5, p.w + 10, p.h + 10, col);
      ctx.globalAlpha = 0.6;
      drawRect(p.x - 2, p.y - 2, p.w + 4, p.h + 4, col);
      ctx.globalAlpha = 1;
      drawRect(p.x, p.y, p.w, p.h, col);
      drawRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8, "#ffffff");
    });
    drawPixelBoy(player.x, player.y, player.face, player.inv > 0 && Math.floor(state.time * 20) % 2 === 0);
    if (player.shield > 0) {
      const scx = player.x + player.w / 2;
      const scy = player.y + player.h / 2;
      const pulse = Math.sin(state.time * 7);
      const r = 46 + pulse * 5;
      ctx.globalAlpha = 0.18 + pulse * 0.08;
      ctx.fillStyle = "#ffd700";
      ctx.beginPath(); ctx.arc(scx, scy, r + 12, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.55 + pulse * 0.2;
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(scx, scy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = "#fffacc";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(scx, scy, r - 8, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
    }

    state.particles.forEach((p) => drawRect(p.x, p.y, p.size, p.size, p.color));
    state.floatText.forEach((f) => {
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "#000000";
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.restore();

    drawHud(level);
    if (state.dialogue) drawDialogue();
    if (state.mode === "title") drawTitle();
    if (state.mode === "credits") drawCredits();
    if (state.mode === "carover") drawCarOver();
    if (state.cardSelect) drawCardSelect();
    if (state.flash > 0) {
      ctx.globalAlpha = clamp(state.flash, 0, 0.8);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  function drawHud(level) {
    if (!level) return;
    const hpRatio = player.hp / player.maxHp;
    const hpCol = hpRatio > 0.5 ? "#ff456d" : hpRatio > 0.25 ? "#ff8c42" : "#ff2222";
    // Barra de HP
    drawRect(20, 18, 196, 30, "#0a0912");
    drawRect(22, 20, 192, 26, "#1a1228");
    drawRect(24, 22, Math.round(188 * hpRatio), 22, hpCol);
    ctx.fillStyle = "#fff7d7";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`HP ${player.hp}/${player.maxHp}`, 28, 37);
    // Barra de acucar
    drawRect(20, 52, 174, 24, "#0a0912");
    drawRect(22, 54, 170, 20, "#1a1228");
    drawRect(24, 56, Math.round(166 * (player.sugar / 100)), 16, "#ffde59");
    ctx.fillStyle = "#191320";
    ctx.font = "bold 11px monospace";
    const sugarShots = Math.floor(player.sugar / 20);
    ctx.fillText(`[K] AÇÚCAR x${sugarShots}`, 28, 68);
    // Barra do escudo
    const shieldReady = player.shieldCd <= 0;
    const shieldCol = player.shield > 0 ? "#ffd700" : shieldReady ? "#44ff99" : "#2255aa";
    const shieldRatio = player.shield > 0 ? player.shield / 3 : shieldReady ? 1 : 1 - player.shieldCd / 9;
    drawRect(20, 80, 148, 20, "#0a0912");
    drawRect(22, 82, 144, 16, "#1a1228");
    drawRect(24, 84, Math.round(140 * shieldRatio), 12, shieldCol);
    ctx.fillStyle = player.shield > 0 ? "#ffd700" : shieldReady ? "#44ff99" : "#aabbdd";
    ctx.font = "bold 10px monospace";
    ctx.fillText(player.shield > 0 ? `[L] ESCUDO ${Math.ceil(player.shield)}s` : shieldReady ? "[L] ESCUDO PRONTO" : `[L] ${Math.ceil(player.shieldCd)}s`, 26, 93);
    // Nome da fase
    ctx.fillStyle = "#fff7d7";
    ctx.font = "14px monospace";
    ctx.fillText(`${level.short} - ${level.name}`, 230, 36);
    // Barra do boss
    if (state.boss && state.mode === "boss") {
      const bRatio = state.boss.hp / state.boss.maxHp;
      drawRect(W - 365, 18, 350, 30, "#0a0912");
      drawRect(W - 363, 20, 346, 26, "#1a1228");
      drawRect(W - 361, 22, Math.round(342 * bRatio), 22, level.bossColor);
      ctx.fillStyle = "#fff7d7";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`BOSS: ${level.boss}`, W - 359, 37);
    }
  }

  function drawDialogue() {
    const d = state.dialogue;
    const [who, text] = d.lines[d.i];
    d.chars = Math.min(text.length, d.chars + 0.9);
    const displayText = text.slice(0, Math.floor(d.chars));
    // Caixa maior para evitar overflow de texto
    drawRect(28, H - 176, W - 56, 152, "#0d0b16");
    drawRect(34, H - 170, W - 68, 140, "#1e1428");
    drawRect(34, H - 170, W - 68, 3, "#4a2f6a");
    // Nome dinamico
    ctx.font = "bold 14px monospace";
    const nameW = Math.max(80, Math.min(ctx.measureText(who).width + 32, W - 100));
    drawRect(50, H - 162, nameW, 26, "#ffde59");
    drawRect(50, H - 162, nameW, 3, "#ffa800");
    ctx.fillStyle = "#191320";
    ctx.fillText(who.toUpperCase(), 60, H - 143);
    // Texto do dialogo
    ctx.fillStyle = "#fff7d7";
    ctx.font = "16px monospace";
    wrapText(displayText, 60, H - 114, W - 100, 22, 4);
    // Indicador de avanco
    if (d.chars >= text.length) {
      const pulse = Math.sin(state.time * 10) > 0;
      if (pulse) {
        ctx.fillStyle = "#ffde59";
        ctx.font = "13px monospace";
        ctx.fillText("▶ Enter", W - 120, H - 36);
      }
    }
  }

  function drawPortal(x, y, color) {
    const pulse = Math.sin(state.time * 7) * 7;
    drawRect(x - 18 - pulse * 0.4, y - pulse, 36 + pulse, 100 + pulse * 2, "#ffffff");
    drawRect(x - 10 - pulse * 0.25, y + 10 - pulse, 20 + pulse * 0.5, 80 + pulse * 2, color);
    drawRect(x - 3, y + 24, 6, 52, "#11111f");
    ctx.fillStyle = "#fff7d7";
    ctx.font = "14px monospace";
    ctx.fillText("PORTAL", x - 28, y - 10);
  }

  function drawTitle() {
    drawRect(0, 0, W, H, "rgba(9, 9, 20, 0.55)");
    ctx.fillStyle = "#ffde59";
    ctx.font = "72px monospace";
    ctx.fillText("GLICOSE", 310 + Math.sin(state.time * 4) * 5, 170);
    ctx.fillStyle = "#fff7d7";
    ctx.font = "22px monospace";
    ctx.fillText("um desenho jogavel sobre acucar, trauma e pao supremo", 150, 220);
    ctx.font = "18px monospace";
    ctx.fillText("Enter / clique: comecar  |  WASD/setas: mover  |  J: soco", 178, 300);
    ctx.fillText("Prologo top view. Mundo inverso side-scroller. Bosses malucos.", 178, 330);
  }

  function drawCredits() {
    drawRect(0, 0, W, H, "rgba(255, 245, 210, 0.9)");
    ctx.fillStyle = "#201526";
    ctx.font = "54px monospace";
    ctx.fillText("FIM?", 392, 150);
    ctx.font = "24px monospace";
    ctx.fillText("O armario pulsa lentamente.", 290, 220);
    ctx.font = "20px monospace";
    ctx.fillText("O consumo excessivo de acucar pode causar:", 238, 292);
    ctx.fillText("trauma | piratas | dimensoes paralelas | problemas psicologicos", 130, 326);
    drawRect(462 + Math.sin(state.time * 4) * 4, 365, 42, 60, "#fff4d1");
    drawRect(468 + Math.sin(state.time * 4) * 4, 380, 30, 18, "#ffde59");
  }

  function drawCardSelect() {
    const cs = state.cardSelect;
    const cw = 210, ch = 300, gap = 80;
    const sx = (W - (cw * 2 + gap)) / 2;
    const cy = (H - ch) / 2 - 10;

    // Detectar hover pelo mouse
    if (mouseX >= sx && mouseX <= sx + cw && mouseY >= cy && mouseY <= cy + ch) cs.hovered = 0;
    else if (mouseX >= sx + cw + gap && mouseX <= sx + cw * 2 + gap && mouseY >= cy && mouseY <= cy + ch) cs.hovered = 1;

    // Escurecer tudo
    ctx.globalAlpha = 0.87;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    // Título
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 30px monospace";
    ctx.fillText("ESCOLHA UMA MELHORIA", W / 2, cy - 28);

    const cards = [
      { title: "+1 ATAQUE", desc: ["Aumenta o dano", "da espada e dos", "projéteis em +1"], barCol: "#c43a1a", icon: "sword" },
      { title: "+2 HP MÁX",  desc: ["Aumenta o HP", "máximo e cura", "+2 de vida"],        barCol: "#1a7a3a", icon: "heart" },
    ];

    cards.forEach((card, i) => {
      const cx = sx + i * (cw + gap);
      const hov = cs.hovered === i;
      const pulse = Math.sin(state.time * 5) * 0.18;

      // Sombra
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = "#000";
      ctx.fillRect(cx + 7, cy + 7, cw, ch);
      ctx.globalAlpha = 1;

      // Fundo da carta
      drawRect(cx, cy, cw, ch, hov ? "#fffbe8" : "#d8d0bc");

      // Borda
      ctx.strokeStyle = hov ? "#ffd700" : "#443322";
      ctx.lineWidth = hov ? 4 : 2;
      ctx.strokeRect(cx, cy, cw, ch);

      // Barra colorida no topo
      drawRect(cx + 4, cy + 4, cw - 8, 78, card.barCol);

      // Ícone na barra
      const icx = Math.round(cx + cw / 2);
      const icy = cy + 44;
      if (card.icon === "sword") {
        drawRect(icx - 3, icy - 30, 6, 40, "#e8e8e8");
        drawRect(icx - 3, icy - 32, 6, 5, "#ffffff");
        drawRect(icx - 15, icy + 4, 30, 5, "#aaaaaa");
        drawRect(icx - 3, icy + 9, 6, 14, "#8b5c2a");
        drawRect(icx - 3, icy + 23, 6, 5, "#555533");
      } else {
        drawRect(icx - 14, icy - 20, 11, 11, "#ff3355");
        drawRect(icx + 3,  icy - 20, 11, 11, "#ff3355");
        drawRect(icx - 16, icy - 11, 32, 13, "#ff3355");
        drawRect(icx - 12, icy + 2,  24, 10, "#ff3355");
        drawRect(icx - 8,  icy + 12, 16,  8, "#ff3355");
        drawRect(icx - 4,  icy + 20,  8,  6, "#ff3355");
        drawRect(icx - 1,  icy + 26,  2,  4, "#ff3355");
      }

      // Título da carta
      ctx.fillStyle = "#1a1010";
      ctx.font = "bold 20px monospace";
      ctx.fillText(card.title, cx + cw / 2, cy + 106);

      // Linha separadora
      drawRect(cx + 14, cy + 114, cw - 28, 2, "#aaa099");

      // Descrição
      ctx.font = "14px monospace";
      ctx.fillStyle = "#2a1a1a";
      card.desc.forEach((line, li) => ctx.fillText(line, cx + cw / 2, cy + 140 + li * 22));

      // Dica de tecla
      ctx.fillStyle = hov ? "#cc8800" : "#776655";
      ctx.font = "bold 13px monospace";
      ctx.fillText(i === 0 ? "[A / ←]  Enter" : "[D / →]  Enter", cx + cw / 2, cy + ch - 18);

      // Brilho de seleção
      if (hov) {
        ctx.globalAlpha = 0.25 + pulse;
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 10;
        ctx.strokeRect(cx - 5, cy - 5, cw + 10, ch + 10);
        ctx.globalAlpha = 1;
        ctx.lineWidth = 1;
      }
    });

    ctx.textAlign = "left";
    ctx.lineWidth = 1;
  }

  function drawCarOver() {
    const t = state.carOverTimer;
    const fadeIn = Math.min(1, t * 0.8);
    ctx.globalAlpha = fadeIn;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = Math.max(0, (t - 1.2) * 0.7);
    ctx.fillStyle = "#cc1111";
    ctx.font = "bold 72px monospace";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", W / 2, H / 2 - 50);
    ctx.globalAlpha = Math.max(0, (t - 2.0) * 0.9);
    ctx.fillStyle = "#e8e8e8";
    ctx.font = "22px monospace";
    ctx.fillText("olhe os dois lados da rua na próxima vez...", W / 2, H / 2 + 20);
    ctx.globalAlpha = Math.max(0, (t - 3.2) * 0.7) * (0.6 + Math.sin(state.time * 3) * 0.4);
    ctx.fillStyle = "#888888";
    ctx.font = "16px monospace";
    ctx.fillText("[ Enter ] para voltar ao menu", W / 2, H / 2 + 80);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
  }

  function wrapText(text, x, y, maxWidth, lineHeight, maxLines = 5) {
    const words = text.split(" ");
    let line = "";
    let lineCount = 0;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        line = word;
        y += lineHeight;
        lineCount++;
        if (lineCount >= maxLines) {
          ctx.fillText(line + (lineCount < words.length ? "..." : ""), x, y);
          return;
        }
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, y);
  }

  function updatePrologue(dt) {
    const scene = prologueScenes[state.storyStage];
    const left = keys.has("a") || keys.has("arrowleft") || pressed.has("a") || pressed.has("arrowleft");
    const right = keys.has("d") || keys.has("arrowright") || pressed.has("d") || pressed.has("arrowright");
    const up = keys.has("w") || keys.has("arrowup") || pressed.has("w") || pressed.has("arrowup");
    const down = keys.has("s") || keys.has("arrowdown") || pressed.has("s") || pressed.has("arrowdown");
    if (left) {
      player.vx -= 1050 * dt;
      player.face = -1;
    }
    if (right) {
      player.vx += 1050 * dt;
      player.face = 1;
    }
    if (up) player.vy -= 1050 * dt;
    if (down) player.vy += 1050 * dt;
    if (!left && !right) player.vx *= Math.pow(0.00005, dt);
    if (!up && !down) player.vy *= Math.pow(0.00005, dt);
    player.vx = clamp(player.vx, -280, 280);
    player.vy = clamp(player.vy, -280, 280);
    if (pressed.has(" ") && player.attack <= 0) {
      player.attack = 0.18;
      addText(player.x + player.face * 18, player.y + 8, "passinho", "#ffde59");
    }
    if (pressed.has("j") && player.attack <= 0) {
      player.attack = 0.2;
      addText(player.x + player.face * 30, player.y + 16, "soco social", "#ffde59");
      beep(190, 0.05, "square", 0.07);
    }
    player.attack = Math.max(0, player.attack - dt);

    const nextX = clamp(player.x + player.vx * dt, 24, scene.width - player.w - 24);
    const nextY = clamp(player.y + player.vy * dt, 24, scene.height - player.h - 24);
    const footX = { x: nextX + 10, y: player.y + 38, w: player.w - 20, h: 20 };
    const footY = { x: player.x + 10, y: nextY + 38, w: player.w - 20, h: 20 };
    const blocks = prologueObstacles(scene);
    if (!blocks.some((r) => hit(footX, r))) player.x = nextX;
    else player.vx = 0;
    if (!blocks.some((r) => hit(footY, r))) player.y = nextY;
    else player.vy = 0;
    player.onGround = true;

    state.cameraX = clamp(player.x - W * 0.5, 0, Math.max(0, scene.width - W));
    state.cameraY = clamp(player.y - H * 0.55, 0, Math.max(0, scene.height - H));
    updateEffects(dt);

    if (state.storyStage < 2 && hit({ x: player.x + 10, y: player.y + 38, w: player.w - 20, h: 20 }, scene.goal)) {
      enterPrologueStage(state.storyStage + 1);
      return;
    }

    const feet = { x: player.x + 10, y: player.y + 38, w: player.w - 20, h: 20 };
    if (state.storyStage === 2 && state.storyCue === "employee" && hit(feet, scene.employee)) {
      player.vx = 0;
      player.vy = 0;
      state.storyCue = "sugar";
      startDialogue([
        ["Funcionário", "Psiu... temos um açúcar especial aqui no fundo."],
        ["Protagonista", "Especial como?"],
        ["Funcionário", "Mais barato. Mas não abra em casa."],
        ["Protagonista", "...tá bom."]
      ], null);
      return;
    }

    if (state.storyStage === 2 && state.storyCue === "sugar" && hit(feet, scene.sugar)) {
      player.vx = 0;
      player.vy = 0;
      state.storyCue = "portal";
      state.flash = 0.8;
      state.shake = 26;
      explode(scene.sugar.x + 32, scene.sugar.y + 24, "#ff4fb8", 90);
      startDialogue([
        ["Pacote de Açúcar", "...me... consuma..."],
        ["Protagonista", "Isso está se mexendo!"],
        ["Narrador", "O chão some. Um portal abre no meio do mercado."]
      ], () => enterPrologueStage(3));
      return;
    }

    if (state.storyStage === 3 && hit(feet, scene.goal)) {
      state.flash = 0.9;
      state.shake = 22;
      startLevel(0);
    }

    if (state.storyStage === 1 && !state.dialogue) {
      const t = state.time;
      const playerBox = { x: player.x + 6, y: player.y + 28, w: player.w - 12, h: player.h - 32 };
      for (let cx = 240; cx < 1260; cx += 340) {
        const carX = cx + Math.sin(t * 1.7 + cx) * 70;
        const carBox = { x: carX, y: 350, w: 100, h: 88 };
        if (hit(playerBox, carBox)) {
          state.mode = "carover";
          state.carOverTimer = 0;
          state.shake = 30;
          state.flash = 1;
          beep(80, 0.4, "sawtooth", 0.18);
          explode(player.x + player.w / 2, player.y + player.h / 2, "#ff4f8f", 60);
          return;
        }
      }
    }
  }

  function update(dt) {
    state.time += dt;
    music();
    state.shake = Math.max(0, state.shake - dt * 22);
    state.flash = Math.max(0, state.flash - dt * 1.8);
    if (state.mode === "title" || state.mode === "credits") return;
    if (state.mode === "carover") {
      state.carOverTimer += dt;
      pressed.clear();
      return;
    }
    if (state.cardSelect) {
      const cs = state.cardSelect;
      cs.cooldown = Math.max(0, cs.cooldown - dt);
      if (cs.cooldown <= 0) {
        if (pressed.has("a") || pressed.has("arrowleft") || pressed.has("1")) cs.hovered = 0;
        if (pressed.has("d") || pressed.has("arrowright") || pressed.has("2")) cs.hovered = 1;
        if (pressed.has("enter")) applyCard(cs.hovered);
      }
      pressed.clear();
      return;
    }
    if (state.dialogue) return;
    if (state.mode === "prologue") {
      updatePrologue(dt);
      pressed.clear();
      return;
    }

    const level = levels[state.level];
    const accel = player.slow > 0 ? 420 : 980;
    const maxSpeed = player.slow > 0 ? 130 : 310;
    const left = keys.has("a") || keys.has("arrowleft") || pressed.has("a") || pressed.has("arrowleft");
    const right = keys.has("d") || keys.has("arrowright") || pressed.has("d") || pressed.has("arrowright");
    if (left) {
      player.vx -= accel * dt;
      player.face = -1;
    }
    if (right) {
      player.vx += accel * dt;
      player.face = 1;
    }
    if (!left && !right) player.vx *= Math.pow(0.00005, dt);
    player.vx = clamp(player.vx, -maxSpeed, maxSpeed);
    if ((pressed.has("w") || pressed.has(" ") || pressed.has("arrowup")) && player.onGround) {
      const wantDrop = keys.has("s") || keys.has("arrowdown");
      const onPlat = state.hazards.some(p =>
        !p.life &&
        player.x + player.w > p.x && player.x < p.x + p.w &&
        Math.abs((player.y + player.h) - p.y) < 6
      );
      if (wantDrop && onPlat) {
        player.dropThrough = 0.35;
        player.vy = 80;
        player.onGround = false;
      } else {
        player.vy = -520;
        player.onGround = false;
        beep(520, 0.07);
      }
    }
    if (pressed.has("l") && player.shieldCd <= 0 && player.shield <= 0) {
      player.shield = 3.0;
      player.shieldCd = 9.0;
      beep(660, 0.12, "sine", 0.12);
      addText(player.x, player.y - 22, "ESCUDO!", "#ffd700");
    }
    if (pressed.has("k") && player.sugar >= 20) {
      player.sugar -= 20;
      spawnProjectile(
        player.x + (player.face > 0 ? player.w + 4 : -20),
        player.y + player.h / 2 - 8,
        player.face * 580,
        0,
        0,
        false,
        true
      );
      beep(550, 0.05, "square", 0.06);
    }
    if (pressed.has("j") && player.attack <= 0) {
      player.attack = 0.22;
      beep(190, 0.05, "square", 0.08);
      const sword = { x: player.x + (player.face > 0 ? player.w - 4 : -62), y: player.y + 20, w: 70, h: 34 };
      state.enemies.forEach((e) => {
        if (hit(sword, e)) {
          e.hp -= (4 + player.attackBonus);
          e.stun = 0.55;
          e.hurt = 0.55;
          e.vx = player.face * 150;
          explode(e.x + e.w / 2, e.y + e.h / 2, e.color, 8);
          addText(e.x, e.y - 10, "SLASH!", "#d8d8d8");
        }
      });
      if (state.boss && hit(sword, state.boss)) {
        state.boss.hp -= (3 + player.attackBonus);
        state.boss.hurt = 0.12;
        state.shake = 7;
        explode(sword.x + sword.w / 2, sword.y, level.bossColor, 10);
      }
    }

    player.attack = Math.max(0, player.attack - dt);
    player.inv = Math.max(0, player.inv - dt);
    player.slow = Math.max(0, player.slow - dt);
    player.dropThrough = Math.max(0, player.dropThrough - dt);
    player.shield = Math.max(0, player.shield - dt);
    player.shieldCd = Math.max(0, player.shieldCd - dt);
    player.vy += 1150 * dt;
    player.x += player.vx * dt;
    player.y += player.vy * dt;
    player.x = clamp(player.x, 20, level.length - 80);
    player.onGround = false;
    if (player.y + player.h >= level.floor) {
      player.y = level.floor - player.h;
      player.vy = 0;
      player.onGround = true;
    }
    state.hazards.forEach((p) => {
      if (!p.life && player.dropThrough <= 0 && player.vy >= 0 && player.x + player.w > p.x && player.x < p.x + p.w && player.y + player.h > p.y && player.y + player.h < p.y + 22) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    });

    updateEnemies(dt, level);
    updateBoss(dt, level);
    updateProjectiles(dt, level);
    updateEffects(dt);
    state.cameraX = clamp(player.x - W * 0.38, 0, level.length - W);

    if (state.mode === "play" && player.x > level.portalX) startBoss();
    if (state.level === 3) {
      player.sugar = clamp(player.sugar - state.ants * dt * 0.7, 0, 100);
      if (player.sugar < 45) {
        player.slow = 0.4;
        state.shake = Math.max(state.shake, 3);
      }
    }
    pressed.clear();
  }

  function updateEnemies(dt, level) {
    for (const e of state.enemies) {
      e.hurt = Math.max(0, e.hurt - dt);
      e.stun = Math.max(0, e.stun - dt);
      if (e.stun > 0) continue;
      e.x += e.vx * dt * 60;
      if (e.type === "charger" && Math.abs(e.x - player.x) < 310) e.vx += Math.sign(player.x - e.x) * dt * 3.8;
      else if (Math.abs(e.x - player.x) < 260) e.vx += Math.sign(player.x - e.x) * dt * 1.2;
      e.vx = clamp(e.vx, e.type === "charger" ? -2.7 : -1.8, e.type === "charger" ? 2.7 : 1.8);
      if (e.type === "bouncer") e.y += Math.sin(state.time * 9 + e.x) * dt * 38;
      if (e.x < 120 || e.x > level.length - 120) e.vx *= -1;
      e.shoot -= dt;
      if (e.shoot <= 0 && Math.abs(e.x - player.x) < 560 && e.type !== "charger") {
        e.shoot = e.type === "bouncer" ? rnd(0.7, 1.3) : rnd(1.1, 2.4);
        if (e.type === "shooter") {
          const ddx = player.x + player.w / 2 - (e.x + e.w / 2);
          const ddy = player.y + player.h / 2 - (e.y + 15);
          const dist = Math.max(1, Math.sqrt(ddx * ddx + ddy * ddy));
          const speed = rnd(260, 330);
          spawnProjectile(e.x + e.w / 2, e.y + 15, (ddx / dist) * speed, (ddy / dist) * speed, state.level);
        } else {
          const dx = Math.sign(player.x - e.x) || 1;
          spawnProjectile(e.x + e.w / 2, e.y + 15, dx * rnd(190, 260), rnd(-310, -190), state.level);
        }
      }
      if (e.type === "charger" && hit(player, e)) {
        hurtPlayer(1);
        player.vx = Math.sign(player.x - e.x) * 280;
      }
      if (state.level === 3 && Math.abs(e.x - player.x) < 48) state.ants = clamp(state.ants + dt * 3, 0, 8);
    }
    state.enemies = state.enemies.filter((e) => {
      if (e.hp > 0) return true;
      explode(e.x + e.w / 2, e.y + e.h / 2, e.color, 22);
      addText(e.x, e.y - 15, "tchau", "#fff7d7");
      player.sugar = clamp(player.sugar + 40, 0, 100);
      addText(e.x + 12, e.y - 28, "+AÇÚCAR", "#ffde59");
      return false;
    });
    state.ants = Math.max(0, state.ants - dt * 0.9);
  }

  function updateBoss(dt, level) {
    const b = state.boss;
    if (!b || state.mode !== "boss") return;
    b.timer += dt;
    b.special += dt;
    b.hurt = Math.max(0, b.hurt - dt);
    b.face = player.x < b.x ? -1 : 1;
    const arenaLeft = clamp(player.x - 560, 80, level.length - 900);
    const arenaRight = arenaLeft + 850;
    const centerX = arenaLeft + 600;
    if (state.level === 1) {
      const freq = b.phase === 2 ? 0.42 : 0.26;
      const tgt = centerX + Math.sin(state.time * freq) * 210;
      b.x += Math.sign(tgt - b.x) * Math.min(Math.abs(tgt - b.x), dt * (b.phase === 2 ? 120 : 75));
    } else if (state.level === 2) {
      b.x += Math.sign(player.x - b.x) * dt * (b.phase === 2 ? 135 : 80);
    } else if (state.level === 3) {
      const orbitFreq = b.phase === 2 ? 1.1 : 0.68;
      const tgt3 = player.x + Math.cos(state.time * orbitFreq) * 220;
      b.x += Math.sign(tgt3 - b.x) * Math.min(Math.abs(tgt3 - b.x), dt * (b.phase === 2 ? 160 : 105));
    } else if (state.level === 5) {
      b.x = centerX + Math.cos(state.time * 1.7) * 230;
      b.y = level.floor - 165 + Math.sin(state.time * 2.1) * 45;
    } else {
      b.x += Math.sign(player.x - b.x) * dt * (b.phase === 2 ? 90 : 45);
    }
    b.x = clamp(b.x, arenaLeft + 220, arenaRight);
    if (b.hp < b.maxHp * 0.52 && b.phase === 1) {
      b.phase = 2;
      state.flash = 0.55;
      state.shake = 18;
      addText(b.x, b.y - 20, state.level === 4 ? "BANDANA!" : "FASE 2!", "#ffde59");
    }
    const cadence = [0.90, 1.10, 1.05, 0.92, 1.20, 0.65][state.level] * (b.phase === 2 ? 0.82 : 1);
    if (b.timer > cadence) {
      b.timer = 0;
      const bx = b.x + b.w / 2;
      const by = b.y + b.h / 2;
      if (state.level === 0) {
        addText(b.x, b.y - 12, b.pattern % 2 ? "SALADA!" : "IMC LASER", "#63ff85");
        if (b.pattern % 2 === 0) {
          state.hazards.push({ x: player.x - 16, y: 70, w: 22, h: level.floor - 70, kind: 3, life: 0.55 });
        } else {
          for (let i = 0; i < 5; i++) spawnProjectile(player.x + rnd(-220, 220), 70, rnd(-40, 40), rnd(280, 390), 0, true);
        }
      } else if (state.level === 1) {
        const count = b.phase === 2 ? 5 : 3;
        addText(b.x, b.y - 12, b.phase === 2 ? "CHUVA DE PIRUITO!" : "ARREMESSO DOCE", "#ff4fb8");
        if (b.phase === 2) state.hazards.push({ x: player.x - 70, y: level.floor - 14, w: 140, h: 14, kind: 4, life: 1.5 });
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.5;
          spawnProjectile(bx, by, Math.cos(-Math.PI / 2 + spread) * 270, Math.sin(-Math.PI / 2 + spread) * 270, 1, true);
        }
      } else if (state.level === 2) {
        addText(b.x, b.y - 12, "BARRIL!", "#ffcf73");
        const dir = Math.sign(player.x - b.x) || -1;
        state.hazards.push({ x: bx, y: level.floor - 50, w: 46, h: 46, vx: dir * (b.phase === 2 ? 260 : 190), kind: 5, life: 4 });
        for (let i = -1; i <= 1; i++) spawnProjectile(bx, by - 20, dir * 340, -270 + i * 100, 2, true);
      } else if (state.level === 3) {
        addText(b.x, b.y - 12, "ENXAME", "#d6f77a");
        state.ants = clamp(state.ants + (b.phase === 2 ? 2.6 : 1.5), 0, 10);
        for (let i = 0; i < 4; i++) spawnProjectile(bx + rnd(-60, 60), by, rnd(-320, 320), rnd(-140, 140), 3, true);
      } else if (state.level === 4) {
        addText(b.x, b.y - 12, b.phase === 2 ? "PAO SUPREMO" : "FORNO AZUL", "#65dbff");
        state.hazards.push({ x: player.x - 130, y: level.floor - 92, w: 260, h: 86, kind: 7, life: 1.1 });
        for (let i = 0; i < 6; i++) spawnProjectile(arenaLeft + 160 + i * 105, level.floor - 240, 0, 350, 4, true);
      } else {
        addText(b.x, b.y - 12, b.pattern % 3 ? "BUGA TUDO" : "GRAVIDADE", "#6e42ff");
        if (b.pattern % 3 === 0) {
          player.vy = -Math.abs(player.vy) - 180;
          state.shake = Math.max(state.shake, 9);
        }
        for (let i = 0; i < (b.phase === 2 ? 12 : 8); i++) {
          const a = i * ((Math.PI * 2) / (b.phase === 2 ? 12 : 8)) + state.time;
          spawnProjectile(bx, by, Math.cos(a) * 370, Math.sin(a) * 370, 5, true);
        }
      }
      b.pattern++;
    }
    if (b.hp <= 0) completeBoss();
    state.hazards = state.hazards.filter((h) => {
      if (!h.life) return true;
      if (h.vx) h.x += h.vx * dt;
      h.life -= dt;
      if (hit(player, h)) {
        hurtPlayer(1);
        if (h.kind === 4) player.slow = 1.4;
      }
      return h.life > 0 && h.x > state.cameraX - 200 && h.x < state.cameraX + W + 260;
    });
  }

  function updateProjectiles(dt) {
    const lvl = levels[state.level];
    for (const p of state.projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (!p.friendly) p.vy += (p.kind === 2 ? 160 : 20) * dt;
      p.life -= dt;
      if (p.friendly) {
        for (const e of state.enemies) {
          if (hit(p, e)) {
            e.hp -= (4 + player.attackBonus);
            e.stun = 0.55;
            e.hurt = 0.55;
            e.vx = Math.sign(e.x - player.x) * 120;
            explode(e.x + e.w / 2, e.y + e.h / 2, e.color, 8);
            addText(e.x, e.y - 10, "POW", "#ffde59");
            p.life = 0;
            break;
          }
        }
        if (p.life > 0 && state.boss && hit(p, state.boss)) {
          state.boss.hp -= (3 + player.attackBonus);
          state.boss.hurt = 0.12;
          state.shake = 7;
          explode(p.x + p.w / 2, p.y, lvl ? lvl.bossColor : "#ff9900", 8);
          p.life = 0;
        }
      } else {
        if (hit(player, p)) {
          hurtPlayer(p.kind === 5 ? 2 : 1);
          p.life = 0;
          if (p.kind === 0) player.slow = 1.2;
        }
      }
    }
    state.projectiles = state.projectiles.filter((p) => p.life > 0 && p.x > state.cameraX - 80 && p.x < state.cameraX + W + 120 && p.y < H + 120);
  }

  function updateEffects(dt) {
    state.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 350 * dt;
      p.life -= dt;
    });
    state.particles = state.particles.filter((p) => p.life > 0);
    state.floatText.forEach((f) => {
      f.y -= 26 * dt;
      f.life -= dt;
    });
    state.floatText = state.floatText.filter((f) => f.life > 0);
  }

  function inputStart() {
    makeAudio();
    if (state.audio && state.audio.ac.state === "suspended") state.audio.ac.resume();
    state.audioOn = true;
    if (state.mode === "carover" && state.carOverTimer > 3.2) {
      state.mode = "title";
      return;
    }
    if (state.mode === "title") {
      startPrologue();
      return;
    }
    if (state.dialogue) advanceDialogue();
  }

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (!keys.has(k)) pressed.add(k);
    keys.add(k);
    if (k === "d" || k === "arrowright") {
      player.vx = Math.max(player.vx, 200);
      player.face = 1;
    }
    if (k === "a" || k === "arrowleft") {
      player.vx = Math.min(player.vx, -200);
      player.face = -1;
    }
    if (state.mode === "prologue" && (k === "w" || k === "arrowup")) player.vy = Math.min(player.vy, -200);
    if (state.mode === "prologue" && (k === "s" || k === "arrowdown")) player.vy = Math.max(player.vy, 200);
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
    if (k === "enter") inputStart();
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = (e.clientX - r.left) * (W / r.width);
    mouseY = (e.clientY - r.top) * (H / r.height);
  });
  canvas.addEventListener("pointerdown", (e) => {
    if (state.cardSelect && state.cardSelect.cooldown <= 0) {
      const cw = 210, ch = 300, gap = 80;
      const sx = (W - (cw * 2 + gap)) / 2;
      const cy = (H - ch) / 2 - 10;
      const r = canvas.getBoundingClientRect();
      const mx = (e.clientX - r.left) * (W / r.width);
      const my = (e.clientY - r.top) * (H / r.height);
      if (mx >= sx && mx <= sx + cw && my >= cy && my <= cy + ch) { applyCard(0); return; }
      if (mx >= sx + cw + gap && mx <= sx + cw * 2 + gap && my >= cy && my <= cy + ch) { applyCard(1); return; }
    }
    inputStart();
  });

  window.GLICOSE_DEBUG = {
    snapshot: () => ({
      mode: state.mode,
      level: state.level,
      storyStage: state.storyStage,
      storyCue: state.storyCue,
      playerX: Math.round(player.x),
      playerY: Math.round(player.y),
      cameraY: Math.round(state.cameraY),
      dialogue: Boolean(state.dialogue)
    })
  };

  function syncDebugDom() {
    statusEl.dataset.mode = state.mode;
    statusEl.dataset.level = String(state.level);
    statusEl.dataset.storyStage = String(state.storyStage);
    statusEl.dataset.storyCue = state.storyCue;
    statusEl.dataset.playerX = String(Math.round(player.x));
    statusEl.dataset.playerY = String(Math.round(player.y));
    statusEl.dataset.cameraY = String(Math.round(state.cameraY));
    statusEl.dataset.dialogue = String(Boolean(state.dialogue));
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    drawWorld();
    syncDebugDom();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
