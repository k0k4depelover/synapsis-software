const frameCount= 53
const images =[];

for(let i=0; i < frameCount; i++){
  const image = new Image();
  image.src =`/img/frame_${String(i).padStart(4, "0")}.webp`;
  images.push(image)
}


const canvas = document.getElementById("sequence-canvas")
const cx = canvas.getContext("2d")


function renderFrame(index){
  const image = images[index];
  if (!image.complete) return;

  ctx.drawImage(
    image,
    0,
    0,
    canvas.width,
    canvas.height
  )
}

function drawCover(image){
  const canvasRatio = canvas.width / canvas.height;
  const imageRatio = image.width / image.height;

  let width;
  let height;
  let x;
  let y;

  if(imageRatio > canvasRatio){
    height = canvas.height;
    width = height * imageRatio;

    x = (canvas.width - width) / 2 ;
    y = 0;

  } else{
    width = canvas.width;
    height = width / imageRatio;
    x= 0;
    y = (canvas.height) / 2;
  }

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
    );

}
