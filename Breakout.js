const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');

    // Grid and brick sizes
    const COLS = 20, ROWS = 20;
    const brickSize = canvas.width / COLS;
    const brickWidth = brickSize, brickHeight = brickSize;

    // Layout: 1 = breakable, 2 = unbreakable
    const layout = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
    for (let c = 0; c < COLS; c++) layout[ROWS - 1][c] = 2;
    layout[ROWS - 1][9] = 1;
    layout[ROWS - 1][10] = 1;

    // Ball state
    const ballRadius = brickSize/2 - 2;
    let x = 0, y = 0;
    let dx = brickSize/4, dy = -brickSize/4;
    let isRunning = false;

    // Paddle state
    const paddleHeight = brickHeight;
    const paddleWidth = brickWidth * 4;
    let paddleX = (canvas.width - paddleWidth)/2;
    let rightPressed = false, leftPressed = false;

    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') rightPressed = true;
      if (e.key === 'ArrowLeft') leftPressed = true;
      if (e.code === 'Space' && !isRunning) isRunning = true;
    });
    document.addEventListener('keyup', e => {
      if (e.key === 'ArrowRight') rightPressed = false;
      if (e.key === 'ArrowLeft') leftPressed = false;
    });

    function drawBricks() {
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const status = layout[r][c];
          if (!status) continue;
          const bx = c*brickWidth, by = r*brickHeight;
          ctx.fillStyle = status===2?'#555':'#0f0';
          ctx.fillRect(bx, by, brickWidth, brickHeight);
          ctx.strokeStyle = '#222'; ctx.lineWidth = 1;
          ctx.strokeRect(bx, by, brickWidth, brickHeight);
        }
      }
    }

    function drawBall() {
      ctx.beginPath();
      ctx.arc(x, y, ballRadius, 0, Math.PI*2);
      ctx.fillStyle = '#ff0'; ctx.fill(); ctx.closePath();
    }

    function drawPaddle() {
      const py = canvas.height - paddleHeight - 10;
      ctx.fillStyle = '#ff0'; ctx.fillRect(paddleX, py, paddleWidth, paddleHeight);
      ctx.strokeStyle = '#aa0'; ctx.lineWidth = 2;
      ctx.strokeRect(paddleX, py, paddleWidth, paddleHeight);
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function collisionDetection() {
      // Check each brick for circle-rectangle collision
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const status = layout[r][c];
          if (status === 0) continue;
          const bx = c*brickWidth, by = r*brickHeight;
          // find closest point to ball center
          const closestX = clamp(x, bx, bx + brickWidth);
          const closestY = clamp(y, by, by + brickHeight);
          // vector from closest point to center
          const diffX = x - closestX;
          const diffY = y - closestY;
          // collision if distance < radius
          if (diffX*diffX + diffY*diffY < ballRadius*ballRadius) {
            if (status === 1) layout[r][c] = 0;
            // determine bounce direction
            if (Math.abs(diffX) > Math.abs(diffY)) dx = -dx;
            else dy = -dy;
            return;
          }
        }
      }
    }

    function draw() {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      drawBricks(); drawPaddle();
      const py = canvas.height - paddleHeight - 10;
      if (!isRunning) {
        x = paddleX + paddleWidth/2;
        y = py - ballRadius;
      }
      drawBall();
      if (isRunning) {
        collisionDetection();
        // wall bounce
        if (x+dx > canvas.width-ballRadius || x+dx < ballRadius) dx = -dx;
        if (y+dy < ballRadius) dy = -dy;
        else {
          // paddle collision
          const nextX = x+dx, nextY = y+dy;
          const nextBottom = nextY + ballRadius;
          if (nextBottom >= py && nextY - ballRadius <= py + paddleHeight &&
              nextX + ballRadius > paddleX && nextX - ballRadius < paddleX + paddleWidth) {
            const rel = nextX - (paddleX + paddleWidth/2);
            const norm = rel / (paddleWidth/2);
            const angle = norm * (Math.PI/3);
            const speed = Math.sqrt(dx*dx+dy*dy);
            dx = speed * Math.sin(angle);
            dy = -speed * Math.cos(angle);
          } else if (nextY > canvas.height) {
            document.location.reload(); return;
          }
        }
        x += dx; y += dy;
      }
      if (rightPressed && paddleX < canvas.width-paddleWidth) paddleX += 8;
      if (leftPressed && paddleX > 0) paddleX -= 8;
      requestAnimationFrame(draw);
    }

    draw();