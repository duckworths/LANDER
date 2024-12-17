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
const gameOverMessage = document.getElementById('gameOverMessage'); // *** Added

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ==================== Particle System for Explosions ==================== //
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6; // Random velocity X
        this.vy = (Math.random() - 0.5) * 6; // Random velocity Y
        this.alpha = 1; // Opacity
        this.size = Math.random() * 4 + 2; // Random size
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= 0.02; // Fade out
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let particles = [];
let explosionActive = false;

// ==================== Confetti System ==================== //
class ConfettiParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4; // Horizontal velocity
        this.vy = Math.random() * -4 - 2; // Upward velocity
        this.gravity = 0.05;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 10;
        this.size = Math.random() * 6 + 4;
        this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.alpha = 1;
    }

    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.alpha -= 0.02;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

let confetti = [];
let confettiActive = false;

function createConfetti(x, y) {
    confetti = [];
    for (let i = 0; i < 100; i++) { // 100 confetti particles
        confetti.push(new ConfettiParticle(x, y));
    }
    confettiActive = true;
}

// ==================== Astronomy Background ==================== //
class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 1.5;
        this.alpha = Math.random();
    }

    twinkle() {
        this.alpha += (Math.random() - 0.5) * 0.02;
        if (this.alpha <= 0) this.alpha = 0;
        if (this.alpha >= 1) this.alpha = 1;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ShootingStar {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height * 0.5;
        this.length = Math.random() * 80 + 10;
        this.speed = Math.random() * 10 + 6;
        this.angle = Math.PI / 4; // 45 degrees
        this.active = false;
        this.timer = 0;
    }

    update() {
        if (!this.active) {
            this.timer++;
            if (this.timer > Math.random() * 500 + 500) { // Random interval
                this.active = true;
                this.timer = 0;
            }
            return;
        }

        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);

        if (this.x > canvas.width || this.y > canvas.height) {
            this.reset();
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(
            this.x - this.length * Math.cos(this.angle),
            this.y - this.length * Math.sin(this.angle)
        );
        ctx.stroke();
        ctx.restore();
    }
}

const stars = [];
for (let i = 0; i < 200; i++) { // 200 stars
    stars.push(new Star());
}

const shootingStars = [];
for (let i = 0; i < 3; i++) { // 3 shooting stars
    shootingStars.push(new ShootingStar());
}


function updateBackground() {
    for (const star of stars) {
        star.twinkle();
    }

    for (const sStar of shootingStars) {
        sStar.update();
    }
}

function drawBackground() {
    // Draw space background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    for (const star of stars) {
        star.draw(ctx);
    }

    // Draw shooting stars
    for (const sStar of shootingStars) {
        sStar.draw(ctx);
    }
}

// ==================== Camera Object ==================== //
const camera = {
    shakeIntensity: 0,      // Current intensity of the shake
    shakeDecay: 0.95,       // Decay rate of the shake
    zoom: 1,                // Current zoom level
    targetZoom: 1,          // Desired zoom level
    zoomStep: 0.05,         // Incremental step for zooming in/out
    isZooming: false        // Flag to indicate if zoom effect is active
};

function createExplosion(x, y, color = 'orange') {
    particles = [];
    for (let i = 0; i < 50; i++) { // 50 particles per explosion
        particles.push(new Particle(x, y, color));
    }
    explosionActive = true;

    // Trigger Camera Shake and Zoom
    camera.shakeIntensity = 15; // Adjust intensity as needed
    camera.isZooming = true;
    camera.targetZoom = 1.3;    // Adjust zoom level as needed
}

function createSuccessConfetti(x, y) {
    createConfetti(x, y);

    // Optional: Additional camera effects for success
    camera.shakeIntensity = 10;
    camera.isZooming = true;
    camera.targetZoom = 1.2;
}

