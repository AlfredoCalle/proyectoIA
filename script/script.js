document.getElementById("canvas").style.display = "none";
const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const btn_clasificar = document.getElementById('btn_clasificar');

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
    detectWebcam();
})();

const constraints = {
    audio: false,
    video: true
};

async function detectWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(
            constraints
        );
        handleSuccess(stream);
    } catch (e) {
        $("#mensaje").html("No se puede acceder a la cámara");
    }
}

function handleSuccess(stream) {
    window.stream = stream;
    video.srcObject = stream;
    //classifyFrame();
}

btn_clasificar.addEventListener('click', function() {
    classifyFrame();
});



async function classifyFrame() {
    // while (true) {
        const predictions = await classify();
        updateResult(predictions);
        await tf.nextFrame();
    // }
}

async function classify() {
    const imageCapture = new ImageCapture(window.stream.getVideoTracks()[0]);
    const img = await imageCapture.grabFrame();
    context.drawImage(img, 0, 0, 640, 480);
    

    // Preprocess the image (you may need to adjust this based on your model)
    const tensor = tf.browser
        .fromPixels(canvas)
        .resizeBilinear([224, 224])
        .toFloat()
        .expandDims();

    // Make predictions
    const predictions = await model.predict(tensor).data();

    return predictions;
}

function updateResult(predictions) {
    // Map predictions to labels
    const labels = ["Botas", "Casual", "Deportivo", "Sandalia", "Tacon"];
    const maxPredictionIndex = predictions.indexOf(
        Math.max(...predictions)
    );
    const resultLabel = labels[maxPredictionIndex];

    // Display result label on the webpage
    document.getElementById("resultado").innerText = resultLabel;
}