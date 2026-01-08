<template>
  <div class="p-6 bg-base-100 min-h-screen relative">
    <h1 class="text-3xl font-bold text-center mb-6"> </h1>
    <div class="divider"></div>
    <div class="flex flex-wrap justify-center gap-4 mb-8">
      <input v-model="search" type="text" placeholder="搜索.." class="input input-bordered w-full max-w-xs" />
      <select v-model="filters.ip" class="select select-bordered max-w-xs">
        <option v-for="ip in ipList" :key="ip.value" :value="ip.value">
          {{ ip.label }}{{ ip.value && ipCounts[ip.value] ? ` (${ipCounts[ip.value]})` : '' }}
        </option>
      </select>
    </div>

    <div ref="galleryContainer" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div v-for="item in paginatedCards" :key="item.productImagePath" class="card bg-base-200 shadow-xl">
        <figure class="relative min-h-[200px] bg-base-300">
          <div v-if="!item._loaded" class="absolute inset-0 flex items-center justify-center text-gray-400">
            <span class="loading loading-spinner loading-md"></span>
          </div>

          <a :href="item.productImagePath" class="gallery-item w-full block"
            :data-sub-html="`<h4>${item.productName}</h4><p>${item._size || '未知大小'}</p>`">
            <img :key="item.productImagePath" :src="item.productImagePath" loading="lazy" :alt="item.productName"
              class="object-cover w-full h-auto transition-opacity duration-300"
              :class="item._loaded ? 'opacity-100' : 'opacity-0'" @load="event => handleImageLoad(item, event)" />
          </a>
        </figure>

        <div class="card-body">
          <h2 class="card-title">{{ item.productName }}</h2>
          <!--p class="text-sm text-gray-500">运营：{{ item.city }} | 来源：{{ item.source }}</p-->
          <p class="text-sm text-gray-500">
            尺寸：{{ item._width || '?' }}×{{ item._height || '?' }} | 大小：{{ item._size || '?' }}
          </p>
        </div>
      </div>
    </div>
    <div v-if="loadError || filteredCards.length === 0" class="text-center text-gray-500 mt-10">
      <template v-if="loadError">
        加载卡片数据失败，请稍后重试。
      </template>
      <template v-else>
        未找到匹配的卡片。
      </template>
    </div>
    <div v-if="totalPages > 1" class="flex justify-center items-center space-x-2 my-8">
      <button @click="goToPage(1)" :disabled="currentPage === 1" class="btn btn-sm btn-square" title="首页">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
            clip-rule="evenodd" />
        </svg>
      </button>

      <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="btn btn-sm btn-square"
        title="上一页">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clip-rule="evenodd" />
        </svg>
      </button>

      <span class="mx-2 font-mono text-sm"> {{ currentPage }} / {{ totalPages }} </span>

      <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="btn btn-sm btn-square"
        title="下一页">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd" />
        </svg>
      </button>

      <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages" class="btn btn-sm btn-square"
        title="尾页">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
            d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0zm6 0a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z"
            clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <button v-show="showBackToTop" @click="scrollToDivider"
      class="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300">
      ↑
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

import lightGallery from 'lightgallery'
import lgThumbnail from 'lightgallery/plugins/thumbnail'
import lgZoom from 'lightgallery/plugins/zoom'
import 'lightgallery/css/lightgallery.css'
import 'lightgallery/css/lg-thumbnail.css'
import 'lightgallery/css/lg-zoom.css'

const search = ref('')
const filters = reactive({ ip: '' })
const loadError = ref(false)
const cards = ref([])
const currentPage = ref(1)
const pageSize = 40
const galleryContainer = ref(null)
let lgInstance = null

const filteredCards = computed(() => {
  const keyword = search.value.toLowerCase()
  const results = []

  for (const ip of cards.value) {
    if (filters.ip && ip.name !== filters.ip) continue
    for (const product of ip.products || []) {
      const nameMatch = ip.name.toLowerCase().includes(keyword)
      const productMatch = product.productName.toLowerCase().includes(keyword)

      if (nameMatch || productMatch) {
        results.push({
          ...product,
          ipName: ip.name,
          ipId: ip.ipId
        })
      }
    }
  }
  return results
})

