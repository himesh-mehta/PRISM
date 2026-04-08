import fs from 'fs';

const file = 'c:/Users/Himesh/Downloads/E-Commerce-WebPage-main/E-Commerce-WebPage-main/ecommerce-project/prism-health-hub/public/meshcharacters/idle.glb';

const buffer = fs.readFileSync(file);
const text = buffer.toString('ascii');

// GLB loaded embeds its JSON chunk block headers. Match name anchors.
const matches = text.match(/"name"\s*:\s*"([^"]+)"/g);
if (matches) {
  fs.writeFileSync('c:/Users/Himesh/Downloads/E-Commerce-WebPage-main/E-Commerce-WebPage-main/ecommerce-project/prism-health-hub/public/gltf_nodes.txt', matches.join('\n'));
  console.log('Nodes extracted!');
} else {
  console.log('No matches found in string buffers.');
}
