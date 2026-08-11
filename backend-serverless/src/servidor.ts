import os from "node:os";

import express from "express";
import type { Request, Response } from "express";
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

import { manejador as manejadorAcceso } from "./acceso/api.js";
import { manejador as manejadorProfesor } from "./profesor/api.js";
import { manejador as manejadorSesiones } from "./sesiones/api.js";
import { manejador as manejadorFase1 } from "./fase1/api.js";
import { manejador as manejadorFase2 } from "./fase2/api.js";
import { manejador as manejadorFase3 } from "./fase3/api.js";
import { manejador as manejadorFase4 } from "./fase4/api.js";
import { manejador as manejadorFase5 } from "./fase5/api.js";

type Manejador = (
  event: APIGatewayProxyEventV2,
) => Promise<APIGatewayProxyResultV2>;

interface RespuestaLambda {
  statusCode?: number;
  headers?: Record<string, string>;
  body?: string;
}

const PUERTO = Number(process.env.PUERTO || 3000);

const RUTA_FRONTEND =
  process.env.RUTA_FRONTEND || "/opt/mision/frontend";

const RUTAS: Array<[string, Manejador]> = [
  ["/api/acceso/", manejadorAcceso],
  ["/api/profesor/", manejadorProfesor],
  ["/api/sesiones/", manejadorSesiones],
  ["/api/fase1/", manejadorFase1],
  ["/api/fase2/", manejadorFase2],
  ["/api/fase3/", manejadorFase3],
  ["/api/fase4/", manejadorFase4],
  ["/api/fase5/", manejadorFase5],
];

function normalizarCabeceras(
  cabeceras: Request["headers"],
): Record<string, string> {
  const resultado: Record<string, string> = {};

  for (const [clave, valor] of Object.entries(cabeceras)) {
    if (typeof valor === "string") {
      resultado[clave.toLowerCase()] = valor;
    } else if (Array.isArray(valor)) {
      resultado[clave.toLowerCase()] = valor.join(",");
    }
  }

  return resultado;
}

function normalizarConsulta(
  consulta: Request["query"],
): Record<string, string> {
  const resultado: Record<string, string> = {};

  for (const [clave, valor] of Object.entries(consulta)) {
    if (typeof valor === "string") {
      resultado[clave] = valor;
    }
  }

  return resultado;
}

function construirEvento(req: Request): APIGatewayProxyEventV2 {
  const cuerpo =
    typeof req.body === "string" && req.body.length > 0
      ? req.body
      : undefined;

  return {
    version: "2.0",
    routeKey: "$default",
    rawPath: req.path,
    rawQueryString: "",
    headers: normalizarCabeceras(req.headers),
    queryStringParameters: normalizarConsulta(req.query),
    requestContext: {
      http: {
        method: req.method,
        path: req.path,
        protocol: "HTTP/1.1",
        sourceIp: req.ip || "",
        userAgent: req.get("user-agent") || "",
      },
    },
    body: cuerpo,
    isBase64Encoded: false,
  } as unknown as APIGatewayProxyEventV2;
}

async function despachar(
  manejador: Manejador,
  req: Request,
  res: Response,
): Promise<void> {
  const resultado = (await manejador(
    construirEvento(req),
  )) as RespuestaLambda;

  res.status(resultado.statusCode ?? 200);

  for (const [clave, valor] of Object.entries(
    resultado.headers ?? {},
  )) {
    res.setHeader(clave, valor);
  }

  res.send(resultado.body ?? "");
}

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);

app.use(express.text({ type: "*/*", limit: "1mb" }));

app.get("/salud", (_req, res) => {
  res.status(200).json({
    ok: true,
    instancia: os.hostname(),
    fecha: new Date().toISOString(),
  });
});

app.use((req, res, next) => {
  const entrada = RUTAS.find(([prefijo]) =>
    req.path.startsWith(prefijo),
  );

  if (!entrada) {
    next();
    return;
  }

  despachar(entrada[1], req, res).catch((error: unknown) => {
    console.error("Error al despachar la petición:", error);

    res.status(500).json({
      ok: false,
      codigo: "ERROR_INTERNO",
      error: "Ocurrió un error interno",
    });
  });
});

app.use(express.static(RUTA_FRONTEND));

app.use((_req, res) => {
  res.status(404).json({
    ok: false,
    error: "Ruta no encontrada",
  });
});

app.listen(PUERTO, "0.0.0.0", () => {
  console.log(
    `Servidor de Misión Emprende escuchando en el puerto ${PUERTO}`,
  );
  console.log(`Instancia: ${os.hostname()}`);
  console.log(
    `Endpoint de base de datos: ${process.env.DYNAMODB_ENDPOINT || "(no definido)"}`,
  );
});
