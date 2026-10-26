// @ts-nocheck
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('frmPerfil');
    var inId = document.getElementById('perfilId');
    var inNombre = document.getElementById('perfilNombre');
    var inCorreo = document.getElementById('perfilCorreo');
    var inTelefono = document.getElementById('perfilTelefono');
    var inClave = document.getElementById('perfilClave');
    var inClaveActual = document.getElementById('perfilClaveActual');
    var verClave = document.getElementById('verClave');
    var btn = document.getElementById('btnGuardar');
    var btnTexto = document.getElementById('btnTexto');
    var overlay = document.getElementById('overlay');
    var modal = document.getElementById('modal');
    var estado = document.getElementById('estado');

    var ICONO_OK = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>';
    var ICONO_ERR = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    function ir(url) { window.location.href = url; }

    function leerUsuario() {
        try { return JSON.parse(localStorage.getItem('usuario')) || null; }
        catch (e) { return null; }
    }

    function setEstado(clase, texto) {
        estado.className = 'estado ' + clase;
        document.getElementById('estadoTxt').textContent = texto;
    }

    function setCargando(si, texto) {
        btn.disabled = si;
        btn.classList.toggle('cargando', si);
        btnTexto.textContent = si ? texto : 'Guardar cambios';
    }

    function marcar(idCampo, invalido) {
        var c = document.getElementById(idCampo);
        c.classList.remove('invalido');
        if (invalido) { void c.offsetWidth; c.classList.add('invalido'); }
    }

    function cerrarSesion() {
        try { localStorage.removeItem('usuario'); } catch (e) { }
        ir('Login.html');
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

    document.getElementById('navToggle').addEventListener('click', function () {
        document.getElementById('navMenu').classList.toggle('abierto');
    });

    verClave.addEventListener('change', function () {
        var ver = verClave.checked;
        inClave.type = ver ? 'text' : 'password';
        inClaveActual.type = ver ? 'text' : 'password';
        document.getElementById('iconoOjo').className = ver ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        document.getElementById('txtOjo').textContent = ver ? 'Ocultar contraseña' : 'Mostrar contraseña';
    });

    var avatar = document.getElementById('avatar');
    avatar.addEventListener('click', function () {
        avatar.classList.remove('ronronea'); void avatar.offsetWidth; avatar.classList.add('ronronea');
    });

    document.getElementById('btnSalir').addEventListener('click', cerrarSesion);
    document.getElementById('menuSalir').addEventListener('click', function (e) {
        e.preventDefault();
        cerrarSesion();
    });

    inNombre.addEventListener('input', function () { marcar('campoNombre', false); });
    inCorreo.addEventListener('input', function () { marcar('campoCorreo', false); });
    inClaveActual.addEventListener('input', function () { marcar('campoClaveActual', false); });

    var usuario = leerUsuario();
    if (!usuario || !(usuario.id || usuario.Id)) { ir('Login.html'); return; }
    var id = usuario.id || usuario.Id;
    inId.value = id;

    var nombreGuardado = usuario.nombre || usuario.Nombre;
    if (nombreGuardado) document.getElementById('titulo').textContent = 'Hola, ' + nombreGuardado;

    setCargando(true, 'Cargando...');
    fetch('/api/usuarios/' + id)
        .then(function (resp) { return resp.ok ? resp.json() : null; })
        .then(function (data) {
            if (data) {
                inNombre.value = data.nombre || '';
                inCorreo.value = data.correo || '';
                inTelefono.value = data.telefono || '';
                document.getElementById('rol').textContent = data.rol || '';
                setEstado('listo', 'Perfil cargado');
            } else {
                setEstado('nuevo', 'No se pudo cargar tu perfil');
            }
        })
        .catch(function () { setEstado('nuevo', 'Sin conexión con el servidor'); })
        .then(function () { setCargando(false); });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var nombre = inNombre.value.trim();
        var correo = inCorreo.value.trim();
        var claveNueva = inClave.value.trim();
        var claveActual = inClaveActual.value.trim();

        var nombreMal = !nombre;
        var correoMal = !correo || correo.indexOf('@') < 1;
        var actualMal = claveNueva !== '' && claveActual === '';
        marcar('campoNombre', nombreMal);
        marcar('campoCorreo', correoMal);
        marcar('campoClaveActual', actualMal);
        if (nombreMal || correoMal || actualMal) return;

        var datos = {
            nombre: nombre,
            correo: correo,
            telefono: inTelefono.value.trim(),
            claveActual: claveActual,
            claveNueva: claveNueva
        };

        setCargando(true, 'Guardando...');

        fetch('/api/usuarios/' + id + '/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        })
            .then(function (resp) {
                return resp.json().catch(function () { return {}; }).then(function (j) {
                    if (resp.ok) {
                        var actual = leerUsuario() || {};
                        actual.nombre = actual.Nombre = nombre;
                        actual.correo = actual.Correo = correo;
                        actual.telefono = datos.telefono;
                        try { localStorage.setItem('usuario', JSON.stringify(actual)); } catch (x) { }

                        document.getElementById('titulo').textContent = 'Hola, ' + nombre;
                        inClave.value = '';
                        inClaveActual.value = '';
                        setEstado('listo', 'Cambios guardados');
                        abrirModal('ok', '¡Cambios guardados!', 'Tu perfil se actualizó correctamente.', [
                            { texto: 'Seguir aquí', accion: cerrarModal },
                            { texto: 'Ir al catálogo', principal: true, accion: function () { ir('gatos.html'); } }
                        ]);
                    } else {
                        abrirModal('error', 'No se pudo guardar',
                            j.mensaje || 'Revisa tus datos e inténtalo de nuevo.',
                            [{ texto: 'Cerrar', principal: true, accion: cerrarModal }]);
                    }
                });
            })
            .catch(function () {
                abrirModal('error', 'Sin conexión',
                    'No se pudo conectar con el servidor. Verifica que la API esté en ejecución.',
                    [{ texto: 'Cerrar', principal: true, accion: cerrarModal }]);
            })
            .then(function () { setCargando(false); });
    });
});