const fs = require('fs');
const path = require('path');
const pug = require('pug');
const stylus = require('stylus');

const ROOT_DIR = __dirname;
const TEMPLATE_DIR = path.join(ROOT_DIR, 'Templates');
const STYLE_DIR = path.join(ROOT_DIR, 'Styles');
const JS_DIR = path.join(ROOT_DIR, 'js');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DIST_CSS_DIR = path.join(DIST_DIR, 'css');
const DIST_JS_DIR = path.join(DIST_DIR, 'js');
const DIST_IMAGES_DIR = path.join(DIST_DIR, 'images');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  fs.readdirSync(srcDir).forEach((item) => {
    const srcPath = path.join(srcDir, item);
    const destPath = path.join(destDir, item);
    const stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  });
}

console.log('🚀 開始編譯 TailorMed SAQ...');

// 1. 編譯 Pug -> HTML
function compilePugRecursive(dir, outputBaseDir, basePath = '') {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      compilePugRecursive(filePath, outputBaseDir, path.join(basePath, file));
    } else if (file.endsWith('.pug')) {
      try {
        const html = pug.renderFile(filePath, {
          pretty: true,
          basedir: TEMPLATE_DIR,
        });

        const relativePath = path.relative(TEMPLATE_DIR, filePath);
        const outputPath = path.join(
          outputBaseDir,
          relativePath.replace(/\.pug$/, '.html')
        );
        ensureDir(path.dirname(outputPath));

        fs.writeFileSync(outputPath, html);
        console.log(`  ✅ 已生成 ${path.relative(DIST_DIR, outputPath)}`);
      } catch (error) {
        console.error(`  ⚠️ 編譯失敗 ${filePath}:`, error.message);
      }
    }
  });
}

if (fs.existsSync(TEMPLATE_DIR)) {
  try {
    console.log('📝 編譯 Pug 模板...');
    compilePugRecursive(TEMPLATE_DIR, DIST_DIR);
  } catch (error) {
    console.error('❌ Pug 編譯失敗:', error.message);
    process.exit(1);
  }
} else {
  console.warn('⚠️ 未找到 Templates 目錄');
}

// 2. 編譯 Stylus -> CSS
function compileStylusRecursive(dir, outputBaseDir) {
  const files = fs.readdirSync(dir);
  const promises = [];

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      const subPromises = compileStylusRecursive(filePath, outputBaseDir);
      if (subPromises && subPromises.length > 0) {
        promises.push(...subPromises);
      }
    } else if (file.endsWith('.styl')) {
      try {
        const stylusCode = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(STYLE_DIR, filePath);
        const outputPath = path.join(
          outputBaseDir,
          relativePath.replace(/\.styl$/, '.css')
        );
        ensureDir(path.dirname(outputPath));

        const promise = new Promise((resolve, reject) => {
          stylus(stylusCode)
            .set('filename', filePath)
            .set('paths', [STYLE_DIR])
            .render((err, css) => {
              if (err) {
                console.error(`  ⚠️ Stylus 編譯失敗 ${filePath}:`, err.message);
                reject(err);
              } else {
                fs.writeFileSync(outputPath, css);
                console.log(`  ✅ 已生成 ${path.relative(DIST_DIR, outputPath)}`);
                resolve();
              }
            });
        });
        promises.push(promise);
      } catch (error) {
        console.error(`  ⚠️ Stylus 編譯失敗 ${filePath}:`, error.message);
      }
    }
  });

  return promises;
}

if (fs.existsSync(STYLE_DIR)) {
  try {
    console.log('🎨 編譯 Stylus 樣式...');
    const stylePromises = compileStylusRecursive(STYLE_DIR, DIST_CSS_DIR);
    if (stylePromises.length > 0) {
      Promise.all(stylePromises).then(() => {
        copyAssets();
      }).catch((error) => {
        console.error('❌ Stylus 編譯失敗:', error.message);
        process.exit(1);
      });
    } else {
      copyAssets();
    }
  } catch (error) {
    console.error('❌ Stylus 編譯失敗:', error.message);
    process.exit(1);
  }
} else {
  console.warn('⚠️ 未找到 Styles 目錄');
  copyAssets();
}

function copyAssets() {
  // 3. 複製 JavaScript 檔案
  if (fs.existsSync(JS_DIR)) {
    console.log('📦 複製 JavaScript 檔案...');
    copyDir(JS_DIR, DIST_JS_DIR);
    console.log('  ✅ JavaScript 檔案已複製');
  }

  // 4. 複製圖片檔案（如果存在）
  const imagesSourceDir = path.join(ROOT_DIR, 'images');
  if (fs.existsSync(imagesSourceDir)) {
    console.log('🖼️  複製圖片檔案...');
    copyDir(imagesSourceDir, DIST_IMAGES_DIR);
    console.log('  ✅ 圖片檔案已複製');
  }

  console.log('✨ 編譯完成！');
}

