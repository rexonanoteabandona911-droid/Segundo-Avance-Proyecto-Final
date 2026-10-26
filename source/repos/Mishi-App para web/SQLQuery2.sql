USE MishiApi;
GO

/* ==========================================================
   0. RESPALDO  (la carpeta C:\Temp debe existir;
      si no, cambia la ruta o créala antes)
   ========================================================== */
BACKUP DATABASE MishiApi
TO DISK = N'C:\Temp\MishiApi_antes_migracion.bak' WITH INIT;
GO

/* ==========================================================
   1. COLUMNAS NUEVAS
   ========================================================== */
IF COL_LENGTH('dbo.Usuarios','Nombre_Usuario') IS NULL ALTER TABLE dbo.Usuarios ADD Nombre_Usuario NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Usuarios','Rol')            IS NULL ALTER TABLE dbo.Usuarios ADD Rol NVARCHAR(20) NULL;
IF COL_LENGTH('dbo.Usuarios','Activo')         IS NULL ALTER TABLE dbo.Usuarios ADD Activo BIT NULL;
IF COL_LENGTH('dbo.Gatos','Sexo')              IS NULL ALTER TABLE dbo.Gatos ADD Sexo CHAR(1) NULL;
IF COL_LENGTH('dbo.Adopciones','Observaciones') IS NULL ALTER TABLE dbo.Adopciones ADD Observaciones NVARCHAR(300) NULL;
GO

/* ==========================================================
   2. USUARIOS (+ correos que solo estaban en Perfiles)
   ========================================================== */
BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID('dbo.Perfiles','U') IS NOT NULL
    BEGIN
        INSERT INTO dbo.Usuarios (Nombre, Correo, ClaveHash, FechaRegistro, Rol, Activo)
        SELECT LEFT(p.Correo, CHARINDEX('@', p.Correo + '@') - 1), p.Correo, MIN(p.ClaveHash), SYSDATETIME(), N'Adoptante', 1
        FROM dbo.Perfiles p
        WHERE p.Correo IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM dbo.Usuarios u WHERE u.Correo = p.Correo)
        GROUP BY p.Correo;
        PRINT 'Correos de Perfiles copiados a Usuarios: ' + CAST(@@ROWCOUNT AS VARCHAR(10));
    END

    ;WITH b AS (
        SELECT Id, Nombre_Usuario,
               base = LEFT(LEFT(ISNULL(Correo, N'usuario'), CHARINDEX('@', ISNULL(Correo, N'usuario') + N'@') - 1), 40),
               cnt  = COUNT(*) OVER (PARTITION BY LEFT(LEFT(ISNULL(Correo, N'usuario'), CHARINDEX('@', ISNULL(Correo, N'usuario') + N'@') - 1), 40))
        FROM dbo.Usuarios
        WHERE Nombre_Usuario IS NULL
    )
    UPDATE b SET Nombre_Usuario = CASE WHEN cnt > 1 THEN base + CAST(Id AS NVARCHAR(10)) ELSE base END;

    UPDATE dbo.Usuarios SET Rol = N'Adoptante' WHERE Rol IS NULL;
    UPDATE dbo.Usuarios SET Activo = 1 WHERE Activo IS NULL;

    COMMIT;
    PRINT 'OK  Usuarios: datos listos';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    PRINT 'ERROR Usuarios: ' + ERROR_MESSAGE();
END CATCH
GO

/* Restricciones de Usuarios (cada una por separado) */
BEGIN TRY
    ALTER TABLE dbo.Usuarios ALTER COLUMN Rol NVARCHAR(20) NOT NULL;
    ALTER TABLE dbo.Usuarios ALTER COLUMN Activo BIT NOT NULL;
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Usuarios_Rol')
        ALTER TABLE dbo.Usuarios ADD CONSTRAINT DF_Usuarios_Rol DEFAULT N'Adoptante' FOR Rol;
    IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Usuarios_Activo')
        ALTER TABLE dbo.Usuarios ADD CONSTRAINT DF_Usuarios_Activo DEFAULT 1 FOR Activo;
    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Usuarios_Rol')
        ALTER TABLE dbo.Usuarios ADD CONSTRAINT CK_Usuarios_Rol CHECK (Rol IN (N'Administrador', N'Adoptante', N'Rescatista'));
    PRINT 'OK  Usuarios: Rol y Activo';
