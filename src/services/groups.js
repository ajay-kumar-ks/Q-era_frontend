import api from './api'

let cache = null
let inflight = null

export async function fetchGroups(force = false) {
  if (!force && cache) return cache
  if (inflight) return inflight
  inflight = api.get('/exams/groups-for-exam')
    .then(({ data }) => {
      const list = Array.isArray(data) ? data : []
      cache = list
      return list
    })
    .catch((err) => {
      console.warn('fetchGroups failed', err?.response?.status)
      cache = []
      return []
    })
    .finally(() => { inflight = null })
  return inflight
}

export function getCachedGroups() {
  return cache
}

export function clearGroupsCache() {
  cache = null
}
