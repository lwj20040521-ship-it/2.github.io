// --- 常量设置 ---
const canvas = document.getElementById('animationCanvas');
const ctx = canvas.getContext('2d');
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
canvas.width = screenWidth;
canvas.height = screenHeight;

const MAX_FLOATING_TEXTS = 18;
const PARTICLE_SPAWN_RATE = 20;

// --- 颜色定义 ---
const HEART_COLORS = [
    "rgb(255, 105, 180)", "rgb(255, 182, 193)",
    "rgb(255, 192, 203)", "rgb(255, 240, 245)"
];
const TEXT_COLORS = [
    "rgb(255, 255, 255)", "rgb(255, 255, 224)",
    "rgb(255, 228, 181)", "rgb(250, 128, 114)"
];

// --- 全局变量 ---
let particles = [];
let floatingTexts = [];

// --- 工具函数 ---
function randomUniform(min, max) {
    return Math.random() * (max - min) + min;
}

// --- 爱心粒子类 ---
class HeartParticle {
    constructor(x, y, cx, cy) {
        this.x = x;
        this.y = y;
        const dx = this.x - cx;
        const dy = this.y - cy;
        const dist = Math.hypot(dx, dy);
        const speed = randomUniform(0.5, 1);
        this.vx = (dist > 0) ? (dx / dist) * speed : randomUniform(-1, 1);
        this.vy = (dist > 0) ? (dy / dist) * speed : randomUniform(-1, 1);
        this.color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
        this.size = randomUniform(1, 2.5);
        this.lifespan = Math.floor(randomUniform(40, 60));
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifespan -= 1;
        if (this.size > 0.2) {
            this.size -= 0.04;
        }
    }

    draw() {
        if (this.lifespan > 0 && this.size > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }
}

// --- 漂浮文字类 ---
class FloatingText {
    constructor() {
        this.text = "天天开心（＾∀＾）";
        const fontSize = Math.floor(randomUniform(10, 30));
        this.font = `${fontSize}px 'Yousun', sans-serif`;
        this.color = TEXT_COLORS[Math.floor(Math.random() * TEXT_COLORS.length)];

        ctx.font = this.font;
        const textMetrics = ctx.measureText(this.text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;

        this.x = randomUniform(0, screenWidth - textWidth);
        this.y = randomUniform(0, screenHeight - textHeight);

        const dx = randomUniform(-1, 1);
        const dy = randomUniform(-1, 1);
        const dist = Math.hypot(dx, dy);
        const speedMagnitude = randomUniform(0.5, 1);

        if (dist > 0) {
            this.vx = (dx / dist) * speedMagnitude;
            this.vy = (dy / dist) * speedMagnitude;
        } else {
            this.vx = 1 * speedMagnitude;
            this.vy = 0;
        }

        this.lifespan = Math.floor(randomUniform(240, 600));
        this.fadeDuration = 90;
        this.width = textWidth;
        this.height = textHeight;
    }

    update() {
        this.lifespan -= 1;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x + this.width > screenWidth) {
            this.vx *= -1;
        }
        if (this.y - this.height < 0 || this.y > screenHeight) {
            this.vy *= -1;
        }
    }

    draw() {
        ctx.save();
        if (this.lifespan < this.fadeDuration) {
            ctx.globalAlpha = Math.max(0, this.lifespan / this.fadeDuration);
        } else {
            ctx.globalAlpha = 1.0;
        }
        ctx.font = this.font;
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}


// --- 动画核心参数 (平滑缩放版) ---
let frameCounter = 0;
const BASE_HEART_SCALE = 4.0;  // 心脏的基础大小 (最小尺寸)
const PULSE_AMPLITUDE = 2.5;   // 缩放的范围 (从最小到最大变化的幅度)
const BEAT_FREQUENCY = 0.03;   // 缩放的速度 (数值越大, 速度越快)


// --- 主动画循环 ---
function animate() {
    // 1. 清理画布
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // 2. 更新心跳大小 (平滑版)
    frameCounter++;

    // 使用 sin 函数创建一个在 0 和 1 之间平滑变化的脉冲值
    const pulse = (Math.sin(frameCounter * BEAT_FREQUENCY) + 1) / 2; 

    // 计算最终的心脏大小
    const heartScale = BASE_HEART_SCALE + pulse * PULSE_AMPLITUDE;

    // 3. 产生新粒子
    const cx = screenWidth / 2;
    const cy = screenHeight / 2;
    for (let i = 0; i < PARTICLE_SPAWN_RATE; i++) {
        const t = randomUniform(0, 2 * Math.PI);
        const x = cx + heartScale * (16 * Math.pow(Math.sin(t), 3));
        const y = cy - heartScale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        particles.push(new HeartParticle(x, y, cx, cy));
    }

    // 4. 产生新漂浮文字
    if (floatingTexts.length < MAX_FLOATING_TEXTS && Math.random() < 0.04) {
        floatingTexts.push(new FloatingText());
    }

    // 5. 更新并绘制所有对象
    particles = particles.filter(p => {
        p.update();
        p.draw();
        return p.lifespan > 0 && p.size > 0;
    });

    floatingTexts = floatingTexts.filter(t => {
        t.update();
        t.draw();
        return t.lifespan > 0;
    });
    
    // 6. 请求下一帧动画
    requestAnimationFrame(animate);
}

// --- 事件监听 ---
window.addEventListener('resize', () => {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    canvas.width = screenWidth;
    canvas.height = screenHeight;
});

// --- 启动动画 ---
animate();