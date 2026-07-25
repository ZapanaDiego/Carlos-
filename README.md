# Carlos++: Visualizador Pedagógico de Memoria para C++

## 1. Contexto y Motivación

En la enseñanza de estructuras de datos y algoritmos, la comprensión del modelo de memoria subyacente (pila *stack*, montículo *heap*, punteros y administración dinámica) constituye una de las principales barreras conceptuales. Los estudiantes suelen enfrentar dificultades para:

- Distinguir entre variables locales (stack) y objetos dinámicos (heap).
- Interpretar correctamente las direcciones de memoria y las relaciones de punteros.
- Visualizar el efecto de operaciones como `new`, `delete`, paso por valor y paso por referencia.
- Detectar errores comunes (punteros colgantes, fugas de memoria, doble liberación).

Las herramientas convencionales de depuración (GDB, LLDB) están orientadas a la corrección de errores en código en producción, no al aprendizaje conceptual. Presentan información en formato textual, requieren conocimientos previos sobre la arquitectura del sistema y ofrecen poca o ninguna abstracción didáctica.

**Carlos++** es un visualizador de memoria de escritorio diseñado específicamente para la enseñanza de C++. A diferencia de los depuradores tradicionales, Carlos++ ofrece:

- Una representación gráfica y secuencial del estado de la memoria en cada paso de ejecución.
- Un modelo de simulación controlado que genera direcciones legibles y permite retroceder en el tiempo.
- Detección automática de errores conceptuales con explicaciones contextuales.
- Integración opcional de un asistente pedagógico basado en IA (desacoplado).

El proyecto se distribuye como una aplicación local autocontenida que no requiere instalación de compiladores ni entornos de desarrollo adicionales.

---

## 2. Enfoque de Simulación vs. Instrumentación

### 2.1. Decisión arquitectónica fundamental

Tras evaluar múltiples aproximaciones, Carlos++ opta por un **motor de simulación pura** en lugar de instrumentar la ejecución real con depuradores (GDB/LLDB). Esta decisión se fundamenta en los siguientes criterios:

| Aspecto | Instrumentación real | Simulación pura |
|---------|----------------------|-----------------|
| **Fidelidad al estándar** | Completa (ejecuta código compilado) | Limitada a un subconjunto definido |
| **Direcciones de memoria** | Aleatorias, dependientes del SO y del estado del sistema | Secuenciales, predecibles y pedagógicas (ej. `0x100`, `0x104`) |
| **Manejo de errores** | *Segmentation fault* aborta el proceso | Captura controlada, se muestra visualmente sin interrupción |
| **Capacidad de retroceso** | No nativa (requiere herramientas como `rr`, limitadas a Linux) | Almacena snapshots del estado, permite navegación hacia atrás |
| **Rendimiento en hardware académico** | Aceptable para programas cortos, pero con latencia por comunicación con el depurador | Muy bajo consumo de CPU y memoria (menos de 100 MB en reposo) |
| **Multiplataforma** | Depende de la disponibilidad de depuradores (GDB/LLDB) en cada SO | El motor es independiente del SO, solo requiere el ejecutable empaquetado |

**Conclusión:** La simulación pura sacrifica la cobertura total del lenguaje (soportamos un subconjunto acotado) a cambio de una experiencia educativa más controlada, legible y portable. Dado que el objetivo no es reemplazar un compilador ni un depurador de producción, sino facilitar la comprensión de estructuras de datos, el balance es favorable.

### 2.2. Subconjunto de C++ soportado

Para mantener la simulación manejable y centrada en los fundamentos de estructuras de datos, Carlos++ implementa el siguiente subconjunto del lenguaje:

**Soportado:**
- Tipos primitivos: `int`, `char`, `bool`, `float`, `double`.
- Punteros: declaración, asignación, desreferencia, aritmética básica, `nullptr`.
- Arrays estáticos y dinámicos (`new[]`/`delete[]`).
- `struct` y `class` con atributos públicos, constructores y métodos simples.
- Asignación dinámica: `new`, `delete`.
- Flujo de control: `if`/`else`, `while`, `for`.
- Funciones: definición y llamada, paso por valor y por referencia (punteros y referencias).
- Ámbitos anidados (frames de pila).

**Excluido (no soportado):**
- Biblioteca Estándar (STL): `std::vector`, `std::string`, `std::map`, etc.
- Plantillas (*templates*).
- Herencia múltiple y polimorfismo dinámico (virtual).
- Punteros inteligentes (`unique_ptr`, `shared_ptr`).
- Excepciones (`try`/`catch`).
- Lambdas y funciones de orden superior.
- `auto` y deducción de tipos avanzada.

Esta restricción no limita los casos de uso pedagógicos típicos (listas enlazadas, pilas, colas, árboles binarios, grafos, tablas hash implementadas con arreglos de punteros).

---

## 3. Arquitectura del Sistema

### 3.1. Diagrama general

