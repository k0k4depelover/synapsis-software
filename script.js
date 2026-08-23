const canvas = document.getElementById("sequence-canvas");
const ctx = canvas.getContext("2d");

const description = document.getElementById("sequence-description");

const section = document.querySelector(".sequence-section");
const textContent = document.querySelector(".text-content");


const frameCount = 121;

const frames = new Array(frameCount);

isPreloadingStarted = false;


function loadImage(index){
    if (frames[index]) return frames[index];

    const image = new Image();
    const number = String(index).padStart(5, "0");
    image.src = `./frames/frame_${number}.webp`;
    frames[index] = image;
    return image;
}

const firstFrame = loadImage(0);
firstFrame.onload = () => {
    render();
};


async function preloadImages() {
    if (isPreloadingStarted) return;
    isPreloadingStarted = true;

    for (let i = 1; i <= 16; i++) {
        if (i < frameCount) loadImage(i);
    }


    for (let i = 17; i < frameCount; i++) {
        await new Promise((resolve) => {
            const img = loadImage(i);
            if (img.complete) {
                resolve();
            } else {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Previene bloqueos si falla un asset
            }
        });
    }
}

const observer = new IntersectionObserver((entries) =>{
    entries.forEach((entry)=>{
        if(entry.isIntersecting){
            preloadImages();
            observer.disconnect();
        }
    });
},   {
    rootMargin: "100px 0px"
});

if (section) {
    observer.observe(section);
}


function resizeCanvas() {

    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


function drawImage(image) {

    if (!image.complete) {
        return;
    }

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const imageWidth = image.width;
    const imageHeight = image.height;

    const scale = Math.min(
        canvasWidth / imageWidth,
        canvasHeight / imageHeight
    );

    const width = imageWidth * scale;
    const height = imageHeight * scale;

    const x = (canvasWidth - width) / 2;
    const y = (canvasHeight - height) / 2;

    ctx.clearRect(
        0,
        0,
        canvasWidth,
        canvasHeight
    );

    ctx.drawImage(
        image,
        x,
        y,
        width,
        height
    );
}


const textSections = [

    {
        start: 0,
        end: 0.25,

        description:
            "Da un impulso digital a tu negocio."
    },

    {
        start: 0.25,
        end: 0.50,
        description:
            "Soluciones diseñadas a tu medida."
    },

    {
        start: 0.50,
        end: 0.75,

        description:
            "Conocemos cada pieza para impulsar tu negocio."
    },

    {
        start: 0.75,
        end: 1,
        description:
            "¿Estas listo?"
    }

];


let currentTextSection = null;


function updateText(progress) {

    const newSection = textSections.find(section => {

        return (
            progress >= section.start &&
            progress < section.end
        );

    });


    if (!newSection) {
        return;
    }

    if (newSection === currentTextSection) {
        return;
    }


    currentTextSection = newSection;


    // Animación de salida
    textContent.classList.add("hidden");


    setTimeout(() => {

        description.textContent =
            newSection.description;

        textContent.classList.remove("hidden");

    }, 300);

}


// ============================================
// SCROLL
// ============================================

function getScrollProgress() {

    const rect =
        section.getBoundingClientRect();


    const scrollableDistance =
        section.offsetHeight -
        window.innerHeight;


    let progress =
        -rect.top /
        scrollableDistance;


    progress =
        Math.max(0, progress);

    progress =
        Math.min(1, progress);


    return progress;

}

function render() {

    const progress =
        getScrollProgress();


    // ----------------------------------------
    // IMAGE
    // ----------------------------------------

    const frameIndex =
        Math.floor(
            progress *
            (frameCount - 1)
        );


    drawImage(
        frames[frameIndex]
    );

    updateText(progress);

}

let ticking = false;


window.addEventListener("scroll", () => {

    if (!ticking) {

        requestAnimationFrame(() => {

            render();

            ticking = false;

        });

        ticking = true;
    }

});

frames[0].onload = () => {

    render();

};
