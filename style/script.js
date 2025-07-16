// style/script.js

const settings = {
  particles: {
    length: 300,
    duration: 2.5,
    velocity: 100,
    effect: -0.6,
    size: 28,
  },
  modes: {
    colorful: {
      colors: [
        '#ff6b6b',
        '#ffd93d',
        '#6bcf7f',
        '#4d9de0',
        '#9b59b6',
        '#ff8a65',
      ],
    },
    romantic: {
      colors: ['#ff1744', '#e91e63', '#ff4081', '#f8bbd9', '#ffcdd2'],
    },
    sunset: { colors: ['#ff7043', '#ff5722', '#ffab40', '#ffc107', '#ff8f00'] },
    ocean: { colors: ['#00bcd4', '#0097a7', '#26c6da', '#4fc3f7', '#29b6f6'] },
    galaxy: { colors: ['#673ab7', '#9c27b0', '#e91e63', '#3f51b5', '#8bc34a'] },
  },
};

let currentSettings = { ...settings };
let currentColorMode = 'colorful';
let currentSpeedMode = 1;
let currentSizeMode = 1;
let isPaused = false;
let animationId;
let currentMessageIndex = -1;

const customMessages = [
  'Halo, Zahla! ❤️',
  'Senang bisa mengenalmu',
  'Pesonamu selalu memukau',
  'Semoga harimu secerah senyummu',
  'Ada kebaikan di setiap langkahmu',
  'Selalu kagum denganmu',
  'Semangat ya, untuk semua impianmu',
  'Terima kasih sudah menjadi inspirasi',
  'Semoga sukses selalu',
  'Senyummu mencerahkan hari',
  'Kamu istimewa',
];

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let isMouseActive = false;

function getRandomColor(mode = currentColorMode) {
  const colors = settings.modes[mode].colors;
  return colors[Math.floor(Math.random() * colors.length)];
}

class Point {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Point(this.x, this.y);
  }

  length(length) {
    if (typeof length === 'undefined')
      return Math.sqrt(this.x * this.x + this.y * this.y);
    this.normalize();
    this.x *= length;
    this.y *= length;
    return this;
  }

  normalize() {
    const length = this.length();
    this.x /= length;
    this.y /= length;
    return this;
  }
}

class Particle {
  constructor() {
    this.position = new Point();
    this.velocity = new Point();
    this.acceleration = new Point();
    this.age = 0;
    this.color = getRandomColor();
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.scale = 0.5 + Math.random() * 0.5;
    this.glowIntensity = Math.random();
  }

  initialize(x, y, dx, dy) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = dx;
    this.velocity.y = dy;
    this.acceleration.x = dx * currentSettings.particles.effect;
    this.acceleration.y = dy * currentSettings.particles.effect;
    this.age = 0;
    this.color = getRandomColor();
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.scale = 0.5 + Math.random() * 0.5;
  }

  update(deltaTime) {
    this.position.x += this.velocity.x * deltaTime * currentSpeedMode;
    this.position.y += this.velocity.y * deltaTime * currentSpeedMode;
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.age += deltaTime;
    this.rotation += this.rotationSpeed;
  }

  draw(context, image) {
    const ease = (t) => --t * t * t + 1;
    const progress = this.age / currentSettings.particles.duration;
    const size = image.width * ease(progress) * this.scale * currentSizeMode;
    const alpha = 1 - progress;

    context.save();
    context.globalAlpha = alpha;
    context.translate(this.position.x, this.position.y);
    context.rotate(this.rotation);

    context.shadowBlur = 20 * this.glowIntensity;
    context.shadowColor = this.color;

    context.fillStyle = this.color;
    context.beginPath();
    this.drawHeart(context, size);
    context.fill();

    context.restore();
  }

  drawHeart(context, size) {
    const scale = size / 100;
    context.beginPath();
    context.moveTo(0, -30 * scale);
    context.bezierCurveTo(
      -50 * scale,
      -80 * scale,
      -90 * scale,
      -10 * scale,
      0,
      30 * scale
    );
    context.bezierCurveTo(
      90 * scale,
      -10 * scale,
      50 * scale,
      -80 * scale,
      0,
      -30 * scale
    );
    context.closePath();
  }
}

class ParticlePool {
  constructor(length) {
    this.particles = [];
    for (let i = 0; i < length; i++) {
      this.particles[i] = new Particle();
    }
    this.firstActive = 0;
    this.firstFree = 0;
    this.duration = currentSettings.particles.duration;
  }

  add(x, y, dx, dy) {
    this.particles[this.firstFree].initialize(x, y, dx, dy);
    this.firstFree++;
    if (this.firstFree === this.particles.length) this.firstFree = 0;
    if (this.firstActive === this.firstFree) this.firstActive++;
    if (this.firstActive === this.particles.length) this.firstActive = 0;
  }

