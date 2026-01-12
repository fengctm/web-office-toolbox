/**
 * Markdown 转换器逻辑 composable
 * 负责 Markdown 解析、HTML 转换和富文本复制
 */

import {ref} from 'vue'
import {marked} from 'marked'

export function useMarkdownConverter() {
    // 状态变量
    const markdownText = ref('')
    const renderedHtml = ref('')

    /**
     * 处理 Markdown 输入并转换为 HTML
     */
    const handleMdInput = () => {
        if (!markdownText.value) {
            renderedHtml.value = ''
            return
        }
        try {
            renderedHtml.value = marked.parse(markdownText.value, {
                breaks: true, // 启用换行符转换为 <br>
                gfm: true
            })
        } catch (error) {
            console.error('Markdown 解析失败:', error)
        }
    }

    /**
     * 复制富文本到剪贴板
     * @param {Function} showSnackbar - 通知回调
     */
    const handleCopyRichText = async (showSnackbar) => {
        if (!renderedHtml.value) {
            showSnackbar('请先输入 Markdown 内容', 'warning')
            return
        }

        try {
            // 为了确保 Word 排版效果，构造完整的 HTML 结构
            // 这里针对 Word 优化了字体和基础样式
            const wordStyles = `
        <style>
          body { font-family: "Calibri", "Microsoft YaHei", sans-serif; font-size: 11pt; line-height: 1.5; color: #000; }
          h1, h2, h3 { color: #2E74B5; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid #999; padding: 4px 8px; }
          blockquote { border-left: 3px solid #ccc; padding-left: 10px; color: #666; }
          code { font-family: Consolas, monospace; background: #eee; padding: 2px 4px; }
          pre { background: #f5f5f5; padding: 10px; }
        </style>
      `

            const htmlContent = `<html><head><meta charset="utf-8">${wordStyles}</head><body>${renderedHtml.value}</body></html>`

            if (navigator.clipboard && window.ClipboardItem) {
                const data = [
                    new ClipboardItem({
                        'text/html': new Blob([htmlContent], {type: 'text/html'}),
                        'text/plain': new Blob([markdownText.value], {type: 'text/plain'})
                    })
                ]
                await navigator.clipboard.write(data)
                showSnackbar('已成功复制！请直接在 Word 中粘贴 (Ctrl+V)', 'success')
            } else {
                await navigator.clipboard.writeText(renderedHtml.value)
                showSnackbar('浏览器不支持富文本复制，已复制 HTML 代码', 'warning')
            }
        } catch (error) {
            console.error('复制失败:', error)
            showSnackbar('复制失败，请检查浏览器权限', 'error')
        }
    }

    /**
     * 清空内容
     * @param {Function} showSnackbar - 通知回调
     */
    const handleClear = (showSnackbar) => {
        markdownText.value = ''
        renderedHtml.value = ''
        showSnackbar('已清空内容', 'info')
    }

    /**
     * 加载示例内容
     * @param {Function} showSnackbar - 通知回调
     */
    const handleLoadDemo = (showSnackbar) => {
        markdownText.value = `# 项目周报

## 1. 本周进度
- 完成了前端界面重构。
- 修复了深色模式下的显示 Bug。
- 优化了 PDF 压缩算法。

## 2. 遇到的问题
在处理 **Markdown 长文本换行** 时遇到了困难，但通过 CSS 的 \`word-break: break-word\` 成功解决。

| 任务 | 状态 | 负责人 |
| :--- | :---: | :--- |
| 设计稿 | ✅ | Alice |
| 前端开发 | 🔄 | Bob |

> 这是一个引用块，用来强调重要信息。

\`\`\`javascript
const demo = "Hello World";
console.log(demo);
\`\`\`
`
        handleMdInput()
        showSnackbar('已加载示例内容', 'success')
    }

    return {
        // 状态
        markdownText,
        renderedHtml,

        // 方法
        handleMdInput,
        handleCopyRichText,
        handleClear,
        handleLoadDemo
    }
}