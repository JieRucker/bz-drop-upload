<template lang="html">
  <div class="">
    <p>
      <button type="button" name="button" @click="abort">取消上传</button>
      <button type="button" name="button" @click="clear">清空</button>
    </p>
    <section>
      <upload
        :multiple="true"
        action=""
        :params="params"
        :onerror="error"
        ref="upload"
        :autoUpload="true"
        :uploadFolder="true"
        :drag="true"
        :folderSelected="folderSelected"
        :allowRootRepeate="false"
        :droped="droped"
        :uploadStart="start"
        :uploadEnd="end"
        :uploadOneFile="uploadOneFile"
        :deleteRoot="deleteRoot"
        >
        <button type="button" name="file-button" class="upload-default" slot="file">上传文件</button>
        <button type="button" name="folder-button" class="upload-default" slot="folder">上传文件夹</button>
        <button type="button" name="button" class="upload-default" slot="submit">上传服务器</button>
        <div class="tip-default" slot="tip">
          支持上传文件、文件夹
        </div>
      </upload>
    </section>
  </div>
</template>

<script>
export default {
  data() {
    return {
      options: {
        target: '//localhost:3000/upload',
        testChunks: false
      },
      attrs: {
        accept: 'image/*'
      },
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      params: {
        uniqueSign: 'M93892838',
        type: 2
      },
      fileNameFilters: ['.DS_Store']
    }
  },
  mounted() {
    this.$nextTick(() => {
      const data = [
        {
          name: '第一个文件夹',
          type: 'folder',
          id: 2
        },
        {
          name: '第二个文件夹',
          type: 'folder',
          id: 4
        },
        {
          name: '第一个文件',
          type: 'file',
          id: 9
        }
      ]
      // this.$refs.upload.setOriginalData(data)
    })
  },
  methods: {
    uploadOneFile (data) {
      console.log(data);
    },
    folderSelected () {
      console.log('文件夹选择完毕');
      this.$refs.upload.submit()
    },
    droped () {
      console.log('拖拽解析完毕');
      // this.$refs.upload.submit()
    },
    error (err) {
      console.log(err);
    },
    start () {
      console.log('uploadStart');
    },
    end () {
      console.log('uploadEnd');
    },
    abort () {
      this.$refs.upload.abort()
    },
    clear () {
      this.$refs.upload.clear()
    },
    deleteRoot (index, file, next) {
      alert('要删除' + file.name)
      next()
    }
  }
}
</script>

<style>
</style>