END TRY
BEGIN CATCH PRINT 'ERROR Usuarios (Rol/Activo): ' + ERROR_MESSAGE(); END CATCH

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Usuarios_Correo' AND object_id = OBJECT_ID('dbo.Usuarios'))
        CREATE UNIQUE INDEX UX_Usuarios_Correo ON dbo.Usuarios(Correo) WHERE Correo IS NOT NULL;
    PRINT 'OK  Usuarios: correo unico';
END TRY
BEGIN CATCH
    PRINT 'ERROR correo unico (hay correos repetidos): ' + ERROR_MESSAGE();
    SELECT Correo, COUNT(*) AS Veces FROM dbo.Usuarios GROUP BY Correo HAVING COUNT(*) > 1;
END CATCH

BEGIN TRY
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Usuarios_Nombre_Usuario' AND object_id = OBJECT_ID('dbo.Usuarios'))
        CREATE UNIQUE INDEX UX_Usuarios_Nombre_Usuario ON dbo.Usuarios(Nombre_Usuario) WHERE Nombre_Usuario IS NOT NULL;
    PRINT 'OK  Usuarios: nombre de usuario unico';
END TRY
BEGIN CATCH PRINT 'ERROR nombre de usuario unico: ' + ERROR_MESSAGE(); END CATCH
GO

/* ==========================================================
   3. GATOS: raza, fecha de nacimiento y estado
   ========================================================== */
BEGIN TRY
    BEGIN TRAN;

    -- Razas que estaban escritas como texto y no existen en la tabla Raza
    INSERT INTO dbo.Raza (Nombre)
    SELECT DISTINCT LTRIM(RTRIM(g.Raza))
    FROM dbo.Gatos g
    WHERE g.Raza IS NOT NULL AND LTRIM(RTRIM(g.Raza)) <> N''
      AND NOT EXISTS (SELECT 1 FROM dbo.Raza r WHERE r.Nombre = LTRIM(RTRIM(g.Raza)));

    IF NOT EXISTS (SELECT 1 FROM dbo.Raza WHERE Nombre = N'Mestizo')
        INSERT INTO dbo.Raza (Nombre) VALUES (N'Mestizo');

    UPDATE g SET id_raza = r.id_raza
    FROM dbo.Gatos g JOIN dbo.Raza r ON r.Nombre = LTRIM(RTRIM(g.Raza))
    WHERE g.id_raza IS NULL;

    -- Los que no tenían raza quedan como Mestizo
    UPDATE dbo.Gatos SET id_raza = (SELECT id_raza FROM dbo.Raza WHERE Nombre = N'Mestizo') WHERE id_raza IS NULL;

    -- Fecha de nacimiento aproximada a partir de la edad en años
    UPDATE dbo.Gatos
    SET Fecha_Nacimiento = DATEADD(YEAR, -TRY_CAST(Edad AS INT), CAST(GETDATE() AS DATE))
    WHERE Fecha_Nacimiento IS NULL AND TRY_CAST(Edad AS INT) BETWEEN 0 AND 30;

    COMMIT;
    PRINT 'OK  Gatos: raza y fecha de nacimiento';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    PRINT 'ERROR Gatos (raza/fecha): ' + ERROR_MESSAGE();
END CATCH
GO

-- Estados que se van a cambiar (revisa que sean los esperados)
SELECT DISTINCT CAST(Estado AS NVARCHAR(50)) AS Estado_Actual
FROM dbo.Gatos
WHERE LOWER(LTRIM(RTRIM(CAST(Estado AS NVARCHAR(50))))) NOT IN (N'disponible', N'adoptado', N'en proceso', N'en tratamiento')
   OR Estado IS NULL;
GO

BEGIN TRY
    BEGIN TRAN;
    UPDATE dbo.Gatos
    SET Estado = CASE LOWER(LTRIM(RTRIM(CAST(Estado AS NVARCHAR(50)))))
                    WHEN N'disponible'     THEN N'Disponible'
                    WHEN N'adoptado'       THEN N'Adoptado'
                    WHEN N'en proceso'     THEN N'En proceso'
                    WHEN N'en tratamiento' THEN N'En tratamiento'
                    ELSE N'Disponible' END;

    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Gatos_Estado')
        ALTER TABLE dbo.Gatos ADD CONSTRAINT CK_Gatos_Estado
            CHECK (Estado IN (N'Disponible', N'En proceso', N'Adoptado', N'En tratamiento'));
    IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Gatos_Sexo')
        ALTER TABLE dbo.Gatos ADD CONSTRAINT CK_Gatos_Sexo CHECK (Sexo IN ('M', 'H'));

    COMMIT;
    PRINT 'OK  Gatos: estado y sexo';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    PRINT 'ERROR Gatos (estado): ' + ERROR_MESSAGE();
END CATCH
GO

/* ==========================================================
   4. SOLICITUDES -> Solicitudes_Adopciones (+ Adoptantes)
   ========================================================== */
BEGIN TRY
    BEGIN TRAN;

    -- Un registro de adoptante por cada usuario que hizo solicitudes
    INSERT INTO dbo.Adoptantes (id_usuario, Direccion)
    SELECT DISTINCT s.UsuarioId, N'Sin registrar'
    FROM dbo.Solicitudes s
    JOIN dbo.Usuarios u ON u.Id = s.UsuarioId
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Adoptantes a WHERE a.id_usuario = s.UsuarioId);

    ;WITH s AS (
        SELECT s.Id, s.GatoId, a.id_adoptante,
               ISNULL(TRY_CAST(s.Fecha AS DATETIME2), SYSDATETIME()) AS Fecha,
               CASE LOWER(LTRIM(RTRIM(CAST(s.Estado AS NVARCHAR(50)))))
                    WHEN N'pendiente'   THEN N'Pendiente'
                    WHEN N'en revisión' THEN N'En revisión'
                    WHEN N'aprobada'    THEN N'Aprobada'
                    WHEN N'aprobado'    THEN N'Aprobada'
                    WHEN N'rechazada'   THEN N'Rechazada'
                    WHEN N'rechazado'   THEN N'Rechazada'
                    WHEN N'cancelada'   THEN N'Cancelada'
                    ELSE N'Pendiente' END AS Estado
        FROM dbo.Solicitudes s
        JOIN dbo.Usuarios u    ON u.Id = s.UsuarioId
        JOIN dbo.Gatos g       ON g.Id = s.GatoId
        JOIN dbo.Adoptantes a  ON a.id_usuario = s.UsuarioId
    ), r AS (
        SELECT *, rn = ROW_NUMBER() OVER (
                   PARTITION BY id_adoptante, GatoId,
                                CASE WHEN Estado IN (N'Pendiente', N'En revisión') THEN 1 ELSE 0 END
                   ORDER BY Fecha, Id)
        FROM s
    )
    INSERT INTO dbo.Solicitudes_Adopciones (id_gato, id_adoptante, Fecha_Solicitud, Estado_Solicitud, Comentarios)
    SELECT GatoId, id_adoptante, Fecha,
           CASE WHEN Estado IN (N'Pendiente', N'En revisión') AND rn > 1 THEN N'Cancelada' ELSE Estado END,
           N'Migrada de Solicitudes (Id ' + CAST(Id AS NVARCHAR(10)) + N')'
    FROM r
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Solicitudes_Adopciones x
                      WHERE x.Comentarios = N'Migrada de Solicitudes (Id ' + CAST(r.Id AS NVARCHAR(10)) + N')');

    PRINT 'Solicitudes migradas: ' + CAST(@@ROWCOUNT AS VARCHAR(10));
    COMMIT;
    PRINT 'OK  Solicitudes migradas';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    PRINT 'ERROR Solicitudes: ' + ERROR_MESSAGE();
