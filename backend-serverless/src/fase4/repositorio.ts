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

export interface SesionFase4 {
  sesionId: string;
  fase: string;
  totalGrupos: number;
  timerCorriendo: boolean;
  segundosRestantes: number;
  timerInicio?: string;
  timerFin?: string;
  ordenSorteado: boolean;
  grupoPresentandoId: string | null;
}

export interface GrupoFase4 {
  grupoId: string;
  nombreGrupo: string;
  tokens: number;
  listoF4: boolean;
  pitchTexto: string;
  listoF4Orden: boolean;
  ordenPresentacion: number | null;
  listoF5: boolean;
  recompensaPeerOtorgada: boolean;
}

export interface RepositorioFase4 {
  buscarSesion(sesionId: string): Promise<SesionFase4 | null>;
  buscarGrupo(sesionId: string, grupoId: string): Promise<GrupoFase4 | null>;
  listarGrupos(sesionId: string): Promise<GrupoFase4[]>;

  marcarListo(
    sesionId: string,
    grupoId: string,
    campo: "listoF4" | "listoF4Orden" | "listoF5",
  ): Promise<void>;

  guardarPitch(
    sesionId: string,
    grupoId: string,
    pitchTexto: string,
  ): Promise<void>;

  cambiarFase(
    sesionId: string,
    fasesEsperadas: string[],
    nuevaFase: string,
    duracionSegundos: number,
  ): Promise<boolean>;

  sortearOrdenPitch(
    sesionId: string,
    ordenGrupoIds: string[],
  ): Promise<boolean>;

  confirmarOrdenYAvanzar(
    sesionId: string,
    duracionPresentacionSegundos: number,
  ): Promise<boolean>;

  iniciarPresentacion(
    sesionId: string,
    grupoId: string,
    duracionSegundos: number,
  ): Promise<boolean>;

  iniciarTimerDeFase(
    sesionId: string,
    faseEsperada: string,
    duracionSegundos: number,
  ): Promise<boolean>;

  avanzarSiguientePitchORanking(
    sesionId: string,
    grupoActualId: string,
    duracionPresentacionSegundos: number,
  ): Promise<{ ok: boolean; terminoTodos: boolean }>;

  ajustarTokens(
    sesionId: string,
    grupoId: string,
    delta: number,
  ): Promise<void>;
}

const claveSesion = (sesionId: string) => ({
  PK: `SESION#${sesionId}`,
  SK: "METADATOS",
});

const claveGrupo = (sesionId: string, grupoId: string) => ({
  PK: `SESION#${sesionId}`,
  SK: `GRUPO#${grupoId}`,
});

function texto(valor: unknown): string {
  return String(valor ?? "");
}

function esCondicional(error: unknown): boolean {
  return (
    error instanceof ConditionalCheckFailedException ||
    (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "ConditionalCheckFailedException"
    )
  );
}

function convertirGrupo(item: Record<string, unknown>): GrupoFase4 {
  return {
    grupoId: texto(item.grupoId),
    nombreGrupo: texto(item.nombreGrupo) || "Grupo",
    tokens: Number(item.tokens || 0),
    listoF4: Boolean(item.listoF4),
    pitchTexto: texto(item.pitchTexto),
    listoF4Orden: Boolean(item.listoF4Orden),
    ordenPresentacion:
      item.ordenPresentacion === null ||
      item.ordenPresentacion === undefined
        ? null
        : Number(item.ordenPresentacion),
    listoF5: Boolean(item.listoF5),
    recompensaPeerOtorgada: Boolean(item.recompensaPeerOtorgada),
  };
}

