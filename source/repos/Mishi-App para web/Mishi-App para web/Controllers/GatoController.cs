using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/gato")]
public class GatoController : ControllerBase
{
    public class Gato
    {
        public int id { get; set; }
        public string nombre { get; set; } = "";
        public string descripcion { get; set; } = "";
    }

    private static readonly List<Gato> gatos = new()
    {
        new Gato { id = 1, nombre = "Mishi", descripcion = "Gatito juguetón de 3 meses" },
        new Gato { id = 2, nombre = "Luna",  descripcion = "Tranquila y cariñosa" },
        new Gato { id = 3, nombre = "Tigre", descripcion = "Rayado y muy curioso" }
    };

    [HttpGet]
    public IActionResult Listar() => Ok(gatos);

    [HttpGet("{id}")]
    public IActionResult Obtener(int id)
    {
        var g = gatos.FirstOrDefault(x => x.id == id);
        return g == null ? NotFound() : Ok(g);
    }

    [HttpPost]
    public IActionResult Agregar([FromBody] Gato g)
    {
        g.id = gatos.Count == 0 ? 1 : gatos.Max(x => x.id) + 1;
        gatos.Add(g);
        return Ok(g);
    }
}
