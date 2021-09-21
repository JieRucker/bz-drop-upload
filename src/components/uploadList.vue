<template lang="html">
  <ul class="upload-list">
    <li v-for="(child, index) in originalData.children" :key="child.originalId" :data-index="index">
      <div class="file-main" style="width:100%">
        <img :class="{'file-img': child.type === 'file'}" :src="child.type === 'file' ? fileSrc : folderSrc">
        <strong
          v-if="!child.inputShow"
          class="file-name"
          :style="{'color': child.uploadFailed ? 'red' : '', 'font-weight': child.uploadFailed ? 'normal' : ''}"
          :title="child.name"
          @dblclick="showChange(index, $event)"
        >{{child.name}}</strong>
        <input v-if="child.inputShow" type="text" class="change-name-input" :value="child.name" @keyup.enter="changeName(index, $event)" @blur="changeName(index, $event)">
        <i class="delete-file" @click="deleteFile(index)" v-if="allowDeleteRoot && !uploading">×</i>
        <span class="file-size-info" v-if="child.uploadedSize && child.totalSize && showFileSize">
          <span>{{(child.uploadedSize / (1024 * 1024)).toFixed(2)}}MB</span>
          /
          <span>{{(child.totalSize / (1024 * 1024)).toFixed(2)}}MB</span>
        </span>
      </div>
      <div class="upload-progress-box" :class="{'upload-failed': child.uploadFailed}">
        <div class="upload-progress" :style="{'width': computedProgressWidth(child)}">
        </div>
      </div>
    </li>
  </ul>
</template>

<script>
import fileSrc from '../assets/small-file-icon.jpg'
import folderSrc from '../assets/small-folder-icon.jpg'
const noop = function () {}
export default {
  props: {
    originalData: {
      type: Object,
      default: () => {
        return {
          children: [],
          namePath: '/'
        }
      }
    },
    allowChangeRootName: {
      type: Boolean,
      default: true
    },
    allowDeleteRoot: {
      type: Boolean,
      default: true
    },
    deleteRootChild: {
      type: Function,
      default: noop
    },
    uploading: Boolean,
    changeChildName: {
      type: Function,
      default: noop
    },
    toChangeInputShow: {
      type: Function,
      default: noop
    },
    hideChangeInput: {
      type: Function,
      default: noop
    },
    showFileSize: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      fileSrc,
      folderSrc
    }
  },
  methods: {
    computedProgressWidth (file) {
      if (file.uploadFailed) {
        return '0'
      } else {
        return file.uploadComplete ? '100%' : file.progress + '%'
      }
    },
    deleteFile (index) {
      this.deleteRootChild(index)
    },
    changeName (index, ev) {
      const value = ev.target.value.trim()
      if (value) {
        this.changeChildName(index, value)
      }
      this.hideChangeInput(index)
    },
    findTargetInput (index) {
      const lis = document.querySelectorAll('.upload-list li')
      const li = Array.prototype.slice.call(lis).find((item, i) => {
        return index === i
      })
      const input = li.querySelector('input.change-name-input')
      return input
    },
    showChange (index, ev) {
      if (!this.allowChangeRootName) return
      this.toChangeInputShow(index)
      this.$nextTick(() => {
        const inputEle = this.findTargetInput(index)
        if (inputEle) {
          inputEle.focus()
        }
      })
    }
  }
}
</script>

<style lang="css">
.upload-list .change-name-input{
  -webkit-appearance: none;
  background-color: #fff;
  background-image: none;
  border-radius: 4px;
  border: 1px solid #d8dce5;
  box-sizing: border-box;
  color: #5a5e66;
  display: inline-block;
  font-size: inherit;
  height: 30px;
  line-height: 1;
  outline: 0;
  padding: 0 15px;
  width: 60%;
}
.upload-list .file-name{
  cursor: pointer;
}
</style>
