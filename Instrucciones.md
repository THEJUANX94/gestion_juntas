# Instrucciones de Desarrollo: Actualización de Sistema de Auto Resolutorio

Este documento contiene las instrucciones detalladas para modificar el comportamiento del flujo de "Auto Resolutorio" tanto en el Frontend como en el Backend.

## 1. Gestión de Roles y Permisos

### Requerimientos de Acceso:
- **Nuevo Rol `GeneracionAuto`**: Debe heredar todos los permisos actuales del rol `auxiliar`. Configura tanto el control de acceso en el Frontend (rutas y componentes) como los middlewares de autorización en el Backend.
- **Modificación Rol `auxiliar`**: Se debe restringir el acceso al botón de "Autoresolutorio". El usuario con rol `auxiliar` ya no debe ver ni poder ejecutar esta acción.

## 2. Modificaciones en el Modelo de Datos (Base de Datos)

Para cumplir con el rastreo de autoría:
- Modifica el modelo de la entidad/tabla de documentos (o la entidad que corresponda al Auto Resolutorio) para añadir el campo `ultimo_editor` o `elaborado_por`.
- Asegúrate de que este campo almacene una referencia al usuario o el nombre completo del último usuario que realizó una edición antes de la generación.

## 3. Lógica de Generación de PDF (Autoresolutorio)

Modifica el servicio de generación de PDF con las siguientes reglas de negocio:

### Clasificación de Comisiones:
El apartado de comisiones debe dividirse estrictamente en tres categorías basadas en el nombre de la comisión de los mandatarios:
1.  **COMISIÓN DE CONVIVENCIA Y CONCILIACIÓN**: Si el nombre contiene "Convivencia" o "Conciliación".
2.  **COMISION EMPRESARIAL**: Si el nombre contiene "Empresarial".
3.  **COMISIONES DE TRABAJO**: Para cualquier otra comisión que no encaje en las dos anteriores.

### Orden de la Tabla:
- En la tabla de dignatarios/miembros, el usuario con el cargo de **Presidente** debe posicionarse siempre en la primera fila (índice 0).

### Información de Firma y Autoría:
- **Firmante**: Cambiar el cargo y nombre del firmante de "Secretaría de Gobierno y Participación" a **"Directora de Participación y Acción Comunal"**.
- **Sección Pie de Página (Elaboró/Generó)**:
    - Cambiar la etiqueta "elaboró - revisó" por **"Elaboró y generó"**.
    - **Generó**: Debe mostrar el nombre completo del usuario que está ejecutando la acción (extraer del token de sesión/JWT).
    - **Elaboró**: Debe mostrar el nombre de la última persona que editó el documento (usando el campo del modelo creado en el punto 2).

## 4. Cambios en el Frontend

### Pantalla de Información (QR):
- Localiza el componente que muestra la información del documento al escanear el QR.
- Añade los campos visuales:
    - **Elaborado por**: [Nombre del último editor]
    - **Generado por**: [Nombre de quien pulsó el botón autoresolutorio]

### Implementación de Captura:
- Al momento de pulsar el botón "Autoresolutorio", el sistema debe capturar el nombre del usuario actual del token y enviarlo al backend o guardarlo en el estado correspondiente para que persista en el documento final.

## 5. Verificación
- Verifica que si una comisión se llama "Comisión de Salud", esta se clasifique correctamente en "Comisiones de Trabajo".
- Verifica que el Presidente aparezca de primero incluso si fue el último en ser agregado a la lista.
"""