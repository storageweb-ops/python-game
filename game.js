const levels = [
  {
    title: "ด่าน 1: คำสั่งแบบลำดับ",
    goal: "เขียนคำสั่ง move() ตามลำดับ เพื่อเก็บชิปสีทองและไปถึงธง",
    hint: "หุ่นยนต์หันไปทางขวาอยู่แล้ว ลองนับจำนวนช่องถึงธง",
    starter: "# ด่าน 1: เรียงคำสั่งตามลำดับ\n# เขียนโค้ดต่อด้านล่าง\n",
    requiredCondition: null,
    start: { x: 0, y: 4, dir: "east" },
    goalPos: { x: 4, y: 4 },
    chips: [{ x: 2, y: 4 }],
    walls: [],
    sensors: [],
  },
  {
    title: "ด่าน 2: ตัดสินใจจากเซนเซอร์",
    goal: "เมื่อหุ่นยนต์อยู่บนช่องสีฟ้า ใช้ if on_blue(): เพื่อตัดสินใจเลี้ยวซ้าย",
    hint: "คำสั่งใต้ if ต้องเยื้องเข้าไป 4 ช่อง เช่น\nif on_blue():\n    turn_left()",
    starter: "# ด่าน 2: ใช้ if ตรวจเซนเซอร์สีฟ้า\nmove()\nmove()\n\n# เขียน if ตรงนี้\n",
    requiredCondition: "on_blue",
    start: { x: 0, y: 2, dir: "east" },
    goalPos: { x: 2, y: 0 },
    chips: [{ x: 1, y: 2 }],
    walls: [{ x: 3, y: 2 }],
    sensors: [{ x: 2, y: 2, type: "blue" }],
  },
  {
    title: "ด่าน 3: ตัดสินใจเมื่อเจอกำแพง",
    goal: "ใช้ if wall_ahead(): ตรวจสอบกำแพง แล้วพาหุ่นยนต์อ้อมไปเก็บชิปและถึงธง",
    hint: "เดินไปก่อน 1 ช่อง แล้วตรวจข้างหน้า เมื่ออ้อมขึ้นไปสุดทางให้เลี้ยวขวา",
    starter: "# ด่าน 3: ตรวจสอบกำแพงด้านหน้า\nmove()\n\n# เขียน if ตรงนี้\n",
    requiredCondition: "wall_ahead",
    start: { x: 0, y: 4, dir: "east" },
    goalPos: { x: 4, y: 0 },
    chips: [{ x: 1, y: 2 }, { x: 3, y: 0 }],
    walls: [{ x: 2, y: 4 }, { x: 2, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 1 }],
    sensors: [],
  },
];

const dirDelta = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};

const turnLeft = { north: "west", west: "south", south: "east", east: "north" };
const turnRight = { north: "east", east: "south", south: "west", west: "north" };

const board = document.querySelector("#board");
const statusBox = document.querySelector("#status");
const levelTitle = document.querySelector("#level-title");
const levelGoal = document.querySelector("#level-goal");
const levelHint = document.querySelector("#level-hint");
const levelNumber = document.querySelector("#level-number");
const progressBar = document.querySelector("#progress-bar");
const codeEditor = document.querySelector("#code-editor");
const lineNumbers = document.querySelector("#line-numbers");
const codeError = document.querySelector("#code-error");
const runBtn = document.querySelector("#run-btn");
const resetCodeBtn = document.querySelector("#reset-code-btn");
const nextBtn = document.querySelector("#next-btn");

let currentLevel = 0;
let robot = {};
let collected = new Set();
let running = false;

function key(pos) {
  return `${pos.x},${pos.y}`;
}

function samePos(a, b) {
  return a.x === b.x && a.y === b.y;
}

function getLevel() {
  return levels[currentLevel];
}

function resetLevel(resetCode = true) {
  const level = getLevel();
  robot = { ...level.start };
  collected = new Set();
  running = false;
  runBtn.disabled = false;
  nextBtn.disabled = true;
  codeError.hidden = true;

  if (resetCode) {
    codeEditor.value = level.starter;
  }

  updateLevelInfo();
  updateLineNumbers();
  renderBoard();
  setStatus("พร้อมเขียนโปรแกรม", "ready");
}

function updateLevelInfo() {
  const level = getLevel();
  levelTitle.textContent = level.title;
  levelGoal.textContent = level.goal;
  levelHint.textContent = level.hint;
  levelNumber.textContent = `${currentLevel + 1}/${levels.length}`;
  progressBar.style.width = `${((currentLevel + 1) / levels.length) * 100}%`;
}

