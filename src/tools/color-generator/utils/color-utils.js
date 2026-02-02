export const hexToRgb = (hex) => {
    let c = hex.replace('#', '')
    if (c.length === 3) {
        c = c.split('').map(char => char + char).join('')
    }
    const num = parseInt(c, 16)
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    }
}

export const rgbToHex = (r, g, b) => {
    const toHex = (n) => {
        const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
    }
    return '#' + toHex(r) + toHex(g) + toHex(b)
}

export const rgbToHsl = (r, g, b) => {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h, s, l = (max + min) / 2

    if (max === min) {
        h = s = 0
    } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
            case g: h = ((b - r) / d + 2) / 6; break
            case b: h = ((r - g) / d + 4) / 6; break
        }
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    }
}

export const hslToRgb = (h, s, l) => {
    h /= 360
    s /= 100
    l /= 100
    let r, g, b

    if (s === 0) {
        r = g = b = l
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        }
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    }
}

export const hexToHsl = (hex) => {
    const rgb = hexToRgb(hex)
    return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

export const hslToHex = (h, s, l) => {
    const rgb = hslToRgb(h, s, l)
    return rgbToHex(rgb.r, rgb.g, rgb.b)
}

export const parseColor = (input) => {
    let hex = input.trim()
    if (!hex) return null

    if (hex.startsWith('#')) {
        hex = hex.slice(1)
    }

    if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
        hex = hex.split('').map(c => c + c).join('')
    }

    if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
        return {
            hex: '#' + hex.toUpperCase(),
            ...hexToRgb('#' + hex),
            ...hexToHsl('#' + hex)
        }
    }

    const rgbMatch = input.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
    if (rgbMatch) {
        const r = parseInt(rgbMatch[1])
        const g = parseInt(rgbMatch[2])
        const b = parseInt(rgbMatch[3])
        return {
            hex: rgbToHex(r, g, b).toUpperCase(),
            r, g, b,
            ...rgbToHsl(r, g, b)
        }
    }

    const hslMatch = input.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/)
    if (hslMatch) {
        const h = parseInt(hslMatch[1])
        const s = parseInt(hslMatch[2])
        const l = parseInt(hslMatch[3])
        const rgb = hslToRgb(h, s, l)
        return {
            hex: rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase(),
            ...rgb,
            h, s, l
        }
    }

    return null
}

export const formatColor = (color, format = 'hex') => {
    const { r, g, b, h, s, l } = color

    switch (format) {
        case 'hex':
            return color.hex
        case 'rgb':
            return `rgb(${r}, ${g}, ${b})`
        case 'rgba':
            return `rgba(${r}, ${g}, ${b}, 1)`
        case 'hsl':
            return `hsl(${h}, ${s}%, ${l}%)`
        case 'hsla':
            return `hsla(${h}, ${s}%, ${l}%, 1)`
        default:
            return color.hex
    }
}

export const generateTypographyColors = (hex) => {
    const hsl = hexToHsl(hex)

    return {
        heading1: {
            hex: hslToHex(hsl.h, hsl.s, 10).toUpperCase(),
            ...hslToRgb(hsl.h, hsl.s, 10),
            h: hsl.h,
            s: hsl.s,
            l: 10
        },
        headingBody: {
            hex: hslToHex(hsl.h, hsl.s, 20).toUpperCase(),
            ...hslToRgb(hsl.h, hsl.s, 20),
            h: hsl.h,
            s: hsl.s,
            l: 20
        },
        secondaryText: {
            hex: hslToHex(hsl.h, Math.max(10, hsl.s * 0.5), 50).toUpperCase(),
            ...hslToRgb(hsl.h, Math.max(10, hsl.s * 0.5), 50),
            h: hsl.h,
            s: Math.max(10, Math.round(hsl.s * 0.5)),
            l: 50
        },
        linkText: {
            hex: hslToHex(hsl.h, Math.min(100, hsl.s + 10), Math.min(95, hsl.l + 5)).toUpperCase(),
            ...hslToRgb(hsl.h, Math.min(100, hsl.s + 10), Math.min(95, hsl.l + 5)),
            h: hsl.h,
            s: Math.min(100, hsl.s + 10),
            l: Math.min(95, hsl.l + 5)
        }
    }
}

