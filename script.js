// Get the canvas element and its 2D rendering context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Get score display elements
const scoreDisplay = document.getElementById('score');
const gameOverMessage = document.getElementById('gameOverMessage');
const finalScoreDisplay = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// --- Sound Effects ---
// Create Audio objects for sound effects.
// You will need to replace 'path/to/food_sound.wav' and 'path/to/game_over_sound.wav'
// with the actual paths to your sound files (e.g., .wav, .mp3).
// For local hosting, these paths would be relative to your index.html file.
const foodSound = new Audio('https://www.soundjay.com/buttons/beep-07a.wav'); // Example sound, replace with your own
const gameOverSound = new Audio('https://www.soundjay.com/misc/fail-buzzer-01.wav'); // Example sound, replace with your own

// Game constants
const gridSize = 20; // Size of each cell in the grid (e.g., 20x20 pixels)
let tileCountX; // Number of tiles horizontally
let tileCountY; // Number of tiles vertically
let snake = []; // Array to store snake segments
let food = {}; // Object to store food position
let dx = 0; // Horizontal direction of snake movement
let dy = 0; // Vertical direction of snake movement
let score = 0; // Player's score
let gameInterval; // Variable to hold the game loop interval
let gameSpeed = 150; // Milliseconds per game frame (lower is faster)
let changingDirection = false; // Flag to prevent rapid direction changes

// Function to set canvas dimensions based on window size
function setCanvasDimensions() {
    // Set canvas width and height to be a multiple of gridSize
    // and fit within a reasonable percentage of the window
    const maxWidth = window.innerWidth * 0.8;
    const maxHeight = window.innerHeight * 0.7;

    tileCountX = Math.floor(maxWidth / gridSize);
    tileCountY = Math.floor(maxHeight / gridSize);

    // Ensure tile counts are at least 15x15 for a decent game size
    tileCountX = Math.max(tileCountX, 15);
    tileCountY = Math.max(tileCountY, 15);

    canvas.width = tileCountX * gridSize;
    canvas.height = tileCountY * gridSize;
}

// Initialize game state
function initializeGame() {
    setCanvasDimensions(); // Set canvas size initially
    snake = [
        { x: 10, y: 10 }, // Head of the snake
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    dx = gridSize; // Initial movement to the right
    dy = 0;
    score = 0;
    scoreDisplay.textContent = score;
    gameOverMessage.style.display = 'none'; // Hide game over message
    changingDirection = false;
    gameSpeed = 150; // Reset speed
    generateFood(); // Place initial food
    startGameLoop(); // Start the game loop
}

// Start the game loop
function startGameLoop() {
    // Clear any existing interval to prevent multiple loops
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    gameInterval = setInterval(gameTick, gameSpeed);
}

// Main game logic per tick
function gameTick() {
    if (checkGameOver()) {
        endGame();
        return;
    }

    changingDirection = false; // Allow direction change for next tick

    clearCanvas(); // Clear the entire canvas
    drawFood(); // Draw the food
    moveSnake(); // Move the snake
    drawSnake(); // Draw the snake in its new position
}

// Clear the canvas
function clearCanvas() {
    ctx.fillStyle = '#1a252f'; // Match canvas background color
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw a single snake segment or food square
function drawSquare(x, y, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#34495e'; // Darker border for segments
    ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
    ctx.strokeRect(x * gridSize, y * gridSize, gridSize, gridSize);
}

// Draw the snake
function drawSnake() {
    snake.forEach((segment, index) => {
        // Head is a different color
        const color = (index === 0) ? '#2ecc71' : '#27ae60'; // Green for head, darker green for body
        drawSquare(segment.x, segment.y, color);
    });
}

// Generate food at a random position
function generateFood() {
    let newFoodX;
    let newFoodY;
    let collisionWithSnake;

    do {
        // Generate random coordinates within the grid
        newFoodX = Math.floor(Math.random() * tileCountX);
        newFoodY = Math.floor(Math.random() * tileCountY);

        // Check if new food position collides with any part of the snake
        collisionWithSnake = snake.some(segment => segment.x === newFoodX && segment.y === newFoodY);

    } while (collisionWithSnake); // Keep generating until no collision

    food = { x: newFoodX, y: newFoodY };
}

// Draw the food
function drawFood() {
    drawSquare(food.x, food.y, '#e74c3c'); // Red color for food
}

// Move the snake
function moveSnake() {
    // Create the new head of the snake
    const head = { x: snake[0].x + (dx / gridSize), y: snake[0].y + (dy / gridSize) };

    // Add the new head to the beginning of the snake array
    snake.unshift(head);

    // Check if snake ate food
    const didEatFood = head.x === food.x && head.y === food.y;

    if (didEatFood) {
        score += 10; // Increase score
        scoreDisplay.textContent = score; // Update score display
        generateFood(); // Generate new food
        // Play food sound
        foodSound.currentTime = 0; // Rewind to start
        foodSound.play();
        // Optionally increase speed as score increases
        if (gameSpeed > 50) { // Don't go below 50ms
            gameSpeed -= 5;
            startGameLoop(); // Restart interval with new speed
        }
    } else {
        // If no food was eaten, remove the tail segment
        snake.pop();
    }
}

// Check for game over conditions
function checkGameOver() {
    const head = snake[0];

    // Check for wall collision
    const hitLeftWall = head.x < 0;
    const hitRightWall = head.x >= tileCountX;
    const hitTopWall = head.y < 0;
    const hitBottomWall = head.y >= tileCountY;

    if (hitLeftWall || hitRightWall || hitTopWall || hitBottomWall) {
        return true;
    }

    // Check for self-collision (snake head hitting its own body)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }

    return false;
}

// End the game
function endGame() {
    clearInterval(gameInterval); // Stop the game loop
    finalScoreDisplay.textContent = score; // Display final score
    gameOverMessage.style.display = 'block'; // Show game over message
    // Play game over sound
    gameOverSound.currentTime = 0; // Rewind to start
    gameOverSound.play();
}

// Event listener for arrow key presses
document.addEventListener('keydown', changeDirection);

function changeDirection(event) {
    // Prevent rapid direction changes within a single game tick
    if (changingDirection) return;
    changingDirection = true;

    const keyPressed = event.keyCode;
    const LEFT_KEY = 37;
    const UP_KEY = 38;
    const RIGHT_KEY = 39;
    const DOWN_KEY = 40;

    // Prevent snake from reversing on itself
    const goingUp = dy === -gridSize;
    const goingDown = dy === gridSize;
    const goingRight = dx === gridSize;
    const goingLeft = dx === -gridSize;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx = -gridSize;
        dy = 0;
    } else if (keyPressed === UP_KEY && !goingDown) {
        dx = 0;
        dy = -gridSize;
    } else if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx = gridSize;
        dy = 0;
    } else if (keyPressed === DOWN_KEY && !goingUp) {
        dx = 0;
        dy = gridSize;
    }
}

// Event listener for restart button
restartButton.addEventListener('click', initializeGame);

// Handle window resize to adjust canvas dimensions
window.addEventListener('resize', () => {
    setCanvasDimensions();
    // Redraw everything after resize to ensure proper scaling
    clearCanvas();
    drawFood();
    drawSnake();
});

// Initialize the game when the window loads
window.onload = initializeGame;
