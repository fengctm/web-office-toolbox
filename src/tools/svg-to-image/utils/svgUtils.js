/**
 * SVG 实用工具模块
 * 提供 SVG 代码格式化、压缩、语法解析校验以及预设示例
 */

/**
 * 格式化 XML/SVG 字符串（智能缩进与换行）
 * @param {string} xml - 原始 SVG 字符串
 * @returns {string} 格式化后的代码
 */
export function formatSvg(xml) {
  if (!xml || typeof xml !== 'string') return ''

  let formatted = ''
  let indent = ''
  const tab = '  ' // 2 空格缩进

  // 预清理多余空格与换行，保留标签结构
  const cleaned = xml
    .replace(/>\s*</g, '><')
    .replace(/<!--[\s\S]*?-->/g, (match) => match.trim())

  // 正则拆分标签与文本
  const tokens = cleaned.split(/(<[^>]+>)/g).filter(Boolean)

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim()
    if (!token) continue

    // 1. 注释或 XML 声明
    if (token.startsWith('<?') || token.startsWith('<!--')) {
      formatted += indent + token + '\n'
      continue
    }

    // 2. 闭合标签 </tag>
    if (token.startsWith('</')) {
      indent = indent.slice(tab.length)
      formatted += indent + token + '\n'
      continue
    }

    // 3. 自闭合标签 <tag ... />
    if (token.startsWith('<') && token.endsWith('/>')) {
      formatted += indent + token + '\n'
      continue
    }

    // 4. 起始标签 <tag ...>
    if (token.startsWith('<') && !token.startsWith('</')) {
      // 检查下一个 token 是否是纯文本且下下个是对应闭合标签（紧凑单行形式）
      const nextToken = tokens[i + 1]?.trim()
      const afterNextToken = tokens[i + 2]?.trim()

      if (
        nextToken &&
        !nextToken.startsWith('<') &&
        afterNextToken &&
        afterNextToken.startsWith('</')
      ) {
        formatted += indent + token + nextToken + afterNextToken + '\n'
        i += 2
        continue
      }

      formatted += indent + token + '\n'
      indent += tab
      continue
    }

    // 5. 纯文本内容
    formatted += indent + token + '\n'
  }

  return formatted.trim()
}

/**
 * 压缩 SVG 源码（去除注释与不必要的空格换行）
 * @param {string} xml - 原始 SVG
 * @returns {string} 压缩后的紧凑代码
 */
export function minifySvg(xml) {
  if (!xml || typeof xml !== 'string') return ''

  return xml
    .replace(/<!--[\s\S]*?-->/g, '') // 移除注释
    .replace(/\s+/g, ' ') // 连续空白合并为单个空格
    .replace(/>\s+</g, '><') // 标签间的空格去除
    .replace(/\s*([=,])\s*/g, '$1') // 属性等号周围空格去除
    .replace(/\s*([{}])\s*/g, '$1') // 样式大括号周围空格去除
    .trim()
}

/**
 * 格式化字节大小
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 解析并校验 SVG 源码，提取元数据
 * @param {string} code - SVG 源码
 * @returns {{ valid: boolean, error?: string, width?: number, height?: number, viewBox?: string, nodeCount?: number, charCount: number, byteSize: string }}
 */
export function parseSvgMetadata(code) {
  const trimmed = (code || '').trim()
  const charCount = trimmed.length
  const byteSize = formatBytes(new Blob([trimmed]).size)

  if (!trimmed) {
    return {
      valid: false,
      error: 'SVG 代码为空',
      charCount: 0,
      byteSize: '0 B'
    }
  }

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(trimmed, 'image/svg+xml')
    const parserError = doc.querySelector('parsererror')

    if (parserError) {
      const errorMsg = parserError.textContent || 'XML 语法错误'
      // 提取关键错误描述
      const cleanError = errorMsg.split('\n')[0] || 'SVG 语法格式不正确'
      return {
        valid: false,
        error: cleanError,
        charCount,
        byteSize
      }
    }

    const svgElement = doc.querySelector('svg')
    if (!svgElement) {
      return {
        valid: false,
        error: '未找到根节点 <svg> 标签',
        charCount,
        byteSize
      }
    }

    // 解析尺寸与 ViewBox
    const viewBoxAttr = svgElement.getAttribute('viewBox')
    let width = parseFloat(svgElement.getAttribute('width'))
    let height = parseFloat(svgElement.getAttribute('height'))

    if (viewBoxAttr) {
      const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number)
      if (parts.length === 4) {
        if (!width || isNaN(width)) width = parts[2]
        if (!height || isNaN(height)) height = parts[3]
      }
    }

    // 若依然缺失，默认 500x500
    if (!width || isNaN(width)) width = 500
    if (!height || isNaN(height)) height = 500

    const nodeCount = svgElement.querySelectorAll('*').length

    return {
      valid: true,
      width: Math.round(width),
      height: Math.round(height),
      viewBox: viewBoxAttr || `0 0 ${Math.round(width)} ${Math.round(height)}`,
      nodeCount,
      charCount,
      byteSize
    }
  } catch (err) {
    return {
      valid: false,
      error: err.message || '解析发生未知异常',
      charCount,
      byteSize
    }
  }
}

