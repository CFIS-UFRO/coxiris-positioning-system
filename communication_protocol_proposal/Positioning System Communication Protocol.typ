#set page(
  margin: (x: 2.5cm, y: 2.5cm),
)

#set text(
  size: 12pt,
  lang: "ES"
)

#set heading(numbering: "1.1")

#show heading: it => [
  #set block(above: 1.4em, below: 1em)
  #set text(weight: "bold")
  #it
]

#align(center)[
  #text(size: 18pt, weight: "bold")[Protocolo de Comunicación para el Sistema de Posicionamiento de COXIRIS]
  #v(1em)
  #text(size: 12pt)[17 de marzo de 2025]
  #v(0.5em)
  #text(size: 12pt)[Versión 1.0]
]

#outline(
  title: [Contenido],
  indent: auto,
)

#pagebreak()

= Introducción <intro>

Este documento detalla el protocolo de comunicación serial implementado para controlar el sistema de posicionamiento 3D de COXIRIS. El protocolo permite enviar comandos a través de una interfaz serial para realizar movimientos, consultar estados y diagnosticar errores en el sistema.

== Configuración de la Comunicación

La comunicación se realiza a través del puerto serial con los siguientes parámetros:

#align(center)[
  #table(
    columns: (auto, auto),
    inset: 10pt,
    align: (center, center),
    [*Parámetro*], [*Valor*],
    [Baud Rate], [115200],
    [Timeout], [50 ms],
    [Buffer de Comandos], [64 bytes],
  )
]

== Estructura General de los Comandos

Todos los comandos siguen la siguiente estructura:

```
COMANDO [parámetro1] [parámetro2] ... [parámetroN]
```

Características importantes:
- Los comandos no distinguen entre mayúsculas y minúsculas (se convierten a mayúsculas internamente), sin embargo el uso de mayúsculas es recomendado para distinguir los comandos de otros strings.
- Los espacios en blanco al inicio y al final son eliminados automáticamente.
- Los comandos deben terminar con un carácter de nueva línea (`\n` o `\r`).
- La longitud máxima de un comando (incluyendo parámetros) es de 63 caracteres.

== Estructura de las Respuestas

Las respuestas siguen el siguiente formato:
```
ACK [COMANDO]
[Resultados específicos del comando, incluyendo errores, si aplica]
DONE [COMANDO] [: Datos adicionales, si aplica]
```

== Estructura de los Mensajes de Error <error-structure>

Los errores siguen una estructura consistente para facilitar su interpretación:

```
ERROR: [mensaje]
```

Los errores siempre estarán entre un mensaje `ACK` y `DONE` por lo que pueden ser fácilmente asociados al comando al que pertenecen.

#pagebreak()

= Comandos del Protocolo <comandos>

== Comando HELP

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`HELP`],
  [*Parámetros:*], [Ninguno],
  [*Descripción:*], [Muestra un mensaje de ayuda con todos los comandos disponibles.],
  [*Respuesta:*], [
```
ACK HELP
[ERROR: error_description] (Si hay errores)
[Lista con todos los comandos disponibles junto con su descripción]
DONE HELP
```
  ]
)

== Comando SET_HOME

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`SET_HOME`],
  [*Parámetros:*], [Ninguno],
  [*Descripción:*], [Establece la posición actual como el origen del sistema de coordenadas (0,0,0).],
  [*Respuesta:*], [
```
ACK SET_HOME
[ERROR: error_description] (Si hay errores)
DONE SET_HOME
```
  ],
)

== Comando GO_HOME

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`GO_HOME`],
  [*Parámetros:*], [Ninguno],
  [*Descripción:*], [Mueve el sistema a la posición de origen (0,0,0).],
  [*Respuesta:*], [
```
ACK GO_HOME
[ERROR: error_description] (Si hay errores)
DONE GO_HOME
```
  ],
)

#pagebreak()

== Comando ABSOLUTE_MOVE

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`ABSOLUTE_MOVE x y z`],
  [*Parámetros:*], [
- `x`: Coordenada X absoluta (número decimal)
- `y`: Coordenada Y absoluta (número decimal)
- `z`: Coordenada Z absoluta (número decimal)
  ],
  [*Descripción:*], [Mueve el sistema a la posición absoluta especificada por las coordenadas X, Y, Z.],
  [*Respuesta Exitosa:*], [
```
ACK ABSOLUTE_MOVE
[ERROR: error_description] (Si hay errores)
DONE ABSOLUTE_MOVE
```
  ]
)

