
const sliderComedies = document.getElementById("sliderComedies");
const sliderAdventure = document.getElementById("sliderAdventure");
const sliderDrama = document.getElementById("sliderDrama");
const sliderHorror = document.getElementById("sliderHorror");
const sliderRomance = document.getElementById("sliderRomance");

let valueComedies = document.getElementById("valueComedies");
let valueHorrors = document.getElementById("valueHorror");
let valueRomances = document.getElementById("valueRomance");
let valueDramas = document.getElementById("valueDrama");
let valueAdventures = document.getElementById("valueAdventure");

let port = null;
let reader = null;
let buffer = null;

//Harold manda un vector con numeros -- 1m2m2m4m4 --  [am, az, r, n, v]
//Alegria -- Amarillo
//Melancolico -- Azul
//Romantico -- Rojo
//Asombro -- Naranja
//Miedo -- Verde
function handleMessage(message) {
  //control de mensajes desde la placa

  let msg;

  try {
    msg = JSON.parse(message);
  } catch (e) {
    return;
  }

  if (msg.type === "perfilActual" && Array.isArray(msg.data)) {
    const [am, az, r, n, v] = msg.data.map((x) =>
      Math.max(0, Math.min(4, parseInt(x, 10))),
    );
    data = `${r} ${v} ${am} ${az} ${n}`;

    console.log("Perfil: ", data);

    let romanticoVal = parseInt(r); //Rojo
    let miedoVal = parseInt(v); //Verde
    let alegriaVal = parseInt(am); //Amarillo
    let melancolicoVal = parseInt(az); //Azul
    let asombroVal = parseInt(n); //Naranja

    if (romanticoVal > 4) {
      romanticoVal = 4;
    }
    if (miedoVal > 4) {
      miedoVal = 4;
    }
    if (melancolicoVal > 4) {
      melancolicoVal = 4;
    }
    if (alegriaVal > 4) {
      alegriaVal = 4;
    }
    if (asombroVal > 4) {
      asombroVal = 4;
    }
    console.log("Colores Recibidos");
    console.log("Rojo: " + romanticoVal);
    console.log("Verde: " + miedoVal);
    console.log("Amarillo: " + alegriaVal);
    console.log("Azul: " + melancolicoVal);
    console.log("Naranja: " + asombroVal);

    sliderRomance.value = romanticoVal * 25;
    sliderHorror.value = miedoVal * 25;
    sliderComedies.value = alegriaVal * 25;
    sliderDrama.value = melancolicoVal * 25;
    sliderAdventure.value = asombroVal * 25;

    valueRomances.innerHTML = sliderRomance.value + "%";
    valueHorrors.innerHTML = sliderHorror.value + "%";
    valueComedies.innerHTML = sliderComedies.value + "%";
    valueDramas.innerHTML = sliderDrama.value + "%";
    valueAdventures.innerHTML = sliderAdventure.value + "%";
    setTimeout(createRecommendations, 2000);
  }

  if (msg.type === "getPerfil") {
    //Enviar perfil actual al servidor
    //Alegria -- Amarillo
    //Melancolico -- Azul
    //Romantico -- Rojo
    //Asombro -- Naranja
    //Miedo -- Verde
    let romanticoVal = parseInt(sliderRomance.value) / 25;
    let miedoVal = parseInt(sliderHorror.value) / 25;
    let alegriaVal = parseInt(sliderComedies.value) / 25;
    let melancolicoVal = parseInt(sliderDrama.value) / 25;
    let asombroVal = parseInt(sliderAdventure.value) / 25;
    console.log(
      "Enviando perfil: " +
        [alegriaVal, melancolicoVal, romanticoVal, asombroVal, miedoVal].join(
          " ",
        ),
    );
    sendData("7,14,2," + [alegriaVal, melancolicoVal, romanticoVal, asombroVal, miedoVal].join(" ") + "\n");
  }
}

// Botón de conectar/desconectar
document.getElementById("connectBtn").onclick = async () => {
  if (port && port.readable) {
    // Desconectar
    await disconnectSerial();
  } else {
    // Conectar
    await connectSerial();
  }
};

// Funciones para conexión Serial
async function connectSerial() {
  try {
    console.log("Solicitando puerto serial (baudRate: 115200)...");
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    document.getElementById("connectBtn").textContent = "Desconectar";
    document.getElementById("connectBtn").className = "btn btn-danger";

    reader = port.readable.getReader();
    sendData("1,0,0,0\n");
    readData();
  } catch (error) {
    console.log(`Error de conexión: ${error.message}`);
  }
}
// Desconectar Serial
async function disconnectSerial() {
  try {
    if (reader) {
      await reader.cancel();
      await reader.releaseLock();
      reader = null;
    }

    if (port) {
      await port.close();
      port = null;
    }

    document.getElementById("connectBtn").textContent = "Conectar Bluetooth";
    document.getElementById("connectBtn").className = "btn btn-success";
  } catch (error) {
    console.log(`Error al desconectar: ${error.message}`);
  }
}
// Leer datos del Serial
async function readData() {
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // Permitir que la secuencia serial se cierre correctamente.
        reader.releaseLock();
        break;
      }

      if (value) {
        // Convertir el valor recibido a una cadena y agregar al buffer
        const receivedString = new TextDecoder().decode(value);
        buffer += receivedString;

        // Procesar el buffer para encontrar mensajes completos
        processBuffer();
      }
    }
  } catch (error) {
    logMessage(`Error al leer datos: ${error.message}`);
  }
}
// Procesar el buffer para extraer líneas completas
function processBuffer() {
  // Buscar líneas completas en el buffer
  let lineEndIndex;
  while ((lineEndIndex = buffer.indexOf("\n")) >= 0) {
    // Extraer la línea completa
    const line = buffer.substring(0, lineEndIndex).trim();
    // Eliminar la línea procesada del buffer
    buffer = buffer.substring(lineEndIndex + 1);

    if (line) {
      processReceivedData(line);
    }
  }
}
// Procesar una línea recibida del Serial
function processReceivedData(line) {
  let message = String(line || "").trim();
  console.log("Receiving from SerialPort: " + message);

  // Estandarizar protocolo:
  if (message.startsWith("setPerfil")) {
    // Vector de perfil recibido
    const payload = message
      .substring(10)
      .split(" ")
      .map((n) => parseInt(n, 10));
    handleMessage(JSON.stringify({ type: "perfilActual", data: payload }));
    console.log("Perfil inicial cambiado por: " + payload);
  } else if (message.startsWith("getPerfil")) {
    handleMessage(JSON.stringify({ type: "getPerfil", data: "1" }));
    console.log("Solicitud de perfil recibida");
  } else {
    handleMessage(JSON.stringify({ type: "raw", data: message }));
    console.log("Serial data:", message);
  }
}
// Enviar datos al Serial
async function sendData(message) {
  if (!port || !port.writable) {
    console.log("Error: No conectado al dispositivo");
    return;
  }

  try {
    const writer = port.writable.getWriter();
    const data = new TextEncoder().encode(message);
    await writer.write(data);
    writer.releaseLock();

    console.log("Enviado: " + message.trim());
  } catch (error) {
    console.log("Error al enviar datos: " + error.message);
  }
}
