// @ts-nocheck
// gatos.js
var GATOS = [
    { nombre: 'Felipe', raza: 'Siamés', img: 'img/felipe.png' },
    { nombre: 'Pelusa', raza: 'Angora', img: 'img/pelusa.png' },
    { nombre: 'Garfield', raza: 'Angora', img: 'img/garfield.png' },
    { nombre: 'Linda', raza: 'Persa', img: 'img/linda.png' },
    { nombre: 'Luciana', raza: 'Mestizo', img: 'img/luciana.png' },
    { nombre: 'Minnie', raza: 'Mestizo', img: 'img/minnie.png' },
    { nombre: 'Sorbete', raza: 'Mestizo', img: 'img/sorbete.png' },
    { nombre: 'Kimby', raza: 'Persa', img: 'img/kimby.png' },
    { nombre: 'Rubén', raza: 'Mestizo', img: 'img/Rúben.png' },
    { nombre: 'Panchito', raza: 'Mestizo', img: 'img/panchito.png' },
    { nombre: 'Pantalones', raza: 'Mestizo', img: 'img/pantalones.png' },
    { nombre: 'Linda', raza: 'Siamés', img: 'img/linda.png' },
    { nombre: 'Capuchino', raza: 'Siamés', img: 'img/capuchino.png' },
    { nombre: 'Despeinado', raza: 'Angora', img: 'img/despeinado.png' },
    { nombre: 'Mishi', raza: 'Angora', img: 'img/mishi.png' },
    { nombre: 'Mandarino', raza: 'Mestizo', img: 'img/mandarino.png' }
];

var estado = { texto: '', raza: 'todas' };
var favoritos = [];