/**
 * 预设优质 SVG 示例模板
 */
export const SAMPLE_SVGS = [
  {
    title: '科技指南针 (Modern Compass)',
    code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <linearGradient id="grad-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="grad-teal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="grad-coral" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e" />
      <stop offset="100%" stop-color="#fb923c" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- 背景圆形卡片 -->
  <rect width="500" height="500" rx="40" fill="url(#grad-bg)" />

  <!-- 外环轨道 -->
  <circle cx="250" cy="250" r="180" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  <circle cx="250" cy="250" r="150" fill="none" stroke="rgba(20,184,166,0.2)" stroke-width="1.5" stroke-dasharray="6 6" />

  <!-- 动态外环装饰点 -->
  <circle cx="250" cy="70" r="5" fill="#14b8a6" filter="url(#glow)" />
  <circle cx="430" cy="250" r="4" fill="#06b6d4" />
  <circle cx="250" cy="430" r="5" fill="#f43f5e" />
  <circle cx="70" cy="250" r="4" fill="#fb923c" />

  <!-- 表盘刻度 -->
  <g stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-linecap="round">
    <line x1="250" y1="110" x2="250" y2="125" />
    <line x1="390" y1="250" x2="375" y2="250" />
    <line x1="250" y1="390" x2="250" y2="375" />
    <line x1="110" y1="250" x2="125" y2="250" />
  </g>

  <!-- 指南针北针 (Teal 渐变) -->
  <polygon points="250,115 285,250 250,230" fill="url(#grad-teal)" filter="url(#glow)" />
  <polygon points="250,115 215,250 250,230" fill="#0d9488" />

  <!-- 指南针南针 (Coral 渐变) -->
  <polygon points="250,385 285,250 250,270" fill="url(#grad-coral)" />
  <polygon points="250,385 215,250 250,270" fill="#e11d48" />

  <!-- 中心轴心圆环 -->
  <circle cx="250" cy="250" r="16" fill="#0f172a" stroke="#ffffff" stroke-width="4" />
  <circle cx="250" cy="250" r="6" fill="#14b8a6" />
</svg>`
  },
  {
    title: '调色盘插画 (Creative Palette)',
    code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
  <defs>
    <linearGradient id="board-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="100%" stop-color="#fef3c7" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.15" />
    </filter>
  </defs>

  <rect width="600" height="450" fill="none" />

  <!-- 画板主体 -->
  <path d="M 120 180 C 120 90, 240 60, 360 70 C 470 80, 520 160, 510 260 C 500 350, 410 400, 300 390 C 230 385, 180 340, 190 280 C 195 240, 160 210, 130 210 C 122 210, 120 195, 120 180 Z"
        fill="url(#board-grad)" filter="url(#shadow)" stroke="#fde68a" stroke-width="3" />

  <!-- 调色颜料圆滴 -->
  <circle cx="260" cy="120" r="24" fill="#ef4444" />
  <circle cx="340" cy="115" r="22" fill="#f97316" />
  <circle cx="415" cy="140" r="23" fill="#eab308" />
  <circle cx="460" cy="205" r="25" fill="#22c55e" />
  <circle cx="445" cy="285" r="26" fill="#3b82f6" />
  <circle cx="380" cy="340" r="24" fill="#8b5cf6" />
  <circle cx="295" cy="335" r="20" fill="#ec4899" />

  <!-- 拇指扣洞 -->
  <ellipse cx="190" cy="290" rx="22" ry="32" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="2" />

  <!-- 画笔倾斜穿过 -->
  <g transform="rotate(35 300 225)">
    <!-- 笔杆 -->
    <rect x="292" y="50" width="16" height="260" rx="8" fill="#78350f" />
    <!-- 金属箍 -->
    <rect x="290" y="300" width="20" height="40" rx="2" fill="#94a3b8" />
    <!-- 笔毛 -->
    <path d="M 290 340 Q 300 395 300 400 Q 300 395 310 340 Z" fill="#0d9488" />
  </g>
</svg>`
  },
  {
    title: '立体几何徽章 (Geometric Badge)',
    code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <linearGradient id="poly-1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#4338ca" />
    </linearGradient>
    <linearGradient id="poly-2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818cf8" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
    <linearGradient id="poly-3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a5b4fc" />
      <stop offset="100%" stop-color="#818cf8" />
    </linearGradient>
    <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="25" flood-color="#4338ca" flood-opacity="0.3" />
    </filter>
  </defs>

  <rect width="500" height="500" fill="transparent" />

  <g filter="url(#badge-shadow)">
    <!-- 正六边形顶面 -->
    <polygon points="250,90 380,165 250,240 120,165" fill="url(#poly-3)" />
    <!-- 右侧面 -->
    <polygon points="250,240 380,165 380,315 250,390" fill="url(#poly-1)" />
    <!-- 左侧面 -->
    <polygon points="250,240 120,165 120,315 250,390" fill="url(#poly-2)" />
  </g>

  <!-- 中心悬浮星光符号 -->
  <path d="M 250 180 L 256 225 L 300 230 L 260 250 L 275 295 L 250 265 L 225 295 L 240 250 L 200 230 L 244 225 Z"
        fill="#ffffff" opacity="0.95" />
</svg>`
  }
]
