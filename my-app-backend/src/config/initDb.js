import bcrypt from 'bcryptjs';
import { query } from './db.js';

/**
 * Catálogo base de Roles institucionales MSPAS
 */
const ROLES_INICIALES = [
  { id_rol: 1, nombre_rol: 'Administrador', descripcion: 'Gestión total del sistema, usuarios y reportes' },
  { id_rol: 2, nombre_rol: 'Médico General', descripcion: 'Evaluación gineco-obstétrica y emisión de boletas ARO' },
  { id_rol: 3, nombre_rol: 'Gineco-Obstetra', descripcion: 'Recepción hospitalaria de referencias y contrarreferencias' },
  { id_rol: 4, nombre_rol: 'Enfermería Profesional', descripcion: 'Captura de signos vitales y cribado de 25 factores' },
  { id_rol: 5, nombre_rol: 'Técnico en Salud Rural', descripcion: 'Captación comunitaria de gestantes en Suchitepéquez' },
  { id_rol: 6, nombre_rol: 'Digitador de Admisión', descripcion: 'Registro de expedientes y admisión de gestantes' }
];

/**
 * Catálogo base de Establecimientos de Salud en Suchitepéquez
 */
const ESTABLECIMIENTOS_INICIALES = [
  { id_establecimiento: 1, nombre_establecimiento: 'Hospital Nacional de Mazatenango', nivel_atencion: '2do Nivel', municipio: 'Mazatenango' },
  { id_establecimiento: 2, nombre_establecimiento: 'Centro de Salud Mazatenango (DDRISS)', nivel_atencion: '1er Nivel', municipio: 'Mazatenango' },
  { id_establecimiento: 3, nombre_establecimiento: 'Centro de Salud San Antonio Suchitepéquez', nivel_atencion: '1er Nivel', municipio: 'San Antonio Suchitepéquez' },
  { id_establecimiento: 4, nombre_establecimiento: 'Centro de Salud Chicacao', nivel_atencion: '1er Nivel', municipio: 'Chicacao' },
  { id_establecimiento: 5, nombre_establecimiento: 'Centro de Salud Cuyotenango', nivel_atencion: '1er Nivel', municipio: 'Cuyotenango' },
  { id_establecimiento: 6, nombre_establecimiento: 'Centro de Salud Patulul', nivel_atencion: '1er Nivel', municipio: 'Patulul' },
  { id_establecimiento: 7, nombre_establecimiento: 'Centro de Salud Santo Domingo Suchitepéquez', nivel_atencion: '1er Nivel', municipio: 'Santo Domingo Suchitepéquez' },
  { id_establecimiento: 8, nombre_establecimiento: 'Centro de Salud Samayac', nivel_atencion: '1er Nivel', municipio: 'Samayac' },
  { id_establecimiento: 9, nombre_establecimiento: 'Centro de Salud San Bernardino', nivel_atencion: '1er Nivel', municipio: 'San Bernardino' },
  { id_establecimiento: 10, nombre_establecimiento: 'Centro de Salud San Gabriel', nivel_atencion: '1er Nivel', municipio: 'San Gabriel' },
  { id_establecimiento: 11, nombre_establecimiento: 'Centro de Salud San Lorenzo', nivel_atencion: '1er Nivel', municipio: 'San Lorenzo' },
  { id_establecimiento: 12, nombre_establecimiento: 'Centro de Salud San Miguel Panán', nivel_atencion: '1er Nivel', municipio: 'San Miguel Panán' },
  { id_establecimiento: 13, nombre_establecimiento: 'Centro de Salud San Pablo Jocopilas', nivel_atencion: '1er Nivel', municipio: 'San Pablo Jocopilas' },
  { id_establecimiento: 14, nombre_establecimiento: 'Centro de Salud Santa Bárbara', nivel_atencion: '1er Nivel', municipio: 'Santa Bárbara' },
  { id_establecimiento: 15, nombre_establecimiento: 'Centro de Salud Santo Tomás La Unión', nivel_atencion: '1er Nivel', municipio: 'Santo Tomás La Unión' },
  { id_establecimiento: 16, nombre_establecimiento: 'Centro de Salud Zunilito', nivel_atencion: '1er Nivel', municipio: 'Zunilito' },
  { id_establecimiento: 17, nombre_establecimiento: 'Centro de Salud Pueblo Nuevo', nivel_atencion: '1er Nivel', municipio: 'Pueblo Nuevo' },
  { id_establecimiento: 18, nombre_establecimiento: 'Centro de Salud Río Bravo', nivel_atencion: '1er Nivel', municipio: 'Río Bravo' }
];

