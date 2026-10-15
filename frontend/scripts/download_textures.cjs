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
  
  // Other Planets
  'mars.jpg': 'https://www.solarsystemscope.com/textures/download/2k_mars.jpg',
  'jupiter.jpg': 'https://www.solarsystemscope.com/textures/download/2k_jupiter.jpg',
  'venus.jpg': 'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg',
  'venus_clouds.jpg': 'https://www.solarsystemscope.com/textures/download/2k_venus_atmosphere.jpg',
  'mercury.jpg': 'https://www.solarsystemscope.com/textures/download/2k_mercury.jpg',
  'saturn.jpg': 'https://www.solarsystemscope.com/textures/download/2k_saturn.jpg',
  'saturn_ring.png': 'https://www.solarsystemscope.com/textures/download/2k_saturn_ring_alpha.png',
  'uranus.jpg': 'https://www.solarsystemscope.com/textures/download/2k_uranus.jpg',
  'neptune.jpg': 'https://www.solarsystemscope.com/textures/download/2k_neptune.jpg',
  'sun.jpg': 'https://www.solarsystemscope.com/textures/download/2k_sun.jpg'
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
