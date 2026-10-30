// The shape every data hook returns.
export const pick = ({ data, isLoading, isError, refetch }) => ({ data, isLoading, isError, refetch })

// Server error message for toasts, with a fallback for network errors.
export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') => error?.response?.data?.message ?? fallback

export const isNotFound = (error) => error?.response?.status === 404

// Combines several hook results for a page that waits on all of them.
export const combine = (...results) => ({
  isLoading: results.some((r) => r.isLoading),
  isError: results.some((r) => r.isError),
  refetch: () => results.filter((r) => r.isError).forEach((r) => r.refetch()),
})
