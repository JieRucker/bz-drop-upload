<template lang="html">
  <div class="upload-folder-btn upload-btn" @click="toUploadFolder">
    <slot>
      <button type="button" name="upload-folder-btn" class="upload-folder-default upload-default">选择文件夹</button>
    </slot>
  </div>
</template>

<script>
export default {
  props: {
    uploadFolderClick: {
      type: Function,
      default: function () {}
    }
  },
  methods: {
    toUploadFolder () {
      this.uploadFolderClick()
    }
  }
}
</script>

<style lang="css">
</style>