// Draw and update particles
function updateParticles() {
    if (explosionActive) {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw(ctx);

            // Remove faded particles
            if (p.alpha <= 0) particles.splice(i, 1);
        }

        if (particles.length === 0) {
            explosionActive = false;
        }
    }

    if (confettiActive) {
        for (let i = confetti.length - 1; i >= 0; i--) {
            const c = confetti[i];
            c.update();
            c.draw(ctx);

            if (c.alpha <= 0) confetti.splice(i, 1);
        }

        if (confetti.length === 0) {
            confettiActive = false;
        }
    }
}

// ==================== Player and Physics ==================== //
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
let rocks = [];
let gameState = 'title'; // Possible values: 'title', 'playing', 'gameover'
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;

// *** Added: Variable to track the outcome of the last game
let lastGameSuccess = false;

// ==================== Rocks ==================== //
class Rock {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = '#555';
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Simple circle rocks; can be enhanced with more complex shapes
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function placeRocks() {
    rocks = [];
    const numberOfRocks = Math.floor(Math.random() * 20) + 10; // Between 10 and 30 rocks
    for (let i = 0; i < numberOfRocks; i++) {
        const rockX = Math.random() * canvas.width;
        const rockY = canvas.height - 30 - Math.random() * 20; // Slightly above ground
        const rockSize = Math.random() * 5 + 2;
        rocks.push(new Rock(rockX, rockY, rockSize));
    }
}

// ==================== Landing Pads ==================== //
function placeLandingPads() {
    landingPads = [];
    const padWidth = 100;
    const padHeight = 10;
    const minY = canvas.height - 30 - (canvas.height * 0.15); // 15% above ground
    const maxY = canvas.height - 30 - (canvas.height * 0.05); // 5% above ground

    for (let i = 0; i < 2; i++) {
        let padX, padY, overlapping;
        let attempts = 0;
        do {
            padX = Math.random() * (canvas.width - padWidth - 20) + 10; // 10px padding from edges
            padY = Math.random() * (maxY - minY) + minY;
            overlapping = landingPads.some(pad => {
                return Math.abs(pad.x - padX) < padWidth + 20; // 20px buffer
            });
            attempts++;
            if (attempts > 100) break; // Prevent infinite loop
        } while (overlapping);

        landingPads.push({
            x: padX,
            y: padY,
            width: padWidth,
            height: padHeight,
            color: 'green'
        });
    }
}

function drawLandingPads() {
    for (const pad of landingPads) {
        ctx.fillStyle = pad.color;
        ctx.shadowColor = pad.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(pad.x, pad.y, pad.width, pad.height);
        ctx.shadowBlur = 0;
    }
}

// ==================== Ground ==================== //
function drawGround() {
    ctx.fillStyle = '#444';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
}

// ==================== Player Rendering ==================== //
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

// ==================== Player Update ==================== //
function updatePlayer() {
    if (player.landed || explosionActive || confettiActive) return; // Stop updates during explosions or confetti

    // Handle rotation and thrust
    if (player.keys.left) player.angle -= rotationSpeed;
    if (player.keys.right) player.angle += rotationSpeed;

    if (player.keys.thrust && player.fuel > 0) {
        const thrustX = Math.sin(player.angle) * -thrustPower;
        const thrustY = Math.cos(player.angle) * thrustPower;

        player.vx += thrustX;
        player.vy -= thrustY;

        player.fuel -= fuelConsumption;
    }

    // Apply gravity and movement
    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;

    // Wrap around horizontal screen edges
    if (player.x < 0) player.x = canvas.width;
    if (player.x > canvas.width) player.x = 0;

    // Check for landing on ground
    if (player.y >= canvas.height - 30 - player.height / 2) {
        createExplosion(player.x, canvas.height - 30 - player.height / 2, 'red');
        // Additional Camera Effects for Ground Crash
        camera.shakeIntensity = 20; // Higher intensity for ground crash
        camera.isZooming = true;
        camera.targetZoom = 1.5;    // More zoom for ground crash

        // End the game after the explosion
        setTimeout(() => {
            endGame(false); // false indicates failure
        }, 500); // Delay to allow explosion animation
        return;
    }

    // Check for landing pads
    for (const pad of landingPads) {
        const isAbovePad =
            player.x > pad.x && player.x < pad.x + pad.width &&
            player.y + player.height / 2 >= pad.y;

        const isSafeLanding =
            Math.abs(player.vx) < 1 && Math.abs(player.vy) < 2 &&
            Math.abs(player.angle) < 0.3; // Angle close to vertical

        if (isAbovePad && isSafeLanding) {
            player.landed = true;
            player.vx = 0;
            player.vy = 0;
            score = player.fuel; // Set score to remaining fuel

            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
            }

            createSuccessConfetti(player.x, pad.y); // Trigger confetti

            // End the game after success effects
            setTimeout(() => {
                endGame(true); // true indicates success
            }, 500); // Delay to allow confetti animation
            return;
        } else if (isAbovePad && !isSafeLanding) {
            createExplosion(player.x, player.y, 'red');
            // Camera Effects for Pad Crash
            camera.shakeIntensity = 15; // Adjust as needed
            camera.isZooming = true;
            camera.targetZoom = 1.3;    // Adjust zoom level as needed

            // End the game after the explosion
            setTimeout(() => {
                endGame(false); // false indicates failure
            }, 500); // Delay to allow explosion animation
            return;
        }
    }

