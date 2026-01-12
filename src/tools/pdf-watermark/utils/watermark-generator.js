/**
 * 统一的水印生成器
 * 用于预览和导出，确保两者完全一致
 */

/**
 * 计算水印布局
 * @param {Object} config - 水印配置
 * @param {string} config.text - 水印文字
 * @param {number} config.fontSize - 字体大小
 * @param {string} config.color - 颜色（十六进制）
 * @param {number} config.opacity - 不透明度 (0-1)
 * @param {number} config.rotation - 旋转角度（度）
 * @param {number} config.gap - 间距（单元格大小）
 * @param {number} config.offsetX - X轴偏移
 * @param {number} config.offsetY - Y轴偏移
 * @param {string} [config.font] - 字体名称
 * @param {number} containerWidth - 容器宽度
 * @param {number} containerHeight - 容器高度
 * @returns {Array<Object>} 水印项数组，每个包含位置、旋转等信息
 */
export function calculateWatermarkLayout(config, containerWidth, containerHeight) {
  const {
    text,
    fontSize,
    color,
    opacity,
    rotation,
    gap,
    offsetX,
    offsetY
  } = config;

  const watermarks = [];

  // 计算需要覆盖的范围（超出容器边缘，确保完全覆盖）
  const startX = -gap;
  const endX = containerWidth + gap;
  const startY = -gap;
  const endY = containerHeight + gap;

  // 遍历网格
  for (let x = startX; x <= endX; x += gap) {
    for (let y = startY; y <= endY; y += gap) {
      watermarks.push({
        text,
        fontSize,
        color,
        opacity,
        rotation,
        x: x + offsetX,
        y: y + offsetY,
        gap
      });
    }
  }

  return watermarks;
}

/**
 * 生成预览用的 SVG 水印背景
 * @param {Object} config - 水印配置
 * @returns {string} base64 编码的 SVG Data URL
 */
export function generatePreviewWatermarkSVG(config) {
  const {
    text,
    fontSize,
    color,
    opacity,
    rotation,
    gap
  } = config;

  // 转义特殊字符
  const escapedText = text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"');

  // SVG 单元格尺寸 = gap
  const size = gap;
  const half = size / 2;

  // 生成 SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <text
        x="${half}"
        y="${half}"
        fill="${color}"
        font-size="${fontSize}"
        font-family="Arial, sans-serif"
        fill-opacity="${opacity}"
        text-anchor="middle"
        dominant-baseline="middle"
        transform="rotate(${rotation} ${half} ${half})"
      >
        ${escapedText}
      </text>
    </svg>
  `.trim();

  // 转换为 base64
  const encoded = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encoded}`;
}

/**
 * 生成 Canvas 水印单元格（用于导出）
 * @param {Object} config - 水印配置
 * @param {number} scale - 缩放倍数（用于高分辨率）
 * @returns {Promise<HTMLCanvasElement>} 包含水印的 Canvas
 */
export async function generateWatermarkCanvas(config, scale = 1) {
  const {
    text,
    fontSize,
    color,
    opacity,
    rotation,
    gap
  } = config;

  // 创建单元格 Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // 设置尺寸（考虑缩放）
  const size = gap * scale;
  canvas.width = size;
  canvas.height = size;

  // 清空并设置透明背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, size, size);

  // 设置字体（不乘以 scale，保持与预览一致）
  const fontFamily = '"Microsoft YaHei", "SimHei", "Noto Sans CJK SC", Arial, sans-serif';
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = hexToRgba(color, opacity);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 计算旋转中心
  const half = size / 2;
  // Canvas 的 rotate() 使用逆时针正角度，SVG 使用顺时针正角度
  // 为了保持一致，这里取反角度，使两者都使用相同的旋转方向
  const rotationRad = (-rotation * Math.PI) / 180;

  // 绘制旋转文字
  ctx.save();
  ctx.translate(half, half);
  ctx.rotate(rotationRad);
  ctx.fillText(text, 0, 0);
  ctx.restore();

  return canvas;
}

/**
 * 在 Canvas 上绘制重复水印背景
 * @param {HTMLCanvasElement} targetCanvas - 目标 Canvas（PDF 页面尺寸）
 * @param {HTMLCanvasElement} watermarkCanvas - 水印单元格 Canvas
 * @param {Object} config - 水印配置
 */
export function drawWatermarkBackground(targetCanvas, watermarkCanvas, config) {
  const ctx = targetCanvas.getContext('2d');
  const { gap, offsetX, offsetY } = config;

  const width = targetCanvas.width;
  const height = targetCanvas.height;

  // 计算需要的行列数（超出边界）
  const cols = Math.ceil(width / gap) + 2;
  const rows = Math.ceil(height / gap) + 2;

  // 绘制重复背景
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * gap + offsetX;
      const y = row * gap + offsetY;

      // 只在可见范围内绘制
      if (x < width && y < height) {
        ctx.drawImage(watermarkCanvas, x, y);
      }
    }
  }
}

/**
 * 颜色转换：十六进制转 RGBA
 * @param {string} hex - 十六进制颜色
 * @param {number} opacity - 不透明度 (0-1)
 * @returns {string} rgba 格式
 */
export function hexToRgba(hex, opacity) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return `rgba(255, 0, 0, ${opacity})`; // 默认红色
  }

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * 预览用：生成 CSS 样式对象
 * @param {Object} config - 水印配置
 * @returns {Object} CSS 样式对象
 */
export function generatePreviewStyle(config) {
  const svgUrl = generatePreviewWatermarkSVG(config);
  
  return {
    backgroundImage: `url("${svgUrl}")`,
    backgroundRepeat: 'repeat',
    backgroundPosition: `${config.offsetX}px ${config.offsetY}px`,
    backgroundSize: 'auto'
  };
}

/**
 * 检查配置是否有效
 * @param {Object} config - 水印配置
 * @returns {boolean} 是否有效
 */
export function isValidWatermarkConfig(config) {
  return config && 
         config.text && 
         config.text.trim().length > 0 &&
         config.gap > 0 &&
         config.fontSize > 0;
}
