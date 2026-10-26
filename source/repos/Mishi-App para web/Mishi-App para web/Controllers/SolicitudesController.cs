using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/solicitudes")]
public class SolicitudesController : ControllerBase
{
    public class Solicitud
    {
        public int id { get; set; }
        public string usuario { get; set; } = "";
        public string gato { get; set; } = "";
        public string fecha { get; set; } = "";
        public string estado { get; set; } = "Pendiente";
    }

    private static readonly List<Solicitud> solicitudes = new()
    {
        new Solicitud { id = 1, usuario = "Kimberly Jaimes", gato = "Felipe", fecha = "2026-10-23", estado = "Aprobada" }
    };

    [HttpGet]
    public IActionResult Listar() => Ok(solicitudes);

    [HttpPost]
    public IActionResult Crear([FromBody] Solicitud s)
    {
        s.id = solicitudes.Count == 0 ? 1 : solicitudes.Max(x => x.id) + 1;
        s.estado = string.IsNullOrEmpty(s.estado) ? "Pendiente" : s.estado;
        solicitudes.Add(s);
        return Ok(s);
    }

    [HttpPut("{id}")]
    public IActionResult Actualizar(int id, [FromBody] Solicitud s)
    {
        var solicitudExistente = solicitudes.FirstOrDefault(x => x.id == id);
        if (solicitudExistente == null)
        {
            return NotFound(new { mensaje = "Solicitud no encontrada." });
        }

        solicitudExistente.usuario = s.usuario;
        solicitudExistente.gato = s.gato;
        solicitudExistente.fecha = s.fecha;
        solicitudExistente.estado = s.estado;

        return Ok(solicitudExistente);
    }

    [HttpDelete("{id}")]
    public IActionResult Eliminar(int id)
    {
        var solicitudExistente = solicitudes.FirstOrDefault(x => x.id == id);
        if (solicitudExistente == null)
        {
            return NotFound(new { mensaje = "Solicitud no encontrada." });
        }

        solicitudes.Remove(solicitudExistente);
        return Ok(new { mensaje = "Solicitud eliminada con éxito." });
    }
}