    // Check for fuel depletion
    if (player.fuel <= 0 && !player.landed) {
        // Player runs out of fuel and hasn't landed
        createExplosion(player.x, player.y, 'red');
        camera.shakeIntensity = 20;
        camera.isZooming = true;
        camera.targetZoom = 1.5;

        setTimeout(() => {
            endGame(false);
        }, 500);
    }
}

// ==================== Camera and Rendering ==================== //
function gameLoop() {
    if (gameState !== 'playing') return; // Stop the loop if not playing

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save(); // Save the current state

    // Apply Camera Shake
    if (camera.shakeIntensity > 0) {
        const shakeX = (Math.random() - 0.5) * camera.shakeIntensity;
        const shakeY = (Math.random() - 0.5) * camera.shakeIntensity;
        ctx.translate(shakeX, shakeY);
        camera.shakeIntensity *= camera.shakeDecay; // Reduce shake over time
    }

    // Apply Zoom
    if (camera.isZooming) {
        if (camera.zoom < camera.targetZoom) {
            camera.zoom += camera.zoomStep;
            if (camera.zoom >= camera.targetZoom) {
                camera.zoom = camera.targetZoom;
                camera.isZooming = false;
            }
        } else if (camera.zoom > 1) {
            camera.zoom -= camera.zoomStep;
            if (camera.zoom <= 1) {
                camera.zoom = 1;
                camera.isZooming = false;
            }
        }
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(camera.zoom, camera.zoom);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Draw Background
    drawBackground();
    updateBackground();

    // Draw Game Elements
    drawGround();
    drawLandingPads();
    rocks.forEach(rock => rock.draw(ctx));
    updatePlayer();
    drawPlayer();
    updateParticles(); // Draw and update explosion and confetti particles
    updateStats(); // Update the HUD

    ctx.restore(); // Restore the original state

    requestAnimationFrame(gameLoop);
}

// ==================== Event Listeners ==================== //
// *** Modified: Updated keydown event to handle game over and success
window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (gameState === 'title') {
            startGame();
        } else if (gameState === 'gameover') {
            if (lastGameSuccess) {
                continueGame(); // Continue to next landing
            } else {
                restartGame(); // Restart the game after crash
            }
        }
    }

    if (gameState !== 'playing') return;

    if (e.key === 'ArrowLeft') player.keys.left = true;
    if (e.key === 'ArrowUp') player.keys.thrust = true;
    if (e.key === 'ArrowRight') player.keys.right = true;
});

