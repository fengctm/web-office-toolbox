// 字符随机生成器 — 字符池定义与抽样算法
// 纯函数模块，不依赖 Vue，便于测试与复用

export const CHAR_SETS = {
  numbers: '0123456789',
  upperLetters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowerLetters: 'abcdefghijklmnopqrstuvwxyz',
  simpleSymbols: '!@#$%^&*()-_=+',
  complexSymbols: '~`!@#$%^&*()_-+={}[]|:;"\'<>,.?/\\'
}

const CATEGORY_KEYS = ['numbers', 'upperLetters', 'lowerLetters', 'simpleSymbols', 'complexSymbols']

/**
 * 用 crypto.getRandomValues 安全取 [0, max) 的均匀分布整数
 * （通过 rejection sampling 消除 modulo 偏倚）
 */
function secureRandomInt(max) {
  if (max <= 0) return 0
  const RANGE = 0x100000000
  const limit = RANGE - (RANGE % max)
  const buf = new Uint32Array(1)
  let n
  do {
    crypto.getRandomValues(buf)
    n = buf[0]
  } while (n >= limit)
  return n % max
}

/**
 * 从单个池里随机取一个字符
 */
function pickCharFromPool(pool) {
  return pool[secureRandomInt(pool.length)]
}

/**
 * Fisher–Yates 洗牌（原地）
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * 统计当前勾选的字符类别数
 * @param {Object} opts - { numbers, upperLetters, lowerLetters, simpleSymbols, complexSymbols }
 * @returns {number}
 */
export function countSelectedCategories(opts) {
  return CATEGORY_KEYS.filter(k => opts[k]).length
}

/**
 * 核心函数：按勾选类别生成满足「每类至少出现一个」的随机字符串
 *
 * 算法：
 *   1) 把勾选的池收集到 selectedPoolList
 *   2) 先从每个池各取 1 个字符塞进 result[]（保证每类至少一个）
 *   3) 剩余 length - selectedPoolList.length 个字符从合并池随机取
 *   4) Fisher–Yates 洗牌，打乱顺序（避免开头出现固定的"每类一个"前缀）
 *
 * @param {number} length - 总长度（调用方负责保证 >= 勾选类别数）
 * @param {Object} opts - { numbers, upperLetters, lowerLetters, simpleSymbols, complexSymbols } 全部为 boolean
 * @returns {string|null} 没有任何类别时返回 null
 */
export function generateRandomString(length, opts) {
  const selectedPoolList = CATEGORY_KEYS
    .filter(k => opts[k])
    .map(k => CHAR_SETS[k])

  if (selectedPoolList.length === 0) return null

  const targetLength = Math.max(selectedPoolList.length, length)
  const result = []

  // Step 2 — 每类至少一个
  for (const pool of selectedPoolList) {
    result.push(pickCharFromPool(pool))
  }

  // Step 3 — 剩余从合并池填充
  const combinedPool = selectedPoolList.join('')
  for (let i = result.length; i < targetLength; i++) {
    result.push(pickCharFromPool(combinedPool))
  }

  // Step 4 — 洗牌
  return shuffle(result).join('')
}