```
+------------------------------------------------------------+
|                    FRONTEND (Tauri + TypeScript)            |
|  - Editor de código con resaltado de sintaxis.             |
|  - Visualización gráfica del Stack y Heap.                 |
|  - Controles de ejecución (paso a paso, continuar,       |
|    retroceder, reiniciar).                                |
|  - Panel de diagnóstico y mensajes de la IA.              |
+----------------------------+-------------------------------+
                             | IPC (JSON sobre stdio/WebSocket)
+----------------------------+-------------------------------+
|              MOTOR DE SIMULACIÓN (Python)                   |
|  - Parser: tree-sitter-cpp (genera AST).                  |
|  - Intérprete: recorre el AST y actualiza el estado.      |
|  - Modelo de memoria: Stack (frames), Heap (bloques).     |
|  - Generador de snapshots: estado completo en cada paso.  |
|  - Detector de errores: fugas, punteros colgados, etc.    |
+----------------------------+-------------------------------+
                             | (opcional)
+----------------------------+-------------------------------+
|          ASISTENTE IA (API externa, desacoplado)           |
|  - Recibe contexto (código, error, historial).           |
|  - Devuelve sugerencias y preguntas socráticas.          |
+------------------------------------------------------------+
```

### 3.2. Componentes detallados


#### 3.2.1. Frontend (Tauri + TypeScript)

- **Editor:** Integración de un componente de edición de código con resaltado de sintaxis para C++.
- **Canvas gráfico:** Uso de librerías de grafos avanzadas (Cytoscape.js o D3.js) para renderizar el mapa de memoria. Proporciona:
  - Layouts semánticos y automatizados (estructuras tipo "peine" para Tablas Hash, árboles jerárquicos y fuerzas elásticas para grafos).
  - Interactividad completa: arrastre de nodos, zoom adaptativo, paneo y selección de elementos.
  - Renderizado eficiente basado en diferencias (*diffs*) entre snapshots para evitar sobrecargar la interfaz.
- **Controles:** Botones para ejecución paso a paso, ejecución continua, retroceso (navegación por historial de snapshots) y reinicio.
- **Panel de diagnóstico:** Muestra el estado actual (variables locales, dirección de retorno, etc.) en formato textual y gráfico.

#### 3.2.2. Motor de Simulación (Python)

- **Parser (`tree-sitter-cpp`):** Genera un Árbol de Sintaxis Abstracta (AST) a partir del código fuente. No requiere un compilador completo; es ligero y rápido.
- **Intérprete:** Recorre el AST instrucción por instrucción, manteniendo un estado interno que incluye:
  - **Pila de frames:** Cada frame contiene variables locales, parámetros y puntero al frame padre.
  - **Heap:** Diccionario de bloques de memoria, cada uno con su dirección, tamaño, tipo (objeto/array), y contenido.
  - **Contador de referencias:** Para cada bloque, el intérprete lleva la cuenta de cuántos punteros activos apuntan a él.
- **Generación de snapshots:** Tras cada instrucción, se serializa el estado completo en un JSON. El motor implementa un sistema de **"puntos de control en bucles"**, permitiendo al usuario saltar iteraciones repetitivas de un `while` o `for` para ir directo al resultado de una inserción (clave para estructuras grandes como Tablas Hash).
- **Detección de errores:** El motor identifica en tiempo real:
  - Desreferencia de `nullptr`.
  - Acceso fuera de rango en arrays.
  - Pérdida de la última referencia a un bloque (fuga de memoria).
  - Doble liberación (`delete` sobre un puntero ya liberado).

#### 3.2.3. Asistente IA (Opcional)

El módulo de IA está desacoplado para no afectar al rendimiento del núcleo. Se activa únicamente cuando el estudiante lo solicita.

- **Diagnóstico local (sin IA):** El motor ya proporciona mensajes de error estructurados (ej. "Estás intentando acceder a un puntero nulo en la línea 12").
- **Consulta ampliada:** El estudiante puede hacer clic en "Ayuda" para enviar el código y el error a un modelo externo (Groq, Gemini) que genera preguntas guía o explicaciones en lenguaje natural.
- **Privacidad:** Al ser un módulo desacoplado, el usuario puede optar por no usarlo o configurar su propia clave de API.

---

## 4. Modelo de Memoria en la Simulación

### 4.1. Representación del Stack

El Stack se modela como una pila de `Frame`. Cada `Frame` incluye:

- `nombre`: identificador de la función (ej. `main`, `insertar`).
- `variables`: diccionario con el nombre y la información de cada variable local/parámetro.
- `pc`: número de línea actual (puntero de instrucción).
- `parent`: referencia al frame anterior (para el retorno de la función).

Las direcciones de las variables en el stack son secuenciales y decrecientes (simulando el crecimiento real hacia abajo): `0xFFF0`, `0xFFE8`, etc.

### 4.2. Representación del Heap

El Heap se modela como un diccionario indexado por dirección. Cada bloque de memoria contiene:

