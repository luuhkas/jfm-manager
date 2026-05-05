function assertIsoDate(value, fieldName) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} inválido.`);
  }
}

function assertMonthKey(value, fieldName) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) {
    throw new Error(`${fieldName} inválida.`);
  }
}

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} é obrigatório.`);
  }
}

function assertNumber(value, fieldName, minValue = 0) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < minValue) {
    throw new Error(`${fieldName} inválido.`);
  }
}

module.exports = {
  assertIsoDate,
  assertMonthKey,
  assertNonEmptyString,
  assertNumber,
};
