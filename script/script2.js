document.addEventListener('DOMContentLoaded', function () {
    // Seleccionar el input de tipo archivo y el div de vista previa
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
    // Manejar el evento de cambio del input de tipo archivo
    inputImagen.addEventListener('change', function () {
      // Obtener el archivo seleccionado
      archivo = inputImagen.files[0];

      if (archivo) {
        // Crear un objeto FileReader para leer el contenido del archivo
        const lector = new FileReader();

        // Manejar el evento de carga del FileReader
        lector.onload = function (e) {
          // Asignar la fuente de la imagen al elemento de la vista previa
          imagenPreview.src = e.target.result;
        };

        // Leer el contenido del archivo como una URL de datos
        lector.readAsDataURL(archivo);

      } else {
        // Limpiar la vista previa si no se selecciona ningún archivo
        imagenPreview.src = '';
        // Ocultar el botón "Nuevo"
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
      // Manejar el caso en el que no se ha seleccionado ningún archivo
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
    context.drawImage(imagen, 0, 0, 640, 480);

    const tensor = tf.browser
      .fromPixels(canvas)
      .resizeBilinear([224, 224])
      .toFloat()
      .expandDims();

    const predictions = await model.predict(tensor).data();
    return predictions;
  }

async function classifyAndShowImage() {
    const predictions = await classifyFrame();
    updateResult(predictions);
}

function updateResult(predictions) {
    const labels = ["Bailarina", "Deportivos", "Formales", "Mocasines", "Plataformas", "Sandalias", "Tacones"];
    var dic_resultado = {}; 
    // Sumar todas las predicciones para obtener el total
    const totalPredictions = predictions.reduce((acc, val) => acc + val, 0);

    // Calcular y mostrar el porcentaje para cada clase
    for (let i = 0; i < predictions.length; i++) {
        const resultPercentage = ((predictions[i] / totalPredictions) * 100);
        console.log(`Etiqueta: ${labels[i]}, Porcentaje: ${resultPercentage}%`);
        dic_resultado[labels[i]] = resultPercentage;
    }

    // Obtener la clase con la mayor predicción
    const maxPredictionIndex = predictions.indexOf(Math.max(...predictions));
    const resultLabel = labels[maxPredictionIndex];
    
    //Ordenar diccionario
    // const entries = Object.entries(dic_resultado);
    // entries.sort((a, b) => b[1] - a[1]);
    const sortedObject = Object.entries(dic_resultado).sort((a, b) => b[1] - a[1]);
    const topThreeLabels = sortedObject.slice(0, 3);
    const resultElement = document.getElementById("resultado");
    resultElement.innerHTML = "";
    for (let i = 0; i < topThreeLabels.length; i++) {
        const [key, value] = topThreeLabels[i];
        // Utilizar toFixed(4) para mostrar el valor con 4 decimales
        resultElement.innerHTML += `${key}: ${value.toFixed(2)}%<br>`;
    }    
    // Mostrar la etiqueta de la clase con mayor predicción
    // document.getElementById("resultado").innerText = resultLabel;
}


function readImage(archivo) {
    const lector = new FileReader();

    lector.onload = function (e) {
        const imagen = new Image();
        imagen.onload = function () {
            // Aquí puedes realizar cualquier preprocesamiento necesario
            // antes de pasar la imagen al modelo de TensorFlow
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = imagen.width;
            canvas.height = imagen.height;
            context.drawImage(imagen, 0, 0, imagen.width, imagen.height);

            // Obtener los datos de píxeles del lienzo
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const pixelData = imageData.data;

            // Ahora `pixelData` contiene los datos de píxeles de la imagen
            // Puedes pasar este `pixelData` a tu modelo de TensorFlow
            // para realizar la clasificación

            // Ejemplo: tf.tensor(pixelData);
        };

        // Asignar la fuente de la imagen a la URL de datos
        imagen.src = e.target.result;
    };

    // Leer el contenido del archivo como una URL de datos
    lector.readAsDataURL(archivo);
}

  });

