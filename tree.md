carlos-cpp/
├── backend/
│   ├── include/
│   │   ├── httplib.h
│   │   └── json.hpp
│   ├── src/
│   │   ├── main.cpp
│   │   ├── parser/
│   │   │   ├── cpp_parser.h
│   │   │   └── cpp_parser.cpp
│   │   ├── interpreter/
│   │   │   ├── interpreter.h
│   │   │   └── interpreter.cpp
│   │   ├── memory/
│   │   │   ├── memory_manager.h
│   │   │   ├── memory_manager.cpp
│   │   │   ├── snapshot.h
│   │   │   └── snapshot.cpp
│   │   └── api/
│   │       ├── routes.h
│   │       └── routes.cpp
│   └── CMakeLists.txt
│
├── frontend/
│   ├── index.html                  # Punto de entrada único, servido en "/"
│   ├── css/
│   │   └── style.css
│   │
│   ├── lessons/
│   │   ├── html/
│   │   │   ├── array.html
│   │   │   └── linked-list.html
│   │   └── js/
│   │       ├── arrayView.js
│   │       └── linkedListView.js
│   │
│   └── simulator/                  # Depende del backend en C++
│       ├── simulator.html          # Contenedor de las 3 zonas
│       └── js/
│           ├── editor.js           # Zona 1: donde se escribe el código
│           ├── execution.js        # Zona 2: output + controles de paso a paso
│           ├── canvasView.js       # Zona 3: cajas de memoria (Stack/Heap)
│           └── api.js              # fetch() hacia el backend — solo lo usa el simulador
│
├── docs/
│   └── memory-model.md
│
└── README.md