END CATCH
GO

-- Solicitudes que NO se pudieron migrar (usuario o gato inexistente)
SELECT s.* FROM dbo.Solicitudes s
WHERE NOT EXISTS (SELECT 1 FROM dbo.Usuarios u WHERE u.Id = s.UsuarioId)
   OR NOT EXISTS (SELECT 1 FROM dbo.Gatos g WHERE g.Id = s.GatoId);
GO

/* ==========================================================
   5. ADOPCIONES -> vincular con una solicitud aprobada
   ========================================================== */
BEGIN TRY
    BEGIN TRAN;

    IF OBJECT_ID('tempdb..#m') IS NOT NULL DROP TABLE #m;

    SELECT a.id AS id_adopcion,
           (SELECT MIN(g.Id) FROM dbo.Gatos g    WHERE g.Nombre = a.gato)    AS id_gato,
           (SELECT MIN(u.Id) FROM dbo.Usuarios u WHERE u.Nombre = a.usuario) AS id_usuario,
           a.fechaAdopcion
    INTO #m
    FROM dbo.Adopciones a
    WHERE a.id_solicitud IS NULL;

    DELETE FROM #m WHERE id_gato IS NULL OR id_usuario IS NULL;

    INSERT INTO dbo.Adoptantes (id_usuario, Direccion)
    SELECT DISTINCT m.id_usuario, N'Sin registrar'
    FROM #m m
    WHERE NOT EXISTS (SELECT 1 FROM dbo.Adoptantes x WHERE x.id_usuario = m.id_usuario);

    INSERT INTO dbo.Solicitudes_Adopciones (id_gato, id_adoptante, Fecha_Solicitud, Estado_Solicitud, Comentarios)
    SELECT m.id_gato, ad.id_adoptante, ISNULL(TRY_CAST(m.fechaAdopcion AS DATETIME2), SYSDATETIME()), N'Aprobada',
           N'Migrada de Adopciones (id ' + CAST(m.id_adopcion AS NVARCHAR(10)) + N')'
    FROM #m m
    JOIN dbo.Adoptantes ad ON ad.id_usuario = m.id_usuario;

    UPDATE a SET id_solicitud = s.id_solicitud
    FROM dbo.Adopciones a
    JOIN dbo.Solicitudes_Adopciones s
      ON s.Comentarios = N'Migrada de Adopciones (id ' + CAST(a.id AS NVARCHAR(10)) + N')'
    WHERE a.id_solicitud IS NULL;

    COMMIT;
    PRINT 'OK  Adopciones vinculadas a solicitudes';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK;
    PRINT 'ERROR Adopciones: ' + ERROR_MESSAGE();
END CATCH
GO

-- Adopciones que NO se pudieron vincular (el nombre del usuario o del gato no coincide)
SELECT id, usuario, gato, fechaAdopcion FROM dbo.Adopciones WHERE id_solicitud IS NULL;
GO

/* ==========================================================
   6. VERIFICACIÓN
   ========================================================== */
SELECT 'Usuarios' AS Tabla, COUNT(*) AS Filas FROM dbo.Usuarios
UNION ALL SELECT 'Adoptantes', COUNT(*) FROM dbo.Adoptantes
UNION ALL SELECT 'Gatos', COUNT(*) FROM dbo.Gatos
UNION ALL SELECT 'Gatos sin id_raza', COUNT(*) FROM dbo.Gatos WHERE id_raza IS NULL
UNION ALL SELECT 'Solicitudes (antigua)', COUNT(*) FROM dbo.Solicitudes
U