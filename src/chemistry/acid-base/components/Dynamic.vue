<template>
  <div class="dynaminc-container">
    <div class="canvas-container">
      <canvas ref="experimentCanvas" width="750" height="470"></canvas>
    </div>
    <div class="controls">
      <button id="startBtn" @click="startExperiment">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
          />
          <path
            d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"
          />
        </svg>
        开始滴定
      </button>
      <button id="resetBtn" @click="resetExperiment">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
        >
          <path
            d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"
          />
          <path
            d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"
          />
        </svg>
        重置
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// 获取Canvas元素引用
const experimentCanvas = ref(null);
let ctx = null;
let animationFrameId = null;

const emit = defineEmits(['callback', 'reset']);

const beakerChangeInfo = {
  color: '#f94241',
  dropCount: 18,
};

// 实验状态（响应式替换原有普通对象，便于跟踪状态变化）
const experiment = ref({
  isRunning: false,
  isPaused: false,
  liquidLevel: 0, // 烧杯液体高度 (0-100%)
  volume: 0, // 当前体积 (0-100 mL)
  maxVolume: 100,
  drops: [], // 滴落的液滴
  dropCount: 0, // 液滴计数
  maxDropCount: 38,
  lastDropTime: 0, // 上次滴落时间
  dropInterval: 500, // 滴落间隔 (ms) - 默认中速
  lastUpdateTime: 0, // 上次更新时间
  fillSpeed: 0.4, // 填充速度 (%/s)
  speedLevel: 2, // 速度级别：0=慢速，1=中速，2=快速
});

// 计算中轴线位置（后续基于Canvas尺寸动态计算）
let centerX = 0;

// 设备尺寸（垂直布局：上滴管，下烧杯）
const dropper = ref({
  x: 0,
  y: 0,
  width: 28,
  bodyHeight: 120,
  tipHeight: 25,
  tipWidth: 6,
  liquidHeight: 70, // 滴管内液体高度
});

const beaker = ref({
  x: 0,
  y: 0,
  width: 120,
  height: 160,
  baseWidth: 100,
  neckWidth: 90,
  lipWidth: 140,
  lipHeight: 12,
  thickness: 6, // 烧杯壁厚度
});

// 初始化实验
const init = () => {
  if (!experimentCanvas.value) return;

  // 重置实验状态
  experiment.value.drops = [];
  experiment.value.liquidLevel = 20;
  experiment.value.volume = 20;
  experiment.value.dropCount = 0;
  experiment.value.lastDropTime = 0;
  experiment.value.lastUpdateTime = 0;

  // 计算中轴线和设备位置
  centerX = experimentCanvas.value.width / 2;

  // 更新滴管位置
  dropper.value.x = centerX;
  dropper.value.y = experimentCanvas.value.height * 0.2;

  // 更新烧杯位置
  beaker.value.x = centerX;
  beaker.value.y = experimentCanvas.value.height * 0.65;

  // 首次绘制
  draw();
};

// 绘制实验装置
const draw = () => {
  if (!ctx) return;
  // 清除画布
  ctx.clearRect(
    0,
    0,
    experimentCanvas.value.width,
    experimentCanvas.value.height,
  );
  // 绘制背景
  drawBackground();
  // 绘制滴管
  drawDropper();
  // 绘制烧杯
  drawBeaker();
  // 绘制液滴
  drawDrops();
};

// 绘制背景
const drawBackground = () => {
  if (!ctx) return;

  // 绘制垂直中轴线（辅助线）
  ctx.strokeStyle = '#d6d9e0';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, experimentCanvas.value.height);
  ctx.stroke();
  ctx.setLineDash([]);
};

