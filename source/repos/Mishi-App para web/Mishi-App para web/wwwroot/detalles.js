// @ts-nocheck
document.addEventListener('DOMContentLoaded', function () {
    var urlParams = new URLSearchParams(window.location.search);
    var nombreGato = urlParams.get('gato') || 'Felipe';
    var baseDatosGatos = {
        "Felipe": {
            raza: "Siamés",
            imagen: "",
            personalidad: "Muy cariñoso, le encanta la compañía humana, es sumamente curioso y le gusta jugar con juguetes interactivos.",
            vacunas: ["Triple Felina (Al día)", "Rabia (Aplicada)", "Desparasitado interna y externa"]
        },
        "Pelusa": {
            raza: "Angora",
            imagen: "",
            personalidad: "Tranquila, hogareña, disfruta de las siestas largas bajo el sol y es ideal para departamentos u hogares calmados.",
            vacunas: ["Triple Felina", "Rabia", "Control de pulgas y garrapatas"]
        },
        "Garfield": {
            raza: "Angora",
            imagen: "",
            personalidad: "Divertido, comelón, amigable con otros animales y muy relajado ante la presencia de visitas.",
            vacunas: ["Triple Felina (Al día)", "Rabia", "Desparasitación completa"]
        },
        "Linda": {
            raza: "Persa",
            imagen: "",
            personalidad: "Elegante, noble, un poco tímida al principio pero extremadamente leal y dulce con su dueña.",
            vacunas: ["Triple Felina", "Leucemia Felina", "Rabia"]
        },
        "Rubén": {
            raza: "Mestizo",
            imagen: "",
            personalidad: "Muy activo, juguetón, le fascina correr por la casa y escalar rascadores altos.",
            vacunas: ["Triple Felina", "Rabia"]
        },
        "Panchito": {
            raza: "Mestizo",
            imagen: "",
            personalidad: "Alegre, protector, sociable y siempre recibe a las personas con un tierno maullido.",
            vacunas: ["Triple Felina (Al día)", "Desparasitado"]
        },
        "Pantalones": {
            raza: "Mestizo",
            imagen: "",
            personalidad: "Dormilón, tierno, busca caricias constantemente y se acurruca por las noches.",
            vacunas: ["Triple Felina", "Rabia"]
        },
        "Capuchino": {
            raza: "Siamés",
            imagen: "",
            personalidad: "Inteligente, observador, vocaliza cuando quiere atención y aprende rápido dónde usar su arenero.",
            vacunas: ["Triple Felina", "Rabia", "Desparasitación completa"]
        },
        "Despeinado": {
            raza: "Angora",
            imagen: "",
            personalidad: "Aventurero, travieso, con una melena única y gran energía para jugar todo el día.",
            vacunas: ["Triple Felina", "Rabia"]
        },
        "Mishi": {
            raza: "Angora",
            imagen: "",
            personalidad: "Dulce, hogareña, rescatada con mucho amor y lista para dar afecto incondicional.",
            vacunas: ["Triple Felina (Al día)", "Rabia", "Desparasitación y vitaminas"]
        },
        "Mandarino": {
            raza: "Mestizo",
            imagen: "",
            personalidad: "Vibrante, carismático, color naranja brillante y un temperamento muy alegre.",
            vacunas: ["Triple Felina", "Rabia"]
        }
    };
    var info = baseDatosGatos[nombreGato] || {
        raza: "Mestizo Rescatado",
        imagen: "",
        personalidad: "Muy amigable, sociable y preparado para formar parte de un nuevo hogar.",
        vacunas: ["Triple Felina", "Rabia"]
    };
    document.getElementById('catName').innerText = nombreGato;
    document.getElementById('catBreed').innerText = "Raza: " + info.raza;
    document.getElementById('catImg').src = info.imagen;
    document.getElementById('catPersonality').innerText = info.personalidad;
    document.getElementById('btnAdoptarLink').href = "adopcion.html?gato=" + encodeURIComponent(nombreGato);
    var listaVacunas = document.getElementById('catVaccines');
    listaVacunas.innerHTML = "";
    info.vacunas.forEach(function (vacuna) {
        var li = document.createElement('li');
        li.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + vacuna;
        listaVacunas.appendChild(li);
    });
});