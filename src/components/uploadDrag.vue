<template lang="html">
  <div
    class="upload-drag"
    :class="{'drag-over': dragOver}"
    @drop.prevent.stop="onDrop"
    @dragover.prevent.stop="onDragOver"
    >
    <slot>
      <i class="icon-default"></i>
    </slot>
    <div class="drag-tip" v-if="!this.uploadFolder">
      将文件拖拽到此处上传
    </div>
    <div class="drag-tip" v-if="this.uploadFolder && !this.rootOnlyNeedFolder">
      将文件、文件夹拖拽到此处上传
    </div>
    <div class="drag-tip" v-if="this.uploadFolder && this.rootOnlyNeedFolder">
      将文件夹拖拽到此处上传
    </div>
  </div>
</template>

<script>
import errorMap from '../utils/errorMap'
export default {
  data() {
    return {
      dragOver: false,
      originalData: {
        namePath: '/',
        children: []
      },
      errorMap
    }
  },
  props: {
    uploadFolder: Boolean,
    propData: {
      type: Object,
      default () {
        return {}
      }
    },
    uploading: Boolean,
    uploadingAllowUpload: {
      type: Boolean,
      default: true
    },
    originalFileData: {
      type: Object,
      default: () => {
        return {}
      }
    },
    originalFolderData: {
      type: Object,
      default: () => {
        return {}
      }
    },
    error: {
      type: Function,
      default: function () {}
    },
    fileNameFilters: {
      type: Array,
      default: () => []
    },
    dropChange: {
      type: Function,
      default: function () {}
    },
    limitRootCount: {
      type: Number,
      default: 100
    },
    rootOnlyNeedFolder: Boolean,
    maxSize: Number,
    lastRootId: Number,
    allowRootRepeate: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    onDrop (e) {
      console.log('onDrop', e);
      this.dragOver = false
      // 若选择完文件正在上传中，则返回，并发送一个error
      if (this.uploading && !this.uploadingAllowUpload) {
        this.error(this.errorMap.uploadingNotAllowUpload, '正在上传中，不能拖拽文件')
        return
      }
      this.originalData = {
        namePath: '/',
        children: []
      }
      const items = e.dataTransfer.items
      if (items.length > this.limitRootCount) {
        let isFolderMessage = this.uploadFolder ? '文件、文件夹' : '文件'
        if (this.rootOnlyNeedFolder) {
          isFolderMessage = '文件夹'
        }
        this.error(this.errorMap.limitRootCountError, `上传${isFolderMessage}数量不能超过${this.limitRootCount}`)
        return
      }
      for (let j = 0; j < items.length; j++) {
        const targetItem = items[j].webkitGetAsEntry()

        console.log('targetItem', targetItem);

        // 校验文件夹名称是否重复
        if (!this.allowRootRepeate && this.propData.children) {
          const target = this.propData.children.find(item => item.name === targetItem.name)
          if (target) {
            if (this.rootOnlyNeedFolder) {
              this.error(this.errorMap.rootNameRepeat, `文件夹${targetItem.name}名称重复`)
            } else {
              this.error(this.errorMap.rootNameRepeat, `文件（文件夹）${targetItem.name}名称重复`)
            }
            continue
          }
        }
        if (targetItem) {
          const index = j + this.lastRootId
          // 是文件夹
          if (targetItem.isDirectory) {
            if (!this.uploadFolder) {
              // 不支持上传文件夹
              this.error(this.errorMap.typeError, '不支持上传文件夹')
              continue
            }
            this.handleFolders(targetItem, null, index, index + 1, j)
          } else if (targetItem.isFile) {
            // 是文件
            if (!this.rootOnlyNeedFolder) {
              this.handleFolders(targetItem, null, index, index + 1, j)
            } else {
              this.error(this.errorMap.rootOnlyFolderError, '只支持上传文件夹')
            }
          }
        }
      }
    },
    /**
     * 向文件树中插入文件
     * @param  {Object} parent     父级对象
     * @param  {String} parentPath 父级的路径
     * @param  {Object} entry      要存储的子集对象
     */
    insertEntry (parent, parentPath, entry) {
      if (parentPath) {
        // 在父级children中的type：folder中查找namePath === parentPath项，并将entry插入到
        // 若在这一级中为找到namePath匹配项，则递归子集中的chidren查找
        parent.children.filter(item => item.type === 'folder').forEach(data => {
          if (data.namePath === parentPath) {
            data.children.push(entry)
          } else {
            this.insertEntry(data, parentPath, entry)
            this.dropChange(this.originalData)
          }
        })
      } else {
        // 若parentPath不存在，则将entry插入到根对象的children
        this.originalData.children.push(entry)
        this.dropChange(this.originalData)
      }
    },
    /**
     * 继续深度处理解析后的文件或文件夹
     * @param  {Object} entry      要处理的文件、文件夹对象
     * @param  {String} parentPath 父级路径
     * @param  {Number} index      文件的索引
     */
    handleFolders (entry, parentPath, index, rootId, rootIndex) {
      if (!entry) return
      if (entry.isFile) {
        // 若要处理的为文件，则将文件插入到指定位置
        entry.file(file => {
          // 过滤文件名
          if (this.fileNameFilters.indexOf(file.name) !== -1) return
          // 判断文件大小是否超限
          if (this.maxSize && file.size > this.maxSize) {
            const message = `文件${file.name}大小超过${this.maxSize}K,${this.maxSize / (1024 * 1024)}M`
            this.error(this.errorMap.maxSizeError, message)
            return
          }
          const resultFile = Object.assign({}, JSON.parse(JSON.stringify(this.originalFileData)), {
            name: entry.name,
            namePath: entry.fullPath.slice(1),
            file,
            originalId: index + 1,
            index,
            rootId,
            totalSize: file.size
          })
          // 根文件统计文件个数及大小
          if (this.originalData.children[rootIndex]) {
            this.originalData.children[rootIndex].totalFile++
            this.originalData.children[rootIndex].totalSize += file.size
          }
          this.insertEntry(this.originalData, parentPath, resultFile)
        })
      } else if (entry.isDirectory) {
        // 若处理的为文件夹，则将文件夹插入到指定位置，并继续解析文件夹，并递归调用深度解析
        const resultFolder = Object.assign({}, JSON.parse(JSON.stringify(this.originalFolderData)), {
          name: entry.name,
          namePath: entry.fullPath.slice(1),
          originalId: index + 1,
          index
        })
        this.insertEntry(this.originalData, parentPath, resultFolder)
        const dirReader = entry.createReader()
        // 调用文件夹内容解析
        this.readDir(dirReader, entry, rootId, rootIndex)
      }
    },
    readDir (dirReader, entry, rootId, rootIndex) {
      dirReader.readEntries((entries) => {
        if (entries.length) {
          for (let j = 0; j < entries.length; j++) {
            this.handleFolders(entries[j], entry.fullPath.slice(1), j, rootId, rootIndex)
          }
          // entries长度不为0，继续调用解析，直至长度为0。因为chrome浏览器只支持一次解析100个
          this.readDir(dirReader, entry, rootId, rootIndex)
        }
      })
    },
    onDragOver () {
      console.log('onDragOver');
      this.dragOver = true
      if (this.timeout !== null) {
        clearTimeout(this.timeout);
      }
      this.timeout = setTimeout(() => {
        this.dragOver = false;
        this.timeout = null;
      }, 100);
    },
  }
}
</script>
