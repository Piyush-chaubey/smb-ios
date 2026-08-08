import { defineStore } from 'pinia'
import { ref } from 'vue'
import { z } from 'zod'

const imageSchema = z.object({
  _id: z.string(),
  url: z.string().url(),
  placeholder: z.string().optional(),
  fileName: z.string().optional(),
  isError: z.boolean().optional().default(false),
  isLoaded: z.boolean().optional().default(false),
  isLoading: z.boolean().optional().default(false),
  isDownloaded: z.boolean().optional().default(false)
})

export type Image = z.infer<typeof imageSchema>

export const useImageStore = defineStore('image', () => {
  const images = ref<Image[]>([])

  function addImage(image: Image) {
    images.value.push(imageSchema.parse(image))
  }

  function updateImage(id: string, patch: Partial<Image>) {
    const index = images.value.findIndex((image) => image._id === id)
    if (index === -1) return
    images.value[index] = { ...images.value[index], ...patch }
  }

  function getImage(id: string) {
    return images.value.find((image) => image._id === id) ?? null
  }

  function clear() {
    images.value = []
  }

  return { images, addImage, updateImage, getImage, clear }
})