== Comando DELTA_MOVE

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`DELTA_MOVE dx dy dz`],
  [*Parámetros:*], [
- `dx`: Desplazamiento relativo en el eje X (número decimal)
- `dy`: Desplazamiento relativo en el eje Y (número decimal)
- `dz`: Desplazamiento relativo en el eje Z (número decimal)
  ],
  [*Descripción:*], [Mueve el sistema de manera relativa a la posición actual según los desplazamientos especificados.],
  [*Respuesta Exitosa:*], [
```
ACK DELTA_MOVE
[ERROR: error_description] (Si hay errores)
DONE DELTA_MOVE
```
  ]
)

== Comando GET_POSITION

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`GET_POSITION`],
  [*Parámetros:*], [Ninguno],
  [*Descripción:*], [Devuelve la posición actual del sistema.],
  [*Respuesta:*], [
```
ACK GET_POSITION
[ERROR: error_description] (Si hay errores)
DONE GET_POSITION: X Y Z
```
Donde X, Y, Z son las coordenadas actuales expresadas como números decimales separados por espacios.
  ],
)

#pagebreak()

== Comando SET_SPEED

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`SET_SPEED speed`],
  [*Parámetros:*], [
- `speed`: Velocidad de movimiento en mm/s (número decimal positivo).
  ],
  [*Descripción:*], [Establece la velocidad de movimiento del sistema.],
  [*Respuesta Exitosa:*], [
```
ACK SET_SPEED
[ERROR: error_description] (Si hay errores)
DONE SET_SPEED
```
  ]
)

== Comando GET_SPEED

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`GET_SPEED`],
  [*Parámetros:*], [Ninguno],
  [*Descripción:*], [Devuelve la velocidad actual de movimiento del sistema.],
  [*Respuesta:*], [
```
ACK GET_SPEED
[ERROR: error_description] (Si hay errores)
DONE GET_SPEED: speed
```
Donde `speed` es la velocidad actual en mm/s.
  ],
)

== Comando GET_MIN_SPEED

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`GET_MIN_SPEED`],
  [*Parámetros:*], [Ninguno],
  [*Descripción:*], [Devuelve la velocidad mínima permitida para el sistema.],
  [*Respuesta:*], [
```
ACK GET_MIN_SPEED
[ERROR: error_description] (Si hay errores)
DONE GET_MIN_SPEED: min_speed
```
Donde `min_speed` es la velocidad mínima en mm/s.
  ],
)

#pagebreak()

== Comando GET_MAX_SPEED

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`GET_MAX_SPEED`],
  [*Parámetros:*], [Ninguno],
  [*Descripción:*], [Devuelve la velocidad máxima permitida para el sistema.],
  [*Respuesta:*], [
```
ACK GET_MAX_SPEED
[ERROR: error_description] (Si hay errores)
DONE GET_MAX_SPEED: max_speed
```
Donde `max_speed` es la velocidad máxima en mm/s.
  ],
)

== Comando GET_ID

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`GET_ID`],
  [*Parámetros:*], [Ninguno],
  [*Descripción:*], [Devuelve el identificador único del dispositivo.],
  [*Respuesta:*], [
```
ACK GET_ID
[ERROR: error_description] (Si hay errores)
DONE GET_ID: DEVICE_ID
```
Donde `DEVICE_ID` es el identificador único del dispositivo (CX25F7TK9P).
  ],
)

== Comando CHECK_ERRORS

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Formato:*], [`CHECK_ERRORS`],
  [*Parámetros:*], [Ninguno],
  [*Descripción:*], [Realiza un diagnóstico del sistema y reporta cualquier error encontrado.],
  [*Respuesta:*], [
```
ACK CHECK_ERRORS
[ERROR: error_description] (Si hay errores)
DONE CHECK_ERRORS
```
  ],
)

#pagebreak()

= Referencia Rápida de Comandos

