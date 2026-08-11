# Backend serverless — Misión Emprende UDD

Este proyecto es el backend nuevo de Misión Emprende. No usa Django ni Python.

## Tecnologías

- TypeScript y Node.js para las Lambdas.
- API Gateway para las rutas HTTP.
- DynamoDB para la base de datos.
- AWS SAM para construir y desplegar todo.

## Estructura simplificada

```text
backend-serverless/
├── src/
│   ├── compartido/
│   │   ├── baseDatos.ts
│   │   ├── respuestas.ts
│   │   └── seguridad.ts
│   ├── acceso/
│   │   ├── api.ts
│   │   ├── servicio.ts
│   │   └── repositorio.ts
│   ├── sesiones/
│   │   ├── api.ts
│   │   ├── servicio.ts
│   │   └── repositorio.ts
│   └── fase1/
│       ├── api.ts
│       ├── servicio.ts
│       └── repositorio.ts
├── scripts/
│   └── prepararLocal.ts
├── pruebas/
│   └── fase1.test.ts
├── template.yaml
├── package.json
└── tsconfig.json
```

Cada módulo tiene solamente tres archivos:

- `api.ts`: recibe la petición de API Gateway y responde JSON.
- `servicio.ts`: contiene las reglas del juego.
- `repositorio.ts`: lee y guarda información en DynamoDB.

No hace falta separarlo más por ahora.

## Rutas incluidas

| Método | Ruta | Función |
|---|---|---|
| POST | `/api/acceso/ingresar` | Ingresar con código de grupo |
| GET | `/api/sesiones/actual` | Consultar sesión y grupo actual |
| GET | `/api/fase1/estado` | Consultar estado de Fase 1 |
| POST | `/api/fase1/palabras` | Registrar palabra encontrada |
| POST | `/api/fase1/completar` | Completar la sopa de letras |

Las rutas protegidas requieren este encabezado:

```text
Authorization: Bearer TOKEN
```

El token se obtiene con `/api/acceso/ingresar`.

## 1. Instalar dependencias

```bash
cd backend-serverless
npm install
```

## 2. Verificar el proyecto

```bash
npm run verificar
```

Este comando revisa TypeScript, ejecuta las pruebas y comprueba que los tres módulos puedan empaquetarse.

## 3. Probar con DynamoDB local

Levanta DynamoDB:

```bash
npm run local:base
```

Crea la tabla y carga dos grupos de prueba:

```bash
npm run local:preparar
```

Copia el archivo de variables:

```bash
cp env.local.example.json env.local.json
```

Construye el proyecto:

```bash
npm run construir
```

Levanta la API local:

```bash
npm run local:api
```

La API quedará normalmente en:

```text
http://127.0.0.1:3000
```

Códigos de prueba:

```text
ABC123
XYZ789
```

## 4. Probar el ingreso

```bash
curl -X POST http://127.0.0.1:3000/api/acceso/ingresar \
  -H "Content-Type: application/json" \
  -d '{"codigo":"ABC123"}'
```

La respuesta entrega un `token`. Para consultar la sesión:

```bash
curl http://127.0.0.1:3000/api/sesiones/actual \
  -H "Authorization: Bearer TU_TOKEN"
```

## 5. Subir a AWS

Cuando funcione localmente:

```bash
sam build
sam deploy --guided
```

SAM crea automáticamente:

- API Gateway.
- Tres Lambdas: acceso, sesiones y Fase 1.
- Una tabla DynamoDB.
- Permisos para que las Lambdas usen la tabla.

No se conecta a una instancia EC2. Todo se despliega directamente en servicios serverless de AWS.

## Cómo agregar Fase 2 después

Se crea solamente:

```text
src/fase2/
├── api.ts
├── servicio.ts
└── repositorio.ts
```

Después se agrega `FuncionFase2` y sus rutas en `template.yaml`.