// 绘制烧杯
const drawBeaker = () => {
  if (!ctx) return;

  const { x, y, width, height, baseWidth, lipHeight, thickness } = beaker.value;

  // 烧杯玻璃效果（外壁）
  ctx.fillStyle = 'rgba(220, 240, 255, 0.12)';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;

  // 烧杯主体轮廓
  ctx.beginPath();
  ctx.moveTo(x - baseWidth / 2, y + height);
  ctx.lineTo(x - baseWidth / 2, y);
  ctx.lineTo(x - baseWidth / 2, y - lipHeight);
  ctx.lineTo(x + baseWidth / 2, y - lipHeight);
  ctx.lineTo(x + baseWidth / 2, y);
  ctx.lineTo(x + baseWidth / 2, y + height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 烧杯刻度
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.font = '12px Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'right';

  // 绘制主要刻度线
  for (let i = 0; i <= 100; i += 20) {
    const lineY = y + height - (i / 100) * height;
    const lineLength = 10;

    ctx.beginPath();
    ctx.moveTo(x - width / 2 - lineLength + 20, lineY);
    ctx.lineTo(x - width / 2 + 20, lineY);
    ctx.stroke();

    // 刻度标签
    ctx.fillText(`${i} mL`, x - width / 2 + 5, lineY + 4);
  }

  // 绘制次要刻度线（每10mL）
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  for (let i = 10; i < 100; i += 10) {
    if (i % 20 === 0) continue; // 跳过主要刻度

    const lineY = y + height - (i / 100) * height;
    const lineLength = 6;

    ctx.beginPath();
    ctx.moveTo(x - width / 2 - lineLength + 20, lineY);
    ctx.lineTo(x - width / 2 + 20, lineY);
    ctx.stroke();
  }

  // 烧杯内液体
  if (experiment.value.liquidLevel > 0) {
    const liquidHeight = (experiment.value.liquidLevel / 100) * height;
    const liquidTopY = y + height - liquidHeight;

    // 计算液体顶部宽度（烧杯是锥形的）
    const liquidTopWidth = baseWidth;

    // 颜色变化
    if (experiment.value.dropCount >= beakerChangeInfo.dropCount) {
      ctx.fillStyle = beakerChangeInfo.color;
    } else {
      ctx.fillStyle = '#6c89e4';
    }

    // 绘制液体
    ctx.beginPath();
    ctx.moveTo(x - baseWidth / 2 + thickness, y + height - thickness);
    ctx.lineTo(x - liquidTopWidth / 2 + thickness, liquidTopY);
    ctx.lineTo(x + liquidTopWidth / 2 - thickness, liquidTopY);
    ctx.lineTo(x + baseWidth / 2 - thickness, y + height - thickness);
    ctx.closePath();
    ctx.fill();
  }

  // 烧杯标签
  ctx.font = 'bold 14px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'center';
  ctx.fillText('100mL 烧杯', x, y + height + 25);
};

// 绘制滴管
const drawDropper = () => {
  if (!ctx) return;

  const { x, y, width, bodyHeight, tipHeight, tipWidth, liquidHeight } =
    dropper.value;

  // 滴管橡胶头
  ctx.fillStyle = 'rgba(180, 40, 40, 0.95)';
  ctx.strokeStyle = 'rgba(140, 20, 20, 0.8)';
  ctx.lineWidth = 1.5;

  // 橡胶头（带有挤压效果）
  ctx.beginPath();
  ctx.ellipse(x, y + 12, width / 2, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 滴管玻璃管
  ctx.fillStyle = 'rgba(220, 240, 255, 0.15)';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.fillRect(x - width / 2, y + 25, width, bodyHeight);
  ctx.strokeRect(x - width / 2, y + 25, width, bodyHeight);

  // 滴管内的液体
  if (
    experiment.value.isRunning ||
    experiment.value.isPaused ||
    experiment.value.liquidLevel < 100
  ) {
    const dropperLiquidHeight = Math.min(liquidHeight, bodyHeight * 0.8);
    const dropperLiquidY = y + 25 + (bodyHeight - dropperLiquidHeight);

    ctx.fillStyle = '#2b8ed2';
    ctx.fillRect(
      x - width / 2 + 2,
      dropperLiquidY,
      width - 4,
      dropperLiquidHeight,
    );

    // 液体上表面
    ctx.fillStyle = 'rgba(150, 220, 255, 0.8)';
    ctx.fillRect(x - width / 2 + 2, dropperLiquidY - 1, width - 4, 2);
  }

  // 滴管尖端
  ctx.beginPath();
  ctx.moveTo(x - tipWidth / 2, y + 25 + bodyHeight);
  ctx.lineTo(x + tipWidth / 2, y + 25 + bodyHeight);
  ctx.lineTo(x, y + 25 + bodyHeight + tipHeight);
  ctx.closePath();
  ctx.fillStyle = 'rgba(220, 240, 255, 0.9)';
  ctx.fill();
  ctx.stroke();

  // 滴管尖端液体（正在滴落时）
  if (experiment.value.isRunning && !experiment.value.isPaused) {
    ctx.fillStyle = 'rgba(64, 164, 254, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y + 25 + bodyHeight + tipHeight - 3, 3, 0, Math.PI * 2);
    ctx.fill();

    // 液滴高光
    ctx.fillStyle = 'rgba(200, 240, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(x - 1, y + 25 + bodyHeight + tipHeight - 4, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // 滴管标签
  ctx.font = 'bold 12px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'center';
  ctx.fillText('胶头滴管', x, y - 8);
};

// 绘制液滴
const drawDrops = () => {
  if (!ctx) return;

  for (let i = 0; i < experiment.value.drops.length; i++) {
    const drop = experiment.value.drops[i];

    // 根据液滴大小和下落阶段调整透明度
    const opacity = drop.active ? 0.9 : 0.6;

    // 液滴渐变
    const dropGradient = ctx.createRadialGradient(
      drop.x,
      drop.y,
      0,
      drop.x,
      drop.y,
      drop.radius,
    );
    dropGradient.addColorStop(0, `rgba(120, 200, 255, ${opacity})`);
    dropGradient.addColorStop(1, `rgba(64, 164, 254, ${opacity * 0.7})`);

    ctx.fillStyle = dropGradient;
    ctx.beginPath();
    ctx.ellipse(
      drop.x,
      drop.y,
      drop.radius,
      drop.radius * 1.2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // 液滴高光
    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.7})`;
    ctx.beginPath();
    ctx.ellipse(
      drop.x - drop.radius * 0.3,
      drop.y - drop.radius * 0.4,
      drop.radius * 0.3,
      drop.radius * 0.2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // 如果液滴即将落入烧杯，添加溅起效果
    if (!drop.active && drop.splashProgress < 1) {
      drawSplashEffect(drop, i);
    }
  }
};

// 绘制溅起效果
const drawSplashEffect = (drop, index) => {
  if (!ctx) return;

  const splashRadius = drop.radius * (1 + drop.splashProgress * 2);
  const opacity = 0.7 * (1 - drop.splashProgress);

  ctx.strokeStyle = `rgba(100, 180, 255, ${opacity})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(drop.x, drop.y, splashRadius, 0, Math.PI * 2);
  ctx.stroke();

  // 小溅起点
  const points = 6;
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const distance = splashRadius * 1.2;
    const pointX = drop.x + Math.cos(angle) * distance;
    const pointY = drop.y + Math.sin(angle) * distance;

    ctx.fillStyle = `rgba(100, 180, 255, ${opacity * 0.8})`;
    ctx.beginPath();
    ctx.arc(pointX, pointY, drop.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 更新溅起进度（注意：直接修改数组元素需要触发响应式更新）
  experiment.value.drops[index].splashProgress += 0.05;
};

// 更新液滴位置
const updateDrops = (timestamp) => {
  if (!experimentCanvas.value) return;

  let exp = experiment.value;
  if (!exp.lastUpdateTime) exp.lastUpdateTime = timestamp;
  const deltaTime = timestamp - exp.lastUpdateTime;

  // 生成新液滴
  if (exp.isRunning && !exp.isPaused) {
    if (timestamp - exp.lastDropTime > exp.dropInterval) {
      // 从滴管尖端创建新液滴
      const newDrop = {
        x: dropper.value.x,
        y:
          dropper.value.y +
          dropper.value.bodyHeight +
          dropper.value.tipHeight +
          25,
        radius: 4,
        speed: 1.5 + exp.speedLevel * 0.4,
        active: true,
        splashProgress: 0,
      };
      exp.drops.push(newDrop);

      exp.dropCount++;
      exp.lastDropTime = timestamp;

      // 触发Vue响应式更新
      experiment.value = { ...exp };
    }
  }

  // 更新液滴位置
  for (let i = exp.drops.length - 1; i >= 0; i--) {
    const drop = exp.drops[i];
    const beakerInfo = beaker.value;
    const beakerTopY = beakerInfo.y - beakerInfo.lipHeight;
    const beakerBottomY = beakerInfo.y + beakerInfo.height;

    if (drop.active) {
      // 液滴下落（速度随时间增加）
      drop.y += drop.speed * (deltaTime / 16);
      drop.speed += 0.04; // 模拟重力加速度

      // 检查液滴是否落入烧杯
      if (drop.y > beakerTopY && drop.y < beakerBottomY) {
        const relativeX = drop.x - beakerInfo.x;
        // 计算在液滴高度处烧杯的宽度
        const heightRatio = (beakerBottomY - drop.y) / beakerInfo.height;
        const currentWidth =
          beakerInfo.baseWidth +
          (beakerInfo.width - beakerInfo.baseWidth) * (1 - heightRatio * 0.7);

        if (Math.abs(relativeX) < currentWidth / 2) {
          // 液滴落入烧杯
          drop.active = false;

          // 增加液体量
          if (exp.isRunning && !exp.isPaused) {
            const increment =
              exp.fillSpeed *
              (deltaTime / 1000) *
              100 *
              (exp.speedLevel + 1) *
              0.25;
            exp.liquidLevel = Math.min(100, exp.liquidLevel + increment);
            exp.volume = (exp.liquidLevel / 100) * 100;
          }
        }
      }

      // 如果液滴超出画布，移除
      if (drop.y > experimentCanvas.value.height + 30) {
        exp.drops.splice(i, 1);
      }
    } else {
      // 已落入烧杯的液滴，显示溅起效果
      if (drop.splashProgress < 1) {
        drop.splashProgress += 0.03;
      } else {
        exp.drops.splice(i, 1);
      }
    }
  }

  exp.lastUpdateTime = timestamp;
  // 触发Vue响应式更新
  experiment.value = { ...exp };
};

// 动画循环
const animate = (timestamp) => {
  updateDrops(timestamp);
  draw();
  emit('callback', experiment.value.dropCount);
  if (experiment.value.dropCount >= experiment.value.maxDropCount) {
    experiment.value.isRunning = false;
    experiment.value.isPaused = true;
    cancelAnimationFrame(animationFrameId);
  } else {
    animationFrameId = requestAnimationFrame(animate);
  }
};

// 开始实验
const startExperiment = () => {
  experiment.value.isRunning = true;
  experiment.value.isPaused = false;
  // 启动动画循环
  animationFrameId = requestAnimationFrame(animate);
};

// 重置实验
const resetExperiment = () => {
  experiment.value.isRunning = false;
  experiment.value.isPaused = false;
  cancelAnimationFrame(animationFrameId);
  init();
  emit('reset');
};

// 组件挂载时初始化
onMounted(() => {
  if (experimentCanvas.value) {
    // 获取Canvas 2D上下文
    ctx = experimentCanvas.value.getContext('2d');
    // 初始化实验
    init();
  }
});

// 组件卸载时销毁动画循环，防止内存泄漏
onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
</script>

<style scoped>
.dynaminc-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 25px;
}

.canvas-container {
  position: relative;
  /* background-color: rgba(255, 255, 255, 0.05); */
  border-radius: 15px;
  padding: 15px;
  /* box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5); */
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  height: 400px;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
  margin-top: 5px;
  width: 100%;
}

button {
  padding: 10px 24px;
  border: none;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  min-width: 120px;
  justify-content: center;
}

#startBtn {
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

#resetBtn {
  background: linear-gradient(90deg, #a9c9ff 0%, #ffbbec 100%);
  color: #333;
}

button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

button:active {
  transform: translateY(1px);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@keyframes shimmer {
  100% {
    left: 100%;
  }
}

@media (max-width: 768px) {
  .canvas-container {
    height: 450px;
    padding: 10px;
  }

  .controls {
    gap: 10px;
  }

  button {
    padding: 8px 16px;
    font-size: 0.85rem;
    min-width: 110px;
  }
}

@media (max-width: 480px) {
  .controls {
    flex-direction: column;
    align-items: center;
  }

  button {
    width: 200px;
  }
}
</style>
