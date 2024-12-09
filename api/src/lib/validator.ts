import { Static, TSchema } from "@sinclair/typebox";
import Ajv, { ErrorObject, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";

export interface ValidationResult<T> {
  body?: T;
  error?: Error;
}

const ajv = addFormats(new Ajv({ allErrors: true }), [
  "date-time",
  "time",
  "date",
  "email",
  "hostname",
  "ipv4",
  "ipv6",
  "uri",
  "uri-reference",
  "uuid",
  "uri-template",
  "json-pointer",
  "relative-json-pointer",
  "regex",
]);

// Convert AJV messages to friendly error messages (at most one per field)
//
export function buildErrorMessages(errors: ErrorObject[]): string[] {
  // Map errors into sets by instancePath ("field") to ensure one error per field
  const errorMap = errors.reduce((acc, error) => {
    const field = error.instancePath.replace(/^\//, ""); // Remove leading slash
    if (!acc.has(field)) {
      acc.set(field, []);
    }
    acc.get(field)?.push(error);
    return acc;
  }, new Map<string, ErrorObject[]>());

  // Create a human-friendly message for each field
  const errorMessages = [];
  for (const [field, errors] of errorMap) {
    const primaryError = errors[0];

    switch (primaryError.keyword) {
      case "type":
        errorMessages.push(
          `The field "${field}" must be of type ${primaryError.params.type}. Please provide a valid ${primaryError.params.type}.`
        );
        break;

      case "additionalProperties":
        errorMessages.push(
          `The property "${primaryError.params.additionalProperty}" is not allowed in "${field}". Please remove it.`
        );
        break;

      case "required":
        errorMessages.push(
          `The field "${primaryError.params.missingProperty}" is required but missing. Please include it in your input.`
        );
        break;

      case "const":
        errorMessages.push(
          `The field "${field}" must be set to "${primaryError.params.allowedValue}". Please correct it.`
        );
        break;

      case "enum":
        const allowedValues = primaryError.params.allowedValues as string[];
        errorMessages.push(
          `The field "${field}" has an invalid value. Allowed values are: ${allowedValues.join(
            ", "
          )}. Please choose one of these.`
        );
        break;

      case "format":
        errorMessages.push(
          `The field "${field}" must match the format "${primaryError.params.format}". Please provide a value in this format.`
        );
        break;

      case "minLength":
        errorMessages.push(
          `The field "${field}" must be at least ${primaryError.params.limit} characters long.`
        );
        break;

      case "maxLength":
        errorMessages.push(
          `The field "${field}" must be no more than ${primaryError.params.limit} characters long.`
        );
        break;

      case "minimum":
        errorMessages.push(
          `The field "${field}" must be at least ${primaryError.params.limit}.`
        );
        break;

      case "maximum":
        errorMessages.push(
          `The field "${field}" must be no more than ${primaryError.params.limit}.`
        );
        break;

      case "pattern":
        errorMessages.push(
          `The field "${field}" must match the required pattern: ${primaryError.params.pattern}.`
        );
        break;

      default:
        errorMessages.push(
          `The field "${field}" has an error: ${primaryError.message}`
        );
        break;
    }
  }
  return errorMessages;
}

// Synchronous validator for object
export function compileValidator<T extends TSchema>(
  schema: T
): (body: unknown) => ValidationResult<Static<T>> {
  const validator = ajv.compile(schema) as ValidateFunction<Static<T>>;
  return (body: unknown): ValidationResult<Static<T>> => {
    if (validator(body)) {
      return { body: body as Static<T> };
    }
    const errorMessage = buildErrorMessages(validator.errors ?? []).join(", ");
    return { error: new Error(errorMessage) };
  };
}

// Asynchronous validator for request body (JSON)
export function compileBodyValidator<T extends TSchema>(
  schema: T
): (req: Request) => Promise<ValidationResult<Static<T>>> {
  const validate = compileValidator(schema);
  return async (req: Request): Promise<ValidationResult<Static<T>>> => {
    const body = await req.json();
    return validate(body);
  };
}