export const repositorioFase4: RepositorioFase4 = {
  async buscarSesion(sesionId) {
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
      segundosRestantes: Number(item.segundosRestantes || 0),
      ordenSorteado: Boolean(item.ordenSorteado),
      grupoPresentandoId:
        item.grupoPresentandoId === undefined ||
        item.grupoPresentandoId === null
          ? null
          : texto(item.grupoPresentandoId),
      ...(item.timerInicio ? { timerInicio: texto(item.timerInicio) } : {}),
      ...(item.timerFin ? { timerFin: texto(item.timerFin) } : {}),
    };
  },

  async buscarGrupo(sesionId, grupoId) {
    const resultado = await baseDatos.send(
      new GetCommand({
        TableName: nombreTabla(),
        Key: claveGrupo(sesionId, grupoId),
        ConsistentRead: true,
      }),
    );

    return resultado.Item ? convertirGrupo(resultado.Item) : null;
  },

  async listarGrupos(sesionId) {
    const resultado = await baseDatos.send(
      new QueryCommand({
        TableName: nombreTabla(),
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :grupo)",
        ExpressionAttributeValues: {
          ":pk": `SESION#${sesionId}`,
          ":grupo": "GRUPO#",
        },
        ConsistentRead: true,
      }),
    );

    return (resultado.Items ?? []).map(convertirGrupo);
  },

  async marcarListo(sesionId, grupoId, campo) {
    await baseDatos.send(
      new UpdateCommand({
        TableName: nombreTabla(),
        Key: claveGrupo(sesionId, grupoId),
        UpdateExpression: "SET #campo = :verdadero",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeNames: { "#campo": campo },
        ExpressionAttributeValues: { ":verdadero": true },
      }),
    );
  },

  async guardarPitch(sesionId, grupoId, pitchTexto) {
    await baseDatos.send(
      new UpdateCommand({
        TableName: nombreTabla(),
        Key: claveGrupo(sesionId, grupoId),
        UpdateExpression: "SET pitchTexto = :texto",
        ConditionExpression: "attribute_exists(PK)",
        ExpressionAttributeValues: { ":texto": pitchTexto },
      }),
    );
  },

  async cambiarFase(sesionId, fasesEsperadas, nuevaFase, duracionSegundos) {
    if (!fasesEsperadas.length) {
      return false;
    }

    const valores: Record<string, unknown> = {
      ":nuevaFase": nuevaFase,
      ":duracion": duracionSegundos,
      ":falso": false,
      ":nulo": null,
    };

    const condiciones = fasesEsperadas.map((fase, indice) => {
      const clave = `:fase${indice}`;
      valores[clave] = fase;
      return clave;
    });

    try {
      await baseDatos.send(
        new UpdateCommand({
          TableName: nombreTabla(),
          Key: claveSesion(sesionId),
          UpdateExpression:
            "SET #fase = :nuevaFase, segundosRestantes = :duracion, " +
            "timerCorriendo = :falso, timerInicio = :nulo, timerFin = :nulo",
          ConditionExpression: `#fase IN (${condiciones.join(", ")})`,
          ExpressionAttributeNames: { "#fase": "fase" },
          ExpressionAttributeValues: valores,
        }),
      );

      return true;
    } catch (error) {
      if (esCondicional(error)) {
        return false;
      }

      throw error;
    }
  },

  async sortearOrdenPitch(sesionId, ordenGrupoIds) {
    if (!ordenGrupoIds.length) {
      return false;
    }

    try {
      await Promise.all(
        ordenGrupoIds.map((grupoId, indice) =>
          baseDatos.send(
            new UpdateCommand({
              TableName: nombreTabla(),
              Key: claveGrupo(sesionId, grupoId),
              UpdateExpression:
                "SET ordenPresentacion = :orden, listoF4Orden = :falso",
              ExpressionAttributeValues: {
                ":orden": indice + 1,
                ":falso": false,
              },
            }),
          ),
        ),
      );

      await baseDatos.send(
        new UpdateCommand({
          TableName: nombreTabla(),
          Key: claveSesion(sesionId),
          UpdateExpression:
            "SET ordenSorteado = :verdadero, grupoPresentandoId = :primero",
          ConditionExpression:
            "#fase = :faseEsperada AND " +
            "(attribute_not_exists(ordenSorteado) OR ordenSorteado = :falso)",
          ExpressionAttributeNames: { "#fase": "fase" },
          ExpressionAttributeValues: {
            ":faseEsperada": "f4_orden_pitch",
            ":verdadero": true,
            ":falso": false,
            ":primero": ordenGrupoIds[0],
          },
        }),
      );

      return true;
    } catch (error) {
      if (esCondicional(error)) {
        return false;
      }

      throw error;
    }
  },

  async confirmarOrdenYAvanzar(sesionId, duracionPresentacionSegundos) {
    try {
      await baseDatos.send(
        new UpdateCommand({
          TableName: nombreTabla(),
          Key: claveSesion(sesionId),
          UpdateExpression:
            "SET #fase = :nuevaFase, segundosRestantes = :duracion, " +
            "timerCorriendo = :falso, timerInicio = :nulo, timerFin = :nulo",
          ConditionExpression:
            "#fase = :faseEsperada AND ordenSorteado = :verdadero",
          ExpressionAttributeNames: { "#fase": "fase" },
          ExpressionAttributeValues: {
            ":faseEsperada": "f4_orden_pitch",
            ":nuevaFase": "f4_presentacion_pitch",
            ":duracion": duracionPresentacionSegundos,
            ":falso": false,
            ":verdadero": true,
            ":nulo": null,
          },
        }),
      );

      return true;
    } catch (error) {
      if (esCondicional(error)) {
        return false;
      }

      throw error;
    }
  },

  async iniciarPresentacion(sesionId, grupoId, duracionSegundos) {
    const ahora = new Date();
    const fin = new Date(ahora.getTime() + duracionSegundos * 1000);

    try {
      await baseDatos.send(
        new UpdateCommand({
          TableName: nombreTabla(),
          Key: claveSesion(sesionId),
          UpdateExpression:
            "SET segundosRestantes = :duracion, timerCorriendo = :verdadero, " +
            "timerInicio = :inicio, timerFin = :fin",
          ConditionExpression:
            "#fase = :faseEsperada AND grupoPresentandoId = :grupoId",
          ExpressionAttributeNames: { "#fase": "fase" },
          ExpressionAttributeValues: {
            ":faseEsperada": "f4_presentacion_pitch",
            ":grupoId": grupoId,
            ":duracion": duracionSegundos,
            ":verdadero": true,
            ":inicio": ahora.toISOString(),
            ":fin": fin.toISOString(),
          },
        }),
      );

      return true;
    } catch (error) {
      if (esCondicional(error)) {
        return false;
      }

      throw error;
    }
  },

  async iniciarTimerDeFase(sesionId, faseEsperada, duracionSegundos) {
    const ahora = new Date();
    const fin = new Date(ahora.getTime() + duracionSegundos * 1000);

    try {
      await baseDatos.send(
        new UpdateCommand({
          TableName: nombreTabla(),
          Key: claveSesion(sesionId),
          UpdateExpression:
            "SET segundosRestantes = :duracion, timerCorriendo = :verdadero, " +
            "timerInicio = :inicio, timerFin = :fin",
          ConditionExpression: "#fase = :faseEsperada",
          ExpressionAttributeNames: { "#fase": "fase" },
          ExpressionAttributeValues: {
            ":faseEsperada": faseEsperada,
            ":duracion": duracionSegundos,
            ":verdadero": true,
            ":inicio": ahora.toISOString(),
            ":fin": fin.toISOString(),
          },
        }),
      );

      return true;
    } catch (error) {
      if (esCondicional(error)) {
        return false;
      }

      throw error;
    }
  },

  async avanzarSiguientePitchORanking(
    sesionId,
    grupoActualId,
    duracionPresentacionSegundos,
  ) {
    const grupos = await this.listarGrupos(sesionId);

    const actual = grupos.find((g) => g.grupoId === grupoActualId);
    const ordenActual = actual?.ordenPresentacion ?? 0;

    const siguiente = grupos
      .filter(
        (g) =>
          g.ordenPresentacion !== null && g.ordenPresentacion > ordenActual,
      )
      .sort(
        (a, b) => (a.ordenPresentacion ?? 0) - (b.ordenPresentacion ?? 0),
      )[0];

    await Promise.all(
      grupos.map((g) =>
        baseDatos.send(
          new UpdateCommand({
            TableName: nombreTabla(),
            Key: claveGrupo(sesionId, g.grupoId),
            UpdateExpression: "SET listoF5 = :falso",
            ExpressionAttributeValues: { ":falso": false },
          }),
        ),
      ),
    );

    if (!siguiente) {
      await baseDatos.send(
        new UpdateCommand({
          TableName: nombreTabla(),
          Key: claveSesion(sesionId),
          UpdateExpression:
            "SET #fase = :nuevaFase, grupoPresentandoId = :nulo, " +
            "segundosRestantes = :cero, timerCorriendo = :falso, " +
            "timerInicio = :nulo, timerFin = :nulo",
          ExpressionAttributeNames: { "#fase": "fase" },
          ExpressionAttributeValues: {
            ":nuevaFase": "f6_ranking",
            ":nulo": null,
            ":cero": 0,
            ":falso": false,
          },
        }),
      );

      return { ok: true, terminoTodos: true };
    }

    await baseDatos.send(
      new UpdateCommand({
        TableName: nombreTabla(),
        Key: claveSesion(sesionId),
        UpdateExpression:
          "SET #fase = :nuevaFase, grupoPresentandoId = :siguiente, " +
          "segundosRestantes = :duracion, timerCorriendo = :falso, " +
          "timerInicio = :nulo, timerFin = :nulo",
        ExpressionAttributeNames: { "#fase": "fase" },
        ExpressionAttributeValues: {
          ":nuevaFase": "f4_presentacion_pitch",
          ":siguiente": siguiente.grupoId,
          ":duracion": duracionPresentacionSegundos,
          ":falso": false,
          ":nulo": null,
        },
      }),
    );

    return { ok: true, terminoTodos: false };
  },

  async ajustarTokens(sesionId, grupoId, delta) {
    const grupo = await this.buscarGrupo(sesionId, grupoId);
    const nuevoValor = Math.max(0, (grupo?.tokens ?? 0) + delta);

    await baseDatos.send(
      new UpdateCommand({
        TableName: nombreTabla(),
        Key: claveGrupo(sesionId, grupoId),
        UpdateExpression: "SET tokens = :valor",
        ExpressionAttributeValues: { ":valor": nuevoValor },
      }),
    );
  },
};