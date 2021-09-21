<template lang="html">
  <div class="upload-file-btn upload-btn" @click="toUploadFile">
    <slot>
      <button type="button" name="upload-file-btn" class="upload-file-default upload-default">选择文件</button>
    </slot>
  </div>
</template>

<script>
export default {
  props: {
    uploadFileClick: {
      type: Function,
      default: function () {}
    }
  },
  methods: {
    toUploadFile () {
      this.uploadFileClick()
    }
  }
}
</script>

<style lang="css">
</style>