function renderBoard() {
  const level = getLevel();
  board.innerHTML = "";

  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 5; x += 1) {
      const pos = { x, y };
      const cell = document.createElement("div");
      cell.className = "cell path";

      if (level.walls.some((wall) => samePos(wall, pos))) {
        cell.className = "cell wall";
      }

      if (level.sensors.some((sensor) => samePos(sensor, pos))) {
        cell.className = "cell sensor";
      }

      if (samePos(level.goalPos, pos)) {
        cell.classList.add("goal");
        cell.appendChild(piece("flag"));
      }

      const chipAtCell = level.chips.find((chip) => samePos(chip, pos));
      if (chipAtCell && !collected.has(key(pos))) {
        cell.appendChild(piece("chip"));
      }

      if (samePos(robot, pos)) {
        const robotPiece = piece("robot");
        robotPiece.classList.add(robot.dir);
        robotPiece.textContent = "➜";
        cell.appendChild(robotPiece);
      }

      board.appendChild(cell);
    }
  }
}

function piece(className) {
  const element = document.createElement("div");
  element.className = `piece ${className}`;
  return element;
}

function setStatus(message, type = "ready") {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
}

function showCodeError(message) {
  codeError.textContent = message;
  codeError.hidden = false;
  setStatus("โค้ดยังมีข้อผิดพลาด ลองแก้แล้วรันอีกครั้ง", "error");
}

function updateLineNumbers() {
  const lineCount = Math.max(1, codeEditor.value.split("\n").length);
  lineNumbers.textContent = Array.from({ length: lineCount }, (_, index) => index + 1).join("\n");
}

function parsePython(source) {
  const lines = source.replace(/\t/g, "    ").split("\n");
  const commands = [];
  const usedConditions = new Set();
  let activeCondition = null;
  let activeBlockId = null;
  let conditionIndent = 0;
  let conditionHasBody = false;
  let nextBlockId = 1;

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const lineNumber = index + 1;
    const content = rawLine.trim();

    if (!content || content.startsWith("#")) {
      continue;
    }

    const indent = rawLine.length - rawLine.trimStart().length;

    if (activeCondition && indent <= conditionIndent) {
      if (!conditionHasBody) {
        throw new Error(`บรรทัด ${lineNumber}: คำสั่ง if ต้องมีคำสั่งที่เยื้องเข้าไป 4 ช่อง`);
      }
      activeCondition = null;
      activeBlockId = null;
      conditionHasBody = false;
    }

    const ifMatch = content.match(/^if\s+(on_blue|wall_ahead)\(\):$/);
    if (ifMatch) {
      if (indent !== 0) {
        throw new Error(`บรรทัด ${lineNumber}: ยังไม่รองรับ if ซ้อนกันในด่านนี้`);
      }
      activeCondition = ifMatch[1];
      activeBlockId = nextBlockId;
      nextBlockId += 1;
      conditionIndent = indent;
      conditionHasBody = false;
      usedConditions.add(activeCondition);
      continue;
    }

    const commandMatch = content.match(/^(move|turn_left|turn_right)\(\)$/);
    if (!commandMatch) {
      throw new Error(`บรรทัด ${lineNumber}: ไม่รู้จักคำสั่ง “${content}”`);
    }

    if (activeCondition) {
      if (indent !== conditionIndent + 4) {
        throw new Error(`บรรทัด ${lineNumber}: คำสั่งใต้ if ต้องเยื้อง 4 ช่อง`);
      }
      commands.push({
        action: commandMatch[1],
        condition: activeCondition,
        blockId: activeBlockId,
        lineNumber,
      });
      conditionHasBody = true;
    } else {
      if (indent !== 0) {
        throw new Error(`บรรทัด ${lineNumber}: มีการเยื้องโดยไม่มี if`);
      }
      commands.push({ action: commandMatch[1], condition: null, blockId: null, lineNumber });
    }
  }

  if (activeCondition && !conditionHasBody) {
    throw new Error("คำสั่ง if บรรทัดสุดท้ายยังไม่มีคำสั่งที่เยื้องอยู่ด้านล่าง");
  }

  if (commands.length === 0) {
    throw new Error("ยังไม่มีคำสั่งให้หุ่นยนต์ทำงาน");
  }

  if (commands.length > 30) {
    throw new Error("โปรแกรมยาวเกิน 30 คำสั่ง ลองเขียนให้กระชับขึ้น");
  }

  return { commands, usedConditions };
}

