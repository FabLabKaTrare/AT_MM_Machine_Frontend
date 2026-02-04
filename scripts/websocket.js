//websocket frontend

const ws = new WebSocket(`ws://${location.host}`); // mismo host/puerto

// Connection opened
ws.addEventListener("open", function (event) {
  console.log("Web socket connection for Server");
});

// Listen for messages
ws.addEventListener("message", function (event) {
  handleMessage(event.data);
});

ws.addEventListener("error", function (error) {
  console.log("WebSocket error: " + error.message);
});

ws.addEventListener("close", function () {
  console.log("WebSocket connection closed");
});

//Harold manda un vector con numeros -- 1m2m2m4m4 --  [am, az, r, n, v]
//Alegria -- Amarillo
//Melancolico -- Azul
//Romantico -- Rojo
//Asombro -- Naranja
//Miedo -- Verde
function handleMessage(message) {
  //control de mensajes desde la placa
}
