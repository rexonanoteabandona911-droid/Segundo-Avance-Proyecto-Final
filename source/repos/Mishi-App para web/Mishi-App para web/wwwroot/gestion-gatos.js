// @ts-nocheck
document.addEventListener('DOMContentLoaded', function () {
    cargarGatosEnTabla();

    const tabla = document.querySelector('#tablaGatos tbody');
    if (tabla) {
        tabla.addEventListener('click', function (e) {
            const fila = e.target.closest('tr');
            if (!fila) return;

            document.querySelectorAll('#tablaGatos tbody tr').forEach(f => f.style.background = 'transparent');
            fila.style.background = 'rgba(255, 77, 141, 0.25)';

            const celdas = fila.querySelectorAll('td');
            document.getElementById('catId').value = celdas[0].textContent;
            document.getElementById('catNombre').value = celdas[1].textContent;
            document.getElementById('catRaza').value = celdas[2].textContent;
            document.getElementById('catEdad').value = celdas[3].textContent;
            document.getElementById('catEstado').value = celdas[4].textContent;
        });
    }
});

function cargarGatosEnTabla() {
    fetch('/api/gatos')
        .then(response => {
            if (!response.ok) throw new Error("Error al obtener los datos");
            return response.json();
        })
        .then(data => {
            var tbody = document.querySelector('#tablaGatos tbody');
            if (!tbody) return;
            tbody.innerHTML = '';

            data.forEach(gato => {
                var nuevaFila = tbody.insertRow();
                nuevaFila.innerHTML = `
                    <td>${gato.id}</td>
                    <td>${gato.nombre}</td>
                    <td>${gato.raza}</td>
                    <td>${gato.edad}</td>
                    <td>${gato.estado}</td>
                `;
            });
        })
        .catch(error => console.error("Error al cargar la tabla:", error));
}

function insertarGato() {
    var nombre = document.getElementById('catNombre').value.trim();
    var raza = document.getElementById('catRaza').value.trim();
    var edad = document.getElementById('catEdad').value.trim();
    var estado = document.getElementById('catEstado').value;

    if (!nombre || !raza || !edad) {
        alert("Por favor completa todos los campos del gatito.");
        return;
    }

    var nuevoGato = {
        nombre: nombre,
        raza: raza,
        edad: edad,
        estado: estado
    };

    fetch('/api/gatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoGato)
    })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("Hubo un error al guardar en la base de datos.");
            }
        })
        .then(data => {
            alert("¡Gatito " + (data.nombre || nombre) + " registrado con éxito en la base de datos!");
            limpiarFormularioGatos();
            cargarGatosEnTabla();
        })
        .catch(error => {
            console.error("Error:", error);
            alert("No se pudo conectar con el servidor.");
        });
}

function actualizarGato() {
    var id = document.getElementById('catId').value;
    var nombre = document.getElementById('catNombre').value.trim();
    var raza = document.getElementById('catRaza').value.trim();
    var edad = document.getElementById('catEdad').value.trim();
    var estado = document.getElementById('catEstado').value;

    if (!id) {
        alert("Selecciona un gato de la tabla para actualizar.");
        return;
    }

    var gatoActualizado = {
        id: parseInt(id),
        nombre: nombre,
        raza: raza,
        edad: edad,
        estado: estado
    };

    fetch(`/api/gatos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gatoActualizado)
    })
        .then(response => {
            if (response.ok) {
                alert("Información del gatito actualizada con éxito.");
                limpiarFormularioGatos();
                cargarGatosEnTabla();
            } else {
                alert("Error al actualizar la información.");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("No se pudo conectar con el servidor.");
        });
}

function eliminarGato() {
    var id = document.getElementById('catId').value;
    var nombre = document.getElementById('catNombre').value;

    if (!id) {
        alert("Selecciona un gato de la tabla para eliminar.");
        return;
    }

    if (confirm(`¿Estás segura de eliminar a ${nombre}?`)) {
        fetch(`/api/gatos/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (response.ok) {
                    alert("Registro eliminado con éxito.");
                    limpiarFormularioGatos();
                    cargarGatosEnTabla();
                } else {
                    alert("Error al eliminar el registro.");
                }
            })
            .catch(error => {
                console.error("Error:", error);
                alert("No se pudo conectar con el servidor.");
            });
    }
}

function limpiarFormularioGatos() {
    document.getElementById('catId').value = '';
    document.getElementById('catNombre').value = '';
    document.getElementById('catRaza').value = '';
    document.getElementById('catEdad').value = '';

    var selectEstado = document.getElementById('catEstado');
    if (selectEstado) selectEstado.selectedIndex = 0;

    document.querySelectorAll('#tablaGatos tbody tr').forEach(f => f.style.background = 'transparent');
}