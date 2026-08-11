import {
  ConditionalCheckFailedException,
} from "@aws-sdk/client-dynamodb";
import {
  GetCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import {
  baseDatos,
  nombreTabla,
} from "../compartido/baseDatos.js";

export interface SesionFase2 {
  sesionId: string;
  fase: string;
  totalGrupos: number;
  timerCorriendo: boolean;
  segundosRestantes: number;
  timerInicio?: string;
  timerFin?: string;
}

export interface BubbleMapDatos {
  emociones: string;
  gustos: string;
  entorno: string;
  necesidades: string;
  limitaciones: string;
  motivaciones: string;
  otros: string[];
  relato: string;
  link: string;
}

export interface GrupoFase2 {
  grupoId: string;
  nombreGrupo: string;
  tokens: number;
  listoF2Ranking: boolean;
  listoF2Mapa: boolean;
  listoF2Transicion: boolean;
  listoF2Empatia: boolean;
  temaElegido: string;
  desafioId: string;
  desafioNombre: string;
  desafioDescripcion: string;
  listoF2Desafio: boolean;
  bubbleMap: BubbleMapDatos;
  bubbleCompletado: boolean;
  bubblePuntaje: number;
  bubbleTokensOtorgados: number;
}

export interface RepositorioFase2 {
  buscarSesion(sesionId: string): Promise<SesionFase2 | null>;
  buscarGrupo(
    sesionId: string,
    grupoId: string,
  ): Promise<GrupoFase2 | null>;
  listarGrupos(sesionId: string): Promise<GrupoFase2[]>;
  marcarListo(
    sesionId: string,
    grupoId: string,
    campo: string,
  ): Promise<void>;
  cambiarFase(
    sesionId: string,
    fasesEsperadas: string[],
    nuevaFase: string,
    duracionSegundos: number,
  ): Promise<boolean>;
  guardarSeleccion(
    sesionId: string,
    grupoId: string,
    temaId: string,
    desafioId: string,
    desafioNombre: string,
    desafioDescripcion: string,
  ): Promise<void>;
  guardarBubbleMap(
    sesionId: string,
    grupoId: string,
    datos: BubbleMapDatos,
  ): Promise<void>;
  completarBubbleMap(
    sesionId: string,
    grupoId: string,
    puntaje: number,
    recompensa: number,
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

function texto(valor: unknown): string {
  return String(valor ?? "");
}

function convertirBubble(
  valor: unknown,
): BubbleMapDatos {
  const objeto =
    valor && typeof valor === "object"
      ? (valor as Record<string, unknown>)
      : {};

  const otros = Array.isArray(objeto.otros)
    ? objeto.otros.map((item) => texto(item)).slice(0, 4)
    : [];

  return {
    emociones: texto(objeto.emociones),
    gustos: texto(objeto.gustos),
    entorno: texto(objeto.entorno),
    necesidades: texto(objeto.necesidades),
    limitaciones: texto(objeto.limitaciones),
    motivaciones: texto(objeto.motivaciones),
    otros,
    relato: texto(objeto.relato),
    link: texto(objeto.link),
  };
}

function convertirGrupo(
  item: Record<string, unknown>,
): GrupoFase2 {
  return {
    grupoId: texto(item.grupoId),
    nombreGrupo: texto(item.nombreGrupo) || "Grupo",
    tokens: Number(item.tokens || 0),
    listoF2Ranking: Boolean(item.listoF2Ranking),
    listoF2Mapa: Boolean(item.listoF2Mapa),
    listoF2Transicion: Boolean(item.listoF2Transicion),
    listoF2Empatia: Boolean(item.listoF2Empatia),
    temaElegido: texto(item.temaElegido),
    desafioId: texto(item.desafioId),
    desafioNombre: texto(item.desafioNombre),
    desafioDescripcion: texto(item.desafioDescripcion),
    listoF2Desafio: Boolean(item.listoF2Desafio),
    bubbleMap: convertirBubble(item.bubbleMap),
    bubbleCompletado: Boolean(item.bubbleCompletado),
    bubblePuntaje: Number(item.bubblePuntaje || 0),
    bubbleTokensOtorgados: Number(
      item.bubbleTokensOtorgados || 0,
    ),
  };
}

export const repositorioFase2: RepositorioFase2 = {
  async buscarSesion(
    sesionId: string,
  ): Promise<SesionFase2 | null> {
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
      fase: texto(item.fase) || "f1_bienvenida",
      totalGrupos: Number(item.totalGrupos || 0),
      timerCorriendo: Boolean(item.timerCorriendo),
      segundosRestantes: Number(
        item.segundosRestantes || 0,
      ),
      ...(item.timerInicio
        ? { timerInicio: texto(item.timerInicio) }
        : {}),
      ...(item.timerFin
        ? { timerFin: texto(item.timerFin) }
        : {}),
    };
  },

  async buscarGrupo(
    sesionId: string,
    grupoId: string,
  ): Promise<GrupoFase2 | null> {
    const resultado = await baseDatos.send(
      new GetCommand({
        TableName: nombreTabla(),
        Key: claveGrupo(sesionId, grupoId),
        ConsistentRead: true,
      }),
    );

    return resultado.Item
      ? convertirGrupo(resultado.Item)
      : null;
  },

  async listarGrupos(
    sesionId: string,
  ): Promise<GrupoFase2[]> {
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

    return (resultado.Items ?? []).map(convertirGrupo);
  },

  async marcarListo(
    sesionId: string,
    grupoId: string,
    campo: string,
  ): Promise<void> {
    await baseDatos.send(
      new UpdateCommand({
        TableName: nombreTabla(),
        Key: claveGrupo(sesionId, grupoId),
        UpdateExpression:
          "SET #campo = :verdadero, fechaActualizacion = :ahora",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeNames: {
          "#campo": campo,
        },
        ExpressionAttributeValues: {
          ":verdadero": true,
          ":ahora": new Date().toISOString(),
        },
      }),
    );
  },

  async cambiarFase(
    sesionId: string,
    fasesEsperadas: string[],
    nuevaFase: string,
    duracionSegundos: number,
  ): Promise<boolean> {
    const ahora = new Date();
    const nombres: Record<string, string> = {
      "#fase": "fase",
    };
    const valores: Record<string, unknown> = {
      ":nuevaFase": nuevaFase,
      ":ahora": ahora.toISOString(),
      ":corriendo": duracionSegundos > 0,
      ":segundos": Math.max(0, duracionSegundos),
      ":timerInicio":
        duracionSegundos > 0 ? ahora.toISOString() : null,
      ":timerFin":
        duracionSegundos > 0
          ? new Date(
              ahora.getTime() + duracionSegundos * 1000,
            ).toISOString()
          : null,
    };

    const condiciones = fasesEsperadas.map(
      (fase, indice) => {
        const clave = `:fase${indice}`;
        valores[clave] = fase;
        return `#fase = ${clave}`;
      },
    );

    try {
      await baseDatos.send(
        new UpdateCommand({
          TableName: nombreTabla(),
          Key: claveSesion(sesionId),
          UpdateExpression:
            "SET #fase = :nuevaFase, timerCorriendo = :corriendo, segundosRestantes = :segundos, timerInicio = :timerInicio, timerFin = :timerFin, fechaActualizacion = :ahora",
          ConditionExpression:
            `attribute_exists(PK) AND (${condiciones.join(
              " OR ",
            )})`,
          ExpressionAttributeNames: nombres,
          ExpressionAttributeValues: valores,
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

  async guardarSeleccion(
    sesionId: string,
    grupoId: string,
    temaId: string,
    desafioId: string,
    desafioNombre: string,
    desafioDescripcion: string,
  ): Promise<void> {
    await baseDatos.send(
      new UpdateCommand({
        TableName: nombreTabla(),
        Key: claveGrupo(sesionId, grupoId),
        UpdateExpression:
          "SET temaElegido = :tema, desafioId = :desafioId, desafioNombre = :nombre, desafioDescripcion = :descripcion, listoF2Desafio = :verdadero, fechaActualizacion = :ahora",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeValues: {
          ":tema": temaId,
          ":desafioId": desafioId,
          ":nombre": desafioNombre,
          ":descripcion": desafioDescripcion,
          ":verdadero": true,
          ":ahora": new Date().toISOString(),
        },
      }),
    );
  },

  async guardarBubbleMap(
    sesionId: string,
    grupoId: string,
    datos: BubbleMapDatos,
  ): Promise<void> {
    await baseDatos.send(
      new UpdateCommand({
        TableName: nombreTabla(),
        Key: claveGrupo(sesionId, grupoId),
        UpdateExpression:
          "SET bubbleMap = :datos, fechaActualizacion = :ahora",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeValues: {
          ":datos": datos,
          ":ahora": new Date().toISOString(),
        },
      }),
    );
  },

  async completarBubbleMap(
    sesionId: string,
    grupoId: string,
    puntaje: number,
    recompensa: number,
  ): Promise<boolean> {
    try {
      await baseDatos.send(
        new UpdateCommand({
          TableName: nombreTabla(),
          Key: claveGrupo(sesionId, grupoId),
          UpdateExpression:
            "SET bubbleCompletado = :verdadero, bubblePuntaje = :puntaje, bubbleTokensOtorgados = :recompensa, tokens = if_not_exists(tokens, :cero) + :recompensa, fechaActualizacion = :ahora",
          ConditionExpression:
            "attribute_exists(PK) AND (attribute_not_exists(bubbleCompletado) OR bubbleCompletado = :falso)",
          ExpressionAttributeValues: {
            ":verdadero": true,
            ":falso": false,
            ":puntaje": puntaje,
            ":recompensa": recompensa,
            ":cero": 0,
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
};
