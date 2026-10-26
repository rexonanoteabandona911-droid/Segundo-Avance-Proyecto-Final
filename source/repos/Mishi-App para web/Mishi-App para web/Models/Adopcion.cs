namespace Mishi_App_para_web.Models
{
    public class Adopcion
    {
        public int Id { get; set; }
        public int id_solicitud { get; set; }
        public DateTime Fecha_Adopcion { get; set; }
        public string Observaciones { get; set; } = "";
    }
}