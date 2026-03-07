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

 let alegriaVal = 0; //Amarillo
    let miedoVal = 0 //Azul
    let romanticoVal = 0 //Rojo
    let melancolicoVal = 0 //Naranja
    let asombroVal = 0//Verde

    let showSliders = false;

let port = null;
let reader = null;
let buffer = "";
let device = null;
let server = null;
let service = null;
let txChar = null;
let rxChar = null;
//Harold manda un vector con numeros -- 1 2 2 4 4 --  [am, az, r, n, v]
//Alegria     -- Amarillo
//Miedo       -- Azul
//Romantico   -- Rojo
//Melancolico -- Naranja
//Asombro     -- Verde
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
    
    alegriaVal = parseInt(am); //Amarillo
    miedoVal = parseInt(az); //Azul
    romanticoVal = parseInt(r); //Rojo
    melancolicoVal = parseInt(n); //Naranja
    asombroVal = parseInt(v); //Verde

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
    console.log("Amarillo: " + alegriaVal);
    console.log("Azul: " + miedoVal);
    console.log("Rojo: " + romanticoVal);
    console.log("Naranja: " + melancolicoVal);
    console.log("Verde: " + asombroVal);

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
        [alegriaVal,miedoVal,romanticoVal, melancolicoVal, asombroVal].join(
          " ",
        ),
    );
    sendBLE(
        [alegriaVal,miedoVal,romanticoVal, melancolicoVal, asombroVal ].join(
          " ",
        ) +
        "\n",
    );
  }
}

// Botón de mostrar sliders
document.getElementById("showSlidersBtn").onclick = async () => {
  toggleVisibility(sliderAdventure)
  toggleVisibility(sliderComedies)
  toggleVisibility(sliderDrama)
  toggleVisibility(sliderHorror)
  toggleVisibility(sliderRomance)
  showSliders = sliderAdventure.hidden

  if(showSliders === false)
  {
document.getElementById("showSlidersBtn").textContent = "Hide sliders"
  }
  else{
document.getElementById("showSlidersBtn").textContent = "Show sliders"
  }
};

function toggleVisibility(element) {
  //const element = document.getElementById(id);
  element.hidden = !element.hidden;
}


// Botón de conectar/desconectar
document.getElementById("connectBtn").onclick = async () => {
  if (device && device.gatt.connected) {
    await onDisconnected();
  } else {
    await connectBLE();
  }
};

// Funciones para BLE

function onDisconnected() {
  if (device && device.gatt.connected) {
    device.gatt.disconnect();
  }

  device = null;
  server = null;
  service = null;
  txChar = null;
  rxChar = null;

  console.log("Desconectado");

  console.log("BLE desconectado");

  document.getElementById("connectBtn").textContent = "Conectar Bluetooth";
  document.getElementById("connectBtn").className = "btn btn-success";
}

async function connectBLE() {
  try {

    buffer = "";

    device = await navigator.bluetooth.requestDevice({
      filters: [{ namePrefix: "AT MM" }],
      optionalServices: ["6e400001-b5a3-f393-e0a9-e50e24dcca9e"],
    });

    device.addEventListener('gattserverdisconnected', onDisconnected);

    server = await device.gatt.connect();

    service = await server.getPrimaryService(
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
    );

    txChar = await service.getCharacteristic(
      "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
    );

    rxChar = await service.getCharacteristic(
      "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
    );

    await txChar.startNotifications();
    txChar.addEventListener("characteristicvaluechanged", handleBLEData);

    console.log("Conectado vía BLE");

     document.getElementById("connectBtn").textContent = "Desconectar Bluetooth";
  document.getElementById("connectBtn").className = "btn btn-danger";

  } catch (err) {
    console.log("Error BLE: " + err);
  }
}

function handleBLEData(event) {
  const value = new TextDecoder().decode(event.target.value);
  console.log("[BLE Event]: " + value)
  processReceivedData(value.trim());
}

function processIncoming(data) {
  buffer += data;

  let lines = buffer.split("\n");
  buffer = lines.pop();

  for (let line of lines) {
    console.log("Received data: " + line.trim());
    processReceivedData(line.trim());
  }
}

async function sendBLE(text) {
  if (!rxChar) return;

  const data = new TextEncoder().encode(text + "\n");
  await rxChar.writeValue(data);

  console.log("[BLE send]:", text);
}

// async function disconnectBLE() {
//   if (device && device.gatt.connected) {
//     device.gatt.disconnect();
//   }

//   device = null;
//   server = null;
//   service = null;
//   txChar = null;
//   rxChar = null;

//   console.log("Desconectado");

//   document.getElementById("connectBtn").textContent = "Conectar Bluetooth";
//   document.getElementById("connectBtn").className = "btn btn-success";
// }

// Leer datos del Serial
// async function readData() {
//   try {
//     while (true) {
//       const { value, done } = await reader.read();
//       if (done) {
//         // Permitir que la secuencia serial se cierre correctamente.
//         reader.releaseLock();
//         break;
//       }

//       if (value) {
//         // Convertir el valor recibido a una cadena y agregar al buffer
//         const receivedString = new TextDecoder().decode(value);
//         buffer += receivedString;

//         // Procesar el buffer para encontrar mensajes completos
//         processBuffer();
//       }
//     }
//   } catch (error) {
//     console.log(`Error al leer datos: ${error.message}`);
//   }
// }
// Procesar el buffer para extraer líneas completas
// function processBuffer() {
//   // Buscar líneas completas en el buffer
//   let lineEndIndex;
//   while ((lineEndIndex = buffer.indexOf("\n")) >= 0) {
//     // Extraer la línea completa
//     const line = buffer.substring(0, lineEndIndex).trim();
//     // Eliminar la línea procesada del buffer
//     buffer = buffer.substring(lineEndIndex + 1);

//     if (line) {
//       processReceivedData(line);
//     }
//   }
// }
// Procesar una línea recibida del Serial
function processReceivedData(line) {
  let message = String(line || "").trim();
  console.log("Receiving from Transporter: " + message);

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
// async function sendData(message) {
//   if (!port || !port.writable) {
//     console.log("Error: No conectado al dispositivo");
//     return;
//   }

//   try {
//     const writer = port.writable.getWriter();
//     const data = new TextEncoder().encode(message);
//     await writer.write(data);
//     writer.releaseLock();

//     console.log("Enviado: " + message.trim());
//   } catch (error) {
//     console.log("Error al enviar datos: " + error.message);
//   }
// }
