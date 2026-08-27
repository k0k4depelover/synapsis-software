// ============================================
// SETUP
// ============================================

const canvas = document.getElementById("sequence-canvas");
const ctx = canvas.getContext("2d", { alpha: false });

const description = document.getElementById("sequence-description");
const section = document.querySelector(".sequence-section");
const textContent = document.querySelector(".text-content");

// Configuramos el inicio y fin de los frames
const startFrame = 5;
const endFrame = 121;
const frameCount = endFrame - startFrame + 1; // 117 frames

// Estado global — todo declarado aquí para evitar Temporal Dead Zone
const frames = new Array(frameCount);
let isPreloadingStarted = false;
let lastRenderedIndex = -1;
let ticking = false;
let timeoutWillChange;
let currentTextSection = null;

// Detección de Safari (createImageBitmap tiene bugs en Safari)
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

// ============================================
// CANVAS RESIZE
// ============================================

function resizeCanvas() {
    // Limitamos el DPR a máximo 2 para ahorrar VRAM y Fill Rate
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    // Solo re-renderizamos si ya hay un frame cargado
    if (frames[lastRenderedIndex]) {
        drawImage(frames[lastRenderedIndex]);
    }
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ============================================
// CARGA DE IMÁGENES
// ============================================

async function loadAndDecodeFrame(index) {
    if (frames[index]) return frames[index];

    const fileNumber = startFrame + index;
    const number = String(fileNumber).padStart(5, "0");
    const url = `./frames_avif/frame_${number}.avif`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();

        // createImageBitmap decodifica fuera del hilo principal (0 jank al dibujar)
        if (window.createImageBitmap && !isSafari) {
            const bitmap = await createImageBitmap(blob);
            frames[index] = bitmap;
            return bitmap;
        } else {
            // Fallback para Safari y browsers sin createImageBitmap
            return new Promise((resolve, reject) => {
                const img = new Image();
                const objectUrl = URL.createObjectURL(blob);
                img.onload = () => {
                    frames[index] = img;
                    URL.revokeObjectURL(objectUrl); // Liberar memoria
                    resolve(img);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error(`Failed to load frame ${index}`));
                };
                img.src = objectUrl;
            });
        }
    } catch (e) {
        console.error(`Error loading frame ${index}:`, e);
        return null;
    }
}

// Carga del primer frame — dibuja en cuanto esté listo
loadAndDecodeFrame(0).then(img => {
    if (img) {
        lastRenderedIndex = 0;
        drawImage(img);
    }
});

// ============================================
// PRECARGA EN PARALELO
// ============================================

async function preloadImages() {
    if (isPreloadingStarted) return;
    isPreloadingStarted = true;

    // Fase 1: Primeros 20 frames en grupos de 4 (alta prioridad)
    const priorityCount = Math.min(20, frameCount);
    const concurrentLimit = 4;

    for (let i = 1; i < priorityCount; i += concurrentLimit) {
        const chunk = [];
        for (let j = 0; j < concurrentLimit && (i + j) < priorityCount; j++) {
            chunk.push(loadAndDecodeFrame(i + j));
        }
        await Promise.all(chunk);
    }

    // Fase 2: El resto en grupos de 6 durante tiempo idle del CPU
    const lazyLoadRest = async () => {
        const lazyChunkLimit = 6; // Respeta el límite de ~6 conexiones de HTTP/1.1
        for (let i = priorityCount; i < frameCount; i += lazyChunkLimit) {
            const chunk = [];
            for (let j = 0; j < lazyChunkLimit && (i + j) < frameCount; j++) {
                chunk.push(loadAndDecodeFrame(i + j));
            }
            await Promise.all(chunk);
        }
    };

    if ('requestIdleCallback' in window) {
        requestIdleCallback(lazyLoadRest, { timeout: 2000 });
    } else {
        setTimeout(lazyLoadRest, 500);
    }
}

// Activar precarga cuando la sección entre en el viewport
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            preloadImages();
            observer.disconnect();
        }
    });
}, { rootMargin: "100px 0px" });

if (section) observer.observe(section);

// ============================================
// DIBUJO EN CANVAS
// ============================================

function drawImage(image) {
    if (!image) return;

    // HTMLImageElement necesita estar completo; ImageBitmap siempre lo está
    if (image instanceof HTMLImageElement && !image.complete) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imageWidth = image.width;
    const imageHeight = image.height;

    const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);

    const width = imageWidth * scale;
    const height = imageHeight * scale;
    const x = (canvasWidth - width) / 2;
    const y = (canvasHeight - height) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(image, x, y, width, height);
}

// ============================================
// TEXTO POR SECCIÓN
// ============================================

const textSections = [
    { start: 0,    end: 0.25, description: "Da un impulso digital a tu negocio." },
    { start: 0.25, end: 0.50, description: "Soluciones diseñadas a tu medida." },
    { start: 0.50, end: 0.75, description: "Conocemos cada pieza para impulsar tu negocio." },
    { start: 0.75, end: 1,    description: "¿Estás listo?" }
];

function updateText(progress) {
    const newSection = textSections.find(s => progress >= s.start && progress < s.end);

    if (!newSection || newSection === currentTextSection) return;

    currentTextSection = newSection;
    textContent.classList.add("hidden");

    setTimeout(() => {
        description.textContent = newSection.description;
        textContent.classList.remove("hidden");
    }, 300);
}

// ============================================
// SCROLL → RENDER
// ============================================

function getScrollProgress() {
    if (!section) return 0;
    const rect = section.getBoundingClientRect();
    const scrollableDistance = section.offsetHeight - window.innerHeight;
    if (scrollableDistance <= 0) return 0;
    const progress = -rect.top / scrollableDistance;
    return Math.max(0, Math.min(1, progress));
}

function render() {
    const progress = getScrollProgress();
    const frameIndex = Math.floor(progress * (frameCount - 1));

    // No redibujar si es el mismo frame que ya está pintado
    if (frameIndex !== lastRenderedIndex) {
        if (frames[frameIndex]) {
            drawImage(frames[frameIndex]);
            lastRenderedIndex = frameIndex;
        }
    }

    updateText(progress);

    // will-change solo activo durante el scroll (libera capa compositing al detenerse)
    canvas.style.willChange = 'transform';
    clearTimeout(timeoutWillChange);
    timeoutWillChange = setTimeout(() => {
        canvas.style.willChange = 'auto';
    }, 300);
}

window.addEventListener("scroll", () => {
    if (!ticking) {
        requestAnimationFrame(() => {
            render();
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });
