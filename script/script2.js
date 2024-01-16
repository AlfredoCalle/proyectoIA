document.addEventListener('DOMContentLoaded', function () {
    const inputImagen = document.getElementById('imagen');
    const imagenPreview = document.getElementById('imagen-seleccionada');
    const btnClasificar = document.getElementById('btn_clasificar');
    var archivo = '';

    class L2 {
      static className = "L2";
      constructor(config) {
          return tf.regularizers.l1l2(config);
      }
  }  

    inputImagen.addEventListener('change', function () {

      archivo = inputImagen.files[0];

      if (archivo) {
        const lector = new FileReader();

        lector.onload = function (e) {
          imagenPreview.src = e.target.result;
        };

        lector.readAsDataURL(archivo);

      } else {
        imagenPreview.src = '';
        document.getElementById('btn_nuevo').style.display = 'none';
      }
    });
    btnClasificar.addEventListener('click', async function () {
        await classifyAndShowImage();
      });


      tf.serialization.registerClass(L2);

(async () => {
    console.log("Cargando modelo...");
    model = await tf.loadLayersModel("modelo/model.json");
    console.log("Modelo cargado");
})();


async function classifyFrame() {
    const predictions = await classify();
    return predictions;
}


async function classify() {
  const archivo = inputImagen.files[0];

  if (!archivo) {
    console.error('No se ha seleccionado ninguna imagen.');
    return;
  }

  const imagen = new Image();
  imagen.src = URL.createObjectURL(archivo);

  await new Promise(resolve => {
    imagen.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const context = canvas.getContext('2d');
  
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.drawImage(imagen, 0, 0, 640, 480);

  const tensor = tf.browser
  .fromPixels(canvas)
  .toFloat()
  .div(tf.scalar(255.0)) 
  .resizeBilinear([224, 224])
  .expandDims();

  const logits = await model.predict(tensor);
  const predictions = logits.dataSync();

  return predictions;
}

async function classifyAndShowImage() {
    const predictions = await classifyFrame();
    updateResult(predictions);
}

function updateResult(predictions) {
    const labels = ["Bailarina", "Mocasines", "Formales", "Suecos", "Deportivos"];
    var dic_resultado = {}; 
    const totalPredictions = predictions.reduce((acc, val) => acc + val, 0);

    for (let i = 0; i < predictions.length; i++) {
        const resultPercentage = ((predictions[i] / totalPredictions) * 100);
        dic_resultado[labels[i]] = resultPercentage;
    }
    
    const sortedObject = Object.entries(dic_resultado).sort((a, b) => b[1] - a[1]);
    const topThreeLabels = sortedObject.slice(0, 3);
    
    mostrarResultados(topThreeLabels)
}


function readImage(archivo) {
    const lector = new FileReader();

    lector.onload = function (e) {
        const imagen = new Image();
        imagen.onload = function () {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = imagen.width;
            canvas.height = imagen.height;
            context.drawImage(imagen, 0, 0, imagen.width, imagen.height);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const pixelData = imageData.data;
        };

        imagen.src = e.target.result;
    };

    lector.readAsDataURL(archivo);
}

  });

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
    <table class="responsive-table" border="0">
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