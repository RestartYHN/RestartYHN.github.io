const fs = require('fs');

let appAstro = fs.readFileSync('src/pages/[...locale]/appreciation.astro', 'utf8');
appAstro = appAstro.replace(/normalizedLang === 'en' \? 'Browse Tags' : '画廊总览'/g, "normalizedLang === 'en' ? 'Gallery Overview' : '画廊总览'");
appAstro = appAstro.replace(/normalizedLang === 'en' \? 'Archive' : '文章归档'/g, "normalizedLang === 'en' ? 'Article Archive' : '文章归档'");
fs.writeFileSync('src/pages/[...locale]/appreciation.astro', appAstro);

let galleryAstro = fs.readFileSync('src/pages/[...locale]/appreciation/gallery.astro', 'utf8');
galleryAstro = galleryAstro.replace(/Artists I love and their illustration works/g, "My favorite illustrators/IPs and image appreciation");
galleryAstro = galleryAstro.replace(/我喜欢的画师和ta们的插画作品/g, "我喜爱的画师/IP以及图片鉴赏");
galleryAstro = galleryAstro.replace(/normalizedLang === 'en' \? 'Browse by Tags' : '按标签浏览'/g, "normalizedLang === 'en' ? 'Gallery Overview' : '画廊总览'");
fs.writeFileSync('src/pages/[...locale]/appreciation/gallery.astro', galleryAstro);

console.log('done');
