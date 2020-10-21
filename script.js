const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector(".scoreEl");
const startGameBtn = document.querySelector(".startBtn");
const modalEL = document.querySelector(".container");
const endScoreEl = document.querySelector(".endScoreEl");

canvas.width = innerWidth;
canvas.height = innerHeight;

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
}

class Projectile {
  constructor(x, y, r, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = r;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class Enemy {
  constructor(x, y, r, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = r;
    this.color = color;
    this.velocity = velocity;
  }

  draw() {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

const friction = 0.99;
class Particle {
  constructor(x, y, r, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = r;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.alpha -= 0.01;
  }
}

// Variables
const x = canvas.width / 2;
const y = canvas.height / 2;

// palyer instance
let player = new Player(x, y, 10, "#fff");
let score = 0;
let projectiles = [];
let enemies = [];
let particles = [];

function init() {
  player = new Player(x, y, 10, "#fff");
  projectiles = [];
  enemies = [];
  particles = [];
  score = 0;
  endScoreEl.textContent = score;
  scoreEl.textContent = score;
}

function spawnEnemies() {
  setInterval(() => {
    const radius = Math.random() * (30 - 5) + 5;
    let x;
    let y;
    if (Math.random() < 0.5) {
      x = Math.random() <= 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      y = Math.random() <= 0.5 ? 0 - radius : canvas.height + radius;
      x = Math.random() * canvas.width;
    }

    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
    const velocity = {
      x: Math.cos(angle),
      y: Math.sin(angle),
    };
    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, 1000);
}

let animationID;
function animate() {
  animationID = requestAnimationFrame(animate);
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  player.draw();

  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else particle.update();
  });

  projectiles.forEach((projectile, proInd) => {
    projectile.update();
    if (
      projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      setTimeout(() => {
        projectiles.splice(proInd, 1);
      }, 0);
    }
  });

  enemies.forEach((enemy, index) => {
    enemy.update();

    const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (dist - enemy.radius - player.radius < 1) {
      // end game
      cancelAnimationFrame(animationID);
      endScoreEl.textContent = score;
      modalEL.style.display = "flex";
    }

    projectiles.forEach((projectile, proInd) => {
      const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

      // when project touch enemy
      if (dist - enemy.radius - projectile.radius < 1) {
        // creating firework
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 6),
                y: (Math.random() - 0.5) * (Math.random() * 6),
              }
            )
          );
        }
        if (enemy.radius - 10 > 10) {
          // increase our score
          score += 100;
          scoreEl.textContent = score;

          gsap.to(enemy, { radius: enemy.radius - 10 });
          setTimeout(() => {
            projectiles.splice(proInd, 1);
          }, 0);
        } else {
          // remove form the scene altogether
          score += 250;
          scoreEl.textContent = score;

          setTimeout(() => {
            enemies.splice(index, 1);
            projectiles.splice(proInd, 1);
          }, 0);
        }
      }
    });
  });
}

window.addEventListener("click", (event) => {
  const angle = Math.atan2(event.clientY - y, event.clientX - x);
  const velocity = {
    x: Math.cos(angle) * 6,
    y: Math.sin(angle) * 6,
  };
  projectiles.push(new Projectile(x, y, 5, "white", velocity));
});

startGameBtn.addEventListener("click", () => {
  init();
  animate();
  spawnEnemies();
  modalEL.style.display = "none";
});
