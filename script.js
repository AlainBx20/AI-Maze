const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const cellSize = 20;
const rows = 21;
const cols = 21;
canvas.width = cols * cellSize;
canvas.height = rows * cellSize;

let maze = [];
let agent = { x: 1, y: 1 };
let goal = { x: cols - 2, y: rows - 2 };
let qTable = {};
const learningRate = 0.1;
const discountFactor = 0.9;
const explorationRate = 0.2;

function generateMaze(rows, cols) {
  const maze = Array.from({ length: rows }, () => Array(cols).fill(1));

  function carvePassages(x, y) {
    const directions = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    directions.sort(() => Math.random() - 0.5);

    for (const [dx, dy] of directions) {
      const nx = x + dx * 2;
      const ny = y + dy * 2;

      if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && maze[ny][nx] === 1) {
        maze[y + dy][x + dx] = 0;
        maze[ny][nx] = 0;
        carvePassages(nx, ny);
      }
    }
  }

  maze[1][1] = 0;
  carvePassages(1, 1);
  maze[rows - 2][cols - 2] = 0;
  return maze;
}

function initializeQTable(rows, cols) {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      qTable[`${x},${y}`] = { up: 0, down: 0, left: 0, right: 0 };
    }
  }
}

function chooseAction(state) {
  if (Math.random() < explorationRate) {
    const actions = ['up', 'down', 'left', 'right'];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  const stateActions = qTable[state];
  return Object.keys(stateActions).reduce((a, b) =>
    stateActions[a] > stateActions[b] ? a : b
  );
}

function takeAction(state, action) {
  const [x, y] = state.split(',').map(Number);
  let nx = x, ny = y;

  if (action === 'up') ny -= 1;
  else if (action === 'down') ny += 1;
  else if (action === 'left') nx -= 1;
  else if (action === 'right') nx += 1;

  if (nx >= 0 && ny >= 0 && nx < cols && ny < rows && maze[ny][nx] === 0) {
    return `${nx},${ny}`;
  }
  return state;
}

function updateQTable(state, action, reward, nextState) {
  const maxFutureQ = Math.max(...Object.values(qTable[nextState]));
  qTable[state][action] +=
    learningRate * (reward + discountFactor * maxFutureQ - qTable[state][action]);
}

function drawMaze(maze) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[0].length; x++) {
      if (maze[y][x] === 1) {
        ctx.fillStyle = '#333';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  ctx.fillStyle = 'green';
  ctx.fillRect(goal.x * cellSize, goal.y * cellSize, cellSize, cellSize);
}

function drawAgent(agent) {
  ctx.fillStyle = 'blue';
  ctx.beginPath();
  ctx.arc(
    agent.x * cellSize + cellSize / 2,
    agent.y * cellSize + cellSize / 2,
    cellSize / 3,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function trainAgent() {
  const episodes = 500;
  for (let i = 0; i < episodes; i++) {
    let state = `${agent.x},${agent.y}`;
    let done = false;

    while (!done) {
      const action = chooseAction(state);
      const nextState = takeAction(state, action);

      let reward = -1;
      if (nextState === `${goal.x},${goal.y}`) {
        reward = 100;
        done = true;
      }

      updateQTable(state, action, reward, nextState);
      state = nextState;
    }
  }
}

function moveAgent() {
  let state = `${agent.x},${agent.y}`;
  const interval = setInterval(() => {
    const action = chooseAction(state);
    const nextState = takeAction(state, action);
    const [nx, ny] = nextState.split(',').map(Number);

    agent.x = nx;
    agent.y = ny;

    drawMaze(maze);
    drawAgent(agent);

    if (nextState === `${goal.x},${goal.y}`) {
      clearInterval(interval);
      console.log('Goal Reached!');
    }

    state = nextState;
  }, 200);
}

document.getElementById('generateMaze').addEventListener('click', () => {
  maze = generateMaze(rows, cols);
  agent = { x: 1, y: 1 };
  initializeQTable(rows, cols);
  drawMaze(maze);
  drawAgent(agent);
});

document.getElementById('startSimulation').addEventListener('click', () => {
  trainAgent();
  moveAgent();
});
