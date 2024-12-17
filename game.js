const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const fuelDisplay = document.getElementById('fuel');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const titleScreen = document.getElementById('titleScreen');
const hud = document.getElementById('hud');
const instructions = document.getElementById('instructions');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreDisplay = document.getElementById('finalScore');
const gameOverMessage = document.getElementById('gameOverMessage');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gravity = 0.1;
const thrustPower = 0.2;
const rotationSpeed = 0.05;
const fuelConsumption = 0.5;

const player = {
    x: canvas.width / 2,
    y: 50,
    vx: 0,
    vy: 0,
    angle: 0,
    fuel: 200,
    width: 20,
    height: 30,
    keys: { left: false, thrust: false, right: false },
    landed: false
};

let landingPads = [];
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameState = 'title'; // 'title', 'playing', 'gameover'

// Function to update score continuously with fuel remaining
function updateScore() {
    if (gameState === 'playing' && !player.landed) {
        score += player.fuel > 0 ? 1 : 0; // Increment score if fuel remains
    }
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(0, -player.height / 2);
    ctx.lineTo(player.width / 2, player.height / 2);
    ctx.lineTo(-player.width / 2, player.height / 2);
    ctx.closePath();
    ctx.fill();

    if (player.keys.thrust && player.fuel > 0 && !player.landed) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(-player.width / 4, player.height / 2);
        ctx.lineTo(player.width / 4, player.height / 2);
        ctx.lineTo(0, player.height);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function updatePlayer() {
    if (player.landed) return;

    if (player.keys.left) player.angle -= rotationSpeed;
    if (player.keys.right) player.angle += rotationSpeed;

    if (player.keys.thrust && player.fuel > 0) {
        const thrustX = Math.sin(player.angle) * -thrustPower;
        const thrustY = Math.cos(player.angle) * thrustPower;

        player.vx += thrustX;
        player.vy -= thrustY;

        player.fuel -= fuelConsumption;
    }

    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;

    if (player.y >= canvas.height - 30 - player.height / 2) {
        endGame(false);
    }
}

function endGame(success = false) {
    gameState = 'gameover';
    hud.style.display = 'none';
    gameOverScreen.style.display = 'flex';

    if (success) {
        gameOverMessage.textContent = 'YOU SURVIVED!';
    } else {
        gameOverMessage.textContent = 'GAME OVER!';
    }

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
    highScoreDisplay.textContent = `High Score: ${highScore}`;
    finalScoreDisplay.textContent = `Final Score: ${score}`;
}

function gameLoop() {
    if (gameState !== 'playing') return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updatePlayer();
    drawPlayer();
    updateScore();

    fuelDisplay.textContent = `Fuel: ${Math.max(player.fuel, 0).toFixed(0)}`;
    scoreDisplay.textContent = `Score: ${score}`;
    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    player.fuel = 200;
    player.landed = false;
    player.x = canvas.width / 2;
    player.y = 50;
    player.vx = 0;
    player.vy = 0;
    player.angle = 0;
    gameState = 'playing';

    titleScreen.style.display = 'none';
    hud.style.display = 'block';
    gameOverScreen.style.display = 'none';
    gameLoop();
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (gameState === 'title' || gameState === 'gameover') {
            startGame();
        }
    }
    if (gameState === 'playing') {
        if (e.key === 'ArrowLeft') player.keys.left = true;
        if (e.key === 'ArrowUp') player.keys.thrust = true;
        if (e.key === 'ArrowRight') player.keys.right = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (gameState === 'playing') {
        if (e.key === 'ArrowLeft') player.keys.left = false;
        if (e.key === 'ArrowUp') player.keys.thrust = false;
        if (e.key === 'ArrowRight') player.keys.right = false;
    }
});

startGame();