#align(center)[
  #table(
    columns: (auto, auto),
    inset: 10pt,
    align: (left, left),
    [*Formato*], [*Descripción*],
    [HELP], [Muestra la ayuda],
    [SET_HOME], [Establece la posición de origen],
    [GO_HOME], [Va a la posición de origen],
    [ABSOLUTE_MOVE x y z], [Movimiento a una posición absoluta],
    [DELTA_MOVE dx dy dz], [Movimiento relativo],
    [GET_POSITION], [Obtiene la posición actual],
    [SET_SPEED speed], [Establece la velocidad],
    [GET_SPEED], [Obtiene la velocidad actual],
    [GET_MIN_SPEED], [Obtiene la velocidad mínima],
    [GET_MAX_SPEED], [Obtiene la velocidad máxima],
    [GET_ID], [Obtiene el identificador único del dispositivo (CX25F7TK9P)],
    [CHECK_ERRORS], [Diagnostica errores],
  )
]

#pagebreak()

= Librería CommandParser

Para facilitar la integración del protocolo descrito, se ha desarrollado una librería para Arduino llamada `CommandParser`. Esta librería está ubicada en la carpeta `CommandParser`.

== Estructura de la Librería

La librería está organizada de la siguiente manera:

#align(center)[
  #table(
    columns: (auto, auto),
    inset: 10pt,
    align: (left, left),
    [*Archivo*], [*Descripción*],
    [CommandParser.h], [Archivo de cabecera que contiene las definiciones de la clase.],
    [CommandParser.cpp], [Implementación de la clase CommandParser.],
    [keywords.txt], [Palabras clave para resaltado de sintaxis en el IDE de Arduino.],
  )
]

== Instalación de la Librería

Para instalar la librería se deben seguir estos pasos:

1. Copiar la carpeta `CommandParser` a la carpeta `libraries` dentro de la carpeta de instalación de Arduino.
2. Reiniciar el IDE de Arduino si está abierto.
3. La librería estará disponible en el menú `Sketch > Include Library`.

También se puede instalar la librería directamente desde el IDE de Arduino:

1. Compirmir la carpeta `CommandParser` como un `.zip`.
2. En el IDE de Arduino, ir a `Sketch > Include Library > Add .ZIP Library`.
3. Seleccionar el archivo `ZIP`.

== Uso de la Librería

La librería CommandParser facilita la implementación del protocolo de comunicación serial descrito en este documento en un proyecto Arduino. Una vez implementada, el sistema podrá recibir y procesar todos los comandos especificados en el protocolo a través del puerto serial.

```cpp
#include <CommandParser.h>

// Crear una instancia de CommandParser
CommandParser parser;

void setup() {
  // Inicializar la librería
  parser.begin();
  
  // Configurar los callbacks
  parser.config(
    setHomeCallback,
    goHomeCallback,
    absoluteMoveCallback,
    deltaMoveCallback,
    getPositionCallback,
    setSpeedCallback,
    getSpeedCallback,
    getMinSpeedCallback,
    getMaxSpeedCallback,
    checkErrorsCallback
  );
}

void loop() {
  // Leer y procesar comandos seriales
  parser.read();
}
```

== Configuración de Funciones Callback

La librería utiliza un sistema de callbacks para procesar los comandos. El usuario debe implementar estas funciones con las firmas descritas a continuación:

#table(
  columns: (auto, 1fr),
  inset: 10pt,
  stroke: 0.5pt,
  [*Función Callback*], [*Firma*],
  [setHomeCallback], [`void setHomeCallback()`],
  [goHomeCallback], [`void goHomeCallback()`],
  [absoluteMoveCallback], [`void absoluteMoveCallback(float &x, float &y, float &z)`],
  [deltaMoveCallback], [`void deltaMoveCallback(float &dx, float &dy, float &dz)`],
  [getPositionCallback], [`void getPositionCallback(float &x, float &y, float &z)`],
  [setSpeedCallback], [`void setSpeedCallback(float &speed)`],
  [getSpeedCallback], [`void getSpeedCallback(float &speed)`],
  [getMinSpeedCallback], [`void getMinSpeedCallback(float &minSpeed)`],
  [getMaxSpeedCallback], [`void getMaxSpeedCallback(float &maxSpeed)`],
  [checkErrorsCallback], [`void checkErrorsCallback()`]
)

== Errores en las funciones Callback

Cualquier error dentro de una función callback se debe implementar siguiendo el formato definido en la sección @error-structure. Esto en Arduino se puede lograr mediante el siguiente código:
```cpp
Serial.print("ERROR: ");
Serial.println(errorMessage);
```