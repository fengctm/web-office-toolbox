/* tslint:disable */
/* eslint-disable */

/**
 * Chroma subsampling format
 */
export enum ChromaSampling {
    /**
     * Both vertically and horizontally subsampled.
     */
    Cs420 = 0,
    /**
     * Horizontally subsampled.
     */
    Cs422 = 1,
    /**
     * Not subsampled.
     */
    Cs444 = 2,
    /**
     * Monochrome.
     */
    Cs400 = 3,
}

/**
 * 存储解码后的原始 RGBA 像素数据
 */
export class RawImage {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * 获取像素数据长度
     */
    data_len(): number;
    /**
     * 获取像素数据指针（供 JS 高效读取）
     */
    data_ptr(): number;
    height(): number;
    width(): number;
}

/**
 * 一步到位转换：输入字节 + 目标格式 + 质量
 */
export function convert_image(input: Uint8Array, target_format: string, quality: number, bg_color: Uint8Array): Uint8Array;

/**
 * 解码图片：输入原始文件字节，返回 RawImage（RGBA 数据 + 尺寸）
 *
 * 支持格式：PNG, JPEG, WebP, BMP, GIF(首帧), TIFF, ICO, TGA, PNM, DDS, farbfeld, EXR, QOI
 */
export function decode_image(input: Uint8Array): RawImage;

/**
 * 编码为 JPEG
 * - rgba_data: RGBA 像素数据（长度 = width * height * 4）
 * - quality: 1-100
 * - bg_color: 背景色 [R, G, B]，用于混合透明像素
 */
export function encode_to_jpeg(rgba_data: Uint8Array, width: number, height: number, quality: number, bg_color: Uint8Array): Uint8Array;

/**
 * 编码为 PNG（无损）
 */
export function encode_to_png(rgba_data: Uint8Array, width: number, height: number): Uint8Array;

/**
 * 编码为 WebP（无损，image 0.25 的 WebP 编码器仅支持无损模式）
 */
export function encode_to_webp(rgba_data: Uint8Array, width: number, height: number): Uint8Array;

/**
 * 获取支持的输入格式列表（JSON 字符串）
 */
export function get_supported_input_formats(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_rawimage_free: (a: number, b: number) => void;
    readonly convert_image: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly decode_image: (a: number, b: number, c: number) => void;
    readonly encode_to_jpeg: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly encode_to_png: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly encode_to_webp: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly get_supported_input_formats: (a: number) => void;
    readonly rawimage_data_len: (a: number) => number;
    readonly rawimage_data_ptr: (a: number) => number;
    readonly rawimage_height: (a: number) => number;
    readonly rawimage_width: (a: number) => number;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