  update(deltaTime) {
    let i;
    if (this.firstActive < this.firstFree) {
      for (i = this.firstActive; i < this.firstFree; i++)
        this.particles[i].update(deltaTime);
    }
    if (this.firstFree < this.firstActive) {
      for (i = this.firstActive; i < this.particles.length; i++)
        this.particles[i].update(deltaTime);
      for (i = 0; i < this.firstFree; i++) this.particles[i].update(deltaTime);
    }

    while (
      this.particles[this.firstActive].age >= this.duration &&
      this.firstActive !== this.firstFree
    ) {
      this.firstActive++;
      if (this.firstActive === this.particles.length) this.firstActive = 0;
    }
  }

  draw(context, image) {
    let i;
    if (this.firstActive < this.firstFree) {
      for (i = this.firstActive; i < this.firstFree; i++)
        this.particles[i].draw(context, image);
    }
    if (this.firstFree < this.firstActive) {
      for (i = this.firstActive; i < this.particles.length; i++)
        this.particles[i].draw(context, image);
      for (i = 0; i < this.firstFree; i++)
        this.particles[i].draw(context, image);
    }
  }

  getActiveCount() {
    if (this.firstActive <= this.firstFree) {
      return this.firstFree - this.firstActive;
    }
    return this.particles.length - this.firstActive + this.firstFree;
  }
}

const canvas = document.getElementById('heartCanvas');
const context = canvas.getContext('2d');
let particles;
let particleRate;
let time;
let frameCount = 0;
let lastFpsUpdate = 0;

function handleMouseMove(event) {
  mouseX = event.clientX;
  mouseY = event.clientY;
  isMouseActive = true;
}

function handleTouchMove(event) {
  event.preventDefault();
  const touch = event.touches[0];
  mouseX = touch.clientX;
  mouseY = touch.clientY;
  isMouseActive = true;
}

function handleMouseLeave() {
  isMouseActive = false;
}

function handleTouchEnd() {
  isMouseActive = false;
}

function pointOnHeart(t) {
  return new Point(
    160 * Math.pow(Math.sin(t), 3),
    130 * Math.cos(t) -
      50 * Math.cos(2 * t) -
      20 * Math.cos(3 * t) -
      10 * Math.cos(4 * t) +
      25
  );
}

function createHeartImage() {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = currentSettings.particles.size;
  canvas.height = currentSettings.particles.size;

  function to(t) {
    const point = pointOnHeart(t);
    point.x =
      currentSettings.particles.size / 2 +
      (point.x * currentSettings.particles.size) / 350;
    point.y =
      currentSettings.particles.size / 2 -
      (point.y * currentSettings.particles.size) / 350;
    return point;
  }

  context.beginPath();
  let t = -Math.PI;
  let point = to(t);
  context.moveTo(point.x, point.y);
  while (t < Math.PI) {
    t += 0.01;
    point = to(t);
    context.lineTo(point.x, point.y);
  }
  context.closePath();
  context.fillStyle = '#ff30c5';
  context.fill();

  const image = new Image();
  image.src = canvas.toDataURL();
  return image;
}

let heartImage = createHeartImage();

function init() {
  particles = new ParticlePool(currentSettings.particles.length);
  particleRate =
    currentSettings.particles.length / currentSettings.particles.duration;
  time = new Date().getTime() / 1000;
}

function render() {
  if (!isPaused) {
    animationId = requestAnimationFrame(render);
  }

  const newTime = new Date().getTime() / 1000;
  const deltaTime = newTime - (time || newTime);
  time = newTime;

  context.fillStyle = 'rgba(0, 0, 0, 0.05)';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const amount = particleRate * deltaTime;
  for (let i = 0; i < amount; i++) {
    let spawnX, spawnY, dirX, dirY;

    if (isMouseActive) {
      spawnX = mouseX;
      spawnY = mouseY;
      const angle = Math.random() * Math.PI * 2;
      dirX = Math.cos(angle) * currentSettings.particles.velocity;
      dirY = Math.sin(angle) * currentSettings.particles.velocity;
    } else {
      const pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
      spawnX = canvas.width / 2 + pos.x;
      spawnY = canvas.height / 2 - pos.y;
      const dir = pos.clone().length(currentSettings.particles.velocity);
      dirX = dir.x;
      dirY = -dir.y;
    }

    particles.add(spawnX, spawnY, dirX, dirY);
  }

  particles.update(deltaTime);
  particles.draw(context, heartImage);

  frameCount++;
  if (newTime - lastFpsUpdate > 1) {
    document.getElementById('fps').textContent = frameCount;
    document.getElementById('particleCount').textContent =
      particles.getActiveCount();
    frameCount = 0;
    lastFpsUpdate = newTime;
  }
}

function onResize() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

