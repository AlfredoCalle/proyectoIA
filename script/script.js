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

    const canvas = document.createElement('canvas');
    canvas.width = img.width;  // Use actual width of the captured image
    canvas.height = img.height;  // Use actual height of the captured image
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, img.width, img.height);

    capturedImage.src = canvas.toDataURL();
    imageContainer.style.display = "block";
    video.style.display = "none";
    btnClasificar.style.display = "none";
    btnNuevo.style.display = "block";
}

function resetUI() {
    quitarResultados()
    imageContainer.style.display = "none";
    video.style.display = "block";
    btnClasificar.style.display = "block";
    btnNuevo.style.display = "none";
    capturedImage.src = "";
    // document.getElementById("resultado").innerText = "----------";
}

async function classifyFrame() {
    const predictions = await classify();
    await tf.nextFrame();
    return predictions;
}

async function classify() {
    activarLoader();

    const imageCapture = new ImageCapture(window.stream.getVideoTracks()[0]);
    const img = await imageCapture.grabFrame();

    const canvas = document.createElement('canvas');
    canvas.width = img.width;  // Use actual width of the captured image
    canvas.height = img.height;  // Use actual height of the captured image
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, img.width, img.height);

    desactivarLoader();

    const tensor = tf.browser
    .fromPixels(canvas)
    .toFloat()
    .div(tf.scalar(255.0))  // Normalización
    .resizeBilinear([224, 224])
    .expandDims();
  
    // Obtener las predicciones del modelo directamente
    const logits = await model.predict(tensor);
    const predictions = logits.dataSync();
  
    return predictions;
  }

function updateResult(predictions) {
    const labels = ["Bailarina", "Mocasines", "Formales", "Suecos", "Deportivos"];
    var dic_resultado = {};
    const totalPredictions = predictions.reduce((acc, val) => acc + val, 0);

    for (let i = 0; i < predictions.length; i++) {
        const resultPercentage = (predictions[i] / totalPredictions) * 100;
        console.log(`Etiqueta: ${labels[i]}, Porcentaje: ${resultPercentage}%`);
        dic_resultado[labels[i]] = resultPercentage;
    }

    const sortedObject = Object.entries(dic_resultado).sort((a, b) => b[1] - a[1]);
    const topThreeLabels = sortedObject.slice(0, 3);
    
    mostrarResultados(topThreeLabels)
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

// Loader

function activarLoader() {
    document.getElementById("resultado").innerText = "No mover el dispositivo mientras se captura el calzado";
    document.getElementById("titulo_resultado").innerText = "CAPTURANDO...";
}

function desactivarLoader() {
    document.getElementById("titulo_resultado").innerText = "RESULTADO";
}


// Barras de progreso
function mostrarResultados(labels) {
    const [key1, value1] = labels[0];
    let porcentaje1 = value1.toFixed(2)
    const [key2, value2] = labels[1];
    let porcentaje2 = value2.toFixed(2)
    const [key3, value3] = labels[2];
    let porcentaje3 = value3.toFixed(2)

    document.getElementById('clasificador_contenedor').innerHTML = `
    <div class="wrapper" style="justify-content: center;">
    <table style="display: flex; flex-wrap: wrap; flex-direction: column;" border="0">
        <tr>
            <td style="text-align: left;">
                <label  for="progress1" style="font-size: 30px; margin: 20px;">${key1}</label>
            </td>
            <td>
                <progress id="progress1" class="progress-bar" value="${porcentaje1}" max="100" style="height: 40px;">${porcentaje1}%</progress>
            </td>
            <td>
                <label  for="progress1" style="font-size: 25px;">${porcentaje1}%</label>
            </td>
        </tr>
        <tr>
            <td style="text-align: left;">
                <label for="progress2" style="font-size: 30px; margin: 20px;">${key2}</label>
            </td>
            <td>
                <progress id="progress2" class="progress-bar" value="${porcentaje2}" max="100" style="height: 40px;">${porcentaje2}%</progress>
            </td>
            <td>
                <label for="progress2" style="font-size: 25px;">${porcentaje2}%</label>
            </td>
        </tr>
        <tr>
            <td style="text-align: left;">
                <label for="progress3" style="font-size: 30px; margin: 20px;">${key3}</label>
            </td>
            <td>
                <progress id="progress3" class="progress-bar" value="${porcentaje3}" max="100" style="height: 40px;">${porcentaje3}%</progress>
            </td>
            <td>
                <label for="progress3" style="font-size: 25px;">${porcentaje3}%</label>
            </td>
        </tr>
    </table>
    </div>
    `;
}

function quitarResultados() {
    document.getElementById('clasificador_contenedor').innerHTML = `
    <p style="font-size: 40px; margin: 20px;" id="resultado">----------</p>
`;
}