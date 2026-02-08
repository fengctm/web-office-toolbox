/**
 * 图标格式配置
 */
export const ICON_FORMATS = {
  png: {
    value: 'png',
    label: 'PNG',
    description: '通用格式，支持透明背景',
    mimeType: 'image/png',
    extension: 'png',
    supportsTransparency: true
  },
  webp: {
    value: 'webp',
    label: 'WebP',
    description: '现代格式，体积更小',
    mimeType: 'image/webp',
    extension: 'webp',
    supportsTransparency: true
  },
  ico: {
    value: 'ico',
    label: 'ICO',
    description: 'Windows 图标格式',
    mimeType: 'image/x-icon',
    extension: 'ico',
    supportsTransparency: true
  },
  svg: {
    value: 'svg',
    label: 'SVG',
    description: '矢量格式（封装 PNG）',
    mimeType: 'image/svg+xml',
    extension: 'svg',
    supportsTransparency: true
  }
}

/**
 * 获取支持的格式列表
 */
export function getSupportedFormats() {
  return Object.values(ICON_FORMATS)
}

/**
 * 获取格式配置
 */
export function getFormatConfig(format) {
  return ICON_FORMATS[format] || ICON_FORMATS.png
}
