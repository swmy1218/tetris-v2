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
  let freezeTimeout = null; // 設置前の猶予時間を管理
  let isDropping = true; // ミノが下に落ちているかどうかを管理

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

  // 壁を超えないかチェックする関数
  function isAtEdge(position) {
    return current.some(index => (position + index) % width === 0 || (position + index) % width === width - 1);
  }

  // テトリミノが壁や他のミノにぶつかるかチェックする関数
  function isCollision(position) {
    return current.some(index => squares[position + index].classList.contains('taken'));
  }

  // ミノが枠外に出ないように位置を調整する関数
  function checkRotationPosition(position) {
    // ミノが枠外に出た場合、調整
    const isOutOfBounds = current.some(index => (position + index) % width === 0 || (position + index) % width === width - 1);

    if (isOutOfBounds) {
      if (position % width > width / 2) {
        // 右端での回転時に枠外に出ないように左にシフト
        return position - 1;
      } else {
        // 左端での回転時に枠外に出ないように右にシフト
        return position + 1;
      }
    }

    return position; // 問題ない場合はそのままの位置を返す
  }

  // コントロール (左移動、右移動、回転)
  function control(e) {
    if (!isPaused && !isGameOver) {
      if (e.keyCode === 37 && !isAtEdge(currentPosition - 1) && !isCollision(currentPosition - 1)) {
        moveLeft();
      } else if (e.keyCode === 38) {
        rotate();
      } else if (e.keyCode === 39 && !isAtEdge(currentPosition + 1) && !isCollision(currentPosition + 1)) {
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
    if (!isPaused && !isGameOver && isDropping) {
      undraw();
      currentPosition += width;
      draw();
      freeze(); // 着地判定
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

  // 横移動を許可し、猶予時間を追加したfreeze関数
  function freeze() {
    if (current.some(index => squares[currentPosition + index + width].classList.contains('taken'))) {
      if (!freezeTimeout) {
        // ミノが落ち続けるのを停止
        isDropping = false;

        // 猶予時間中は横移動を許可
        freezeTimeout = setTimeout(() => {
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
          freezeTimeout = null; // タイマーをリセット
          isDropping = true; // 次のミノの落下を再開
        }, 300); // 0.3秒の猶予時間
      }
    }
  }

  function moveLeft() {
    undraw();
    currentPosition -= 1;
    draw();
  }

  function moveRight() {
    undraw();
    currentPosition += 1;
    draw();
  }

  // 回転処理
  function rotate() {
    undraw();
    const originalRotation = currentRotation;
    currentRotation = (currentRotation + 1) % current.length;
    const newPosition = checkRotationPosition(currentPosition); // 回転後の位置を調整
    current = theTetrominoes[random][currentRotation];

    // 新しい位置が枠外や他のミノにぶつからないか確認
    if (!isCollision(newPosition) && !isAtEdge(newPosition)) {
      currentPosition = newPosition; // 問題ない場合のみ新しい位置を反映
    } else {
      currentRotation = originalRotation; // 問題がある場合は元の回転に戻す
      current = theTetrominoes[random][currentRotation]; // 元の回転に戻す
    }
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
