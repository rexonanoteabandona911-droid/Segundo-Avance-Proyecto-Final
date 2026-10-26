namespace Mishi_App_para_web.Models
{
    public class ActualizarUsuario
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = "";
        public string Correo { get; set; } = "";
        public string Telefono { get; set; } = "";
        public string Rol { get; set; } = "Adoptante";
    }
}
