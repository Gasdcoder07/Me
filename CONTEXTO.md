**Rol y Contexto del Proyecto:**
Actúa como un Arquitecto de Software y Diseñador UI/UX experto especializado en React Native, Expo y Tailwind CSS. Tu tarea es diseñar y desarrollar el código para una aplicación móvil llamada "Mi" (o "My"). 

**Visión de la Aplicación:**
"Mi" es un "santuario digital" estrictamente personal. Es una bóveda minimalista, limpia y altamente segura donde el usuario guardará sus documentos importantes, claves bancarias, recordatorios y alarmas. La app tiene un enfoque "Local-First" (sin servidores externos, todo vive en el dispositivo) y depende de la autenticación biométrica (Face ID) para el acceso.

**Funcionalidades Core (MVP):**
1. **Autenticación y Seguridad:** Bloqueo de la app mediante Face ID (usando `expo-local-authentication`) y almacenamiento cifrado en el dispositivo (`expo-secure-store` para claves, SQLite/WatermelonDB para datos estructurados).
2. **Módulo de Identidad (Bóveda):** Gestor de contraseñas y credenciales bancarias.
3. **Módulo de Archivos:** Espacio para adjuntar y visualizar documentos vitales (PDFs, fotos de identificaciones).
4. **Módulo de Tiempo:** Sistema de alarmas y recordatorios utilizando notificaciones locales del dispositivo.

**Reglas de Diseño Estrictas (Design System):**
DEBES aplicar las siguientes reglas visuales en cada componente y pantalla que generes. No te desvíes de este sistema:

1. **La Paleta de Color y Contraste (Cromática)**
- Fondo General: Gris medio, neutro, mate e industrial (#808080 aprox.), para resaltar los lienzos.
- Lienzo de Pantallas (L1): Tono "off-white" o tiza muy claro y cálido, casi mate. No usar blanco puro.
- Color de Contenido Primario (On-L1): Negro puro o gris extremadamente oscuro para textos, formas y elementos activos.
- Color de Contenido Secundario: Gris medio-suave para subtítulos, bordes y estados inactivos.
- Foco de Atención: Bloques negros puros con texto en contraste (blanco/gris muy claro).
- Acentos de Color: Muy limitados (ej. amarillo/naranja para iconos específicos, rojo/coral para una línea de interfaz).

2. **Estructura, Formas y Layout (Geometría)**
- Contenedores Principales (Pantallas): Rectángulos flotantes con esquinas exageradamente redondeadas (border-radius de 32px a 40px).
- Tarjetas y Botones: Esquinas redondeadas generosas (16px a 24px).
- Margen y "Respiro": Amplio espacio libre. La información nunca toca los bordes físicos de la pantalla (padding/margin perimetral mínimo de 24px).
- Composición Vertical: Flujo de arriba hacia abajo, con espacio entre bloques para que la interfaz "respire".

3. **Tipografía y Jerarquía Visual**
- Familia Tipográfica: Sans-serif geométrica, moderna y limpia.
- Contrastes de Tamaño:
  - Titulares Gigantes (Display): Tamaño masivo y peso visual grueso (Bold) para datos cruciales.
  - Títulos de Sección: Medianos y con peso fuerte.
  - Cuerpo/Soporte: Pequeños con peso ligero o regular.
- Densidad Visual: Los textos gigantes deben tener un interlineado y tracking cerrado (compactos).

4. **Elementos Gráficos y UI**
- Iconografía: Líneas muy delgadas o formas geométricas simples. Uso de botones de acción circular con "+" o iconos minimalistas.
- Micro-ilustraciones: Agrupadas en carruseles horizontales con esquinas redondeadas.
- Líneas de Interconexión: Líneas finas continuas o punteadas con pequeños nodos para interconectar datos.

5. **Comportamiento, Estados e Interactividad**
- Navegación (Bottom Bar): Barra flotante o cápsula inferior (no adherida a los bordes) con botones circulares en alto contraste. El elemento activo resalta en color sólido/contrastante.
- Estados: 
  - Activo: Color sólido y opaco (ej. bloque negro).
  - Inactivo: Tonos grises claros, menor contraste o difuminados/transparentes.
- Selectores (Toggles): Contenedores alargados donde el estado activo es un bloque de color sólido.

6. **Efecto "Material" (Sombras y Profundidad)**
- Ausencia de 3D: Diseño completamente plano (Flat/Semi-Flat), sin biseles ni gradientes.
- Sombra de Elevación: Los contenedores flotantes llevan una sombra paralela (box-shadow) sumamente suave, casi invisible, con alto desenfoque (blur alto) para levitar sobre el fondo sin ensuciar la interfaz.

**Instrucción de Ejecución:**
Comienza proponiendo la estructura de carpetas del proyecto y genera el código de la pantalla principal (El Dashboard o Bóveda) construyendo los componentes base en React Native que sigan al pie de la letra estas reglas de estilo.