document.getElementById('colorBtn').addEventListener('click', function () {
  const modes = Object.keys(settings.modes);
  const currentIndex = modes.indexOf(currentColorMode);
  currentColorMode = modes[(currentIndex + 1) % modes.length];
  document.getElementById('currentMode').textContent =
    currentColorMode.charAt(0).toUpperCase() + currentColorMode.slice(1);
  updateActiveButton(this);
  hideMessageTemporarily();
});

document.getElementById('speedBtn').addEventListener('click', function () {
  currentSpeedMode =
    currentSpeedMode === 1 ? 2 : currentSpeedMode === 2 ? 0.5 : 1;
  this.innerHTML =
    currentSpeedMode === 2
      ? '<span class="material-symbols-outlined">fast_forward</span> Fast'
      : currentSpeedMode === 0.5
      ? '<span class="material-symbols-outlined">slow_motion_video</span> Slow'
      : '<span class="material-symbols-outlined">speed</span> Speed';
  updateActiveButton(this);
  hideMessageTemporarily();
});

document.getElementById('sizeBtn').addEventListener('click', function () {
  currentSizeMode =
    currentSizeMode === 1 ? 1.5 : currentSizeMode === 1.5 ? 0.7 : 1;
  this.innerHTML =
    currentSizeMode === 1.5
      ? '<span class="material-symbols-outlined">zoom_out_map</span> Large'
      : currentSizeMode === 0.7
      ? '<span class="material-symbols-outlined">zoom_in_map</span> Small'
      : '<span class="material-symbols-outlined">fullscreen</span> Size';
  updateActiveButton(this);
  hideMessageTemporarily();
});

document.getElementById('pauseBtn').addEventListener('click', function () {
  isPaused = !isPaused;
  this.innerHTML = isPaused
    ? '<span class="material-symbols-outlined">play_arrow</span> Play'
    : '<span class="material-symbols-outlined">pause</span> Pause';
  if (!isPaused) {
    time = new Date().getTime() / 1000;
    render();
  }
  updateActiveButton(this);
  hideMessageTemporarily();
});

document.getElementById('resetBtn').addEventListener('click', function () {
  currentColorMode = 'colorful';
  currentSpeedMode = 1;
  currentSizeMode = 1;
  isPaused = false;
  currentMessageIndex = -1;

  document.getElementById('colorBtn').innerHTML =
    '<span class="material-symbols-outlined">palette</span> Color Mode';
  document.getElementById('speedBtn').innerHTML =
    '<span class="material-symbols-outlined">speed</span> Speed';
  document.getElementById('sizeBtn').innerHTML =
    '<span class="material-symbols-outlined">fullscreen</span> Size';
  document.getElementById('pauseBtn').innerHTML =
    '<span class="material-symbols-outlined">pause</span> Pause';
  document.getElementById('currentMode').textContent = 'Colorful';

  document
    .querySelectorAll('.control-btn')
    .forEach((btn) => btn.classList.remove('active'));
  document.getElementById('colorBtn').classList.add('active');

  document.getElementById('messageDisplay').classList.add('hidden');
  document.getElementById('messageBtn').classList.remove('active');

  init();
  if (!isPaused) render();
});

document.getElementById('messageBtn').addEventListener('click', function () {
  updateActiveButton(this);
  showMessage();
});

function updateActiveButton(clickedBtn) {
  document
    .querySelectorAll('.control-btn')
    .forEach((btn) => btn.classList.remove('active'));
  clickedBtn.classList.add('active');
}

function showMessage() {
  const messageDisplay = document.getElementById('messageDisplay');
  const messageText = document.getElementById('messageText');

  messageDisplay.classList.remove('hidden');

  currentMessageIndex = (currentMessageIndex + 1) % customMessages.length;
  messageText.textContent = customMessages[currentMessageIndex];

  messageText.style.animation = 'none';
  void messageText.offsetWidth;
  messageText.style.animation = null;
}

let messageTimeout;
function hideMessageTemporarily() {
  const messageDisplay = document.getElementById('messageDisplay');
  messageDisplay.classList.add('hidden');

  document.getElementById('messageBtn').classList.remove('active');

  if (messageTimeout) {
    clearTimeout(messageTimeout);
  }
  messageTimeout = setTimeout(() => {
    if (document.getElementById('messageBtn').classList.contains('active')) {
      messageDisplay.classList.remove('hidden');
    }
  }, 5000);
}

window.addEventListener('resize', onResize);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseleave', handleMouseLeave);
canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
canvas.addEventListener('touchend', handleTouchEnd);
onResize();
init();

document.getElementById('messageDisplay').classList.remove('hidden');
document.getElementById('messageText').textContent = customMessages[0];
currentMessageIndex = 0;

setTimeout(() => {
  render();
}, 100);
