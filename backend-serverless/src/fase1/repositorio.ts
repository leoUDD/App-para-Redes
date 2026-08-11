import {
  ConditionalCheckFailedException,
  TransactionCanceledException,
} from "@aws-sdk/client-dynamodb";
import {
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  baseDatos,
  nombreTabla,
} from "../compartido/baseDatos.js";

export type ModoEquipo = "primera_vez" | "conocidos";
export type EtapaLista = "conocidos" | "pre_sopa";

export interface SesionFase1 {
  sesionId: string;
  fase: string;
  totalGrupos: number;
  gruposListosConocidos?: number;
  gruposListosF1?: number;
  gruposSopaCompletada: number;
  conocidosActividadIniciada?: boolean;
  conocidosTimerInicio?: string;
  conocidosTimerFin?: string;
  primerGrupoSopaId?: string;
  timerCorriendo?: boolean;
  segundosRestantes?: number;
  timerInicio?: string;
  timerFin?: string;
}

export interface GrupoFase1 {
  grupoId: string;
  nombreGrupo: string;
  tokens: number;
  modoEquipo?: ModoEquipo;
  listoConocidos?: boolean;
  listoF1?: boolean;
  sopaCompletada: boolean;
  sopaTiempoSegundos?: number;
  fechaSopaCompletada?: string;
}

export interface DatosMarcarListo {
  sesionId: string;
  grupoId: string;
  etapa: EtapaLista;
  cantidadEsperada: number;
  nuevaCantidad: number;
  todosListos: boolean;
  ahora: string;
  timerFin?: string;
}

export interface DatosCompletarSopa {
  sesionId: string;
  grupoId: string;
  cantidadEsperada: number;
  nuevaCantidad: number;
  esPrimerGrupo: boolean;
  todosCompletaron: boolean;
  bonificacion: number;
  segundosTranscurridos?: number;
}

export interface RepositorioFase1 {
  buscarSesion(sesionId: string): Promise<SesionFase1 | null>;
  buscarGrupo(
    sesionId: string,
    grupoId: string,
  ): Promise<GrupoFase1 | null>;
  listarGrupos?(sesionId: string): Promise<GrupoFase1[]>;
  listarPalabras(
    sesionId: string,
    grupoId: string,
  ): Promise<string[]>;
  palabraExiste(
    sesionId: string,
    grupoId: string,
    palabra: string,
  ): Promise<boolean>;
  iniciarFaseAtomica?(sesionId: string): Promise<boolean>;
  guardarModoEquipo?(
    sesionId: string,
    grupoId: string,
    modo: ModoEquipo,
  ): Promise<void>;
  marcarListoAtomico?(
    datos: DatosMarcarListo,
  ): Promise<boolean>;
  finalizarConocidosAtomico?(
    sesionId: string,
    ahora: string,
  ): Promise<boolean>;
  registrarPalabraAtomica(
    sesionId: string,
    grupoId: string,
    palabra: string,
    recompensa: number,
  ): Promise<boolean>;
  completarSopaAtomica(
    datos: DatosCompletarSopa,
  ): Promise<boolean>;
}

const claveSesion = (sesionId: string) => ({
  PK: `SESION#${sesionId}`,
  SK: "METADATOS",
});

const claveGrupo = (
  sesionId: string,
  grupoId: string,
) => ({
  PK: `SESION#${sesionId}`,
  SK: `GRUPO#${grupoId}`,
});

const clavePalabra = (
  sesionId: string,
  grupoId: string,
  palabra: string,
) => ({
  PK: `GRUPO#${sesionId}#${grupoId}`,
  SK: `PALABRA#${palabra}`,
});

function convertirGrupo(
  item: Record<string, unknown>,
): GrupoFase1 {
  const modoRecibido = String(item.modoEquipo || "");
  const modoEquipo =
    modoRecibido === "primera_vez" ||
    modoRecibido === "conocidos"
      ? modoRecibido
      : undefined;

  return {
    grupoId: String(item.grupoId || ""),
    nombreGrupo: String(item.nombreGrupo || "Grupo"),
    tokens: Number(item.tokens || 0),
    ...(modoEquipo ? { modoEquipo } : {}),
    listoConocidos: Boolean(item.listoConocidos),
    listoF1: Boolean(item.listoF1),
    sopaCompletada: Boolean(item.sopaCompletada),
    ...(item.sopaTiempoSegundos !== undefined
      ? {
          sopaTiempoSegundos: Number(
            item.sopaTiempoSegundos,
          ),
        }
      : {}),
    ...(item.fechaSopaCompletada
      ? {
          fechaSopaCompletada: String(
            item.fechaSopaCompletada,
          ),
        }
      : {}),
  };
}