function normalizar(t) {
    return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function escapar(t) {
    var d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

function idGato(g) { return normalizar(g.nombre) + '-' + normalizar(g.raza); }

function cargarFavoritos() {
    try { favoritos = JSON.parse(localStorage.getItem('gatosFavoritos')) || []; }
    catch (e) { favoritos = []; }
}

function guardarFavoritos() {
    try { localStorage.setItem('gatosFavoritos', JSON.stringify(favoritos)); } catch (e) { }
}
function crearTarjetas() {
    var grid = document.getElementById('grid');
    var html = '';

    GATOS.forEach(function (g, i) {
        var id = idGato(g);
        var esFav = favoritos.indexOf(id) !== -1;
        html +=
            '<article class="cat-card" style="--i:' + Math.min(i, 14) + '"' +
            ' data-id="' + id + '"' +
            ' data-nombre="' + escapar(normalizar(g.nombre)) + '"' +
            ' data-raza="' + escapar(normalizar(g.raza)) + '">' +
            '<button type="button" class="fav' + (esFav ? ' activo' : '') + '" aria-label="Marcar como favorito" title="Favorito">' +
            '<i class="fa-' + (esFav ? 'solid' : 'regular') + ' fa-heart"></i></button>' +
            '<div class="cat-image-wrapper"><img src="' + escapar(g.img) + '" alt="' + escapar(g.nombre) + '" loading="lazy"></div>' +
            '<div class="cat-info">' +
            '<span class="badge"><i class="fa-solid fa-paw"></i>' + escapar(g.raza) + '</span>' +
            '<h3>' + escapar(g.nombre) + '</h3>' +
            '</div>' +
            '<a href="adopcion.html?gato=' + encodeURIComponent(g.nombre) + '" class="btn-adopt">' +
            '<i class="fa-solid fa-heart"></i> Adoptar</a>' +
            '</article>';
    });

    grid.innerHTML = html;
}
function crearFiltros() {
    var razas = [];
    GATOS.forEach(function (g) { if (razas.indexOf(g.raza) === -1) razas.push(g.raza); });

    var html = '<button type="button" class="chip activo" data-raza="todas"><i class="fa-solid fa-border-all"></i> Todos</button>';
    razas.forEach(function (r) {
        html += '<button type="button" class="chip" data-raza="' + escapar(normalizar(r)) + '">' + escapar(r) + '</button>';
    });
    html += '<button type="button" class="chip" data-raza="favoritos"><i class="fa-solid fa-heart"></i> Favoritos</button>';
    html += '<span class="contador" id="contador"></span>';

    document.getElementById('filtros').innerHTML = html;
}
function filtrarGatos() {
    var inputElem = document.getElementById('searchInput');
    if (!inputElem) return;

    estado.texto = normalizar(inputElem.value);
    document.getElementById('btnLimpiar').classList.toggle('visible', inputElem.value.length > 0);

    var cards = document.querySelectorAll('.cat-card');
    var visibles = 0;

    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var nombre = card.getAttribute('data-nombre') || '';
        var raza = card.getAttribute('data-raza') || '';
        var id = card.getAttribute('data-id');

        var coincideTexto = nombre.indexOf(estado.texto) !== -1 || raza.indexOf(estado.texto) !== -1;
        var coincideRaza = estado.raza === 'todas' ||
            (estado.raza === 'favoritos' ? favoritos.indexOf(id) !== -1 : raza === estado.raza);

        if (coincideTexto && coincideRaza) {
            card.style.display = 'flex';
            visibles++;
        } else {
            card.style.display = 'none';
        }
    }

    document.getElementById('contador').innerHTML =
        'Mostrando <b>' + visibles + '</b> de <b>' + cards.length + '</b> gatitos';

    var vacio = document.getElementById('vacio');
    vacio.classList.toggle('visible', visibles === 0);
    if (visibles === 0 && estado.raza === 'favoritos' && !estado.texto) {
        vacio.querySelector('h3').textContent = 'Aún no tienes favoritos';
        vacio.querySelector('p').textContent = 'Toca el corazón de un gatito para guardarlo aquí.';
    } else {
        vacio.querySelector('h3').textContent = 'No encontramos ese gatito';
        vacio.querySelector('p').textContent = 'Prueba con otro nombre o raza, o quita los filtros.';
    }
}

function seleccionarRaza(raza) {
    estado.raza = raza;
    var chips = document.querySelectorAll('#filtros .chip');
    for (var i = 0; i < chips.length; i++) {
        chips[i].classList.toggle('activo', chips[i].getAttribute('data-raza') === raza);
    }
    filtrarGatos();
}

function reiniciar() {
    document.getElementById('searchInput').value = '';
    seleccionarRaza('todas');
}
document.addEventListener('DOMContentLoaded', function () {
    cargarFavoritos();
    crearTarjetas();
    crearFiltros();

    var buscador = document.getElementById('searchInput');
    buscador.addEventListener('input', filtrarGatos);
    buscador.addEventListener('keyup', filtrarGatos);

    document.getElementById('btnLimpiar').addEventListener('click', function () {
        buscador.value = '';
        filtrarGatos();
        buscador.focus();
    });

    document.getElementById('btnReset').addEventListener('click', reiniciar);
    document.getElementById('filtros').addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (chip) seleccionarRaza(chip.getAttribute('data-raza'));
    });
    document.getElementById('grid').addEventListener('click', function (e) {
        var boton = e.target.closest('.fav');
        if (!boton) return;

        var card = boton.closest('.cat-card');
        var id = card.getAttribute('data-id');
        var pos = favoritos.indexOf(id);
        var activo = pos === -1;

        if (activo) favoritos.push(id); else favoritos.splice(pos, 1);
        guardarFavoritos();

        boton.classList.toggle('activo', activo);
        boton.querySelector('i').className = 'fa-' + (activo ? 'solid' : 'regular') + ' fa-heart';

        if (estado.raza === 'favoritos') filtrarGatos();
    });
    document.getElementById('grid').addEventListener('error', function (e) {
        if (e.target.tagName !== 'IMG') return;
        var marco = e.target.parentNode;
        marco.innerHTML = '<i class="fa-solid fa-paw sin-foto"></i>';
    }, true);
    document.getElementById('navToggle').addEventListener('click', function () {
        document.getElementById('navMenu').classList.toggle('abierto');
    });

    filtrarGatos();
});