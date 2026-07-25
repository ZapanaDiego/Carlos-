carlospp/
├── schemas/                         # 🟢 CONTRATO ÚNICO (Single Source of Truth)
│   ├── ipc_protocol.schema.json     # Contrato JSON (incluye 'semantic_hint' por HeapBlock)
│   └── telemetry_log.schema.json    # Esquema único para logs estructurados
│
├── logs/                            # DIRECTORIO LOCAL DE AUDITORÍA (Gitignored en prod)
│   ├── .gitkeep
│   ├── carlospp_dev.log             # Log rotativo consolidado (Frontend + Rust + Python)
│   └── crash_dumps/                 # Volcados de estado cuando el motor Python falla
│
├── src-tauri/                       # Backend Tauri (Rust)
│   ├── src/
│   │   ├── main.rs                  # Entrada de Tauri
│   │   ├── commands.rs              # Comandos invocados desde la UI
│   │   ├── sidecar/                 # Capsulado: Manejo del Sidecar Python
│   │   │   ├── mod.rs
│   │   │   ├── dev_runner.rs        # Ejecuta 'python main.py' en desarrollo
│   │   │   └── prod_runner.rs       # Ejecuta el binario de PyInstaller en producción
│   │   ├── ipc/                     # Capsulado: Serialización y canal IPC
│   │   │   ├── mod.rs
│   │   │   └── validator.rs         # Valida JSONs contra el esquema antes de enviar a UI
│   │   └── observability/           # CAPSULADO: GESTOR CENTRAL DE LOGS EN RUST
│   │       ├── mod.rs
│   │       ├── logger.rs            # Escribe logs de Rust y Sidecar a file/stdout
│   │       └── sidecar_observer.rs  # Captura stderr/stdout de Python y emite eventos a React
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                             # Frontend (React + TypeScript)
│   ├── index.html
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── assets/                      # Estilos y recursos gráficos
│   │   ├── styles/
│   │   └── icons/
│   │
│   ├── features/                    # ARQUITECTURA POR MÓDULOS ENCAPSULADOS
│   │   │
│   │   ├── Editor/                  # Módulo: Editor de Código
│   │   │   ├── components/
│   │   │   │   ├── CodeEditor.tsx
│   │   │   │   └── LineHighlighter.tsx
│   │   │   └── hooks/useEditor.ts
│   │   │
│   │   ├── MemoryCanvas/            # Módulo: Visualizador Gráfico de Alto Rendimiento
│   │   │   ├── MemoryCanvas.tsx     # Contenedor principal de la vista
│   │   │   ├── core/
│   │   │   │   ├── CanvasEngine.ts  # 🟢 Wrapper y orquestador directo de Cytoscape.js
│   │   │   │   └── SnapshotDiff.ts  # Renderiza SOLO los cambios (clave para 50+ nodos)
│   │   │   ├── layouts/             # 🟢 Adaptadores y configuradores de Layouts Cytoscape.js
│   │   │   │   ├── HashTableLayout.ts   # Presets estrictos para Buckets y colisiones
│   │   │   │   ├── TreeLayout.ts        # Configuración Dagre / Jerárquico (Árboles/AVL)
│   │   │   │   ├── GraphLayout.ts       # Configuración Cose / Fuerza dirigida (Grafos)
│   │   │   │   └── LinkedListLayout.ts  # Alineación lineal horizontal/vertical
│   │   │   └── renderers/           # Personalización de estilos de nodos y bordes
│   │   │       ├── NodeElement.ts
│   │   │       └── PointerArrow.ts
│   │   │
│   │   ├── Controls/                # Módulo: Barra de Ejecución y Tiempos
│   │   │   ├── ControlBar.tsx
│   │   │   └── components/
│   │   │       ├── StepButton.tsx
│   │   │       ├── MacroSkipButton.tsx # Botón para saltar bucles largos en C++
│   │   │       └── SpeedSlider.tsx
│   │   │
│   │   ├── Diagnostics/             # Módulo: Inspección de Pila y Heap
│   │   │   ├── DiagnosticsPanel.tsx
│   │   │   └── components/
│   │   │       ├── StackFrameView.tsx
│   │   │       └── HeapBlockView.tsx
│   │   │
│   │   ├── DebugConsole/            # MÓDULO: CONSOLA DE DEPURACIÓN Y DEVTOOLS UI
│   │   │   ├── DebugConsolePanel.tsx # Panel desplegable inferior para ver logs en vivo
│   │   │   ├── components/
│   │   │   │   ├── LogViewer.tsx     # Visor de logs filtrable (INFO, WARN, ERROR)
│   │   │   │   ├── IPCTracker.tsx    # Inspector de mensajes JSON crudos
│   │   │   │   └── ASTViewer.tsx     # Inspector visual del árbol AST generado por Python
│   │   │   └── hooks/useDebugLogs.ts
│   │   │
│   │   └── AIAssistant/             # Módulo: Asistente Socrático
│   │       ├── AIAssistantPanel.tsx
│   │       └── components/
│   │           ├── ChatBubble.tsx
│   │           └── SuggestionCard.tsx
│   │
│   ├── services/                    # Capa de comunicación con el exterior
│   │   ├── SimulationService.ts
│   │   ├── TauriIPCAdapter.ts
│   │   ├── MockSimulationAdapter.ts
│   │   ├── AIService.ts
│   │   └── LoggerService.ts         # Captura errores no controlados de React y envía a Rust
│   │
│   ├── store/                       # Estado Global (Zustand)
│   │   ├── simulationStore.ts
│   │   ├── editorStore.ts
│   │   ├── uiStore.ts
│   │   └── logStore.ts              # Almacena el flujo de logs en tiempo real para la UI
│   │
│   ├── types/                       # Tipos globales derivados del IPC Schema
│   │   ├── memory.types.ts
│   │   ├── ipc.types.ts
│   │   └── log.types.ts
│   │
│   └── utils/                       # Funciones puras de formateo y math
│       ├── hex.ts                   # Convierte enteros a formato 0x1000
│       └── geometry.ts              # Cálculos auxiliares de dimensiones
│
├── engine/                          # Motor de Simulación (Python Sidecar)
│   ├── main.py                      # Punto de entrada I/O (stdin/stdout)
│   │
│   ├── core/                        # Núcleo de Ejecución de C++
│   │   ├── interpreter.py           # Orquestador del paso a paso
│   │   ├── ast_visitor.py           # Evaluador del AST de tree-sitter
│   │   ├── memory_manager.py        # Asignador ficticio de direcciones en Stack/Heap
│   │   └── step_compressor.py       # Agrupa iteraciones largas de bucles
│   │
│   ├── semantics/                   # DETECTOR INTELIGENTE DE ESTRUCTURAS
│   │   ├── structure_detector.py    # 🟢 Asigna 'semantic_hint' por HeapBlock (HASH_TABLE, TREE, etc.)
│   │   ├── graph_analyzer.py        # Identifica listas de adyacencia y componentes
│   │   └── cycle_detector.py        # 🟢 Detecta ciclos en listas, grafos y referencias circulares
│   │
│   ├── models/                      # Clases de Dominio Internas
│   │   ├── stack_frame.py
│   │   ├── heap_block.py            # Incluye propiedad semantic_hint opcional
│   │   └── snapshot.py
│   │
│   ├── parsers/                     # Integración con Tree-sitter
│   │   └── cpp_parser.py            # Parser optimizado para C++
│   │
│   ├── diagnostics/                 # Reglas pedagógicas de C++
│   │   ├── leak_detector.py         # Rastrea memoria no liberada
│   │   ├── null_pointer_guard.py    # Captura desreferencia de nullptr
│   │   └── out_of_bounds_guard.py   # Valida límites de arreglos
│   │
│   ├── observability/               # CAPSULADO: TELEMETRÍA Y DEPURACIÓN EN PYTHON
│   │   ├── __init__.py
│   │   ├── logger.py                # Único Logger estructurado JSON hacia stderr/file
│   │   ├── tracer.py                # Rastreador de hooks de ejecución paso a paso
│   │   └── crash_dump.py            # Genera snapshot completo en disco si Python falla
│   │
│   └── utils/
│       └── json_serializer.py
│
├── scripts/                         # Automatización
│   ├── build_engine.py              # PyInstaller script
│   └── validate_schemas.py          # Chequea que TS y Python sigan los esquemas JSON
│
├── tests/
│   ├── engine_cpp_samples/          # Casos reales de C++ (archivos de 200-300 líneas)
│   │   ├── hash_table_50_buckets.cpp
│   │   ├── graph_adjacency_list.cpp
│   │   └── doubly_linked_list.cpp
│   ├── unit/                        # Tests unitarios del motor Python
│   └── e2e/                         # Tests de interfaz
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md