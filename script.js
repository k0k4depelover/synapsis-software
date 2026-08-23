const canvas = document.getElementById("sequence-canvas");
const ctx = canvas.getContext("2d");

const title = document.getElementById("sequence-title");
const description = document.getElementById("sequence-description");

const section = document.querySelector(".sequence-section");
const textContent = document.querySelector(".text-content");


const frameCount = 130;

const frames = [];



for (let i = 0; i <= frameCount; i++) {

    const image = new Image();

    const number = String(i).padStart(5, "0");

    image.src = `./img/frame_${number}.webp`;

    frames.push(image);
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
            "Conoce nuestra empresa."
    },

    {
        start: 0.25,
        end: 0.50,
        description:
            "Soluciones diseñadas para nuestros clientes."
    },

    {
        start: 0.50,
        end: 0.75,

        description:
            "Experiencia y tecnología para crear soluciones."
    },

    {
        start: 0.75,
        end: 1,
        description:
            "Estamos listos para ayudarte."
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


    // Si seguimos dentro del mismo texto,
    // no hacemos nada.
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


// ============================================
// RENDER
// ============================================

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


    // ----------------------------------------
    // TEXT
    // ----------------------------------------

    updateText(progress);

}


// ============================================
// SCROLL OPTIMIZADO
// ============================================

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