- `direccion`: identificador único (ej. `0x1000`).
- `tamaño`: número de bytes o elementos.
- `tipo`: `"objeto"` o `"array"`.
- `contenido`: para objetos, un diccionario con los valores de los atributos; para arrays, una lista de valores.
- `referencias`: contador de punteros activos que apuntan a este bloque.
- `creado_en_paso`: identificador del paso de ejecución en que se asignó.
- `liberado`: booleano que indica si ya se ejecutó `delete`.

### 4.3. Gestión de punteros

Cada variable de tipo puntero almacena una dirección (entero). El motor valida que la dirección corresponda a un bloque existente y no liberado antes de permitir la desreferencia. Esta validación es la base para detectar errores de puntero colgante.

---

## 5. Experiencia de Usuario (Flujo de Trabajo)

1. **Apertura:** El estudiante abre Carlos++ y ve un editor de código, un panel de visualización y controles.
2. **Escritura:** Escribe su código C++ (un solo archivo en la primera fase, soporte multiarchivo en fases posteriores).
3. **Inicio:** Pulsa "Ejecutar" para iniciar la simulación. El motor parsea el código, valida la sintaxis (mostrando errores de compilación simulada en el editor) y prepara el estado inicial.
4. **Paso a paso:** El estudiante avanza instrucción por instrucción. En cada paso:
   - El motor actualiza el Stack y el Heap.
   - El frontend renderiza los cambios: nuevas variables, modificaciones de valores, flechas entre punteros y bloques.
   - El panel de diagnóstico muestra mensajes contextuales.
5. **Errores:** Si el código comete un error (ej. `nullptr` desreferenciado), el motor lo captura y muestra una alerta visual sin detener la simulación (puede continuar o reiniciar).
6. **Asistencia:** Si el estudiante no entiende un error, puede solicitar ayuda al asistente IA, que generará preguntas guía (sin dar la solución directamente).

---

## 6. Plan de Desarrollo (Roadmap)

El desarrollo se organiza en iteraciones incrementales para asegurar la estabilidad y permitir ajustes tempranos:

### Fase 1: Prototipo funcional (MVP)
- Motor de simulación en Python con soporte para un único archivo `.cpp`.
- Subconjunto básico de C++ (primitivos, punteros, structs, control de flujo).
- Frontend mínimo en Tauri con Cytoscape.js mostrando Stack y Heap.
- Paso a paso, detección de fugas y punteros nulos.
- **Entregable:** Aplicación autocontenida que permite ejecutar y visualizar programas pequeños (listas enlazadas simples).

### Fase 2: Soporte multiarchivo y estructuras avanzadas
- Layouts avanzados para árboles, grafos y tablas hash (layouts jerárquicos y dirigidos por fuerzas).
- Integración opcional del asistente IA (API externa).
- **Entregable:** Capacidad para simular proyectos de estructura de datos de tamaño medio (50-100 nodos).

### Fase 3: Optimización y migración a Rust (exploración)
- Evaluación del rendimiento y consumo de recursos.
- Si se justifica, migración del motor de simulación a Rust para unificar el backend con Tauri (eliminando la dependencia del sidecar Python).
- Publicación en tiendas de aplicaciones para facilitar la distribución.

---

## 7. Instalación y Requisitos Técnicos

Carlos++ se distribuye como un binario autocontenido. No requiere que el usuario instale Python, compiladores ni bibliotecas adicionales.

**Requisitos mínimos:**
- **SO Soportados Oficialmente:** Windows 10/11 (x64) y distribuciones Linux.
- **RAM:** Recomendado 8 GB.
- **Almacenamiento:** ~300 MB libres.

**Modo de empleo:**
1. Descargar el instalador desde el repositorio de lanzamientos.
2. Ejecutar el instalador (no requiere privilegios de administrador en la mayoría de los casos).
3. Abrir Carlos++ y comenzar a escribir código.

---

## 8. Limitaciones Conocidas y Trabajo Futuro

- **Cobertura del lenguaje:** No se soporta STL ni plantillas. Esto es intencionado para enfocarse en fundamentos, pero puede ser una limitación para estudiantes que quieran visualizar código con estas características.
- **Rendimiento con programas grandes:** Aunque el motor es eficiente, simular más de 500 nodos con muchos pasos puede ralentizar el frontend (los snapshots se vuelven grandes). Se planea incorporar compresión de snapshots y modos de "ejecución rápida" para estos casos.
- **IA opcional:** El asistente requiere conexión a internet y una clave de API para servicios externos (se ofrecerán opciones gratuitas por defecto, como Groq o Gemini).

---

## 9. Contribuciones y Estado del Proyecto

Este proyecto está en fase de diseño y desarrollo inicial. Se invita a la comunidad educativa y de desarrollo a contribuir en:

- Ampliación del subconjunto de C++ soportado.
- Mejora de los algoritmos de layout para estructuras complejas.
- Integración de nuevos diagnósticos pedagógicos.
- Traducción y adaptación a otros idiomas.

El código fuente y el roadmap detallado están disponibles en el repositorio oficial (enlace). Las contribuciones deben seguir las guías de estilo y el proceso de revisión establecido.