/**
 * Recrear y estructurar la base de datos limpia desde cero
 */
export const resetAndRecreateDatabase = async () => {
  console.log('Iniciando limpieza y recreación de la base de datos SIREP_MSPAS...');
  try {
    // 1. Eliminar tablas existentes en cascada
    await query(`
      DROP TABLE IF EXISTS contrarreferencias CASCADE;
      DROP TABLE IF EXISTS boleta_referencia CASCADE;
      DROP TABLE IF EXISTS indicador_detalle CASCADE;
      DROP TABLE IF EXISTS fichas_aro CASCADE;
      DROP TABLE IF EXISTS pacientes CASCADE;
      DROP TABLE IF EXISTS usuarios CASCADE;
      DROP TABLE IF EXISTS establecimientos CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
    `);

    // 2. Crear tabla roles
    await query(`
      CREATE TABLE roles (
        id_rol SERIAL PRIMARY KEY,
        nombre_rol VARCHAR(100) NOT NULL UNIQUE,
        descripcion TEXT
      );
    `);

    // 3. Crear tabla establecimientos
    await query(`
      CREATE TABLE establecimientos (
        id_establecimiento SERIAL PRIMARY KEY,
        nombre_establecimiento VARCHAR(200) NOT NULL UNIQUE,
        nivel_atencion VARCHAR(50) NOT NULL,
        municipio VARCHAR(100) NOT NULL
      );
    `);

    // 4. Crear tabla usuarios
    await query(`
      CREATE TABLE usuarios (
        id_usuario SERIAL PRIMARY KEY,
        nombres VARCHAR(150) NOT NULL,
        apellidos VARCHAR(150),
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        id_rol INTEGER NOT NULL REFERENCES roles(id_rol),
        rol VARCHAR(100),
        id_establecimiento INTEGER REFERENCES establecimientos(id_establecimiento),
        establecimiento VARCHAR(200),
        estado VARCHAR(20) DEFAULT 'ACTIVO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Crear tabla pacientes
    await query(`
      CREATE TABLE pacientes (
        id_paciente SERIAL PRIMARY KEY,
        cui_dpi VARCHAR(13) NOT NULL UNIQUE,
        dpi_cui VARCHAR(13),
        nombres VARCHAR(150) NOT NULL,
        apellidos VARCHAR(150) NOT NULL,
        fecha_nacimiento DATE NOT NULL,
        telefono VARCHAR(30),
        direccion TEXT,
        municipio VARCHAR(100) NOT NULL,
        comunidad VARCHAR(100),
        gestas_previas INTEGER DEFAULT 0,
        partos_previos INTEGER DEFAULT 0,
        cesareas_previas INTEGER DEFAULT 0,
        abortos_previos INTEGER DEFAULT 0,
        id_establecimiento_origen INTEGER REFERENCES establecimientos(id_establecimiento),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 6. Crear tabla fichas_aro
    await query(`
      CREATE TABLE fichas_aro (
        id_ficha SERIAL PRIMARY KEY,
        id_paciente INTEGER NOT NULL REFERENCES pacientes(id_paciente) ON DELETE CASCADE,
        id_usuario INTEGER REFERENCES usuarios(id_usuario),
        semanas_gestacion INTEGER NOT NULL,
        peso_kg NUMERIC(5,2),
        talla_cm NUMERIC(5,2),
        imc NUMERIC(4,2),
        estado_nutricional VARCHAR(50),
        presion_sistolica INTEGER NOT NULL,
        presion_diastolica INTEGER NOT NULL,
        frecuencia_cardiaca_fetal INTEGER,
        ind_01_edad_menor_20 BOOLEAN DEFAULT FALSE,
        ind_02_edad_mayor_35 BOOLEAN DEFAULT FALSE,
        ind_03_abortos_recurrentes BOOLEAN DEFAULT FALSE,
        ind_04_muerte_fetal_previa BOOLEAN DEFAULT FALSE,
        ind_05_parto_prematuro_previo BOOLEAN DEFAULT FALSE,
        ind_06_cesarea_previa BOOLEAN DEFAULT FALSE,
        ind_07_periodo_intergenesico_corto BOOLEAN DEFAULT FALSE,
        ind_08_gran_multipara BOOLEAN DEFAULT FALSE,
        ind_09_hta_cronica BOOLEAN DEFAULT FALSE,
        ind_10_diabetes BOOLEAN DEFAULT FALSE,
        ind_11_presion_alta_actual BOOLEAN DEFAULT FALSE,
        ind_12_hemorragia_1er_trim BOOLEAN DEFAULT FALSE,
        ind_13_hemorragia_2do_3er_trim BOOLEAN DEFAULT FALSE,
        ind_14_embarazo_multiple BOOLEAN DEFAULT FALSE,
        ind_15_presentacion_no_cefalica BOOLEAN DEFAULT FALSE,
        ind_16_ruptura_membranas BOOLEAN DEFAULT FALSE,
        ind_17_infeccion_urinaria BOOLEAN DEFAULT FALSE,
        ind_18_its_vih BOOLEAN DEFAULT FALSE,
        ind_19_talla_baja BOOLEAN DEFAULT FALSE,
        ind_20_desnutricion_imc_bajo BOOLEAN DEFAULT FALSE,
        ind_21_obesidad_imc_alto BOOLEAN DEFAULT FALSE,
        ind_22_anemia BOOLEAN DEFAULT FALSE,
        ind_23_cardiopatia_nefropatia BOOLEAN DEFAULT FALSE,
        ind_24_sin_control_prenatal BOOLEAN DEFAULT FALSE,
        ind_25_vulnerabilidad_violencia BOOLEAN DEFAULT FALSE,
        es_aro BOOLEAN NOT NULL DEFAULT FALSE,
        total_indicadores_activos INTEGER DEFAULT 0,
        observaciones_clinicas TEXT,
        fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 7. Crear tabla indicador_detalle
    await query(`
      CREATE TABLE indicador_detalle (
        id_detalle SERIAL PRIMARY KEY,
        id_ficha INTEGER NOT NULL REFERENCES fichas_aro(id_ficha) ON DELETE CASCADE,
        num_indicador INTEGER NOT NULL,
        nombre_indicador VARCHAR(200) NOT NULL,
        categoria VARCHAR(10) NOT NULL,
        valor_presente BOOLEAN NOT NULL DEFAULT FALSE
      );
    `);

    // 8. Crear tabla boleta_referencia
    await query(`
      CREATE TABLE boleta_referencia (
        id_boleta SERIAL PRIMARY KEY,
        id_ficha INTEGER NOT NULL REFERENCES fichas_aro(id_ficha) ON DELETE CASCADE,
        id_establecimiento_destino INTEGER REFERENCES establecimientos(id_establecimiento),
        codigo_correlativo VARCHAR(50) NOT NULL,
        fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ruta_pdf TEXT,
        estado_whatsapp VARCHAR(50) DEFAULT 'EN_COLA',
        estado_email VARCHAR(50) DEFAULT 'EN_COLA'
      );
    `);

    // 9. Crear tabla contrarreferencias
    await query(`
      CREATE TABLE contrarreferencias (
        id_contrarreferencia SERIAL PRIMARY KEY,
        id_boleta INTEGER NOT NULL REFERENCES boleta_referencia(id_boleta) ON DELETE CASCADE,
        id_usuario INTEGER REFERENCES usuarios(id_usuario),
        fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        diagnostico_ingreso TEXT,
        tratamiento_brindado TEXT,
        recomendaciones TEXT
      );
    `);

    // 10. Insertar Roles (Administrador = ID 1)
    for (const r of ROLES_INICIALES) {
      await query(
        `INSERT INTO roles (id_rol, nombre_rol, descripcion) VALUES ($1, $2, $3)`,
        [r.id_rol, r.nombre_rol, r.descripcion]
      );
    }
    await query(`SELECT setval('roles_id_rol_seq', (SELECT MAX(id_rol) FROM roles));`);

    // 11. Insertar Establecimientos
    for (const e of ESTABLECIMIENTOS_INICIALES) {
      await query(
        `INSERT INTO establecimientos (id_establecimiento, nombre_establecimiento, nivel_atencion, municipio) VALUES ($1, $2, $3, $4)`,
        [e.id_establecimiento, e.nombre_establecimiento, e.nivel_atencion, e.municipio]
      );
    }
    await query(`SELECT setval('establecimientos_id_establecimiento_seq', (SELECT MAX(id_establecimiento) FROM establecimientos));`);

    // 12. Insertar Usuario Administrador Inicial
    const adminSalt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Admin2026!', adminSalt);

    await query(`
      INSERT INTO usuarios (
        id_usuario,
        nombres,
        apellidos,
        email,
        password_hash,
        id_rol,
        rol,
        id_establecimiento,
        establecimiento,
        estado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      1,
      'Administrador',
      'MSPAS',
      'admin@mspas.gob.gt',
      adminPasswordHash,
      1,
      'Administrador',
      1,
      'Hospital Nacional de Mazatenango',
      'ACTIVO'
    ]);
    await query(`SELECT setval('usuarios_id_usuario_seq', (SELECT MAX(id_usuario) FROM usuarios));`);

    console.log('Base de datos SIREP_MSPAS recreada e inicializada exitosamente.');
    console.log('Usuario Administrador Inicial: admin@mspas.gob.gt / Admin2026!');
  } catch (error) {
    console.error('Error al recrear la base de datos:', error);
  }
};

/**
 * Inicialización normal al arrancar el servidor
 */
export const initDatabaseSchema = async () => {
  // Asegura que las tablas existan sin destruirlas en arranques ordinarios
  try {
    const checkRoles = await query("SELECT to_regclass('public.roles')");
    if (!checkRoles.rows[0].to_regclass) {
      await resetAndRecreateDatabase();
    } else {
      // Migración idempotente para asegurar columnas y cálculo de estado nutricional
      await query(`ALTER TABLE fichas_aro ADD COLUMN IF NOT EXISTS via_captura VARCHAR(30) DEFAULT 'WEB';`);
      await query(`ALTER TABLE fichas_aro ADD COLUMN IF NOT EXISTS estado_nutricional VARCHAR(50);`);
      await query(`
        UPDATE fichas_aro 
        SET estado_nutricional = CASE 
          WHEN imc < 18.5 THEN 'DESNUTRICION' 
          WHEN imc >= 18.5 AND imc <= 24.9 THEN 'NORMAL' 
          WHEN imc >= 25.0 AND imc <= 29.9 THEN 'SOBREPESO' 
          WHEN imc >= 30.0 THEN 'OBESIDAD' 
          ELSE 'NO_EVALUADO' 
        END 
        WHERE (estado_nutricional IS NULL OR estado_nutricional = '') AND imc IS NOT NULL;
      `);
    }
  } catch (error) {
    console.error('Error en initDatabaseSchema:', error);
  }
};
