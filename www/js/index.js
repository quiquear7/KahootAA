document.addEventListener('deviceready', function() {

  let user = null;
  let db = null;
  let ref = 0;
  let refmod = null;
  let id = null;
  getRedirectResult();

  document.querySelector('#btn_google_login').addEventListener('click', function() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithRedirect(provider).then(() => {
      getRedirectResult();
    });
  });

  document.querySelector('#btn_qr').addEventListener('click', function() {
    cordova.plugins.barcodeScanner.scan(function(result) {
        let idjuego = result.text;
        if (idjuego != "") {
          firebase.database().ref("/juegos/" + idjuego + "/jugadores/").set({
            name: user.email

          });
          firebase.database().ref("/juegos/" + idjuego + "/resultados/" + user.uid).set({
            email: user.email,
            puntos: 0
          });
          firebase.database().ref("/alumnos/" + user.uid).update({
            name: user.email,
            juego: idjuego

          });
          document.querySelector('#page_main').style.display = 'none';
          document.querySelector('#esperando').style.display = 'block';
        }

        id = idjuego;
        let root_ref = db.ref("/juegos/" + idjuego + "/estado");
        root_ref.on('child_changed', iniciar_juego);
        let finalizado = db.ref("/juegos/" + idjuego + "/finalizado");
        finalizado.on('child_changed', com_finalizado);



      },
      function(error) {}
    );

  });

  function com_finalizado(child_snapshot, prev_child_key) {
    firebase.database().ref("/alumnos/" + user.uid).update({
      name: user.email,
      juego: ""
    });
    document.querySelector('#respuesta_correcta').style.display = 'none';
    document.querySelector('#respuesta_registrada').style.display = 'none';
    document.querySelector('#esperando').style.display = 'none';
    document.querySelector('#tiempo').style.display = 'none';
    document.querySelector('#page_main').style.display = 'block';
  }

  let empezado = 0;
  let data = null;
  let dataanterior = null;
  let x = 0;
  let contestado = 0;

  function iniciar_juego(child_snapshot, prev_child_key) {
    let iniciado = child_snapshot.val();

    if (iniciado == 1) {
      let pregunta = firebase.database().ref("/juegos/" + id + "/preguntaActual");
      pregunta.on('value', (snapshot) => {
        data = snapshot.val();
        if (dataanterior == null || data.pregunta != dataanterior.pregunta) {
          if (empezado == 0) {
            console.log(data);
            mostrarPregunta(data);
            mostrarTiempo(data);
            empezado = 1;
          } else {
            if (data.tipo == "si_no" && contestado == 0) {
              navigator.accelerometer.getCurrentAcceleration(accelerometerSuccess, accelerometerError);
            }
            mostrarTiempo(data);
          }
        }
      });
    }
    if (iniciado == 0 && empezado == 1) {
      mostrarResultados(data);
      empezado = 0;
      dataanterior = data;
    }
  }

  function mostrarTiempo(data) {
    document.querySelector('#respuesta_correcta').style.display = 'none';
    document.querySelector('#page_main').style.display = 'none';
    document.querySelector('#esperando').style.display = 'none';
    document.querySelector('#tiempo').style.display = 'block';
    const pregunta = document.querySelector('#tiempo');
    pregunta.innerHTML = "";
    let p = document.createElement('p');
    p.innerHTML += "<br></br>";
    p.innerHTML += "Tiempo Restante:  " + data.tiempo / 1000;
    p.innerHTML += "<br></br>";
    pregunta.appendChild(p);
  }

  function mostrarPregunta(data) {
    document.querySelector('#respuesta_registrada').style.display = 'none';
    document.querySelector('#respuesta_correcta').style.display = 'none';
    document.querySelector('#page_main').style.display = 'none';
    document.querySelector('#esperando').style.display = 'none';
    document.querySelector('#pregunta').style.display = 'block';
    const pregunta = document.querySelector('#pregunta');
    pregunta.innerHTML = "";
    let p = document.createElement('p');
    if (data.imagen != "") {
      p.innerHTML += "<img class=imagen src='" + data.imagen + "' />";
    }
    p.innerHTML += "<h4>Pregunta: </h4>" + data.pregunta;
    p.innerHTML += "<br></br>";
    p.innerHTML += "<h5>Puntos: </h5>" + data.puntos;
    p.innerHTML += "<br></br>";
    let punto = 0;
    if (data.tipo == "si_no") {
      p.innerHTML += "<button id='si' class='botones botona margen mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect' > SI </button>"
      p.innerHTML += "<button id='no' class='botones botonb margen mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effects' > NO </button>"
      p.innerHTML += "<br></br>";
      p.innerHTML += "<h6>Pulsa o Mueve el telefono hacia el lado correcto </h6>";
      navigator.accelerometer.getCurrentAcceleration(accelerometerSuccessInicial, accelerometerError);
      contestado = 0
    }


    if (data.tipo == "opciones") {
      p.innerHTML += "<button id='a' class='botones botona margen mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect' >" + data.opciones.opcion_a + "</button>"
      p.innerHTML += "<button id='b' class='botones botonb margen mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effects' >" + data.opciones.opcion_b + "</button>"



      p.innerHTML += "<br></br>";
      if (data.opciones.opcion_c != "") {
        p.innerHTML += "<button id='c' class='botones botonc margen mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effects' >" + data.opciones.opcion_c + "</button>"

      }

      if (data.opciones.opcion_d != "") {
        p.innerHTML += "<button id='d' class='botones margen botond mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effects' >" + data.opciones.opcion_d + "</button>"

      }

    }
    if (data.tipo == "abierta") {
      p.innerHTML += "<input type='text' id='abierta' name='question' required />";
      p.innerHTML += "<br></br>";
      p.innerHTML += "<button id='babierta' class='mdl-button margen mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent' > Enviar </button>"
      //  p.innerHTML += "<button id='grabarabierta' class='mdl-button margen mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent' > Grabar </button>"
      pregunta.appendChild(p);
      document.querySelector('#babierta').addEventListener('click', function() {
        document.querySelector('#pregunta').style.display = 'none';
        document.querySelector('#respuesta_registrada').style.display = 'block';
      });
      /*  document.querySelector('#grabarabierta').addEventListener('click', function() {
        let options = {
          String: "es-ES",
          Number: 5,
          String: "", // Android only
          Boolean: true, // Android only
          Boolean: false
        }
				window.plugins.speechRecognition.requestPermission(successCallback,errorCallback);
        window.plugins.speechRecognition.startListening(successCallback,  errorCallback,  options);
      });*/
    }
    /*function successCallback(array){
			alert(array);
		}

		function errorCallback() {
	    alert('onError!');
	  }*/

    pregunta.appendChild(p);
    var botones = document.querySelectorAll('.botones'); //obtenemos bootnes remove
    for (var i = 0; i < botones.length; i++) {
      botones[i].addEventListener('click', manejadorPuntos); //capturamos el evento click
    }


  }

  function manejadorPuntos(event) {
    puntos(event.target.id);
  }

  function puntos(id) {

    let punto = 0;
    contestado = 1;
    if (id == "si") {
      if (data.respuesta[0] == "si") {
        punto = parseInt(data.puntos, 10);
      }
    }
    if (id == "no") {
      if (data.respuesta[0] == "no") {
        punto = parseInt(data.puntos, 10);
      }
    }
    if (id == "a") {
      if (data.respuesta[0] == 0) {
        punto = parseInt(data.puntos, 10);
      }
    }
    if (id == "b") {
      if (data.respuesta[0] == 1) {
        punto = parseInt(data.puntos, 10);
      }
    }
    if (id == "c") {
      if (data.respuesta[0] == 2) {
        punto = parseInt(data.puntos, 10);
      }
    }
    if (id == "d") {
      if (data.respuesta[0] == 3) {
        punto = parseInt(data.puntos, 10);
      }
    }

    document.querySelector('#respuesta_registrada').style.display = 'block';
    document.querySelector('#pregunta').style.display = 'none';
    firebase.database().ref("/juegos/" + data.juego + "/resultados/" + user.uid).once('value').then((snapshot) => {
      username = snapshot.val();
      punto += parseInt(username.puntos, 10);
      firebase.database().ref("/juegos/" + data.juego + "/resultados/" + user.uid).update({
        email: user.email,
        puntos: punto
      });
    });

  }


  function mostrarResultados(doc) {
    document.querySelector('#respuesta_registrada').style.display = 'none';
    document.querySelector('#pregunta').style.display = 'none';
    document.querySelector('#tiempo').style.display = 'none';
    document.querySelector('#respuesta_correcta').style.display = 'block';
    let respuesta = doc.respuesta[0];

    if (doc.tipo == "opciones") {
      if (doc.respuesta[0] == 0) {
        respuesta = doc.opciones.opcion_a;
      }
      if (doc.respuesta[0] == 1) {
        respuesta = doc.opciones.opcion_b;
      }
      if (doc.respuesta[0] == 2) {
        respuesta = doc.opciones.opcion_c
      }
      if (doc.respuesta[0] == 3) {
        respuesta = doc.opciones.opcion_d;
      }
    }
    let respuesta_correcta = document.querySelector('#respuesta_correcta');
    respuesta_correcta.innerHTML = "";
    let parrafo = document.createElement("p");
    parrafo.innerHTML += "<br></br>";
    parrafo.innerHTML += "<br></br>";
    parrafo.innerHTML += "<br></br>";
    if (doc.tipo != "abierta") {
      parrafo.innerHTML += "RESPUESTA CORRECTA:   ";
      parrafo.innerHTML += "<h4>" + respuesta + "</h4>";
    }
    parrafo.innerHTML += "<br></br>";
    parrafo.innerHTML += "PUNTUACIÓN";
    parrafo.innerHTML += "<br></br>";
    let resultados = db.ref("/juegos/" + doc.juego + "/resultados");
    resultados.once("value").then(function(querySnapshot) {
      querySnapshot.forEach(function(doc) {
        let puntos = doc.val();
        parrafo.innerHTML += puntos.email + " ----- " + puntos.puntos + " puntos";
        parrafo.innerHTML += "<br></br>";
      });
    });
    respuesta_correcta.appendChild(parrafo);
  }

  function accelerometerSuccessInicial(acceleration) {
    x = acceleration.x;
  }


  function accelerometerSuccess(acceleration) {
    let answer = "";
    if (contestado == 0) {
      if ((acceleration.x - x) > 5) {
        answer = "si";
        puntos(answer);
      }
      if ((acceleration.x + x) > 5) {
        answer = "no";
        puntos(answer);
      }
    }
  }

  function accelerometerError() {
    alert('onError!');
  }


  function getRedirectResult() {
    firebase.auth().getRedirectResult().then((result) => {
      if (result.credential) {
        document.querySelector('#page_login').style.display = 'none';
        document.querySelector('#page_main').style.display = 'block';
        user = result.user;
        db = firebase.database();
        let root_ref = db.ref();

        refmod = user.email.split("@");
        if (refmod[1] == "alumnos.uc3m.es") {
          const imagen = document.querySelector('#encabezado');
          imagen.innerHTML += "<img class='fotoperfil' src='" + user.photoURL + "' />";
          const nombre = document.querySelector('#header');
          nombre.innerHTML += "<span class='mdl-layout-title'>" + user.displayName + "</span>";

          firebase.database().ref("/alumnos/" + user.uid).once('value').then((snapshot) => {
            var userinfo = snapshot.val();
            if (userinfo == null) {
              firebase.database().ref("/alumnos/" + user.uid).set({
                name: user.email,
                juego: ""
              });
            } else {
              if (userinfo.juego != "") {
                firebase.database().ref("/juegos/" + userinfo.juego + "/finalizado").once('value').then((snapshot) => {
                  var estado = snapshot.val();
                  if (estado.finalizado == 0) {
                    console.log("comprobamos estado");
                    let root_ref = db.ref("/juegos/" + userinfo.juego + "/estado");
                    root_ref.on('child_changed', iniciar_juego);
                    let final = db.ref("/juegos/" + userinfo.juego + "/finalizado");
                    final.on('child_changed', com_finalizado);
                    id= userinfo.juego;
                    document.querySelector('#page_main').style.display = 'none';
                    document.querySelector('#esperando').style.display = 'block';
                  }
                });
              }
            }
          });
        } else {
          document.querySelector('#page_login').style.display = 'block';
          document.querySelector('#page_main').style.display = 'none';
        }
      }
    }).catch((error) => {
      console.log(error);
    });
  }
});
