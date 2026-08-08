import dayjs from 'dayjs'

export function useDate() {
  function formatDate(dateString: string) {
    const date = dayjs(dateString)
    return date.format('dddd MMMM D, YYYY')
  }
  return {
    formatDate
  }
}
