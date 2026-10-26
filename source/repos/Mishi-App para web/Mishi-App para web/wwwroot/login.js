// @ts-nocheck
// login.js
window.addEventListener('load', function () {
    var form = document.getElementById('frmLogin');
    var inCorreo = document.getElementById('correo');
    var inClave = document.getElementById('clave');
    var verClave = document.getElementById('verClave');
    var btn = document.getElementById('btn');
    var btnTexto = document.getElementById('btnTexto');
    var overlay = document.getElementById('overlay');
    var modal = document.getElementById('modal');
    var timer = null;

    var ICONO_OK = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>';
    var ICONO_ERR = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';

    var navToggle = document.getElementById('navToggle');
    if (navToggle) {
        navToggle.addEventListener('click', function () {
            document.getElementById('navMenu').classList.toggle('abierto');
        });
    }
    if (verClave) {
        verClave.addEventListener('change', function () {
            var ver = verClave.checked;
            inClave.type = ver ? 'text' : 'password';
            document.getElementById('iconoOjo').className = ver ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
            document.getElementById('txtOjo').textContent = ver ? 'Ocultar contraseña' : 'Mostrar contraseña';
        });
    }
    function ir(url) { window.location.href = url; }

    function setCargando(si) {
        btn.disabled = si;
        btn.classList.toggle('cargando', si);
        btnTexto.textContent = si ? 'Verificando...' : 'Entrar';
    }

    function cerrarModal() {
        overlay.classList.remove('abierto');
        clearTimeout(timer);
        setCargando(false);
    }

    function abrirModal(tipo, titulo, texto, botones, conBarra) {
        modal.className = 'modal ' + tipo;
        document.getElementById('modalIcono').innerHTML = tipo === 'ok' ? ICONO_OK : ICONO_ERR;
        document.getElementById('modalTitulo').textContent = titulo;
        document.getElementById('modalTexto').textContent = texto;
        modal.querySelector('.barra').style.display = conBarra ? 'block' : 'none';

        // reinicia la animación de la barra
        var barra = modal.querySelector('.barra i');
        barra.style.animation = 'none';
        void barra.offsetWidth;
        barra.style.animation = '';

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

    // ---------- Validación visual ----------
    function marcar(idCampo, invalido) {
        var c = document.getElementById(idCampo);
        c.classList.remove('invalido');
        if (invalido) { void c.offsetWidth; c.classList.add('invalido'); }
    }
    inCorreo.addEventListener('input', function () { marcar('campoCorreo', false); });
    inClave.addEventListener('input', function () { marcar('campoClave', false); });

    // ---------- Envío del formulario ----------
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var correo = inCorreo.value.trim();
            var clave = inClave.value;

            var correoMal = !correo || correo.indexOf('@') < 1;
            var claveMal = !clave;
            marcar('campoCorreo', correoMal);
            marcar('campoClave', claveMal);
            if (correoMal || claveMal) return;

            setCargando(true);

            fetch('/api/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo: correo, clave: clave })
            })
                .then(function (resp) {
                    // ===== USUARIO NO ENCONTRADO → PERFIL =====
                    if (!resp.ok) {
                        abrirModal('error', 'Usuario no encontrado',
                            'No encontramos una cuenta con esos datos. Te llevamos al perfil...',
                            [
                                { texto: 'Reintentar', accion: cerrarModal },
                                { texto: 'Ir al perfil', principal: true, accion: function () { ir('perfil.html'); } }
                            ], true);
                        timer = setTimeout(function () { ir('perfil.html'); }, 2200);
                        return;
                    }

                    // ===== USUARIO ENCONTRADO → CATÁLOGO =====
                    return resp.json().then(function (usuario) {
                        try { localStorage.setItem('usuario', JSON.stringify(usuario)); } catch (x) { }

                        abrirModal('ok', 'Usuario encontrado',
                            '¡Bienvenido a Mishi! Te llevamos al catálogo...',
                            [{ texto: 'Ir al catálogo', principal: true, accion: function () { ir('gatos.html'); } }], true);
                        timer = setTimeout(function () { ir('gatos.html'); }, 2200);
                    });
                })
                .catch(function () {
                    abrirModal('error', 'Sin conexión',
                        'No se pudo conectar con el servidor. Verifica que la API esté en ejecución e inténtalo de nuevo.',
                        [{ texto: 'Cerrar', principal: true, accion: cerrarModal }], false);
                });
        });
    }
});