export const repositorioFase1: RepositorioFase1 = {
  async buscarSesion(
    sesionId: string,
  ): Promise<SesionFase1 | null> {
    const resultado = await baseDatos.send(
      new GetCommand({
        TableName: nombreTabla(),
        Key: claveSesion(sesionId),
        ConsistentRead: true,
      }),
    );

    const item = resultado.Item;

    if (!item) {
      return null;
    }

    return {
      sesionId,
      fase: String(item.fase || "f1_bienvenida"),
      totalGrupos: Number(item.totalGrupos || 0),
      gruposListosConocidos: Number(
        item.gruposListosConocidos || 0,
      ),
      gruposListosF1: Number(item.gruposListosF1 || 0),
      gruposSopaCompletada: Number(
        item.gruposSopaCompletada || 0,
      ),
      conocidosActividadIniciada: Boolean(
        item.conocidosActividadIniciada,
      ),
      ...(item.conocidosTimerInicio
        ? {
            conocidosTimerInicio: String(
              item.conocidosTimerInicio,
            ),
          }
        : {}),
      ...(item.conocidosTimerFin
        ? {
            conocidosTimerFin: String(
              item.conocidosTimerFin,
            ),
          }
        : {}),
      timerCorriendo: Boolean(item.timerCorriendo),
      segundosRestantes: Number(
        item.segundosRestantes || 0,
      ),
      ...(item.primerGrupoSopaId
        ? {
            primerGrupoSopaId: String(
              item.primerGrupoSopaId,
            ),
          }
        : {}),
      ...(item.timerInicio
        ? { timerInicio: String(item.timerInicio) }
        : {}),
      ...(item.timerFin
        ? { timerFin: String(item.timerFin) }
        : {}),
    };
  },

  async buscarGrupo(
    sesionId: string,
    grupoId: string,
  ): Promise<GrupoFase1 | null> {
    const resultado = await baseDatos.send(
      new GetCommand({
        TableName: nombreTabla(),
        Key: claveGrupo(sesionId, grupoId),
        ConsistentRead: true,
      }),
    );

    const item = resultado.Item;

    return item ? convertirGrupo(item) : null;
  },

  async listarGrupos(
    sesionId: string,
  ): Promise<GrupoFase1[]> {
    const resultado = await baseDatos.send(
      new QueryCommand({
        TableName: nombreTabla(),
        KeyConditionExpression:
          "PK = :pk AND begins_with(SK, :grupo)",
        ExpressionAttributeValues: {
          ":pk": `SESION#${sesionId}`,
          ":grupo": "GRUPO#",
        },
        ConsistentRead: true,
      }),
    );

    return (resultado.Items ?? []).map((item) =>
      convertirGrupo(item),
    );
  },

  async listarPalabras(
    sesionId: string,
    grupoId: string,
  ): Promise<string[]> {
    const resultado = await baseDatos.send(
      new QueryCommand({
        TableName: nombreTabla(),
        KeyConditionExpression:
          "PK = :pk AND begins_with(SK, :prefijo)",
        ExpressionAttributeValues: {
          ":pk": `GRUPO#${sesionId}#${grupoId}`,
          ":prefijo": "PALABRA#",
        },
        ConsistentRead: true,
      }),
    );

    return (resultado.Items ?? [])
      .map((item) => String(item.palabra || ""))
      .filter((palabra) => palabra !== "");
  },

  async palabraExiste(
    sesionId: string,
    grupoId: string,
    palabra: string,
  ): Promise<boolean> {
    const resultado = await baseDatos.send(
      new GetCommand({
        TableName: nombreTabla(),
        Key: clavePalabra(sesionId, grupoId, palabra),
        ConsistentRead: true,
      }),
    );

    return Boolean(resultado.Item);
  },

  async iniciarFaseAtomica(
    sesionId: string,
  ): Promise<boolean> {
    try {
      await baseDatos.send(
        new UpdateCommand({
          TableName: nombreTabla(),
          Key: claveSesion(sesionId),
          UpdateExpression:
            "SET #fase = :siguiente, fechaActualizacion = :ahora",
          ConditionExpression:
            "attribute_exists(PK) AND #fase = :actual",
          ExpressionAttributeNames: {
            "#fase": "fase",
          },
          ExpressionAttributeValues: {
            ":actual": "f1_bienvenida",
            ":siguiente": "f1_conocidos",
            ":ahora": new Date().toISOString(),
          },
        }),
      );

      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }

      throw error;
    }
  },

  async guardarModoEquipo(
    sesionId: string,
    grupoId: string,
    modo: ModoEquipo,
  ): Promise<void> {
    await baseDatos.send(
      new UpdateCommand({
        TableName: nombreTabla(),
        Key: claveGrupo(sesionId, grupoId),
        UpdateExpression:
          "SET modoEquipo = :modo, fechaActualizacion = :ahora",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeValues: {
          ":modo": modo,
          ":ahora": new Date().toISOString(),
        },
      }),
    );
  },

  async marcarListoAtomico(
    datos: DatosMarcarListo,
  ): Promise<boolean> {
    const esConocidos = datos.etapa === "conocidos";
    const contador = esConocidos
      ? "gruposListosConocidos"
      : "gruposListosF1";
    const campoGrupo = esConocidos
      ? "listoConocidos"
      : "listoF1";
    const faseEsperada = esConocidos
      ? "f1_conocidos"
      : "f1_pre_sopa";
    const faseSiguiente = esConocidos
      ? "f1_pre_sopa"
      : "f1_sopa";

    const nombresSesion: Record<string, string> = {
      "#contador": contador,
      "#fase": "fase",
    };
    const valoresSesion: Record<string, unknown> = {
      ":esperada": datos.cantidadEsperada,
      ":nueva": datos.nuevaCantidad,
      ":faseEsperada": faseEsperada,
      ":ahora": datos.ahora,
    };
    const cambiosSesion = [
      "#contador = :nueva",
      "fechaActualizacion = :ahora",
    ];

    if (datos.todosListos) {
      if (esConocidos) {
        cambiosSesion.push(
          "conocidosActividadIniciada = :verdadero",
          "conocidosTimerInicio = :ahora",
          "conocidosTimerFin = :timerFin",
        );
        valoresSesion[":verdadero"] = true;
        valoresSesion[":timerFin"] = datos.timerFin;
      } else {
        cambiosSesion.push(
          "#fase = :faseSiguiente",
          "timerCorriendo = :verdadero",
          "segundosRestantes = :sesenta",
          "timerInicio = :ahora",
          "timerFin = :timerFin",
        );
        valoresSesion[":faseSiguiente"] = faseSiguiente;
        valoresSesion[":verdadero"] = true;
        valoresSesion[":sesenta"] = 60;
        valoresSesion[":timerFin"] = datos.timerFin;
      }
    }

    const condicionContador =
      datos.cantidadEsperada === 0
        ? "(attribute_not_exists(#contador) OR #contador = :esperada)"
        : "#contador = :esperada";

    try {
      await baseDatos.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: nombreTabla(),
                Key: claveSesion(datos.sesionId),
                UpdateExpression: `SET ${cambiosSesion.join(
                  ", ",
                )}`,
                ConditionExpression:
                  `attribute_exists(PK) AND #fase = :faseEsperada AND ${condicionContador}`,
                ExpressionAttributeNames: nombresSesion,
                ExpressionAttributeValues: valoresSesion,
              },
            },
            {
              Update: {
                TableName: nombreTabla(),
                Key: claveGrupo(datos.sesionId, datos.grupoId),
                UpdateExpression:
                  "SET #listo = :verdadero, fechaActualizacion = :ahora",
                ConditionExpression:
                  "attribute_exists(PK) AND (attribute_not_exists(#listo) OR #listo = :falso)",
                ExpressionAttributeNames: {
                  "#listo": campoGrupo,
                },
                ExpressionAttributeValues: {
                  ":verdadero": true,
                  ":falso": false,
                  ":ahora": datos.ahora,
                },
              },
            },
          ],
        }),
      );

      return true;
    } catch (error) {
      if (error instanceof TransactionCanceledException) {
        return false;
      }

      throw error;
    }
  },

  async finalizarConocidosAtomico(
    sesionId: string,
    ahora: string,
  ): Promise<boolean> {
    try {
      await baseDatos.send(
        new UpdateCommand({
          TableName: nombreTabla(),
          Key: claveSesion(sesionId),
          UpdateExpression:
            "SET #fase = :siguiente, conocidosActividadIniciada = :falso, fechaActualizacion = :ahora REMOVE conocidosTimerInicio, conocidosTimerFin",
          ConditionExpression:
            "attribute_exists(PK) AND #fase = :actual AND conocidosActividadIniciada = :verdadero AND conocidosTimerFin <= :ahora",
          ExpressionAttributeNames: {
            "#fase": "fase",
          },
          ExpressionAttributeValues: {
            ":actual": "f1_conocidos",
            ":siguiente": "f1_pre_sopa",
            ":verdadero": true,
            ":falso": false,
            ":ahora": ahora,
          },
        }),
      );

      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }

      throw error;
    }
  },

  async registrarPalabraAtomica(
    sesionId: string,
    grupoId: string,
    palabra: string,
    recompensa: number,
  ): Promise<boolean> {
    const ahora = new Date().toISOString();

    try {
      await baseDatos.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Put: {
                TableName: nombreTabla(),
                Item: {
                  ...clavePalabra(
                    sesionId,
                    grupoId,
                    palabra,
                  ),
                  tipo: "PALABRA_FASE1",
                  sesionId,
                  grupoId,
                  palabra,
                  fechaCreacion: ahora,
                },
                ConditionExpression:
                  "attribute_not_exists(PK)",
              },
            },
            {
              Update: {
                TableName: nombreTabla(),
                Key: claveGrupo(sesionId, grupoId),
                UpdateExpression:
                  "SET tokens = if_not_exists(tokens, :cero) + :recompensa, fechaActualizacion = :ahora",
                ConditionExpression: "attribute_exists(PK)",
                ExpressionAttributeValues: {
                  ":cero": 0,
                  ":recompensa": recompensa,
                  ":ahora": ahora,
                },
              },
            },
          ],
        }),
      );

      return true;
    } catch (error) {
      if (error instanceof TransactionCanceledException) {
        return false;
      }

      throw error;
    }
  },

  async completarSopaAtomica(
    datos: DatosCompletarSopa,
  ): Promise<boolean> {
    const ahora = new Date().toISOString();

    const valoresSesion: Record<string, unknown> = {
      ":esperada": datos.cantidadEsperada,
      ":nueva": datos.nuevaCantidad,
      ":ahora": ahora,
    };
    const cambiosSesion = [
      "gruposSopaCompletada = :nueva",
      "fechaActualizacion = :ahora",
    ];
    let condicionSesion =
      "attribute_exists(PK) AND #fase = :faseSopa AND (attribute_not_exists(gruposSopaCompletada) OR gruposSopaCompletada = :esperada)";

    valoresSesion[":faseSopa"] = "f1_sopa";

    if (datos.esPrimerGrupo) {
      cambiosSesion.push("primerGrupoSopaId = :grupoId");
      valoresSesion[":grupoId"] = datos.grupoId;
      condicionSesion +=
        " AND attribute_not_exists(primerGrupoSopaId)";
    } else {
      condicionSesion +=
        " AND attribute_exists(primerGrupoSopaId)";
    }

    if (datos.todosCompletaron) {
      cambiosSesion.push(
        "#fase = :ranking",
        "timerCorriendo = :falso",
        "segundosRestantes = :cero",
      );
      valoresSesion[":ranking"] = "f1_ranking";
      valoresSesion[":falso"] = false;
      valoresSesion[":cero"] = 0;
    }

    const valoresGrupo: Record<string, unknown> = {
      ":falso": false,
      ":verdadero": true,
      ":cero": 0,
      ":bonificacion": datos.bonificacion,
      ":ahora": ahora,
    };
    const cambiosGrupo = [
      "tokens = if_not_exists(tokens, :cero) + :bonificacion",
      "sopaCompletada = :verdadero",
      "fechaSopaCompletada = :ahora",
      "fechaActualizacion = :ahora",
    ];

    if (datos.segundosTranscurridos !== undefined) {
      cambiosGrupo.push("sopaTiempoSegundos = :segundos");
      valoresGrupo[":segundos"] =
        datos.segundosTranscurridos;
    }

    try {
      await baseDatos.send(
        new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: nombreTabla(),
                Key: claveSesion(datos.sesionId),
                UpdateExpression: `SET ${cambiosSesion.join(
                  ", ",
                )}`,
                ConditionExpression: condicionSesion,
                ExpressionAttributeNames: {
                  "#fase": "fase",
                },
                ExpressionAttributeValues: valoresSesion,
              },
            },
            {
              Update: {
                TableName: nombreTabla(),
                Key: claveGrupo(
                  datos.sesionId,
                  datos.grupoId,
                ),
                UpdateExpression: `SET ${cambiosGrupo.join(
                  ", ",
                )}`,
                ConditionExpression:
                  "attribute_exists(PK) AND (attribute_not_exists(sopaCompletada) OR sopaCompletada = :falso)",
                ExpressionAttributeValues: valoresGrupo,
              },
            },
          ],
        }),
      );

      return true;
    } catch (error) {
      if (error instanceof TransactionCanceledException) {
        return false;
      }

      throw error;
    }
  },
};