function collectChipIfPresent() {
  const chip = getLevel().chips.find((item) => samePos(item, robot));
  if (chip) collected.add(key(chip));
}

function isWallOrEdge(pos) {
  const level = getLevel();
  const outside = pos.x < 0 || pos.x > 4 || pos.y < 0 || pos.y > 4;
  return outside || level.walls.some((wall) => samePos(wall, pos));
}

function nextPosition() {
  const delta = dirDelta[robot.dir];
  return { x: robot.x + delta.x, y: robot.y + delta.y };
}

function conditionIsTrue(condition) {
  if (condition === "on_blue") {
    return getLevel().sensors.some((sensor) => sensor.type === "blue" && samePos(sensor, robot));
  }

  if (condition === "wall_ahead") return isWallOrEdge(nextPosition());
  return true;
}

function runAction(action) {
  if (action === "turn_left") {
    robot.dir = turnLeft[robot.dir];
    return true;
  }

  if (action === "turn_right") {
    robot.dir = turnRight[robot.dir];
    return true;
  }

  if (action === "move") {
    const target = nextPosition();
    if (isWallOrEdge(target)) return false;
    robot.x = target.x;
    robot.y = target.y;
    collectChipIfPresent();
  }

  return true;
}

function levelComplete() {
  const level = getLevel();
  return samePos(robot, level.goalPos) && collected.size === level.chips.length;
}

async function runProgram() {
  if (running) return;
  codeError.hidden = true;
  let parsed;

  try {
    parsed = parsePython(codeEditor.value);
  } catch (error) {
    showCodeError(error.message);
    return;
  }

  const required = getLevel().requiredCondition;
  if (required && !parsed.usedConditions.has(required)) {
    const requiredCode = required === "on_blue" ? "if on_blue():" : "if wall_ahead():";
    showCodeError(`ด่านนี้ต้องฝึกใช้ ${requiredCode}`);
    return;
  }

  running = true;
  runBtn.disabled = true;
  nextBtn.disabled = true;
  robot = { ...getLevel().start };
  collected = new Set();
  renderBoard();
  await wait(280);
  const conditionResults = new Map();

  for (const command of parsed.commands) {
    if (command.blockId !== null && !conditionResults.has(command.blockId)) {
      conditionResults.set(command.blockId, conditionIsTrue(command.condition));
    }
    const shouldRun = command.blockId === null ? true : conditionResults.get(command.blockId);
    const conditionText = command.condition ? `ตรวจสอบ ${command.condition}() → ${shouldRun}` : "";
    setStatus(conditionText || `กำลังทำบรรทัด ${command.lineNumber}: ${command.action}()`, "ready");

    if (shouldRun) {
      const ok = runAction(command.action);
      renderBoard();
      await wait(480);
      if (!ok) {
        running = false;
        runBtn.disabled = false;
        setStatus(`บรรทัด ${command.lineNumber}: หุ่นยนต์ชนกำแพง`, "error");
        return;
      }
    } else {
      await wait(340);
    }
  }

  running = false;
  runBtn.disabled = false;

  if (levelComplete()) {
    if (currentLevel === levels.length - 1) {
      setStatus("ยอดเยี่ยม ผ่านครบ 3 ด่านและใช้ Python สำเร็จ!", "win");
    } else {
      setStatus("ผ่านด่านแล้ว โค้ดทำงานถูกต้อง!", "win");
      nextBtn.disabled = false;
    }
  } else {
    setStatus("โปรแกรมจบแล้ว แต่ยังต้องเก็บชิปให้ครบและไปหยุดที่ธง", "error");
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

codeEditor.addEventListener("input", () => {
  updateLineNumbers();
  codeError.hidden = true;
});

codeEditor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = codeEditor.scrollTop;
});

codeEditor.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  event.preventDefault();
  const start = codeEditor.selectionStart;
  const end = codeEditor.selectionEnd;
  codeEditor.setRangeText("    ", start, end, "end");
  updateLineNumbers();
});

resetCodeBtn.addEventListener("click", () => {
  if (!running) resetLevel(true);
});

runBtn.addEventListener("click", runProgram);

nextBtn.addEventListener("click", () => {
  if (currentLevel < levels.length - 1) {
    currentLevel += 1;
    resetLevel(true);
    codeEditor.focus();
  }
});

resetLevel(true);
