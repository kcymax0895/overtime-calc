/**
 * generate-icons.cjs
 * 외부 패키지 없이 순수 Node.js로 PWA용 PNG 아이콘 파일을 생성합니다.
 * (zlib 내장 모듈 사용)
 */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) {
            c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        }
        table[i] = c;
    }
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/**
 * size x size PNG 생성
 * - 배경: 인디고 (#4f46e5 = 79, 70, 229)
 * - 중앙 원: 흰색 (달 모양)
 * - 오른쪽 하단 소원: 연한 보라 (#c4b5fd)
 */
function createPNG(size) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(size, 0);
    ihdr.writeUInt32BE(size, 4);
    ihdr.writeUInt8(8, 8);  // bit depth
    ihdr.writeUInt8(2, 9);  // RGB
    ihdr.writeUInt8(0, 10);
    ihdr.writeUInt8(0, 11);
    ihdr.writeUInt8(0, 12);

    // 픽셀 데이터 생성
    const rawRows = [];
    const cx = size / 2, cy = size / 2;
    const moonR = size * 0.32;      // 달 원 반지름
    const moonOX = size * 0.06;     // 달 오프셋 (초승달 효과)
    const outerR = size * 0.42;     // 배경 원형 테두리
    const dotCX = cx + size * 0.22;
    const dotCY = cy - size * 0.18;
    const dotR = size * 0.06;       // 점 반지름 (별)

    for (let y = 0; y < size; y++) {
        const row = [0]; // filter byte
        for (let x = 0; x < size; x++) {
            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 바깥 배경: 딥 인디고
            let r = 30, g = 27, b = 75;

            if (dist < outerR + 2) {
                // 원형 영역: 인디고
                r = 79; g = 70; b = 229;
            }
            // 별/점
            const ddx = x - dotCX, ddy = y - dotCY;
            const ddist = Math.sqrt(ddx * ddx + ddy * ddy);
            if (ddist < dotR) {
                r = 196; g = 181; b = 253;
            }
            // 달 (초승달)
            const mdx = x - cx, mdy = y - cy;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            const shifted = Math.sqrt((x - cx - moonOX) ** 2 + (y - cy) ** 2);
            if (mdist < moonR && shifted >= moonR * 0.72) {
                r = 255; g = 255; b = 255;
            }

            row.push(r, g, b);
        }
        rawRows.push(...row);
    }

    const raw = Buffer.from(rawRows);
    const compressed = zlib.deflateSync(raw);

    return Buffer.concat([
        signature,
        makeChunk('IHDR', ihdr),
        makeChunk('IDAT', compressed),
        makeChunk('IEND', Buffer.alloc(0)),
    ]);
}

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createPNG(192));
console.log('✓ public/icon-192.png 생성 완료');

fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createPNG(512));
console.log('✓ public/icon-512.png 생성 완료');
