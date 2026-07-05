-- ============================================================================
--  Esquema SQL Server para verificacion de certificados farmaceuticos.
--  Ejecutado automaticamente por `npm run db:seed` (sin sentencias GO).
-- ============================================================================

IF OBJECT_ID('dbo.Establecimientos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Establecimientos (
        CertificadoId          UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        Ruc                    NVARCHAR(11)   NOT NULL,
        NombreComercial        NVARCHAR(200)  NOT NULL,
        RazonSocial            NVARCHAR(200)  NOT NULL,
        Direccion              NVARCHAR(400)  NOT NULL,
        Ubicacion              NVARCHAR(200)  NOT NULL,
        DirectorTecnico        NVARCHAR(200)  NOT NULL,
        NumeroColegiatura      NVARCHAR(50)   NOT NULL,
        EstadoColegiatura      NVARCHAR(20)   NOT NULL,
        HorarioDT              NVARCHAR(200)  NOT NULL,
        EstadoEstablecimiento  NVARCHAR(20)   NOT NULL,
        EmitidoEn              DATETIME2      NOT NULL,
        EstadoRegistro         NVARCHAR(20)   NOT NULL CONSTRAINT DF_Est_EstadoRegistro DEFAULT 'VALIDO',
        BatchId                NVARCHAR(66)   NULL,
        Proof                  NVARCHAR(MAX)  NULL,
        ActualizadoEn          DATETIME2      NOT NULL CONSTRAINT DF_Est_ActualizadoEn DEFAULT SYSUTCDATETIME()
    );
    CREATE INDEX IX_Establecimientos_BatchId ON dbo.Establecimientos (BatchId);
    CREATE INDEX IX_Establecimientos_EstadoRegistro ON dbo.Establecimientos (EstadoRegistro);
END;

-- Migracion: columna Ubicacion en tablas creadas antes de este cambio.
IF OBJECT_ID('dbo.Establecimientos', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.Establecimientos', 'Ubicacion') IS NULL
BEGIN
    ALTER TABLE dbo.Establecimientos ADD Ubicacion NVARCHAR(200) NOT NULL
        CONSTRAINT DF_Est_Ubicacion DEFAULT '';
END;

IF OBJECT_ID('dbo.Lotes', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Lotes (
        BatchId         NVARCHAR(66)  NOT NULL PRIMARY KEY,
        BatchUuid       NVARCHAR(36)  NOT NULL,
        MerkleRoot      NVARCHAR(66)  NOT NULL,
        TxHash          NVARCHAR(66)  NULL,
        BlockNumber     BIGINT        NULL,
        Red             NVARCHAR(30)  NOT NULL,
        TotalRegistros  INT           NOT NULL CONSTRAINT DF_Lotes_Total DEFAULT 0,
        Estado          NVARCHAR(20)  NOT NULL CONSTRAINT DF_Lotes_Estado DEFAULT 'PENDIENTE',
        AncladoEn       DATETIME2     NOT NULL CONSTRAINT DF_Lotes_AncladoEn DEFAULT SYSUTCDATETIME()
    );
END;