const totalPages = computed(() => {
  return Math.ceil(filteredCards.value.length / pageSize) || 1
})

const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredCards.value.slice(start, start + pageSize)
})

const ipList = computed(() => {
  const set = new Set()
  for (const item of cards.value) {
    if (item.name) set.add(item.name)
  }
  return [{ value: '', label: '全部 IP' }, ...[...set].sort().map(name => ({ value: name, label: name }))]
})

const ipCounts = computed(() => {
  const counts = {}
  for (const ip of cards.value) {
    const name = ip.name
    if (name) {
      counts[name] = (counts[name] || 0) + (ip.products?.length || 0)
    }
  }
  return counts
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    scrollToDivider()
  }
}

const scrollToDivider = () => {
  const divider = document.querySelector('.divider')
  if (divider) {
    const top = divider.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top, behavior: 'smooth' })
  }
}

const initLightGallery = () => {
  if (galleryContainer.value) {
    lgInstance = lightGallery(galleryContainer.value, {
      plugins: [lgThumbnail, lgZoom],
      speed: 500,
      selector: '.gallery-item',
      download: true,
      mousewheel: true
    })
  }
}

const handleImageLoad = (item, event) => {
  item._loaded = true
  setImageInfo(item, event)
}

const setImageInfo = (item, event) => {
  const img = event.target
  item._width = img.naturalWidth
  item._height = img.naturalHeight

  if (!item._size) {
    fetch(img.src)
      .then(res => res.blob())
      .then(blob => {
        item._size = (blob.size / 1024000).toFixed(2) + ' MB'
      })
      .catch(() => {
        item._size = '未知'
      })
  }
}

const showBackToTop = ref(false)
const handleScroll = () => {
  const scrollY = window.scrollY || document.documentElement.scrollTop
  showBackToTop.value = scrollY > 500
}

watch(
  [search, () => filters.ip],
  () => {
    currentPage.value = 1
  }
)

watch(paginatedCards, async () => {
  if (lgInstance) {
    lgInstance.destroy(true)
    lgInstance = null
  }
  await nextTick()
  initLightGallery()
})

watch([() => window.innerWidth, () => window.innerHeight], () => {
  window.removeEventListener('scroll', handleScroll)
}, { immediate: true, deep: true })

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onMounted(async () => {
  try {
    const res = await fetch('./pass.json')
    const data = await res.json()

    cards.value = data.map(ip => ({
      ...ip,
      products: ip.products?.map(p => ({
        ...p,
        _loaded: false,
        _width: 0,
        _height: 0,
        _size: ''
      })) || []
    }))

    await nextTick()
    initLightGallery()
  } catch (err) {
    console.error('加载出错:', err)
    loadError.value = true
  }
})

onUnmounted(() => {
  if (lgInstance) lgInstance.destroy(true)
})
</script>

<style>
body {
  font-family: "Segoe UI", sans-serif;
  background-color: #f7f7f7;
  margin: 0;
  padding: 2rem;
}

@media (max-width: 767px) {
  body {
    padding: 0;
  }

  .card {
    margin: 0.5rem;
  }
}

h1 {
  text-align: center;
  color: #333;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  margin: 1rem 0 2rem;
}

.filters input,
.filters select {
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.card img {
  width: 100%;
  height: auto;
  display: block;
}

.card-body {
  padding: 1rem;
}

.card-body h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  color: #333;
}

/* .card-body p {
      margin: 0.25rem 0;
      font-size: 0.9rem;
      color: #666;
    }*/

.card-body a {
  display: inline-block;
  margin-top: 0.5rem;
  color: #007bff;
  text-decoration: none;
}

.card-body a:hover {
  text-decoration: underline;
}

.fixed.bottom-6.right-6 {
  transition: opacity 0.3s ease;
}

.fixed.bottom-6.right-6:hover {
  opacity: 0.8;
  transform: scale(1.05);
}
</style>
