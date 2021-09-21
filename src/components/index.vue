<script type="text/javascript">
import List from './uploadList'
import UploadFileBtn from './uploadFile'
import UploadFolderBtn from './uploadFolder'
import UploadDrag from './uploadDrag'
import errorMap from '../utils/errorMap'
import { httpRequest, uploadXHR } from '../utils/ajax'

const noop = function () {}
export default {
  data () {
    return {
      errorMap,
      httpRequest,
      fileEle: null, // input file 上传文件
      folderEle: null, // input file 上传文件夹
      originalData: {
        namePath: '/',
        children: []
      }, // 上传文件数据存储
      dropChangeTimer: null, // 拖拽的函数节流控制定时器
      originalFolderData: { // 定义文件夹对象基础数据
        progress: 0,
        originalId: 0,
        index: 0,
        type: 'folder',
        name: '',
        namePath: '',
        children: [],
        totalFile: 0,
        uploadedFile: 0,
        uploadComplete: false,
        inputShow: false,
        totalSize: 0,
        uploadedSize: 0,
        uploadFailed: false
      },
      originalFileData: { // 定义文件对象基础数据
        progress: 0,
        originalId: 0,
        index: 0,
        type: 'file',
        name: '',
        file: null,
        namePath: '',
        rootId: null,
        chunkList: [],
        uploadedPiece: 0,
        isPiece: false,
        totalPiece: 0,
        inputShow: false,
        totalSize: 0,
        uploadedSize: 0,
        uploadFailed: false
      },
      currentUploadFile: null, //当前正在上传的文件对象
      uploading: false, // 记录是否正在上传
    }
  },
  components: {
    List,
    UploadFileBtn,
    UploadFolderBtn,
    UploadDrag
  },
  props: {
    action: { // 上传目标地址
      type: String,
      required: true
    },
    headers: { // 自定义请求头
      type: Object,
      default() {
        return {}
      }
    },
    params: { // 自定义请求参数
      type: Object,
      default() {
        return {}
      }
    },
    multiple: Boolean, // 是否支持多文件上传
    drag: Boolean, // 是否支持拖拽上传
    onlyDrag: Boolean, // 是否只支持拖拽上传
    accept: String, // 接受的上传文件类型
    uploadFolder: Boolean, // 是否支持上传文件夹
    isShowUploadList: { // 控制是否显示上传列表
      type: Boolean,
      default: true
    },
    limitRootCount: { // 最大一次性上传文件或文件夹个数限制（只限制最外层文件、文件夹）
      type: Number,
      default: 100
    },
    allowRootRepeate: { // 是否允许根文件、文件夹重名
      type: Boolean,
      default: true
    },
    rootOnlyNeedFolder: Boolean, // 最外层只支持文件夹上传
    maxSize: Number, // 单文件最大限制
    isPerPiece: Boolean, // 是否对大文件进行分片
    pieceLimit: { // 分片界限，大于（）的文件将进行分片
      type: Number,
      default: 5 * 1024 * 1024
    },
    fileNameFilters: { // 上传文件须过滤掉的文件名集合
      type: Array,
      default: () => []
    },
    autoUpload: Boolean, // 选择完后自动上传
    uploadingAllowUpload: { // 是否允许正在上传中时选择、拖拽文件进行上传
      type: Boolean,
      default: true
    },
    allowChangeRootName: { // 是否允许修改最外层文件、文件夹名称
      type: Boolean,
      default: true
    },
    allowDeleteRoot: { // 是否允许删除文件、文件夹
      type: Boolean,
      default: true
    },
    showFileSize: { // 显示文件大小及已经上传的大小
      type: Boolean,
      default: true
    },
    onlyNeedUploadOneRoot: { // 只允许上传一个最外层文件、文件夹
      type: Boolean,
      default: false
    },
    onerror: { // 发生错误时的回调
      type: Function,
      default: noop
    },
    fileSelected: { // 点击选择文件按钮，文件选择完毕的回调
      type: Function,
      default: noop
    },
    folderSelected: { // 点击选择文件夹按钮，文件夹选择完毕的回调
      type: Function,
      default: noop
    },
    droped: { // 拖拽完毕，文件、文件夹解析完毕的回调
      type: Function,
      default: noop
    },
    uploadStart: { // 开始上传回调
      type: Function,
      default: noop
    },
    uploadEnd: { // 上传结束回调
      type: Function,
      default: noop
    },
    changeRootName: { // 更改最外层文件、文件夹名称回调
      type: Function,
      default: noop
    },
    deleteRoot: { // 删除最外层文件、文件夹
      type: Function,
      default: null
    },
    uploadOneFile: { // 上传完成一个文件的回调
      type: Function,
      default: noop
    },
    withCredentials: { // 跨域时是否需要传递cookie
      type: Boolean,
      default: false
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.fileEle = this.$refs.file
      this.folderEle = this.$refs.folder
    })
  },
  computed: {
    lastRootId () {
      return this.originalData.children.length ? this.originalData.children[this.originalData.children.length - 1].originalId : 0
    }
  },
  methods: {
    uploadFileClick () {
      this.fileEle.click()
    },
    uploadFolderClick () {
      this.folderEle.click()
    },
    handleFileChange (e) {
      // 若正在上传中，则不能上传
      if (this.uploading && !this.uploadingAllowUpload) {
        this.error(this.errorMap.uploadingNotAllowUpload, '正在上传中，禁止选择文件上传')
        return
      }
      // 将选择的文件处理后，放至originalData
      const files = e.target.files
      if (files.length > this.limitRootCount) {
        this.error(this.errorMap.limitRootCountError, `上传文件数量不能超过${this.limitRootCount}`)
        return
      }
      Array.prototype.slice.call(files).forEach((file, index) => {
        // 若选择的文件不在允许上传的格式中，则不存储
        if (this.accept) {
          const acceptTypes = this.accept.split(',').map(type => type.trim()).filter(type => type)
          if (acceptTypes.indexOf(file.type) === -1) return
        }
        if (this.maxSize && file.size > this.maxSize) {
          const message = `文件${file.name}大小超过${this.maxSize / (1024 * 1024)}M(${this.maxSize / 1024}KB)`
          this.error(this.errorMap.maxSizeError, message)
          return
        }
        // 判断文件名是否重复
        if (!this.allowRootRepeate) {
          const target = this.originalData.children.find(item => item.name === file.name)
          if (target) {
            this.error(this.errorMap.rootNameRepeat, `文件${file.name}名称重复`)
            return
          }
        }
        const newFileData = Object.assign({}, JSON.parse(JSON.stringify(this.originalFileData)), {
          originalId: this.lastRootId + index + 1,
          index: this.lastRootId + index,
          name: file.name,
          file,
          namePath: file.name,
          rootId: this.lastRootId + index + 1,
          totalSize: file.size
        })
        if (this.onlyNeedUploadOneRoot) {
          this.originalData.children.splice(0, this.originalData.children.length)
        }
        this.originalData.children.push(newFileData)
      })
      if (this.autoUpload && this.originalData.children.length) {
        this.submit()
      }
      // 调用文件选择完毕回调,传入选择的文件作为参数
      this.tryCallback(this.fileSelected, files)
      // file读取完毕并存储后，清空fileEle的value，避免两次选择同一文件时不触发change
      this.fileEle.value = ''
    },
    handleFolderChange (e) {
      // 若正在上传中，则不能上传
      if (this.uploading && !this.uploadingAllowUpload) {
        this.error(this.errorMap.uploadingNotAllowUpload, '正在上传中，禁止选择文件夹上传')
        return
      }

      // 判断文件夹名是否重复
      if (!this.allowRootRepeate) {
        const target = this.originalData.children.find(item => item.name === file.name)
        if (target) {
          this.error(this.errorMap.rootNameRepeat, '文件夹名称重复')
          return
        }
      }
      // 按钮的选择的文件夹，将所有文件都解析放至files中，只在webkitRelativePath字段中提现路径
      // 顾 这里的目录树，只有一级
      const files = e.target.files
      if (!files[0]) return
      const dirName = files[0].webkitRelativePath.split('/')[0]
      const dataLength = this.originalData.children.length
      const folder = Object.assign({}, JSON.parse(JSON.stringify(this.originalFolderData)), {
        originalId: this.lastRootId + 1,
        index: this.lastRootId,
        name: dirName,
        namePath: dirName,
        totalFile: files.length
      })
      Array.prototype.slice.call(files).forEach((file, index) => {
        // 文件名称在过滤目标内的文件，不存储
        if (this.fileNameFilters.indexOf(file.name) !== -1) {
          folder.totalFile--
          return
        }
        if (this.maxSize && file.size > this.maxSize) {
          const message = `文件${file.name}大小超过${this.maxSize}K,${this.maxSize / (1024 * 1024)}M`
          this.error(this.errorMap.maxSizeError, message)
          folder.totalFile--
          return
        }
        const newFileData = Object.assign({}, JSON.parse(JSON.stringify(this.originalFileData)), {
          originalId: index + 1,
          index,
          name: file.name,
          file,
          namePath: file.webkitRelativePath,
          rootId: this.lastRootId + 1,
          totalSize: file.size
        })
        folder.totalSize += file.size
        folder.children.push(newFileData)
      })
      if (!folder.children.length) {
        this.error(this.errorMap.emptyFolderSelect, '不能上传空文件夹')
        return
      }
      if (this.onlyNeedUploadOneRoot) {
        this.originalData.children.splice(0, this.originalData.children.length)
      }
      this.originalData.children.push(folder)
      if (this.autoUpload) {
        this.submit()
      }
      // 调用文件夹选择完毕回调,传入选择的文件夹作为参数
      this.tryCallback(this.folderSelected, files)
      this.folderEle.value = ''
    },
    tryCallback (callback, data) {
      if (typeof arguments[0] !== 'function') return
      try {
        const argumentsArray = Array.prototype.slice.call(arguments)
        arguments[0](...argumentsArray.slice(1))
      } catch (e) {
        this.error(this.errorMap.callbackError, e)
      }
    },
    error (code, message, data) {
      const err = {
        code,
        message: message || '',
        data
      }
      if (!err.data) {
        delete err.data
      }
      this.onerror(err)
    },
    // 在指定目录对象下查找文件，找到第一个即返回
    findFile (parent) {
      let file
      parent.children.some(child => {
        if (child.type === 'file') {
          file = child
        } else {
          file = this.findFile(child)
        }
        return file
      })
      return file
    },
    // 拖拽释放文件解析监听
    dropChange (dropFileData) {
      // 使用函数节流，2s后还未收到再次更改要求，则将数据存储
      clearTimeout(this.dropChangeTimer)
      this.dropChangeTimer = setTimeout(() => {
        // 过滤完全空文件夹（从最外层开始都是空）
        const children = dropFileData.children.filter(data => {
          if (data.type === 'folder') {
            const file = this.findFile(data)
            if (file) {
              return true
            }
          } else {
            return true
          }
          return false
        })
        this.originalData.children.push(...children)

        if (this.autoUpload) {
          this.submit()
        }

        // 拖拽文件、文件夹解析完毕，调用回调，传入此次拖拽解析后的文件数据作为参数
        this.tryCallback(this.droped, dropFileData)
      }, 1000)
    },
    // 遍历目录树，寻找上传文件
    findFileToUpload (parent) {
      let target
      parent.children.some(child => {
        if (child.progress === 100 || child.uploadFailed) {
          return false
        }
        if (child.type === 'file' && child.progress === 0) {
          target = child
          return true
        } else if (child.type === 'folder') {
          target = this.findFileToUpload(child)
          if (target) return true
        }
        return false
      })
      return target
    },
    // 处理文件上传发生错误：后端接口发生错误状态码非200或者请求成功，但是后端返回status非100
    handleFileUploadFailed () {
      const _c = this.currentUploadFile
      // 若文件是跟文件，则只处理当前上传文件
      if (_c && _c.namePath.indexOf('/') === -1) {
        _c.uploadFailed = true
        _c.uploadedSize = 0
      } else {
        // 文件不是跟文件，标记文件所在的文件夹为上传失败，并且标记文件夹中的所有文件为失败
        const targetFolder = this.originalData.children.find(item => item.originalId === _c.rootId)
        if (targetFolder) {
          targetFolder.uploadFailed = true
          targetFolder.uploadedSize = 0
          targetFolder.children.forEach(item => {
            item.uploadFailed = true
            item.uploadedSize = 0
          })
        }
      }
    },
    perPieceCurrentUploadFile () {
      const totalPiece = Math.ceil(this.currentUploadFile.file.size / this.pieceLimit)
      let i
      for (i = 0; i < totalPiece; i++) {
        const startSize = i * this.pieceLimit
        const endSize = Math.min(this.currentUploadFile.file.size, startSize + this.pieceLimit)
        const formData = new FormData
        formData.append('name', this.currentUploadFile.namePath)
        formData.append('allPart', totalPiece)
        formData.append('curPart', i + 1)
        formData.append('multiName', this.currentUploadFile.file.slice(startSize, endSize))
        formData.append('attr', this.currentUploadFile.rootId)
        this.currentUploadFile.chunkList.push(formData)
      }
      this.currentUploadFile.totalPiece = totalPiece
    },
    uploadCurrentFilePiece (params) {
      const uploadChunk = this.currentUploadFile.chunkList.shift()
      if (params) {
        for (var key in params) {
          if (params.hasOwnProperty(key) && params[key]) {
            uploadChunk.set(key, params[key])
          }
        }
      }
      const option = {
        formData: uploadChunk,
        headers: this.headers,
        withCredentials: this.withCredentials,
        onProgress: this.onProgress,
        action: this.action
      }
      this.httpRequest(option).then((response) => {
        if (response.status === 100) {
          if (this.currentUploadFile.chunkList.length !== 0) {
            const params = {
              uploadId: null
            }
            if (response.data.uploadId) {
              params.uploadId = response.data.uploadId
            }
            const _c = this.currentUploadFile
            _c.uploadedPiece++
            this.uploadCurrentFilePiece(Object.assign({}, this.params, params))
            _c.progress = Math.round((_c.uploadedPiece / _c.totalPiece) * 100)
            _c.uploadedSize = (_c.totalSize / _c.totalPiece) * _c.uploadedPiece
          } else {
            this.uploadedOneFile(response)
          }
        } else {
          this.uploading = false
          this.handleFileUploadFailed()
          const target = this.originalData.children.find(item => item.originalId == this.currentUploadFile.rootId)
          this.error(this.errorMap.responseErrorCode, response.data, {
            target
          })
          this.uploadSubmit()
          return {message: 'faild'}
        }
      }).catch(error => {
        this.handleFileUploadFailed()
        const target = this.originalData.children.find(item => item.originalId == this.currentUploadFile.rootId)
        this.error(this.errorMap.httpError, undefined, Object.assign({}, error, {
          target
        }))
        this.uploadSubmit()
      })
    },
    setOriginalData (data) {
      this.originalData.children.splice(0, this.originalData.children.length)
      if (!Array.isArray(data)) return
      const assignData = data.map((item, index) => {
        return Object.assign({}, {
          originalId: index + 1,
          index,
          type: data.type || 'folder',
          name: data.name || '',
          namePath: data.name || '',
          children: [],
          totalFile: 0,
          uploadedFile: 0,
          uploadComplete: true,
          progress: 100,
          inputShow: false
        }, item)
      })
      this.originalData.children.push(...assignData)
    },
    deleteRootChild (index) {
      const callBack = () => this.spliceRoot(index)
      if (this.deleteRoot && (typeof this.deleteRoot == 'function')) {
        this.tryCallback(this.deleteRoot, index, JSON.parse(JSON.stringify(this.originalData.children[index])), callBack)
      } else if (this.deleteRoot === null) {
        this.spliceRoot(index)
      }
    },
    spliceRoot (index) {
      this.originalData.children.splice(index, 1)
    },
    changeChildName (index, name) {
      if (!this.allowChangeRootName) return
      this.originalData.children[index].name = name
      this.tryCallback(this.changeRootName, name, this.originalData.children[index])
    },
    toChangeInputShow (index) {
      if (this.uploading) return
      this.originalData.children[index].inputShow = true
    },
    hideChangeInput (index) {
      this.originalData.children[index].inputShow = false
    },
    onProgress (e) {
      // 若文件不是根文件，则不做处理
      if (this.currentUploadFile && this.currentUploadFile.namePath.indexOf('/') !== -1) return
      // 若文件已经分片，不做处理
      if (this.currentUploadFile && this.currentUploadFile.isPiece) return
      const target = this.originalData.children.find(item => {
        return item.type === 'file' && item.namePath === this.currentUploadFile.namePath && item.originalId === this.currentUploadFile.originalId
      })
      if (!target) return
      if (e.lengthComputable) {
        target.progress = Math.round((e.loaded / e.total) * 100)
        target.uploadedSize = Math.round((e.loaded / e.total)) * target.totalSize
      }
      if (target.progress === 100) {
        target.uploadComplete = true
        target.uploadedSize = target.totalSize
      }
    },
    computedProgress () {
      // 处理最外层为文件夹的情况
      const _c = this.currentUploadFile
      _c.progress = 100
      _c.uploadComplete = true
      _c.uploadedSize = _c.totalSize
      if (_c.namePath.indexOf('/') === -1) return
      // 计算当前文件所在的根文件的进度
      const target = this.originalData.children.find(item => item.originalId === _c.rootId)
      if (target) {
        target.uploadedFile++
        target.progress = (target.uploadedFile / target.totalFile) * 100
        target.uploadedSize = (target.uploadedFile / target.totalFile) * target.totalSize
        if (target.progress === 100) {
          target.uploadComplete = true
          target.uploadedSize = target.totalSize
        }
      }
    },
    submit () {
      const willUpdate = this.originalData.children.filter(item => item.progress !== 100)
      if (willUpdate.length > this.limitRootCount) {
        let isFolderMessage = this.uploadFolder ? '文件、文件夹' : '文件'
        if (this.rootOnlyNeedFolder) {
          isFolderMessage = '文件夹'
        }
        this.error(this.errorMap.limitRootCountError, `上传${isFolderMessage}数量不能超过${this.limitRootCount}`)
        return
      }
      this.uploading = true
      this.tryCallback(this.uploadStart)
      this.uploadSubmit()
    },
    // 上传完毕所有分片
    uploadedOneFile (response) {
      // 计算外层文件夹总进度
      this.computedProgress()
      this.tryCallback(this.uploadOneFile, {
        file: this.currentUploadFile,
        response
      })
      // 继续上传下一个文件
      this.uploadSubmit()
    },
    // 上传文件、文件夹
    uploadSubmit () {
      // 寻找可上传文件
      const file = this.findFileToUpload(this.originalData)
      this.currentUploadFile = file
      // 不分片判断条件
      // （找到file && 需要分片 && 文件大小未达到分片极限) || (找到file && 不分片)
      const unPiece = (file && this.isPerPiece && this.currentUploadFile.file.size < this.pieceLimit) || (file && !this.isPerPiece)
      // 找到文件，对当前上传文件进行分片
      if (file && this.isPerPiece && this.currentUploadFile.file.size > this.pieceLimit) {
        // 分片
        this.currentUploadFile.isPiece = true
        this.perPieceCurrentUploadFile()
        // 上传
        this.uploadCurrentFilePiece(this.params)
      } else if(unPiece){
        // 不分片
        const formData = new FormData()
        formData.append('name', this.currentUploadFile.namePath)
        formData.append('allPart', 1)
        formData.append('curPart', 1)
        formData.append('multiName', this.currentUploadFile.file)
        formData.append('attr', this.currentUploadFile.rootId)
        for (var key in this.params) {
          if (this.params.hasOwnProperty(key) && this.params[key]) {
            formData.append(key, this.params[key])
          }
        }
        const option = {
          formData,
          headers: this.headers,
          withCredentials: this.withCredentials,
          action: this.action,
          onProgress: this.onProgress
        }
        this.httpRequest(option).then((response) => {
          if(response.status === 100) {
            this.tryCallback(this.uploadOneFile, {
              file: this.currentUploadFile,
              response
            })
            this.computedProgress()
            this.uploadSubmit()
          } else {
            this.handleFileUploadFailed()
            const target = this.originalData.children.find(item => item.originalId === this.currentUploadFile.rootId)
            this.error(this.errorMap.responseErrorCode, response.data, {
              target
            })
            this.uploading = false
            this.uploadSubmit()
          }
        }).catch(error => {
          this.handleFileUploadFailed()
          const target = this.originalData.children.find(item => item.originalId === this.currentUploadFile.rootId)
          this.error(this.errorMap.httpError, undefined, Object.assign({}, error, {
            target
          }))
          this.uploading = false
          this.uploadSubmit()
        })
      } else if (!file && !this.originalData.children.length) {
        // 无文件可上传
        let isFolderMessage = this.uploadFolder ? '文件、文件夹' : '文件'
        if (this.rootOnlyNeedFolder) {
          isFolderMessage = '文件夹'
        }
        this.error(this.errorMap.emptyUpload, `请先选择${isFolderMessage}`)
        this.uploading = false
      } else if(!file && this.originalData.children.length) {
        this.tryCallback(this.uploadEnd)
        this.uploading = false
      }
    },
    abort () {
      if (uploadXHR && typeof (uploadXHR.abort) == 'function') {
        uploadXHR.abort()
      }
    },
    clear () {
      // 正在上传中，不能清空相关重要数据
      if (this.uploading) {
        this.error(this.errorMap.uploadingNotClear, '正在上传中，不能清空列表')
        return
      }
      this.originalData = {
        children: [],
        namePath: '/'
      }
      this.fileEle = null
      this.folderEle = null
      this.dropChangeTimer = null
      this.currentUploadFile = null
      this.uploading = false
    }
  },
  destroyed () {
    this.clear()
  },
  render() {
    let {
      uploadFileClick,
      uploadFolderClick,
      handleFileChange,
      handleFolderChange,
      error,
      submit,
      dropChange
    } = this
    const uploadDragData = {
      props: {
        originalFolderData: JSON.parse(JSON.stringify(this.originalFolderData)),
        originalFileData: JSON.parse(JSON.stringify(this.originalFileData)),
        uploadFolder: this.uploadFolder,
        limitRootCount: this.limitRootCount,
        rootOnlyNeedFolder: this.rootOnlyNeedFolder,
        maxSize: this.maxSize,
        lastRootId: this.lastRootId,
        error,
        fileNameFilters: this.fileNameFilters,
        dropChange,
        uploadingAllowUpload: this.uploadingAllowUpload,
        uploading: this.uploading,
        allowRootRepeate: this.allowRootRepeate,
        propData: this.originalData
      }
    }
    const uploadDragComponent = this.drag || this.onlyDrag ? (
      <upload-drag
        {...uploadDragData}
      >
        {this.$slots.icon}
      </upload-drag>
    ) : null

    const uploadListData = {
      props: {
        originalData: this.originalData,
        deleteRootChild: this.deleteRootChild,
        uploading: this.uploading,
        changeChildName: this.changeChildName,
        toChangeInputShow: this.toChangeInputShow,
        hideChangeInput: this.hideChangeInput,
        allowChangeRootName: this.allowChangeRootName,
        allowDeleteRoot: this.allowDeleteRoot,
        uploading: this.uploading,
        showFileSize: this.showFileSize
      }
    }

    return (
      <section class="upload-model">
        <div class="upload-file-area">

          <div class="btns-group">
            {!this.onlyDrag ? (
              <div style="display:inline-block">
                {!this.rootOnlyNeedFolder ? (
                  <div class="upload-file-btn upload-btn" on-click={uploadFileClick}>
                    {this.$slots.file ? this.$slots.file : (
                      <button type="button" name="upload-file-btn" class="upload-file-default upload-default">选择文件</button>
                    )}
                  </div>
                ) : null}
                {this.uploadFolder ? (
                  <div class="upload-folder-btn upload-btn" on-click={uploadFolderClick}>
                    {this.$slots.folder ? this.$slots.folder : (
                      <button type="button" name="upload-folder-btn" class="upload-folder-default upload-default">选择文件夹</button>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
            {!this.autoUpload ? (
              <div class="upload-file-btn upload-btn" on-click={submit}>
                {this.$slots.submit ? this.$slots.submit : (
                  <button type="button" name="upload-file-btn" class="upload-file-default upload-default">上传</button>
                )}
              </div>
            ) : null}
            {this.$slots.default}
          </div>
          <div class="drag-area">
            {uploadDragComponent}
          </div>
        </div>
        {this.$slots.tip}
        {this.isShowUploadList ?
          (<list
            {...uploadListData}
          />) : null
        }
        <input type="file" on-change={handleFileChange} name="select-file" accept={this.accept} multiple={this.multiple} ref="file"/>
        <input type="file" on-change={handleFolderChange} webkitdirectory={true} name="select-folder" ref="folder" multiple="multiple"/>
      </section>
    )
  }
}
</script>
<style media="screen">
  .upload-model{
    width: 400px;
    margin: auto;
  }
  .upload-model input[type="file"] {
    display: none;
  }
  .upload-model .btns-group{
    margin-bottom: 10px;
    text-align: left;
  }
  .upload-model .btns-group .upload-btn{
    display: inline-block;
    vertical-align: middle;
    margin-right: 10px;
  }
  .upload-model .btns-group .upload-btn .upload-default {
    padding: 9px 15px;
    font-size: 12px;
    border-radius: 3px;
    color: #fff;
    background-color: #409eff;
    border-color: #409eff;
    outline: none;
    cursor: pointer;
    position: relative;
  }
  .upload-model .btns-group .upload-btn .upload-default:hover ::after{
    content: '';
    position: absolute;
    left:0;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, .3);
  }
  .upload-model .upload-drag {
    background-color: #fff;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    box-sizing: border-box;
    height: 180px;
    text-align: center;
    position: relative;
    overflow: hidden;
    width: 100%;
    margin-bottom: 5px;
  }
  .upload-model .upload-drag.drag-over{
    border: 2px dashed #409eff;
    background-color: rgba(32,159,255,.06);
  }
  .upload-model .upload-drag:hover{
    border-color: #409eff;
  }
  .upload-model .upload-drag .icon-default{
    background: url('../assets/upload.jpg');
    width: 80px;
    height: 60px;
    display: block;
    margin: 0 auto;
    margin-top: 40px;
    background-size: 100%;
    background-repeat: no-repeat;
  }
  .upload-model .drag-tip{
    margin-top: 5px;
    font-size: 12px;
    color: #606266;
  }
  .upload-model .tip-default{
    color: #606266;
    font-size: 14px;
    text-align: left;
  }
  .upload-model .upload-list{
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .upload-model .upload-list li {
    width: 100%;
    margin-bottom: 10px;
    font-size: 14px;
    color: #333;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
    border-radius: 4px;
    line-height: 30px;
    height: 30px;
    padding-right: 5px;
    box-sizing: border-box;
    position: relative;
  }
  .upload-model .upload-list li .file-name{
    display: inline-block;
    vertical-align: middle;
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .upload-model .upload-list li .file-size-info{
    font-size: 12px;
    color: #999;
    float: right;
    margin-right: 10px;
  }
  .upload-model .upload-list li:hover {
    color: rgb(64, 158, 255);
    /* box-shadow: 0 0 2px 1px rgb(64, 158, 255); */
  }
  .upload-model .upload-list li img{
    width: 20px;
    vertical-align: middle;
    margin-right: 5px;
  }
  .upload-model .upload-list li img.file-img{
    width: 14px;
  }
  .upload-model .upload-list li .delete-file{
    float: right;
    font-size: 20px;
    color: #999;
    cursor: pointer;
  }
  .upload-model .upload-list li .delete-file.complete{
    color: #67c23a;
    cursor: auto;
  }
  .upload-model .upload-list li .delete-file.complete:hover{
    color: #67c23a;
  }
  .upload-model .upload-list li .delete-file:hover{
    color: #000;
  }
  .upload-model .upload-list li .upload-progress-box {
    width: 100%;
    height: 2px;
    box-sizing: content-box;
    border: 1px solid rgb(64, 158, 255);
    position: absolute;
    bottom: -4px;
    left: 0;
    border-radius: 2px;
  }
  .upload-model .upload-list li .upload-progress-box.upload-failed{
    border-color: #dbdbdb;
    font-weight: normal;
  }
  .upload-model .upload-list li .upload-progress-box div{
    width: 0;
    position: absolute;
    height: 2px;
    box-sizing: content-box;
    bottom: 0px;
    left: 0;
    transition: .3s;
    background: rgb(64, 158, 255);
  }
</style>