window.addEventListener('keyup', (e) => {
    if (gameState !== 'playing') return;

    if (e.key === 'ArrowLeft') player.keys.left = false;
    if (e.key === 'ArrowUp') player.keys.thrust = false;
    if (e.key === 'ArrowRight') player.keys.right = false;
});

// ==================== HUD Update ==================== //
function updateStats() {
    fuelDisplay.textContent = `Fuel: ${Math.max(player.fuel, 0).toFixed(0)}`;
    scoreDisplay.textContent = `Score: ${score}`;
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}

// ==================== Game State Functions ==================== //
function startGame() {
    gameState = 'playing';
    titleScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    hud.style.display = 'block';
    instructions.style.display = 'block';
    resetGame();
    requestAnimationFrame(gameLoop);
}

function endGame(success = false) {
    lastGameSuccess = success; // *** Track the outcome
    gameState = 'gameover';
    hud.style.display = 'none';
    instructions.style.display = 'none';
    gameOverScreen.style.display = 'flex';
    
    if (success) {
        gameOverMessage.textContent = 'YOU SURVIVED!'; // *** Set success message
        finalScoreDisplay.textContent = `Fuel Remaining: ${Math.max(player.fuel, 0).toFixed(0)}`;
        
        // Add fuel for the next landing
        player.fuel += 200; // *** Adjust the amount as needed
    } else {
        gameOverMessage.textContent = 'GAME OVER!'; // *** Set failure message
        finalScoreDisplay.textContent = `Score: ${Math.max(player.fuel, 0).toFixed(0)}`;
    }
    
    // Update High Score if necessary
    if (Math.max(player.fuel, 0).toFixed(0) > highScore) {
        highScore = Math.max(player.fuel, 0).toFixed(0);
        localStorage.setItem('highScore', highScore);
    }
    highScoreDisplay.textContent = `High Score: ${highScore}`;
}

function restartGame() {
    gameState = 'playing';
    gameOverScreen.style.display = 'none';
    hud.style.display = 'block';
    instructions.style.display = 'block';
    resetGame();
    requestAnimationFrame(gameLoop);
}

// *** Added: Function to continue the game after a successful landing
function continueGame() {
    gameState = 'playing';
    gameOverScreen.style.display = 'none';
    hud.style.display = 'block';
    instructions.style.display = 'block';
    resetPlayer(); // Reset player for the next landing
    requestAnimationFrame(gameLoop);
}

// ==================== Reset Game ==================== //
function resetGame() {
    player.x = canvas.width / 2;
    player.y = 50;
    player.vx = 0;
    player.vy = 0;
    player.angle = 0;
    player.fuel = 200;
    player.landed = false;
    player.keys = { left: false, thrust: false, right: false };

    placeLandingPads();
    placeRocks();
    score = 0; // Reset score
    updateStats();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    explosionActive = false;
    confettiActive = false;
    particles = [];
    confetti = [];

    // Reset Camera
    camera.shakeIntensity = 0;
    camera.zoom = 1;
    camera.isZooming = false;
    camera.targetZoom = 1;
}

// *** Added: Function to reset player without resetting fuel
function resetPlayer() {
    player.x = canvas.width / 2;
    player.y = 50;
    player.vx = 0;
    player.vy = 0;
    player.angle = 0;
    player.landed = false;
    player.keys = { left: false, thrust: false, right: false };

    placeLandingPads();
    placeRocks();
    score = player.fuel; // Update score to current fuel
    updateStats();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    explosionActive = false;
    confettiActive = false;
    particles = [];
    confetti = [];

    // Reset Camera
    camera.shakeIntensity = 0;
    camera.zoom = 1;
    camera.isZooming = false;
    camera.targetZoom = 1;
}

// ==================== Initialize the Game ==================== //
resetGame(); // Initialize the game variables on page load