export const generateButtonColors = (hex) => {
    const hsl = hexToHsl(hex)
    const mainColor = {
        hex: hex.toUpperCase(),
        ...hexToRgb(hex),
        h: hsl.h,
        s: hsl.s,
        l: hsl.l
    }

    return {
        normal: mainColor,
        hover: {
            hex: hslToHex(hsl.h, hsl.s, Math.min(95, hsl.l + 10)).toUpperCase(),
            ...hslToRgb(hsl.h, hsl.s, Math.min(95, hsl.l + 10)),
            h: hsl.h,
            s: hsl.s,
            l: Math.min(95, hsl.l + 10)
        },
        active: {
            hex: hslToHex(hsl.h, hsl.s, Math.max(10, hsl.l - 10)).toUpperCase(),
            ...hslToRgb(hsl.h, hsl.s, Math.max(10, hsl.l - 10)),
            h: hsl.h,
            s: hsl.s,
            l: Math.max(10, hsl.l - 10)
        },
        disabled: {
            hex: hslToHex(hsl.h, 10, hsl.l).toUpperCase(),
            ...hslToRgb(hsl.h, 10, hsl.l),
            h: hsl.h,
            s: 10,
            l: hsl.l
        },
        onPrimary: {
            hex: '#FFFFFF',
            r: 255,
            g: 255,
            b: 255,
            h: 0,
            s: 0,
            l: 100
        }
    }
}

export const generateSurfaceColors = (hex) => {
    const hsl = hexToHsl(hex)

    return {
        pageBackground: {
            hex: hslToHex(hsl.h, Math.min(20, hsl.s * 0.2), 98).toUpperCase(),
            ...hslToRgb(hsl.h, Math.min(20, hsl.s * 0.2), 98),
            h: hsl.h,
            s: Math.min(20, Math.round(hsl.s * 0.2)),
            l: 98
        },
        cardBackground: {
            hex: '#FFFFFF',
            r: 255,
            g: 255,
            b: 255,
            h: 0,
            s: 0,
            l: 100
        },
        darkSurface: {
            hex: hslToHex(hsl.h, Math.min(30, hsl.s * 0.5), 10).toUpperCase(),
            ...hslToRgb(hsl.h, Math.min(30, hsl.s * 0.5), 10),
            h: hsl.h,
            s: Math.min(30, Math.round(hsl.s * 0.5)),
            l: 10
        }
    }
}

export const generateUtilityColors = (hex) => {
    const hsl = hexToHsl(hex)
    const rgb = hexToRgb(hex)

    return {
        shadow: {
            hex: rgbToHex(rgb.r, rgb.g, rgb.b).toUpperCase(),
            rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`,
            ...rgb,
            h: hsl.h,
            s: hsl.s,
            l: hsl.l,
            opacity: 0.15
        },
        border: {
            hex: hslToHex(hsl.h, Math.min(25, hsl.s * 0.3), 92).toUpperCase(),
            ...hslToRgb(hsl.h, Math.min(25, hsl.s * 0.3), 92),
            h: hsl.h,
            s: Math.min(25, Math.round(hsl.s * 0.3)),
            l: 92
        },
        success: {
            hex: '#10B981',
            r: 16,
            g: 185,
            b: 129,
            h: 160,
            s: 84,
            l: 39
        },
        error: {
            hex: '#EF4444',
            r: 239,
            g: 68,
            b: 68,
            h: 0,
            s: 84,
            l: 60
        },
        focus: {
            hex: hex.toUpperCase(),
            rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`,
            ...rgb,
            h: hsl.h,
            s: hsl.s,
            l: hsl.l,
            opacity: 0.5
        }
    }
}

export const generateAllColors = (hex) => {
    const mainColor = parseColor(hex)
    if (!mainColor) return null

    return {
        main: mainColor,
        typography: generateTypographyColors(hex),
        buttons: generateButtonColors(hex),
        surfaces: generateSurfaceColors(hex),
        utilities: generateUtilityColors(hex)
    }
}
