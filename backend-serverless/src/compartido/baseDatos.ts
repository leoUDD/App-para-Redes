import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const endpointLocal = process.env.DYNAMODB_ENDPOINT?.trim();

const cliente = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  ...(endpointLocal
    ? {
        endpoint: endpointLocal,
        credentials: {
          accessKeyId: "local",
          secretAccessKey: "local",
        },
      }
    : {}),
});

export const baseDatos = DynamoDBDocumentClient.from(cliente, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export function nombreTabla(): string {
  const nombre = process.env.NOMBRE_TABLA;

  if (!nombre) {
    throw new Error("Falta la variable de entorno NOMBRE_TABLA");
  }

  return nombre;
}
