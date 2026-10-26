// @ts-nocheck
// gestion-usuarios.js
document.addEventListener('DOMContentLoaded', function () {

    var RUTAS = ['/api/usuarios', '/api/usuariosperfil'];
    var API = null;

    var $ = function (id) { return document.getElementById(id); };

    var txtId = $('txtId'), txtNombre = $('txtNombre'), txtCorreo = $('txtCorreo'),
        txtTelefono = $('txtTelefono'), txtClave = $('txtClave'), txtRol = $('txtRol');
    var btnAgregar = $('btnAgregar'), btnModificar = $('btnModificar'),
        btnEliminar = $('btnEliminar'), btnLimpiar = $('btnLimpiar');
    var tbody = $('tbodyUsuarios'), txtBuscar = $('txtBuscar'), btnX = $('btnBorrarBusqueda');

    var lista = [];
    var filtroActual = 'todos';
    var seleccionado = null;
    var GRUPOS = ['grpNombre', 'grpCorreo', 'grpTelefono', 'grpClave'];

    function escapar(t) {
        var d = document.createElement('div');
        d.textContent = t == null ? '' : t;
        return d.innerHTML;
    }

    function normalizar(t) {
        return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }
    function tomar(u, claves) {
        for (var i = 0; i < claves.length; i++) {
            if (u[claves[i]] !== undefined && u[claves[i]] !== null) return u[claves[i]];
        }
        return '';
    }

    function normalizarUsuario(u) {
        return {
            id: tomar(u, ['id', 'Id', 'ID']),
            nombre: tomar(u, ['nombreCompleto', 'NombreCompleto', 'nombre', 'Nombre']),
            correo: tomar(u, ['correo', 'Correo']),
            telefono: tomar(u, ['telefono', 'Telefono']),
            rol: tomar(u, ['rol', 'Rol']) || 'Adoptante'
        };
    }
    async function llamar(metodo, url, cuerpo) {
        var op = { method: metodo, headers: {} };
        if (cuerpo !== undefined) {
            op.headers['Content-Type'] = 'application/json';
            op.body = JSON.stringify(cuerpo);
        }
        var r = await fetch(url, op);
        var texto = await r.text();
        var datos = null;
        try { datos = texto ? JSON.parse(texto) : null; } catch (e) { }
        return { ok: r.ok, status: r.status, datos: datos, texto: texto };
    }

    function mensajeError(r) {
        var d = r.datos;
        if (d) {
            if (typeof d === 'string') return d;
            if (d.mensaje) return d.mensaje;
            if (d.message) return d.message;
            if (d.detail) return d.detail;
            if (d.errors) {
                var m = [];
                Object.keys(d.errors).forEach(function (k) { m.push([].concat(d.errors[k]).join(' ')); });
                if (m.length) return m.join(' ');
            }
            if (d.title) return d.title + ' (error ' + r.status + ')';
        }
        if (r.texto && r.texto.length < 300 && r.texto.charAt(0) !== '<') return r.texto;
        return 'El servidor respondió con el error ' + r.status + '.';
    }
    var ICONOS = { ok: 'fa-circle-check', error: 'fa-circle-xmark', warn: 'fa-triangle-exclamation' };

    function cerrarModal() { $('modalOverlay').classList.remove('abierto'); }

    function mostrarModal(tipo, titulo, mensaje, botones) {
        $('modalCaja').className = 'modal ' + tipo;
        $('modalIcono').className = 'fa-solid ' + ICONOS[tipo];
        $('modalTitulo').textContent = titulo;
        $('modalMensaje').textContent = mensaje;

        var cont = $('modalBotones');
        cont.innerHTML = '';
        (botones || [{ texto: 'Aceptar', clase: 'principal', accion: cerrarModal }]).forEach(function (b) {
            var el = document.createElement('button');
            el.type = 'button';
            el.textContent = b.texto;
            if (b.clase) el.className = b.clase;
            el.addEventListener('click', b.accion);
            cont.appendChild(el);
        });

        $('modalOverlay').classList.add('abierto');
        var primero = cont.querySelector('button.principal') || cont.querySelector('button.peligro') || cont.querySelector('button');
        if (primero) primero.focus();
    }

    function falloConexion() {
        mostrarModal('error', 'Sin conexión', 'No se pudo conectar con el servidor. Verifica que la API esté en ejecución.');
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && $('modalOverlay').classList.contains('abierto')) cerrarModal();
    });

    $('navToggle').addEventListener('click', function () { $('navMenu').classList.toggle('abierto'); });

    $('verContrasena').addEventListener('change', function () {
        var ver = this.checked;
        txtClave.type = ver ? 'text' : 'password';
        $('iconoOjo').className = ver ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        $('txtOjo').textContent = ver ? 'Ocultar contraseña' : 'Ver contraseña';
        $('iconLock').className = ver ? 'fa-solid fa-lock-open' : 'fa-solid fa-lock';
    });

    function marcar(idCampo, invalido) {
        var c = $(idCampo);
        c.classList.remove('invalido');
        if (invalido) { void c.offsetWidth; c.classList.add('invalido'); }
    }

    txtNombre.addEventListener('input', function () { marcar('grpNombre', false); });
    txtCorreo.addEventListener('input', function () { marcar('grpCorreo', false); });
    txtTelefono.addEventListener('input', function () { marcar('grpTelefono', false); });
    txtClave.addEventListener('input', function () { marcar('grpClave', false); });

    function actualizarModo() {
        var editando = seleccionado !== null;
        $('badgeModo').className = 'modo' + (editando ? ' editando' : '');
        $('txtModo').textContent = editando ? 'Editando usuario #' + seleccionado : 'Nuevo registro';
        btnAgregar.disabled = editando;
        btnModificar.disabled = !editando;
        btnEliminar.disabled = !editando;
        $('ayudaClave').classList.toggle('visible', editando);
        txtClave.placeholder = editando ? 'Dejar vacía para no cambiarla' : 'Mínimo 4 caracteres';
    }

    function setCargando(si) {
        btnAgregar.classList.toggle('cargando', si);
        if (si) { btnAgregar.disabled = true; btnModificar.disabled = true; btnEliminar.disabled = true; }
        else actualizarModo();
    }

    function limpiarFormulario() {
        seleccionado = null;
        txtId.value = ''; txtNombre.value = ''; txtCorreo.value = '';
        txtTelefono.value = ''; txtClave.value = '';
        txtRol.value = 'Adoptante';
        GRUPOS.forEach(function (g) { marcar(g, false); });
        actualizarModo();
        dibujarTabla();
    }

    function seleccionarUsuario(id) {
        var u = lista.filter(function (x) { return String(x.id) === String(id); })[0];
        if (!u) return;
        seleccionado = u.id;
        txtId.value = u.id;
        txtNombre.value = u.nombre;
        txtCorreo.value = u.correo;
        txtTelefono.value = u.telefono || '';
        txtClave.value = '';  
        txtRol.value = normalizar(u.rol) === 'administrador' ? 'Administrador' : 'Adoptante';
        GRUPOS.forEach(function (g) { marcar(g, false); });
        actualizarModo();
        dibujarTabla();
        if (window.innerWidth <= 1050) $('formUsuario').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function leerFormulario(esNuevo) {
        var nombre = txtNombre.value.trim();
        var correo = txtCorreo.value.trim();
        var telefono = txtTelefono.value.trim();
        var clave = txtClave.value;

        var nombreMal = !nombre;
        var correoMal = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
        var telMal = telefono !== '' && !/^[0-9+\-\s()]{7,20}$/.test(telefono);
        var claveMal = esNuevo ? clave.length < 4 : (clave.length > 0 && clave.length < 4);

        $('errCorreo').textContent = 'Escribe un correo válido.';
        marcar('grpNombre', nombreMal);
        marcar('grpCorreo', correoMal);
        marcar('grpTelefono', telMal);
        marcar('grpClave', claveMal);

        if (nombreMal || correoMal || telMal || claveMal) return null;
        return { nombre: nombre, correo: correo, telefono: telefono, clave: clave, rol: txtRol.value };
    }

    function correoRepetido(correo, idActual) {
        var c = normalizar(correo);
        return lista.some(function (u) {
            return normalizar(u.correo) === c && String(u.id) !== String(idActual === undefined ? '' : idActual);
        });
    }

    function armarPayload(d, id) {
        var p = { nombreCompleto: d.nombre, nombre: d.nombre, correo: d.correo, telefono: d.telefono, rol: d.rol };
        if (d.clave) { p.contrasena = d.clave; p.clave = d.clave; p.claveHash = d.clave; }
        if (id !== undefined && id !== null && id !== '') p.id = parseInt(id, 10);
        return p;
    }
    function dibujarTabla() {
        var texto = normalizar(txtBuscar.value);
        btnX.classList.toggle('visible', txtBuscar.value.length > 0);

        var admins = lista.filter(function (u) { return normalizar(u.rol) === 'administrador'; }).length;
        $('statTotal').textContent = lista.length;
        $('statAdmins').textContent = admins;
        $('statAdopt').textContent = lista.length - admins;

        var filtrados = lista.filter(function (u) {
            var rol = normalizar(u.rol);
            var okRol = filtroActual === 'todos' || rol === filtroActual;
            var okTexto = !texto ||
                normalizar(u.nombre).indexOf(texto) !== -1 ||
                normalizar(u.correo).indexOf(texto) !== -1 ||
                normalizar(u.telefono).indexOf(texto) !== -1 ||
                rol.indexOf(texto) !== -1;
            return okRol && okTexto;
        });
        $('lblCantMostrada').textContent = filtrados.length;

        if (!filtrados.length) {
            var hay = lista.length > 0;
            tbody.innerHTML = '<tr><td colspan="5"><div class="vacio"><i class="fa-solid fa-user-slash"></i>' +
                '<h3>' + (hay ? 'Sin coincidencias' : 'Aún no hay usuarios') + '</h3>' +
                '<p>' + (hay ? 'Prueba con otra búsqueda o cambia el filtro.' : 'Agrega el primer usuario con el formulario.') + '</p></div></td></tr>';
            return;
        }

        var html = '';
        filtrados.forEach(function (u, i) {
            var esAdmin = normalizar(u.rol) === 'administrador';
            var sel = seleccionado !== null && String(seleccionado) === String(u.id);
            var inicial = u.nombre ? String(u.nombre).charAt(0).toUpperCase() : 'U';
            html += '<tr class="fila' + (sel ? ' sel' : '') + '" data-id="' + escapar(u.id) + '" style="animation-delay:' + Math.min(i, 12) * 30 + 'ms">' +
                '<td class="id-num">#' + escapar(u.id) + '</td>' +
                '<td><div class="celda-usuario"><span class="av">' + escapar(inicial) + '</span><b>' + escapar(u.nombre) + '</b></div></td>' +
                '<td class="correo">' + escapar(u.correo) + '</td>' +
                '<td class="tel">' + (u.telefono ? '<i class="fa-solid fa-phone" style="color:var(--soft-pink);margin-right:7px;font-size:.7rem"></i>' + escapar(u.telefono) : '<span class="nd">N/D</span>') + '</td>' +
                '<td><span class="rol ' + (esAdmin ? 'admin' : 'adop') + '"><i class="fa-solid ' + (esAdmin ? 'fa-shield-halved' : 'fa-heart') + '"></i>' + escapar(u.rol) + '</span></td>' +
                '</tr>';
        });
        tbody.innerHTML = html;
    }

    tbody.addEventListener('click', function (e) {
        var fila = e.target.closest('tr.fila');
        if (fila) seleccionarUsuario(fila.getAttribute('data-id'));
    });

    txtBuscar.addEventListener('input', dibujarTabla);
    btnX.addEventListener('click', function () { txtBuscar.value = ''; dibujarTabla(); txtBuscar.focus(); });

    var controlesFiltro = document.querySelectorAll('[data-filtro]');
    function aplicarFiltro(f) {
        filtroActual = f;
        controlesFiltro.forEach(function (c) {
            c.classList.toggle('activo', c.getAttribute('data-filtro') === f);
        });
        dibujarTabla();
    }
    controlesFiltro.forEach(function (c) {
        c.addEventListener('click', function () { aplicarFiltro(c.getAttribute('data-filtro')); });
    });
    function mostrarEsqueleto() {
        var f = '';
        for (var i = 0; i < 4; i++) {
            f += '<tr class="esq"><td><div style="width:30px"></div></td><td><div style="width:70%"></div></td><td><div style="width:80%"></div></td><td><div style="width:60%"></div></td><td><div style="width:70px"></div></td></tr>';
        }
        tbody.innerHTML = f;
    }

    function mostrarErrorTabla(intentos) {
        tbody.innerHTML = '<tr><td colspan="5"><div class="vacio"><i class="fa-solid fa-plug-circle-xmark"></i>' +
            '<h3>No se pudo cargar la lista</h3>' +
            '<p>Verifica que la API esté en ejecución y que la ruta del controlador sea correcta.</p>' +
            '<small>' + escapar(intentos.join('  |  ')) + '</small>' +
            '<button type="button" class="chip" id="btnReintentar"><i class="fa-solid fa-rotate-right"></i> Reintentar</button></div></td></tr>';
        $('btnReintentar').addEventListener('click', cargarUsuarios);
    }

    async function cargarUsuarios() {
        mostrarEsqueleto();
        var intentos = [];
        var rutas = API ? [API] : RUTAS;

        for (var i = 0; i < rutas.length; i++) {
            try {
                var r = await llamar('GET', rutas[i]);
                if (r.ok && Array.isArray(r.datos)) {
                    API = rutas[i];
                    lista = r.datos.map(normalizarUsuario);
                    if (seleccionado !== null && !lista.some(function (u) { return String(u.id) === String(seleccionado); })) {
                        seleccionado = null;
                        actualizarModo();
                    }
                    dibujarTabla();
                    return true;
                }
                intentos.push(rutas[i] + ' → error ' + r.status);
            } catch (e) {
                intentos.push(rutas[i] + ' → sin conexión');
            }
        }
        mostrarErrorTabla(intentos);
        return false;
    }
    async function agregarUsuario() {
        var d = leerFormulario(true);
        if (!d) return;

        if (!API && !(await cargarUsuarios())) {
            mostrarModal('error', 'Sin conexión', 'No se encontró la API de usuarios. Revisa que esté en ejecución.');
            return;
        }
        if (correoRepetido(d.correo)) {
            $('errCorreo').textContent = 'Ya existe un usuario con ese correo.';
            marcar('grpCorreo', true);
            return;
        }

        setCargando(true);
        try {
            var r = await llamar('POST', API, armarPayload(d));
            if (r.ok) {
                limpiarFormulario();
                mostrarModal('ok', '¡Usuario registrado!', 'El nuevo usuario se guardó en la base de datos.');
                await cargarUsuarios();
            } else {
                mostrarModal('error', 'No se pudo registrar', mensajeError(r));
            }
        } catch (e) { falloConexion(); }
        setCargando(false);
    }
    async function modificarUsuario() {
        if (seleccionado === null) {
            mostrarModal('warn', 'Selecciona un usuario', 'Elige un usuario de la tabla para modificarlo.');
            return;
        }
        var d = leerFormulario(false);
        if (!d) return;

        if (correoRepetido(d.correo, seleccionado)) {
            $('errCorreo').textContent = 'Ya existe otro usuario con ese correo.';
            marcar('grpCorreo', true);
            return;
        }

        var id = seleccionado;
        setCargando(true);
        try {
            var r = await llamar('PUT', API + '/' + id, armarPayload(d, id));
            if (r.ok) {
                limpiarFormulario();
                mostrarModal('ok', '¡Actualizado!', 'Los datos del usuario se modificaron con éxito.');
                await cargarUsuarios();
            } else {
                mostrarModal('error', 'No se pudo actualizar', mensajeError(r));
            }
        } catch (e) { falloConexion(); }
        setCargando(false);
    }
    function eliminarUsuario() {
        if (seleccionado === null) {
            mostrarModal('warn', 'Selecciona un usuario', 'Elige un usuario de la tabla para eliminarlo.');
            return;
        }
        var id = seleccionado;
        var nombre = txtNombre.value || ('#' + id);

        mostrarModal('warn', '¿Eliminar usuario?',
            'Vas a eliminar a ' + nombre + '. Esta acción no se puede deshacer.',
            [
                { texto: 'Cancelar', accion: cerrarModal },
                {
                    texto: 'Sí, eliminar', clase: 'peligro',
                    accion: async function () {
                        cerrarModal();
                        setCargando(true);
                        try {
                            var r = await llamar('DELETE', API + '/' + id);
                            if (r.ok) {
                                limpiarFormulario();
                                mostrarModal('ok', '¡Eliminado!', 'El usuario fue borrado de la base de datos.');
                                await cargarUsuarios();
                            } else {
                                mostrarModal('error', 'No se pudo eliminar', mensajeError(r));
                            }
                        } catch (e) { falloConexion(); }
                        setCargando(false);
                    }
                }
            ]);
    }
    $('formUsuario').addEventListener('submit', function (e) { e.preventDefault(); if (!btnAgregar.disabled) agregarUsuario(); });
    btnModificar.addEventListener('click', modificarUsuario);
    btnEliminar.addEventListener('click', eliminarUsuario);
    btnLimpiar.addEventListener('click', limpiarFormulario);

    actualizarModo();
    cargarUsuarios();
});