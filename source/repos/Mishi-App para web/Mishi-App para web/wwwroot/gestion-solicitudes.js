// @ts-nocheck
document.addEventListener('DOMContentLoaded', function () {
    cargarSolicitudesEnTabla();
    const fechaInput = document.getElementById('solFecha');
    if (fechaInput && !fechaInput.value) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.value = hoy;
    }
    const tabla = document.querySelector('#tablaSolicitudes tbody');
    if (tabla) {
        tabla.addEventListener('click', function (e) {
            const fila = e.target.closest('tr');
            if (!fila) return;

            document.querySelectorAll('#tablaSolicitudes tbody tr').forEach(f => f.style.background = 'transparent');
            fila.style.background = 'rgba(168, 85, 247, 0.15)';

            const celdas = fila.querySelectorAll('td');
            document.getElementById('solId').value = celdas[0].textContent;
            document.getElementById('solUsuario').value = celdas[1].textContent;
            document.getElementById('solGato').value = celdas[2].textContent;
            document.getElementById('solFecha').value = celdas[3].textContent;
            document.getElementById('solEstado').value = celdas[4].textContent;
        });
    }
});
function cargarSolicitudesEnTabla() {
    fetch('/api/solicitudes')
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener las solicitudes");
            return response.json();
        })
        .then(data => {
            var tbody = document.querySelector('#tablaSolicitudes tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            data.forEach(sol => {
                var nuevaFila = tbody.insertRow();
                nuevaFila.innerHTML = `
                    <td>${sol.id}</td>
                    <td>${sol.usuario}</td>
                    <td>${sol.gato}</td>
                    <td>${sol.fecha}</td>
                    <td>${sol.estado}</td>
                `;
            });
        })
        .catch(error => console.error("Error al cargar la tabla:", error));
}
function crearSolicitud() {
    var usuario = document.getElementById('solUsuario').value;
    var gato = document.getElementById('solGato').value;
    var fecha = document.getElementById('solFecha').value;
    var estado = document.getElementById('solEstado').value;

    if (!fecha) {
        alert("Por favor selecciona una fecha.");
        return;
    }

    var nuevaSolicitud = {
        usuario: usuario,
        gato: gato,
        fecha: fecha,
        estado: estado
    };

    fetch('/api/solicitudes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaSolicitud)
    })
        .then(response => {
            if (response.ok) return response.json();
            throw new Error("Error al registrar la solicitud.");
        })
        .then(data => {
            alert("¡Solicitud creada con éxito!");
            limpiarFormularioSolicitudes();
            cargarSolicitudesEnTabla();
        })
        .catch(error => {
            console.error("Error:", error);
            alert("No se pudo conectar con el servidor.");
        });
}
function actualizarSolicitud() {
    var id = document.getElementById('solId').value;
    var usuario = document.getElementById('solUsuario').value;
    var gato = document.getElementById('solGato').value;
    var fecha = document.getElementById('solFecha').value;
    var estado = document.getElementById('solEstado').value;

    if (!id) {
        alert("Selecciona una solicitud de la tabla para actualizar.");
        return;
    }

    var solicitudActualizada = {
        id: parseInt(id),
        usuario: usuario,
        gato: gato,
        fecha: fecha,
        estado: estado
    };

    fetch(`/api/solicitudes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(solicitudActualizada)
    })
        .then(response => {
            if (response.ok) {
                alert("Solicitud actualizada con éxito.");
                limpiarFormularioSolicitudes();
                cargarSolicitudesEnTabla();
            } else {
                alert("Error al actualizar la solicitud.");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("No se pudo conectar con el servidor.");
        });
}
function eliminarSolicitud() {
    var id = document.getElementById('solId').value;

    if (!id) {
        alert("Selecciona una solicitud de la tabla para eliminar.");
        return;
    }

    if (confirm(`¿Estás segura de eliminar la solicitud con ID ${id}?`)) {
        fetch(`/api/solicitudes/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    alert("Solicitud eliminada con éxito.");
                    limpiarFormularioSolicitudes();
                    cargarSolicitudesEnTabla();
                } else {
                    alert("Error al eliminar la solicitud.");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("No se pudo conectar con el servidor.");
            });
    }
}
function limpiarFormularioSolicitudes() {
    document.getElementById('solId').value = '';
    const usuarioInput = document.getElementById('solUsuario');
    if (usuarioInput) {
        usuarioInput.value = '';
    }

    document.getElementById('solGato').selectedIndex = 0;
    const fechaInput = document.getElementById('solFecha');
    if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }

    document.getElementById('solEstado').selectedIndex = 0;
    document.querySelectorAll('#tablaSolicitudes tbody tr').forEach(f => f.style.background = 'transparent');
}