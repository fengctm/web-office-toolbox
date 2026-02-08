/**
 * 图标尺寸配置
 */
export const ICON_SIZES = {
  // 标准尺寸 - 通用图标
  standard: [
    { size: 16, label: '16x16', description: '浏览器标签页图标' },
    { size: 32, label: '32x32', description: 'Windows 任务栏' },
    { size: 48, label: '48x48', description: 'Windows 桌面' },
    { size: 64, label: '64x64', description: 'Retina 显示器' },
    { size: 128, label: '128x128', description: 'macOS Retina' },
    { size: 256, label: '256x256', description: '高分辨率' }
  ],

  // 扩展尺寸
  extended: [
    { size: 512, label: '512x512', description: 'Android 启动图标' },
    { size: 1024, label: '1024x1024', description: 'App Store 图标' }
  ],

  // iOS 尺寸
  ios: [
    { size: 60, label: '60x60', description: 'iPhone (2x)' },
    { size: 76, label: '76x76', description: 'iPad (1x)' },
    { size: 120, label: '120x120', description: 'iPhone (3x)' },
    { size: 152, label: '152x152', description: 'iPad (2x)' },
    { size: 167, label: '167x167', description: 'iPad Pro (2x)' },
    { size: 180, label: '180x180', description: 'iPhone (3x)' }
  ],

  // Android 尺寸
  android: [
    { size: 48, label: '48x48', description: 'Android 通知栏' },
    { size: 72, label: '72x72', description: 'Android Launcher (mdpi)' },
    { size: 96, label: '96x96', description: 'Android Launcher (xhdpi)' },
    { size: 144, label: '144x144', description: 'Android Launcher (xxhdpi)' },
    { size: 192, label: '192x192', description: 'Android Launcher (xxxhdpi)' },
    { size: 512, label: '512x512', description: 'Google Play 商店' }
  ]
}

/**
 * 尺寸预设组合
 */
export const SIZE_PRESETS = {
  favicon: {
    label: '网站图标 (Favicon)',
    description: '网站浏览器图标',
    sizes: [16, 32, 48, 64]
  },
  ios: {
    label: 'iOS App 图标',
    description: 'iPhone 和 iPad 应用图标',
    sizes: [60, 76, 120, 152, 167, 180]
  },
  android: {
    label: 'Android App 图标',
    description: 'Android 应用图标',
    sizes: [48, 72, 96, 144, 192, 512]
  },
  all: {
    label: '全平台所有尺寸',
    description: '包含所有平台和尺寸',
    sizes: [
      16, 32, 48, 60, 64, 72, 76, 96, 120, 128, 144, 152, 167, 180, 192, 256, 512, 1024
    ]
  }
}

/**
 * 获取所有可用尺寸（去重）
 */
export function getAllSizes() {
  const allSizes = new Set()
  Object.values(ICON_SIZES).forEach(category => {
    category.forEach(({ size }) => allSizes.add(size))
  })
  return Array.from(allSizes).sort((a, b) => a - b)
}

/**
 * 根据预设获取尺寸
 */
export function getSizesByPreset(preset) {
  return SIZE_PRESETS[preset]?.sizes || []
}
