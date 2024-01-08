document.getElementById("canvas").style.display = "none";
const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const imageContainer = document.getElementById("imageContainer");
const capturedImage = document.getElementById("capturedImage");
const btnClasificar = document.getElementById('btn_clasificar');
const btnNuevo = document.getElementById('btn_nuevo');

let model = null;

class L2 {
    static className = "L2";
    constructor(config) {
        return tf.regularizers.l1l2(config);
    }
}
tf.serialization.registerClass(L2);

(async () => {
    console.log("Cargando modelo...");
    model = await tf.loadLayersModel("modelo/model.json");
    console.log("Modelo cargado");
    await detectWebcam();
})();

async function detectWebcam() {
    try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log(navigator.userAgent);
        let constraints = {
            audio: false,
            video: {}
        };

        if (isMobile) {
            constraints.video.facingMode = { exact: "environment" };
        } 

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
        btnClasificar.addEventListener('click', classifyAndShowImage);
        btnNuevo.addEventListener('click', resetUI);
    } catch (e) {
        document.getElementById("mensaje").innerHTML = "No se puede acceder a la cámara";
    }
}


function handleSuccess(stream) {
    window.stream = stream;
    video.srcObject = stream;
}

async function classifyAndShowImage() {
    const predictions = await classifyFrame();
    updateResult(predictions);

    const imageCapture = new ImageCapture(window.stream.getVideoTracks()[0]);
    const img = await imageCapture.grabFrame();
    const blob = await createImageBlob(img);
    capturedImage.src = URL.createObjectURL(blob);
    imageContainer.style.display = "block";
    video.style.display = "none";
    
    btnClasificar.style.display = "none";
    btnNuevo.style.display = "block";
}

function resetUI() {
    imageContainer.style.display = "none";
    video.style.display = "block";
    btnClasificar.style.display = "block";
    btnNuevo.style.display = "none";
    capturedImage.src = "";
    document.getElementById("resultado").innerText = "----------";
}

async function classifyFrame() {
    const predictions = await classify();
    await tf.nextFrame();
    return predictions;
}

async function classify() {
    const imageCapture = new ImageCapture(window.stream.getVideoTracks()[0]);
    const img = await imageCapture.grabFrame();
    const context = canvas.getContext("2d");
    context.drawImage(img, 0, 0, 640, 480);

    const tensor = tf.browser
        .fromPixels(canvas)
        .resizeBilinear([224, 224])
        .toFloat()
        .expandDims();

    const predictions = await model.predict(tensor).data();
    return predictions;
}

function updateResult(predictions) {
    const labels = ["Bailarina", "Deportivos", "Formales", "Mocasines", "Plataformas", "Sandalias", "Tacones"];
    
    // Sumar todas las predicciones para obtener el total
    const totalPredictions = predictions.reduce((acc, val) => acc + val, 0);

    // Calcular y mostrar el porcentaje para cada clase
    for (let i = 0; i < predictions.length; i++) {
        const resultPercentage = ((predictions[i] / totalPredictions) * 100).toFixed(2);
        console.log(`Etiqueta: ${labels[i]}, Porcentaje: ${resultPercentage}%`);
    }

    // Obtener la clase con la mayor predicción
    const maxPredictionIndex = predictions.indexOf(Math.max(...predictions));
    const resultLabel = labels[maxPredictionIndex];

    // Mostrar la etiqueta de la clase con mayor predicción
    document.getElementById("resultado").innerText = resultLabel;
}



function createImageBlob(image) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, image.width, image.height);
        canvas.toBlob(resolve, 'image/png');
    });
}
