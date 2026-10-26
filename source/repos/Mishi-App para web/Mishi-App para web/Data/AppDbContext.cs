using Microsoft.EntityFrameworkCore;
using Mishi_App_para_web.Models;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Gato> Gatos { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Solicitud> Solicitudes { get; set; }
    public DbSet<Adopcion> Adopciones { get; set; }
}