namespace Mishi_App_para_web.Models
{
    public class Solicitud
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public int GatoId { get; set; }
        public DateTime Fecha { get; set; }
        public string Estado { get; set; }
    }
}
