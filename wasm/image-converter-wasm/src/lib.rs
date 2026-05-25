use std::io::Cursor;
use wasm_bindgen::prelude::*;
use image::{DynamicImage, ImageFormat, RgbaImage, codecs::webp::WebPEncoder};

/// 存储解码后的原始 RGBA 像素数据
#[wasm_bindgen]
pub struct RawImage {
    data: Vec<u8>,
    width: u32,
    height: u32,
}

#[wasm_bindgen]
impl RawImage {
    pub fn width(&self) -> u32 {
        self.width
    }

    pub fn height(&self) -> u32 {
        self.height
    }

    /// 获取像素数据长度
    pub fn data_len(&self) -> usize {
        self.data.len()
    }

    /// 获取像素数据指针（供 JS 高效读取）
    pub fn data_ptr(&self) -> *const u8 {
        self.data.as_ptr()
    }
}

/// 解码图片：输入原始文件字节，返回 RawImage（RGBA 数据 + 尺寸）
///
/// 支持格式：PNG, JPEG, WebP, BMP, GIF(首帧), TIFF, ICO, TGA, PNM, DDS, farbfeld, EXR, QOI
#[wasm_bindgen]
pub fn decode_image(input: &[u8]) -> Result<RawImage, JsValue> {
    let img = image::load_from_memory(input)
        .map_err(|e| JsValue::from_str(&format!("解码失败: {}", e)))?;

    let rgba = img.to_rgba8();
    let (w, h) = rgba.dimensions();

    Ok(RawImage {
        data: rgba.into_raw(),
        width: w,
        height: h,
    })
}

/// 从 RGBA 像素数据重建 DynamicImage
fn build_image_from_rgba(rgba_data: &[u8], width: u32, height: u32) -> Result<DynamicImage, JsValue> {
    let buffer = RgbaImage::from_raw(width, height, rgba_data.to_vec())
        .ok_or_else(|| JsValue::from_str("无效的 RGBA 数据或尺寸不匹配"))?;
    Ok(DynamicImage::ImageRgba8(buffer))
}

/// 将透明像素与指定背景色混合（用于 JPEG 等不支持透明的格式）
fn blend_with_background(rgba_data: &mut [u8], bg_r: u8, bg_g: u8, bg_b: u8) {
    for chunk in rgba_data.chunks_exact_mut(4) {
        let alpha = chunk[3] as f32 / 255.0;
        chunk[0] = (chunk[0] as f32 * alpha + bg_r as f32 * (1.0 - alpha)) as u8;
        chunk[1] = (chunk[1] as f32 * alpha + bg_g as f32 * (1.0 - alpha)) as u8;
        chunk[2] = (chunk[2] as f32 * alpha + bg_b as f32 * (1.0 - alpha)) as u8;
        chunk[3] = 255; // 完全不透明
    }
}

/// 编码为 JPEG
/// - rgba_data: RGBA 像素数据（长度 = width * height * 4）
/// - quality: 1-100
/// - bg_color: 背景色 [R, G, B]，用于混合透明像素
#[wasm_bindgen]
pub fn encode_to_jpeg(
    rgba_data: &[u8],
    width: u32,
    height: u32,
    quality: u8,
    bg_color: &[u8],
) -> Result<Vec<u8>, JsValue> {
    let mut data = rgba_data.to_vec();

    // JPEG 不支持透明，混合背景色
    let bg_r = bg_color.get(0).copied().unwrap_or(255);
    let bg_g = bg_color.get(1).copied().unwrap_or(255);
    let bg_b = bg_color.get(2).copied().unwrap_or(255);
    blend_with_background(&mut data, bg_r, bg_g, bg_b);

    let img = DynamicImage::ImageRgba8(
        RgbaImage::from_raw(width, height, data)
            .ok_or_else(|| JsValue::from_str("无效的 RGBA 数据"))?
    );

    let mut output = Vec::new();
    let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut output, quality);
    img.write_with_encoder(encoder)
        .map_err(|e| JsValue::from_str(&format!("JPEG 编码失败: {}", e)))?;
    Ok(output)
}

/// 编码为 PNG（无损）
#[wasm_bindgen]
pub fn encode_to_png(rgba_data: &[u8], width: u32, height: u32) -> Result<Vec<u8>, JsValue> {
    let img = build_image_from_rgba(rgba_data, width, height)?;
    let mut output = Cursor::new(Vec::new());
    img.write_to(&mut output, ImageFormat::Png)
        .map_err(|e| JsValue::from_str(&format!("PNG 编码失败: {}", e)))?;
    Ok(output.into_inner())
}

/// 编码为 WebP（无损，image 0.25 的 WebP 编码器仅支持无损模式）
#[wasm_bindgen]
pub fn encode_to_webp(
    rgba_data: &[u8],
    width: u32,
    height: u32,
) -> Result<Vec<u8>, JsValue> {
    let img = build_image_from_rgba(rgba_data, width, height)?;
    let mut output = Vec::new();
    let encoder = WebPEncoder::new_lossless(&mut output);
    img.write_with_encoder(encoder)
        .map_err(|e| JsValue::from_str(&format!("WebP 编码失败: {}", e)))?;
    Ok(output)
}

/// 一步到位转换：输入字节 + 目标格式 + 质量
#[wasm_bindgen]
pub fn convert_image(
    input: &[u8],
    target_format: &str,
    quality: u8,
    bg_color: &[u8],
) -> Result<Vec<u8>, JsValue> {
    let raw = decode_image(input)?;
    match target_format {
        "jpeg" | "jpg" => encode_to_jpeg(&raw.data, raw.width, raw.height, quality, bg_color),
        "png" => encode_to_png(&raw.data, raw.width, raw.height),
        "webp" => encode_to_webp(&raw.data, raw.width, raw.height),
        _ => Err(JsValue::from_str(&format!("不支持的输出格式: {}", target_format))),
    }
}

/// 获取支持的输入格式列表（JSON 字符串）
#[wasm_bindgen]
pub fn get_supported_input_formats() -> String {
    r#"{"formats":[
        {"name":"PNG","extensions":[".png"],"mime":"image/png"},
        {"name":"JPEG","extensions":[".jpg",".jpeg"],"mime":"image/jpeg"},
        {"name":"WebP","extensions":[".webp"],"mime":"image/webp"},
        {"name":"BMP","extensions":[".bmp"],"mime":"image/bmp"},
        {"name":"GIF","extensions":[".gif"],"mime":"image/gif"},
        {"name":"TIFF","extensions":[".tiff",".tif"],"mime":"image/tiff"},
        {"name":"ICO","extensions":[".ico"],"mime":"image/x-icon"},
        {"name":"TGA","extensions":[".tga"],"mime":""},
        {"name":"PNM","extensions":[".pnm",".pbm",".pgm",".ppm"],"mime":""},
        {"name":"DDS","extensions":[".dds"],"mime":""},
        {"name":"farbfeld","extensions":[".ff"],"mime":""},
        {"name":"EXR","extensions":[".exr"],"mime":""},
        {"name":"QOI","extensions":[".qoi"],"mime":""}
    ]}"#.to_string()
}
