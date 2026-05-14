const fs = require('fs');
const file = 'src/components/comment/Comments.svelte';
let txt = fs.readFileSync(file, 'utf8');

const replacement = \const unsub = previewImageStore.subscribe(url => {
      if (url && !overlayEl) {
        // Collect all images in the comment section
        const imgs = Array.from(document.querySelectorAll('.comment-content img')).map(img => img.src);
        let currentIndex = imgs.indexOf(url);
        if(currentIndex === -1) currentIndex = 0;

        overlayEl = document.createElement('div');
        overlayEl.className = 'fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center overflow-hidden';
        overlayEl.onclick = (e) => { 
            if (e.target === overlayEl) previewImageStore.set(null); 
        };

        const closeBtn = document.createElement('button');
        closeBtn.className = 'absolute top-4 right-4 z-[100] w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer';
        closeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
        closeBtn.onclick = (e) => { e.stopPropagation(); previewImageStore.set(null); };
        overlayEl.appendChild(closeBtn);

        const prevBtn = document.createElement('button');
        prevBtn.className = 'absolute left-4 sm:left-8 z-[100] w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer hidden md:flex';
        prevBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>';

        const nextBtn = document.createElement('button');
        nextBtn.className = 'absolute right-4 sm:right-8 z-[100] w-12 h-12 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer hidden md:flex';
        nextBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>';

        let scale = 1, posX = 0, posY = 0, dragging = false, lastX = 0, lastY = 0;

        const img = document.createElement('img');
        img.src = imgs[currentIndex];
        img.className = 'max-w-full max-h-full object-contain rounded shadow-2xl select-none';
        img.style.transition = 'transform 0.1s ease-out';
        img.style.cursor = 'grab';
        img.draggable = false;

        const updateTransform = () => { img.style.transform = \\\	ranslate(\\\px, \\\px) scale(\\\)\\\; };
        const resetTransform = () => { scale = 1; posX = 0; posY = 0; updateTransform(); };

        const updateImage = (index) => {
            if(index < 0) index = imgs.length - 1;
            if(index >= imgs.length) index = 0;
            currentIndex = index;
            img.src = imgs[currentIndex];
            resetTransform();
        };

        prevBtn.onclick = (e) => { e.stopPropagation(); updateImage(currentIndex - 1); };
        nextBtn.onclick = (e) => { e.stopPropagation(); updateImage(currentIndex + 1); };
        
        if(imgs.length > 1) {
            overlayEl.appendChild(prevBtn);
            overlayEl.appendChild(nextBtn);
        }

        let touchStartX = 0;
        let touchEndX = 0;
        overlayEl.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
        overlayEl.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (scale === 1) {
                if (touchStartX - touchEndX > 50) updateImage(currentIndex + 1);
                if (touchEndX - touchStartX > 50) updateImage(currentIndex - 1);
            }
        });

        overlayEl.addEventListener('wheel', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const delta = e.deltaY > 0 ? -0.1 : 0.1;
          scale = Math.max(0.5, Math.min(5, scale + delta));
          updateTransform();
        }, { passive: false });

        img.addEventListener('mousedown', (e) => {
          dragging = true;
          lastX = e.clientX;
          lastY = e.clientY;
          img.style.cursor = 'grabbing';
          img.style.transition = 'none';
        });

        window.addEventListener('mousemove', (e) => {
          if (!dragging) return;
          posX += e.clientX - lastX;
          posY += e.clientY - lastY;
          lastX = e.clientX;
          lastY = e.clientY;
          updateTransform();
        });

        window.addEventListener('mouseup', () => {
          if (dragging) {
            dragging = false;
            img.style.cursor = 'grab';
            img.style.transition = 'transform 0.1s ease-out';
          }
        });

        img.addEventListener('dblclick', () => { resetTransform(); });

        overlayEl.appendChild(img);
        document.body.appendChild(overlayEl);

        const onKey = (e) => { 
            if (e.key === 'Escape') previewImageStore.set(null); 
            if (imgs.length > 1) {
                if (e.key === 'ArrowLeft') updateImage(currentIndex - 1);
                if (e.key === 'ArrowRight') updateImage(currentIndex + 1);
            }
        };
        document.addEventListener('keydown', onKey);
        overlayEl.__keyHandler = onKey;
      } else if (!url && overlayEl) {
        document.removeEventListener('keydown', overlayEl.__keyHandler);
        overlayEl.remove();
        overlayEl = null;
      }
    });\

txt = txt.replace(/const unsub = previewImageStore\.subscribe\(url => \{[\s\S]*?return \(\) => unsub\(\);\s*\}\);/, replacement + '\n\n    return () => unsub();\n  });');

fs.writeFileSync(file, txt, 'utf8');
