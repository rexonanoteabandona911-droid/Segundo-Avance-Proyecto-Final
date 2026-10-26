using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Mishi_App_para_web.Models;

[Route("api/[controller]")]
[ApiController]
public class GatosController : ControllerBase
{
    private readonly AppDbContext _context;

    public GatosController(AppDbContext context)
    {
        _context = context;
    }
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Gato>>> GetGatos()
    {
        return await _context.Gatos.ToListAsync();
    }
    [HttpPost]
    public async Task<ActionResult<Gato>> PostGato(Gato gato)
    {
        _context.Gatos.Add(gato);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetGatos), new { id = gato.Id }, gato);
    }
    [HttpPut("{id}")]
    public async Task<IActionResult> PutGato(int id, Gato gato)
    {
        if (id != gato.Id)
        {
            return BadRequest();
        }

        _context.Entry(gato).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Gatos.Any(e => e.Id == id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGato(int id)
    {
        var gato = await _context.Gatos.FindAsync(id);
        if (gato == null)
        {
            return NotFound();
        }

        _context.Gatos.Remove(gato);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
