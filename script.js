const canvas = document.getElementById('gameCanvas');
if (!canvas) throw new Error("Canvas element not found");
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error("2D context not found");

const scoreDisplay = document.getElementById('currentScore');
if (!scoreDisplay) throw new Error("Score display element not found");

const restartButton = document.getElementById('restart');
if (!restartButton) throw new Error("Restart button element not found");

const startButton = document.getElementById('start');
if (!startButton) throw new Error("Start button element not found");

const timerDisplay = document.getElementById('timer');
if (!timerDisplay) throw new Error("Timer display element not found");
const box = 20;

let snake, direction, food, score;
let gameSpeed = 200;
let gameInterval;
let obstacleInterval;
let obstacles = [];
let timeElapsed = 0;
let isPaused = false;
let foodCounter = 0;
let specialFood;
let specialFoodTimer;
let timerInterval;

startButton.addEventListener('click', () => startGame('medium'));
restartButton.addEventListener('click', restartGame);
document.addEventListener('keydown', changeDirection);
document.getElementById('difficulty-menu').style.display = 'block';

const startGame = (difficulty) => {
    isPaused = false;
    switch (difficulty) {
        case 'easy':
            gameSpeed = 200;
            obstacles = createObstacles(2); // 2 obstacles for easy
            break;
        case 'medium':
            gameSpeed = 125;
            obstacles = createObstacles(5); // 5 obstacles for medium
            break;
        case 'hard':
            gameSpeed = 75;
            obstacles = createObstacles(10); // 10 obstacles for hard
            break;
    }

    // Reset game variables
    snake = [{ x: 9 * box, y: 9 * box }];
    direction = 'RIGHT';
    foodCounter = 0;
    food = generateFood();
    score = 0;
    timeElapsed = 0; // Reset time elapsed
    specialFood = null; // Reset special food

    // Update score display
    scoreDisplay.innerHTML = `Score: ${score}`;
    timerDisplay.innerHTML = `Time: ${timeElapsed}s`; // Reset timer display

    // Start the game loop
    gameInterval = setInterval(draw, gameSpeed);
    obstacleInterval = setInterval(addObstacle, 20000); // Add a new obstacle every 20 seconds

    // Hide the start button and show the restart button
    startButton.style.display = 'none'; // Hide start button
    restartButton.style.display = 'none'; // Hide restart button
    document.getElementById('difficulty-menu').style.display = 'none';

    timeElapsed = 0; // Reset time elapsed
    timerDisplay.innerHTML = `Time: ${timeElapsed}s`; // Reset timer display

    timerInterval = setInterval(() => {
        timeElapsed += gameSpeed / 1000; // Increase time based on game speed
        timerDisplay.innerHTML = `Time: ${timeElapsed.toFixed(1)}s`; // Display time with one decimal
    }, gameSpeed); // Update timer every gameSpeed milliseconds

    // Reset special food
    specialFood = null; // Reset special food
    clearTimeout(specialFoodTimer);
};

function createObstacles(count) {
    try {
        const obstacles = [];
        for (let i = 0; i < count; i++) {
            const x = Math.floor(Math.random() * (canvas.width / box)) * box;
            const y = Math.floor(Math.random() * (canvas.height / box)) * box;
            obstacles.push({ x, y });
        }
        return obstacles;
    } catch (error) {
        console.error("Error creating obstacles:", error);
        return []; // Return an empty array in case of error
    }
}

function restartGame() {
    clearInterval(gameInterval);
    clearInterval(obstacleInterval); // Clear the obstacle interval
    clearInterval(timerInterval); // Clear the timer interval
    snake = [{ x: 9 * box, y: 9 * box }];
    score = 0;
    timeElapsed = 0; // Reset time elapsed
    foodCounter = 0; // Reset food counter
    specialFood = null; // Reset special food
    scoreDisplay.innerHTML = `Score: ${score}`;
    timerDisplay.innerHTML = `Time: ${timeElapsed}s`; // Reset timer display
    startButton.style.display = 'none'; // Hide start button
    restartButton.style.display = 'none'; // Hide restart button
    obstacles = []; // Reset obstacles

    // Show the start button again
    startButton.style.display = 'block'; // Show start button
}


