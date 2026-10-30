// Minimal react-hook-form resolver for a zod schema; keeps the first message per field.
// Errors are nested by path (variants.0.name -> errors.variants[0].name) as react-hook-form expects.
export function zodResolver(schema) {
  return (values) => {
    const result = schema.safeParse(values)
    if (result.success) return { values: result.data, errors: {} }
    const errors = {}
    for (const issue of result.error.issues) {
      const path = issue.path.length ? issue.path : ['root']
      let node = errors
      path.slice(0, -1).forEach((key, i) => {
        node[key] ??= typeof path[i + 1] === 'number' ? [] : {}
        node = node[key]
      })
      node[path.at(-1)] ??= { type: issue.code, message: issue.message }
    }
    return { values: {}, errors }
  }
}
