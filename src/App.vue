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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="item in paginatedCards" :key="item.productImagePath" class="card bg-base-200 shadow-xl">
                <figure>
                    <img :src="item.productImagePath" loading="lazy" :alt="item.productName" class="object-cover" @load="event => setImageInfo(item, event)" />
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
            <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="btn btn-sm">
                上一页
            </button>
            <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
            <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="btn btn-sm">
                下一页
            </button>
        </div>
        <button v-show="showBackToTop" @click="scrollToDivider" class="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full shadow-lg transition duration-300">
            ↑
        </button>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'


const search = ref('')
const filters = reactive({ ip: '' })

const loadError = ref(false) // 新增加载错误标志
const cards = ref([])
const currentPage = ref(1)
const pageSize = 40



const totalPages = computed(() => {
  return Math.ceil(filteredCards.value.length / pageSize)
})

const paginatedCards = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredCards.value.slice(start, start + pageSize)
})

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    scrollToDivider() // 每次切换分页时滚动到列表顶部
  }
}

watch(
  [search, () => filters.ip],
  () => {
    currentPage.value = 1
  }
)


// 滚动到 divider 元素位置
const scrollToDivider = () => {
  const divider = document.querySelector('.divider')
  if (divider) {
    const top = divider.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top, behavior: 'smooth' })
  }
}
// 新增返回顶部相关变量
const showBackToTop = ref(false)
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
// 监听滚动事件显示/隐藏按钮
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})
const handleScroll = () => {
  const scrollY = window.scrollY || document.documentElement.scrollTop
  showBackToTop.value = scrollY > 500 // 滚动超过500px时显示按钮
}
// 组件卸载时移除事件监听
watch([() => window.innerWidth, () => window.innerHeight], () => {
  window.removeEventListener('scroll', handleScroll)
}, { immediate: true, deep: true })

// 远程加载 JSON
onMounted(async () => {
  try {
    const res = await fetch('./pass.json')
    if (!res.ok) throw new Error('加载失败')
    cards.value = await res.json()
  } catch (err) {
    console.error('加载 json 出错:', err)
    loadError.value = true
  }
})

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


// 自动从 cards 中生成 IP 筛选项
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



const setImageInfo = (item, event) => {
  const img = event.target
  item._width = img.naturalWidth
  item._height = img.naturalHeight
  fetch(img.src)
    .then(res => res.blob())
    .then(blob => {
      item._size = (blob.size / 1024000).toFixed(2) + ' MB'
    })
    .catch(() => {
      item._size = '未知'
    })
}


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
    padding: 0; /* 移动端移除 padding */
  }
  
  .card {
    margin: 0.5rem; /* 为卡片添加一些外边距 */
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

    .filters input, .filters select {
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
