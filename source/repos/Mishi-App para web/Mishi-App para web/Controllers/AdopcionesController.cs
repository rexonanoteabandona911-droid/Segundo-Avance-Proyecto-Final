using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

[ApiController]
[Route("api/adopciones")]
public class AdopcionesController : ControllerBase
{
    private readonly string cs;

    public AdopcionesController(IConfiguration config)
    {
        cs = config.GetConnectionString("MishiApi")
            ?? "Data Source=KIMBY-PC\\SQLEXPRESS;Initial Catalog=MishiApi;Integrated Security=True;Encrypt=True;Trust Server Certificate=True;";
    }

    public class AdopcionDto
    {
        public int id_usuario { get; set; }
        public int id_gato { get; set; }
        public DateTime? fechaAdopcion { get; set; }
        public string? observaciones { get; set; }
    }

    // Listas para el formulario: usuarios y gatos que aún no han sido adoptados
    [HttpGet("opciones")]
    public async Task<IActionResult> Opciones()
    {
        using var con = new SqlConnection(cs);
        await con.OpenAsync();

        var usuarios = new List<object>();
        using (var cmd = new SqlCommand("SELECT Id, Nombre FROM Usuarios ORDER BY Nombre", con))
        using (var r = await cmd.ExecuteReaderAsync())
        {
            while (await r.ReadAsync())
                usuarios.Add(new { id = r.GetInt32(0), nombre = r.IsDBNull(1) ? "" : r.GetString(1) });
        }

        var gatos = new List<object>();
        using (var cmd = new SqlCommand(@"
            SELECT g.Id, g.Nombre
            FROM Gatos g
            WHERE NOT EXISTS (
                SELECT 1
                FROM Solicitudes_Adopciones s
                JOIN Adopciones d ON d.id_solicitud = s.id_solicitud
                WHERE s.id_gato = g.Id)
            ORDER BY g.Nombre", con))
        using (var r = await cmd.ExecuteReaderAsync())
        {
            while (await r.ReadAsync())
                gatos.Add(new { id = r.GetInt32(0), nombre = r.IsDBNull(1) ? "" : r.GetString(1) });
        }

        return Ok(new { usuarios, gatos });
    }

    // Adopciones registradas, con nombres obtenidos por JOIN
    [HttpGet]
    public async Task<IActionResult> Listar()
    {
        using var con = new SqlConnection(cs);
        await con.OpenAsync();
        using var cmd = new SqlCommand(@"
            SELECT d.id_adopcion, d.id_solicitud, d.Fecha_Adopcion, d.Observaciones,
                   u.Nombre AS Adoptante, g.Nombre AS Gato
            FROM Adopciones d
            JOIN Solicitudes_Adopciones s ON s.id_solicitud = d.id_solicitud
            JOIN Adoptantes a ON a.id_adoptante = s.id_adoptante
            JOIN Usuarios  u ON u.Id = a.id_usuario
            JOIN Gatos     g ON g.Id = s.id_gato
            ORDER BY d.Fecha_Adopcion DESC", con);
        using var r = await cmd.ExecuteReaderAsync();

        var lista = new List<object>();
        while (await r.ReadAsync())
        {
            lista.Add(new
            {
                id_adopcion = r.GetInt32(0),
                id_solicitud = r.GetInt32(1),
                fechaAdopcion = r.GetDateTime(2),
                observaciones = r.IsDBNull(3) ? "" : r.GetString(3),
                adoptante = r.IsDBNull(4) ? "" : r.GetString(4),
                gato = r.IsDBNull(5) ? "" : r.GetString(5)
            });
        }
        return Ok(lista);
    }

    [HttpPost]
    public async Task<IActionResult> Registrar([FromBody] AdopcionDto d)
    {
        if (d.id_usuario <= 0 || d.id_gato <= 0)
            return BadRequest(new { mensaje = "Selecciona el adoptante y el gato" });

        try
        {
            using var con = new SqlConnection(cs);
            await con.OpenAsync();
            using var tx = con.BeginTransaction();

            // Usuario y gato existen
            using (var c = new SqlCommand("SELECT COUNT(*) FROM Usuarios WHERE Id = @u", con, tx))
            {
                c.Parameters.AddWithValue("@u", d.id_usuario);
                if (Convert.ToInt32(await c.ExecuteScalarAsync()) == 0)
                    return NotFound(new { mensaje = "El usuario no existe" });
            }
            using (var c = new SqlCommand("SELECT COUNT(*) FROM Gatos WHERE Id = @g", con, tx))
            {
                c.Parameters.AddWithValue("@g", d.id_gato);
                if (Convert.ToInt32(await c.ExecuteScalarAsync()) == 0)
                    return NotFound(new { mensaje = "El gato no existe" });
            }

            // El gato no debe estar ya adoptado
            using (var c = new SqlCommand(@"
                SELECT COUNT(*)
                FROM Solicitudes_Adopciones s
                JOIN Adopciones a ON a.id_solicitud = s.id_solicitud
                WHERE s.id_gato = @g", con, tx))
            {
                c.Parameters.AddWithValue("@g", d.id_gato);
                if (Convert.ToInt32(await c.ExecuteScalarAsync()) > 0)
                    return Conflict(new { mensaje = "Ese gatito ya fue adoptado" });
            }

            var fecha = d.fechaAdopcion ?? DateTime.Now;
            var obs = string.IsNullOrWhiteSpace(d.observaciones) ? null : d.observaciones.Trim();

            // 1. Adoptante: se reutiliza si existe, si no se crea
            int? idAdoptante = null;
            using (var c = new SqlCommand("SELECT id_adoptante FROM Adoptantes WHERE id_usuario = @u", con, tx))
            {
                c.Parameters.AddWithValue("@u", d.id_usuario);
                var o = await c.ExecuteScalarAsync();
                if (o != null && o != DBNull.Value) idAdoptante = Convert.ToInt32(o);
            }
            if (idAdoptante == null)
            {
                using var c = new SqlCommand(@"
                    INSERT INTO Adoptantes (id_usuario, Direccion)
                    OUTPUT INSERTED.id_adoptante
                    VALUES (@u, @dir)", con, tx);
                c.Parameters.AddWithValue("@u", d.id_usuario);
                c.Parameters.AddWithValue("@dir", "Sin especificar");
                idAdoptante = Convert.ToInt32(await c.ExecuteScalarAsync());
            }

            // 2. Solicitud aprobada
            int idSolicitud;
            using (var c = new SqlCommand(@"
                INSERT INTO Solicitudes_Adopciones
                    (id_gato, id_adoptante, Fecha_Solicitud, Estado_Solicitud, Comentarios, Fecha_Revision)
                OUTPUT INSERTED.id_solicitud
                VALUES (@g, @a, @f, 'Aprobada', @c, @f)", con, tx))
            {
                c.Parameters.AddWithValue("@g", d.id_gato);
                c.Parameters.AddWithValue("@a", idAdoptante.Value);
                c.Parameters.AddWithValue("@f", fecha);
                c.Parameters.AddWithValue("@c", "Registrada desde el formulario de adopción");
                idSolicitud = Convert.ToInt32(await c.ExecuteScalarAsync());
            }

            // 3. Adopción
            int idAdopcion;
            using (var c = new SqlCommand(@"
                INSERT INTO Adopciones (id_solicitud, Fecha_Adopcion, Observaciones)
                OUTPUT INSERTED.id_adopcion
                VALUES (@s, @f, @o)", con, tx))
            {
                c.Parameters.AddWithValue("@s", idSolicitud);
                c.Parameters.AddWithValue("@f", fecha);
                c.Parameters.AddWithValue("@o", (object?)obs ?? DBNull.Value);
                idAdopcion = Convert.ToInt32(await c.ExecuteScalarAsync());
            }

            tx.Commit();
            return Ok(new { mensaje = "Adopción registrada con éxito", id_adopcion = idAdopcion });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { mensaje = "Error interno en el servidor: " + ex.Message });
        }
    }
}
