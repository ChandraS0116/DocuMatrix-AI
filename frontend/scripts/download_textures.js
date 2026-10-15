const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/textures');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const textures = {
  // Earth
  'earth_day.jpg': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
  'earth_normal.jpg': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
  'earth_specular.jpg': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
  'earth_clouds.png': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png',
  'moon.jpg': 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg',
  
  // Other Planets (from a reliable open source repo)
  'mars.jpg': 'https://raw.githubusercontent.com/joshcam/three-solar-system/master/public/textures/mars.jpg',
  'jupiter.jpg': 'https://raw.githubusercontent.com/joshcam/three-solar-system/master/public/textures/jupiter.jpg',
  'venus.jpg': 'https://raw.githubusercontent.com/joshcam/three-solar-system/master/public/textures/venus.jpg',
  'mercury.jpg': 'https://raw.githubusercontent.com/joshcam/three-solar-system/master/public/textures/mercury.jpg',
  'saturn.jpg': 'https://raw.githubusercontent.com/joshcam/three-solar-system/master/public/textures/saturn.jpg',
  'saturn_ring.png': 'https://raw.githubusercontent.com/joshcam/three-solar-system/master/public/textures/saturn_ring.png',
  'uranus.jpg': 'https://raw.githubusercontent.com/joshcam/three-solar-system/master/public/textures/uranus.jpg',
  'neptune.jpg': 'https://raw.githubusercontent.com/joshcam/three-solar-system/master/public/textures/neptune.jpg',
  'sun.jpg': 'https://raw.githubusercontent.com/joshcam/three-solar-system/master/public/textures/sun.jpg'
};

const download = (filename, url) => {
  return new Promise((resolve, reject) => {
    const dest = path.join(targetDir, filename);
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded: ${filename}`);
          resolve();
        });
      } else if (response.statusCode === 404) {
        // Fallback for missing planets: use earth as placeholder or ignore
        console.warn(`[WARN] 404 for ${filename} at ${url}`);
        fs.unlinkSync(dest);
        resolve(); // resolve anyway so promise.all doesn't fail
      } else {
        fs.unlinkSync(dest);
        reject(`Server responded with ${response.statusCode}: ${response.statusMessage}`);
      }
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err.message);
    });
  });
};

async function main() {
  console.log('Downloading high-res textures...');
  const promises = Object.entries(textures).map(([filename, url]) => download(filename, url));
  await Promise.allSettled(promises);
  console.log('Done downloading textures.');
}

main();
