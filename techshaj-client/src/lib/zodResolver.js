// Minimal react-hook-form resolver for a zod schema; keeps the first message per field.
export function zodResolver(schema) {
  return (values) => {
    const result = schema.safeParse(values)
    if (result.success) return { values: result.data, errors: {} }
    const errors = {}
    for (const issue of result.error.issues) {
      const key = issue.path.join('.')
      errors[key] ??= { type: issue.code, message: issue.message }
    }
    return { values: {}, errors }
  }
}
