document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.grid');
  let squares = Array.from(document.querySelectorAll('.grid div'));
  const scoreDisplay = document.querySelector('#score');
  const startBtn = document.querySelector('#start-button');
  const width = 10;
  let nextRandom = 0;
  let timerId;
  let score = 0;
  const colors = ['#FDC5F5', '#F7AEF8', '#B388EB', '#8093F1', '#72DDF7'];
  let currentSpeed = 1000; // 通常スピード
  let isAccelerating = false; // 加速状態を追跡
  let isFreezing = false; // ミノが設置されるかどうか
  let isPaused = false; // ゲームが一時停止かどうか
  let isGameOver = false; // ゲームオーバーかどうか

  // テトリミノの定義
  const lTetromino = [
    [1, width + 1, width * 2 + 1, 2],
    [width, width + 1, width + 2, width * 2 + 2],
    [1, width + 1, width * 2 + 1, width * 2],
    [width, width * 2, width * 2 + 1, width * 2 + 2]
  ];

  const zTetromino = [
    [0, width, width + 1, width * 2 + 1],
    [width + 1, width + 2, width * 2, width * 2 + 1],
    [0, width, width + 1, width * 2 + 1],
    [width + 1, width + 2, width * 2, width * 2 + 1]
  ];

  const tTetromino = [
    [1, width, width + 1, width + 2],
    [1, width + 1, width + 2, width * 2 + 1],
    [width, width + 1, width + 2, width * 2 + 1],
    [1, width, width + 1, width * 2 + 1]
  ];

  const oTetromino = [
    [0, 1, width, width + 1],
    [0, 1, width, width + 1],
    [0, 1, width, width + 1],
    [0, 1, width, width + 1]
  ];

  const iTetromino = [
    [1, width + 1, width * 2 + 1, width * 3 + 1],
    [width, width + 1, width + 2, width + 3],
    [1, width + 1, width * 2 + 1, width * 3 + 1],
    [width, width + 1, width + 2, width + 3]
  ];

  const theTetrominoes = [lTetromino, zTetromino, tTetromino, oTetromino, iTetromino];

  let currentPosition = 3;  // ミノが出現する固定位置
  let currentRotation = 0;
  let random = Math.floor(Math.random() * theTetrominoes.length);
  let current = theTetrominoes[random][currentRotation];

  function draw() {
    current.forEach(index => {
      squares[currentPosition + index].classList.add('tetromino');
      squares[currentPosition + index].style.backgroundColor = colors[random];
    });
  }

  function undraw() {
    current.forEach(index => {
      squares[currentPosition + index].classList.remove('tetromino');
      squares[currentPosition + index].style.backgroundColor = '';
    });
  }

  function control(e) {
    if (!isPaused && !isGameOver) { // ゲームが一時停止されておらず、ゲームオーバーでない場合のみ操作可能
      if (e.keyCode === 37) {
        moveLeft();
      } else if (e.keyCode === 38) {
        rotate();
      } else if (e.keyCode === 39) {
        moveRight();
      } else if (e.keyCode === 40 && !isFreezing) {
        accelerate(); // 下矢印キーが押されたら加速
      }
    }
  }

  function stopAccelerate(e) {
    if (!isPaused && !isGameOver && e.keyCode === 40) {
      resetSpeed(); // 下矢印キーが離されたらスピードを元に戻す
    }
  }

  document.addEventListener('keydown', control);
  document.addEventListener('keyup', stopAccelerate);

  function moveDown() {
    if (!isPaused && !isGameOver) { // 一時停止されていない時、ゲームオーバーでない時のみ動かす
      undraw();
      currentPosition += width;
      draw();
      freeze();
    }
  }

  function accelerate() {
    if (!isPaused && !isGameOver && !isAccelerating) {
      isAccelerating = true;
      clearInterval(timerId);
      timerId = setInterval(moveDown, 100); // 加速
    }
  }

  function resetSpeed() {
    isAccelerating = false;
    clearInterval(timerId);
    timerId = setInterval(moveDown, currentSpeed); // 通常のスピードに戻す
  }

  function freeze() {
    if (current.some(index => squares[currentPosition + index + width].classList.contains('taken'))) {
      isFreezing = true; // ミノが設置された
      current.forEach(index => squares[currentPosition + index].classList.add('taken'));
      random = nextRandom;
      nextRandom = Math.floor(Math.random() * theTetrominoes.length);
      current = theTetrominoes[random][currentRotation];
      currentPosition = 3; // 固定された位置に次のミノを表示
      draw();
      displayShape();
      addScore();
      checkGameOver(); // ゲームオーバーかどうかを確認
      resetSpeed(); // 設置された後は通常スピードに戻す
      isFreezing = false; // 設置完了
    }
  }

  function moveLeft() {
    undraw();
    const isAtLeftEdge = current.some(index => (currentPosition + index) % width === 0);
    if (!isAtLeftEdge) currentPosition -= 1;
    if (current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
      currentPosition += 1;
    }
    draw();
  }

  function moveRight() {
    undraw();
    const isAtRightEdge = current.some(index => (currentPosition + index) % width === width - 1);
    if (!isAtRightEdge) currentPosition += 1;
    if (current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
      currentPosition -= 1;
    }
    draw();
  }

  function rotate() {
    undraw();
    currentRotation++;
    if (currentRotation === current.length) {
      currentRotation = 0;
    }
    current = theTetrominoes[random][currentRotation];
    draw();
  }

  const displaySquares = document.querySelectorAll('.mini-grid div');
  const displayWidth = 4;
  const displayIndex = 0;

  const upNextTetrominoes = [
    [1, displayWidth + 1, displayWidth * 2 + 1, 2], // lTetromino
    [0, displayWidth, displayWidth + 1, displayWidth * 2 + 1], // zTetromino
    [1, displayWidth, displayWidth + 1, displayWidth + 2], // tTetromino
    [0, 1, displayWidth, displayWidth + 1], // oTetromino
    [1, displayWidth + 1, displayWidth * 2 + 1, displayWidth * 3 + 1] // iTetromino
  ];

  function displayShape() {
    displaySquares.forEach(square => {
      square.classList.remove('tetromino');
      square.style.backgroundColor = '';
    });
    upNextTetrominoes[nextRandom].forEach(index => {
      displaySquares[displayIndex + index].classList.add('tetromino');
      displaySquares[displayIndex + index].style.backgroundColor = colors[nextRandom];
    });
  }

  startBtn.addEventListener('click', () => {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
      isPaused = true; // 一時停止状態にする
    } else {
      if (isGameOver) {
        restartGame(); // ゲームオーバーの場合は再スタート
      } else {
        draw();
        timerId = setInterval(moveDown, currentSpeed);
        nextRandom = Math.floor(Math.random() * theTetrominoes.length);
        displayShape();
      }
      isPaused = false; // ゲームを再開
    }
  });

  function checkGameOver() {
    if (current.some(index => squares[currentPosition + index].classList.contains('taken'))) {
      gameOver();
    }
  }

  function gameOver() {
    scoreDisplay.innerHTML = 'Game Over';
    clearInterval(timerId); // ゲームを停止
    isGameOver = true; // ゲームオーバーに設定
  }

  function restartGame() {
    // グリッドの状態をクリア
    squares.forEach(square => {
      square.classList.remove('taken');
      square.classList.remove('tetromino');
      square.style.backgroundColor = '';
    });

    // 初期状態に戻す
    score = 0;
    scoreDisplay.innerHTML = score;
    isGameOver = false;
    random = Math.floor(Math.random() * theTetrominoes.length);
    current = theTetrominoes[random][currentRotation];
    currentPosition = 3; // 初期位置にミノを表示
    draw();
    timerId = setInterval(moveDown, currentSpeed);
  }

  function addScore() {
    for (let i = 0; i < 199; i += width) {
      const row = [i, i + 1, i + 2, i + 3, i + 4, i + 5, i + 6, i + 7, i + 8, i + 9];
      
      // 全てのセルが 'taken' である場合、行を消去
      if (row.every(index => squares[index].classList.contains('taken'))) {
        score += 10;
        scoreDisplay.innerHTML = score;
  
        // 行を消去
        row.forEach(index => {
          squares[index].classList.remove('taken');
          squares[index].classList.remove('tetromino');
          squares[index].style.backgroundColor = '';
        });
  
        // 消した行を削除し、上の行を1行ずつ下にずらす
        const squaresRemoved = squares.splice(i, width); // 削除した行を取り出す
        squares = squaresRemoved.concat(squares); // 削除した行を先頭に追加
        squares.forEach(cell => grid.appendChild(cell)); // 再配置
  
        // ここでiの値を再度確認し、次のループがずれないように調整
        i -= width;
      }
    }
  }
});
