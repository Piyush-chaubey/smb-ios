import { Directory, Filesystem } from '@capacitor/filesystem'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGlobalStore = defineStore('global', () => {
  // Toast notification state (used by App.vue via storeToRefs)
  const isOpen = ref(false)
  const message = ref('')

  function showToast(msg: string) {
    message.value = msg
    isOpen.value = true
  }

  const thumbnailDir = ref('thumbnails')
  const audioDir = ref('audios')
  const cacheDir = ref(Directory.Cache)
  const docsDir = ref(Directory.Documents)

  async function ensureDir(path: string, directory: Directory = cacheDir.value) {
    if (!path) return
    try {
      await Filesystem.mkdir({ path, directory, recursive: true })
    } catch (e) {
      // ignore errors (exists or unsupported)
    }
  }

  function getCacheFilePath(kind: 'thumbnail' | 'audio', id: string, ext = 'jpg') {
    const base = kind === 'thumbnail' ? thumbnailDir.value : audioDir.value
    return `${base}/${id}.${ext}`
  }

  async function writeCacheFile(
    path: string,
    base64Data: string,
    directory: Directory = cacheDir.value
  ) {
    const dirPath = path.split('/').slice(0, -1).join('/')
    if (dirPath) await ensureDir(dirPath, directory)
    return Filesystem.writeFile({ path, data: base64Data, directory })
  }

  async function readCacheUri(path: string, directory: Directory = cacheDir.value) {
    try {
      const res = await Filesystem.getUri({ path, directory })
      return res.uri
    } catch (e) {
      return null
    }
  }

  async function fileExists(path: string, directory: Directory = cacheDir.value) {
    try {
      await Filesystem.stat({ path, directory })
      return true
    } catch {
      return false
    }
  }

  async function removeFile(path: string, directory: Directory = cacheDir.value) {
    try {
      await Filesystem.deleteFile({ path, directory })
      return true
    } catch {
      return false
    }
  }

  return {
    isOpen,
    message,
    showToast,
    thumbnailDir,
    audioDir,
    cacheDir,
    docsDir,
    ensureDir,
    getCacheFilePath,
    writeCacheFile,
    readCacheUri,
    fileExists,
    removeFile
  }
})
