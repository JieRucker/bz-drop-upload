import upload from './components'

if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(install)
}

function install (Vue) {
  if (install.installed) return
  Vue.component('upload', upload)
}

export default {
  install
}
