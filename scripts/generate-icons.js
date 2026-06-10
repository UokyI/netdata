// 从 icon.svg 生成各平台应用图标
// 运行: node scripts/generate-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SVG_PATH = path.join(__dirname, '..', 'assets', 'icon.svg');
const ASSETS_DIR = path.join(__dirname, '..', 'assets');

async function generateIcons() {
    console.log('🎨 从 icon.svg 生成应用图标...\n');

    // ====== Windows ICO (包含 16, 32, 48, 256 尺寸) ======
    const icoSizes = [16, 32, 48, 256];
    const pngBuffers = [];

    for (const size of icoSizes) {
        const buf = await sharp(SVG_PATH).resize(size, size).png().toBuffer();
        pngBuffers.push({ size, buf });
        console.log(`  ✅ 生成 ${size}x${size} PNG`);
    }

    // 组装 ICO 文件
    const icoPath = path.join(ASSETS_DIR, 'icon.ico');
    const icoData = buildICO(pngBuffers);
    fs.writeFileSync(icoPath, icoData);
    console.log(`  📦 生成 icon.ico (${icoData.length} bytes)\n`);

    // ====== macOS ICNS (使用 512x512 PNG 作为替代) ======
    // electron-builder 在 macOS 上也可以用 PNG
    const png512 = await sharp(SVG_PATH).resize(512, 512).png().toBuffer();
    const pngPath = path.join(ASSETS_DIR, 'icon.png');
    fs.writeFileSync(pngPath, png512);
    console.log(`  ✅ 生成 512x512 icon.png (${png512.length} bytes)`);

    console.log('\n✨ 图标生成完成！');
}

// 手工构建 ICO 文件（无需额外依赖）
function buildICO(pngs) {
    const imageCount = pngs.length;
    const headerSize = 6;
    const entrySize = 16;
    const offset = headerSize + entrySize * imageCount;

    // ICO 头部
    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0);   // reserved
    header.writeUInt16LE(1, 2);   // ICO type
    header.writeUInt16LE(imageCount, 4);

    // 目录条目 + 图像数据
    const entries = [];
    const imageData = [];
    let currentOffset = offset;

    for (const { size, buf } of pngs) {
        const entry = Buffer.alloc(entrySize);
        const w = size >= 256 ? 0 : size;  // 256 → 0
        entry.writeUInt8(w, 0);             // width
        entry.writeUInt8(w, 1);             // height
        entry.writeUInt8(0, 2);             // color palette
        entry.writeUInt8(0, 3);             // reserved
        entry.writeUInt16LE(1, 4);          // color planes
        entry.writeUInt16LE(32, 6);         // bits per pixel
        entry.writeUInt32LE(buf.length, 8); // image size
        entry.writeUInt32LE(currentOffset, 12); // offset
        entries.push(entry);
        imageData.push(buf);
        currentOffset += buf.length;
    }

    return Buffer.concat([header, ...entries, ...imageData]);
}

generateIcons().catch(err => {
    console.error('❌ 图标生成失败:', err.message);
    process.exit(1);
});