function draw() {
    if (isPaused) return;

    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the snake
        for (let i = 0; i < snake.length; i++) {
            ctx.fillStyle = (i === 0) ? '#28a745' : '#6c757d'; // Head color green, body gray
            ctx.fillRect(snake[i].x, snake[i].y, box, box);
        }

        drawFoodAndObstacles();

        // Get the current head position
        const snakeX = snake[0].x;
        const snakeY = snake[0].y;

        // Check if the snake eats the food
        if (snakeX === food.x && snakeY === food.y) {
            foodCounter++; // Increment food counter
            score++;
            scoreDisplay.innerHTML = `Score: ${score}`;

            // Check if it's time for a special food
            if (foodCounter === 5) {
                // Create special food
                specialFood = generateFood();
                foodCounter = 0; // Reset food counter
            }

            // Generate new regular food
            food = generateFood();
        } else {
            // Remove the tail
            snake.pop();
        }

        // Check if the snake eats the special food
        if (specialFood && snakeX === specialFood.x && snakeY === specialFood.y) {
            score += 5; // Add 5 points for special food
            scoreDisplay.innerHTML = `Score: ${score}`;
            specialFood = null; // Remove special food after eating
        }

        // Move the snake
        if (direction === 'LEFT') snake.unshift({ x: snakeX - box, y: snakeY });
        if (direction === 'UP') snake.unshift({ x: snakeX, y: snakeY - box });
        if (direction === 'RIGHT') snake.unshift({ x: snakeX + box, y: snakeY });
        if (direction === 'DOWN') snake.unshift({ x: snakeX, y: snakeY + box });

        // Update the timer
        timeElapsed += gameSpeed / 1000; // Increase time based on game speed
        timerDisplay.innerHTML = `Time: ${timeElapsed.toFixed(1)}s`; // Display time with one decimal

        // Check for collisions with walls
        if (snake[0].x < 0 || snake[0].x >= canvas.width ||
            snake[0].y < 0 || snake[0].y >= canvas.height ||
            collision(snake) || collisionWithObstacles(snake)) {
            clearInterval(gameInterval);
            clearInterval(obstacleInterval); // Clear the obstacle interval
            restartButton.style.display = 'block'; // Show restart button
            startButton.style.display = 'none'; // Hide start button
            clearInterval(timerInterval); // Stop the timer
            console.error("Game over: Collision detected");
        }
    } catch (error) {
        console.error("Error during drawing:", error);
    }
}

function changeDirection(event) {
    if (event.keyCode === 80) { // Key "P"
        togglePause(); // Call the togglePause function
    } else if (event.keyCode === 71) { // Key "G"
        restartGame(); // Restart the game
    } else if (event.keyCode === 37 && direction !== 'RIGHT') direction = 'LEFT';
    else if (event.keyCode === 38 && direction !== 'DOWN') direction = 'UP';
    else if (event.keyCode === 39 && direction !== 'LEFT') direction = 'RIGHT';
    else if (event.keyCode === 40 && direction !== 'UP') direction = 'DOWN';
}

function collision(snake) {
    for (let i = 1; i < snake.length; i++) {
        if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) return true;
    }
    return false;
}

function collisionWithObstacles(snake) {
    for (const obstacle of obstacles) {
        if (snake[0].x === obstacle.x && snake[0].y === obstacle.y) {
            return true; // Collision with an obstacle
        }
    }
    return false;
}

function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(gameInterval);
    } else {
        gameInterval = setInterval(draw, gameSpeed);
    }
}

function drawFoodAndObstacles() {
    // Draw the food
    ctx.fillStyle = '#dc3545'; // Regular food color (red)
    ctx.fillRect(food.x, food.y, box, box);

    // Draw special food if it exists
    if (specialFood) {
        ctx.fillStyle = '#800080'; // Special food color (purple)
        ctx.fillRect(specialFood.x, specialFood.y, box, box);
    }

    // Draw obstacles
    ctx.fillStyle = '#ffc107'; // Obstacle color yellow
    for (const obstacle of obstacles) {
        ctx.fillRect(obstacle.x, obstacle.y, box, box);
    }
}

function generateFood() {
    try {
        const x = Math.floor(Math.random() * (canvas.width / box)) * box;
        const y = Math.floor(Math.random() * (canvas.height / box)) * box;
        return { x, y };
    } catch (error) {
        console.error("Error generating food:", error);
        return { x: 0, y: 0 }; // Return a default position in case of error
    }
}

function addObstacle() {
    try {
        const obstacle = {
            x: Math.floor(Math.random() * (canvas.width / box)) * box,
            y: Math.floor(Math.random() * (canvas.height / box)) * box,
        };
        obstacles.push(obstacle);
        if (obstacles.length > 10) { // Limit the number of obstacles
            obstacles.shift(); // Remove the oldest obstacle if there are more than 10
        }
    } catch (error) {
        console.error("Error adding obstacle:", error);
    }
}