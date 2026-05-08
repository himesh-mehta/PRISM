import fs from 'fs';

const file = 'c:/Users/Himesh/Downloads/E-Commerce-WebPage-main/E-Commerce-WebPage-main/ecommerce-project/prism-health-hub/public/meshcharacters/neck.glb';

try {
  const buffer = fs.readFileSync(file);
  
  // GLB header is 12 bytes
  const magic = buffer.readUInt32LE(0);
  const version = buffer.readUInt32LE(4);
  const totalLength = buffer.readUInt32LE(8);

  if (magic !== 0x46546C67) { // 'glTF'
    throw new Error('Not a GLB file');
  }

  // First chunk header is 8 bytes
  const chunkLength = buffer.readUInt32LE(12);
  const chunkType = buffer.readUInt32LE(16);

  if (chunkType !== 0x4E4F534A) { // 'JSON'
    throw new Error('First chunk is not JSON');
  }

  const jsonBuffer = buffer.subarray(20, 20 + chunkLength);
  const jsonString = jsonBuffer.toString('utf8');
  const gltf = JSON.parse(jsonString);

  console.log('--- GLB Animations ---');
  if (gltf.animations && gltf.animations.length > 0) {
    gltf.animations.forEach((anim, i) => {
      // Find duration estimation
      console.log(`${i}: "${anim.name}"`);
    });
  } else {
    console.log('No animations found in GLB');
  }
} catch (e) {
  console.error('Error reading GLB:', e);
}
