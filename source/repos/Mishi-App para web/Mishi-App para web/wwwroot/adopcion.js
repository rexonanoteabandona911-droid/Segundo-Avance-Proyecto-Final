// @ts-nocheck
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('frmAdopcion');
    var selUsuario = document.getElementById('adopcionUsuario');
    var selGato = document.getElementById('adopcionGato');
    var inFecha = document.getElementById('adopcionFecha');
    var inObs = document.getElementById('adopcionObs');
    var btn = document.getElementById('btnGuardar');
    var btnTexto = document.getElementById('btnTexto');
    var overlay = document.getElementById('overlay');
    var modal = document.getElementById('modal');
    var resumen = document.getElementById('resumen');

    var ICONO_OK = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>';
    var ICONO_ERR = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    function ir(url) { window.location.href = url; }

    function hoy() {
        var d = new Date();
        var mes = ('0' + (d.getMonth() + 1)).slice(-2);
        var dia = ('0' + d.getDate()).slice(-2);
        return d.getFullYear() + '-' + mes + '-' + dia;
    }

    function setCargando(si) {
        btn.disabled = si;
        btn.classList.toggle('cargando', si);
        btnTexto.textContent = si ? 'Guardando...' : 'Guardar adopción';
    }

    function marcar(idCampo, invalido) {
        var c = document.getElementById(idCampo);
        if (c) {
            c.classList.remove('invalido');
            if (invalido) { void c.offsetWidth; c.classList.add('invalido'); }
        }
    }

    function formatearFecha(iso) {
        if (!iso) return '';
        var p = iso.split('-');
        return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
    }

    function escapar(t) {
        var d = document.createElement('div');
        d.textContent = t;
        return d.innerHTML;
    }

    function textoElegido(sel) {
        var op = sel.options[sel.selectedIndex];
        return sel.value && op ? op.textContent : '';
    }

    function cerrarModal() { overlay.classList.remove('abierto'); }

    function abrirModal(tipo, titulo, texto, botones) {
        modal.className = 'modal ' + tipo;
        document.getElementById('modalIcono').innerHTML = tipo === 'ok' ? ICONO_OK : ICONO_ERR;
        document.getElementById('modalTitulo').textContent = titulo;
        document.getElementById('modalTexto').textContent = texto;

        var cont = document.getElementById('modalBotones');
        cont.innerHTML = '';
        botones.forEach(function (b) {
            var el = document.createElement('button');
            el.type = 'button';
            el.textContent = b.texto;
            if (b.principal) el.className = 'principal';
            el.addEventListener('click', b.accion);
            cont.appendChild(el);
        });

        overlay.classList.add('abierto');
        var primero = cont.querySelector('button.principal') || cont.querySelector('button');
        if (primero) primero.focus();
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('abierto')) cerrarModal();
    });

    var navToggle = document.getElementById('navToggle');
    if (navToggle) {
        navToggle.addEventListener('click', function () {
            document.getElementById('navMenu').classList.toggle('abierto');
        });
    }

    var avatar = document.getElementById('avatar');
    if (avatar) {
        avatar.addEventListener('click', function () {
            avatar.classList.remove('ronronea'); void avatar.offsetWidth; avatar.classList.add('ronronea');
        });
    }

    if (!inFecha.value) inFecha.value = hoy();

    function actualizarResumen() {
        var u = textoElegido(selUsuario);
        var g = textoElegido(selGato);
        var f = inFecha.value;
        if (u && g && f) {
            document.getElementById('resumenTxt').innerHTML =
                '<b>' + escapar(u) + '</b> adoptará a <b>' + escapar(g) + '</b> el ' + formatearFecha(f) + '.';
            resumen.classList.add('visible');
        } else {
            resumen.classList.remove('visible');
        }
    }

    function llenar(sel, lista, textoVacio) {
        sel.innerHTML = '';
        var vacia = document.createElement('option');
        vacia.value = '';
        vacia.textContent = lista.length ? textoVacio : 'No hay opciones disponibles';
        sel.appendChild(vacia);
        lista.forEach(function (x) {
            var op = document.createElement('option');
            op.value = x.id;
            op.textContent = x.nombre;
            sel.appendChild(op);
        });
    }

    // Usuario con sesión iniciada (lo guarda el Login)
    function usuarioSesion() {
        try {
            var u = JSON.parse(localStorage.getItem('usuario'));
            return u ? (u.id || u.Id) : null;
        } catch (e) { return null; }
    }

    function cargarOpciones() {
        selUsuario.innerHTML = '<option value="">Cargando...</option>';
        selGato.innerHTML = '<option value="">Cargando...</option>';

        return fetch('/api/adopciones/opciones')
            .then(function (resp) {
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                return resp.json();
            })
            .then(function (data) {
                llenar(selUsuario, data.usuarios || [], 'Selecciona tu nombre');
                llenar(selGato, data.gatos || [], 'Selecciona un gatito');

                // Preselecciona al usuario que inició sesión
                var idSesion = usuarioSesion();
                if (idSesion) selUsuario.value = idSesion;

                // Preselecciona el gato si viene del catálogo: adopcion.html?gato=ID
                var gatoParam = new URLSearchParams(window.location.search).get('gato');
                if (gatoParam) selGato.value = gatoParam;

                actualizarResumen();
            })
            .catch(function () {
                selUsuario.innerHTML = '<option value="">No se pudo conectar con el servidor</option>';
                selGato.innerHTML = '<option value="">No se pudo conectar con el servidor</option>';
            });
    }

    cargarOpciones();

    selUsuario.addEventListener('change', function () { marcar('campoUsuario', false); actualizarResumen(); });
    selGato.addEventListener('change', function () { marcar('campoGato', false); actualizarResumen(); });
    inFecha.addEventListener('input', function () { marcar('campoFecha', false); actualizarResumen(); });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var idUsuario = parseInt(selUsuario.value, 10);
        var idGato = parseInt(selGato.value, 10);
        var fechaAdopcion = inFecha.value;

        marcar('campoUsuario', !idUsuario);
        marcar('campoGato', !idGato);
        marcar('campoFecha', !fechaAdopcion);
        if (!idUsuario || !idGato || !fechaAdopcion) return;

        var nombreAdoptante = textoElegido(selUsuario);
        var nombreGato = textoElegido(selGato);

        var nuevaAdopcion = {
            id_usuario: idUsuario,
            id_gato: idGato,
            fechaAdopcion: fechaAdopcion,
            observaciones: inObs.value.trim()
        };

        setCargando(true);

        fetch('/api/adopciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevaAdopcion)
        })
            .then(function (resp) {
                return resp.json().catch(function () { return {}; }).then(function (j) {
                    if (resp.ok) {
                        abrirModal('ok', '¡Adopción registrada!',
                            nombreGato + ' ya tiene un hogar con ' + nombreAdoptante + '. La adopción se guardó correctamente.',
                            [
                                {
                                    texto: 'Registrar otra',
                                    accion: function () {
                                        inObs.value = '';
                                        inFecha.value = hoy();
                                        cerrarModal();
                                        cargarOpciones();
                                    }
                                },
                                { texto: 'Ir al catálogo', principal: true, accion: function () { ir('gatos.html'); } }
                            ]);
                    } else {
                        abrirModal('error', 'No se pudo registrar',
                            j.mensaje || 'Revisa los datos e inténtalo de nuevo.',
                            [{ texto: 'Cerrar', principal: true, accion: cerrarModal }]);
                    }
                });
            })
            .catch(function () {
                abrirModal('error', 'Sin conexión',
                    'No se pudo conectar con el servidor. Verifica que la API esté en ejecución e inténtalo de nuevo.',
                    [{ texto: 'Cerrar', principal: true, accion: cerrarModal }]);
            })
            .then(function () { setCargando(false); });
    });
});