# vue-drop-upload

> 基于vue的批量上传组件，支持上传文件、文件夹。支持拖拽上传

## 安装

> npm install vue-drop-upload

## 功能介绍

*  按钮点击上传文件、文件夹；
*  拖拽上传文件、文件夹；
*  多文件上传；
*  支持大文件分片；
*  支持自动上传；
*  自定义请求头；
*  自定义请求参数；
*  自定义过滤上传文件名；
*  支持配置一次上传最大数量（仅限最外层文件、文件夹）；
*  支持单文件最大上传限制（单位：KB）；
*  可定义不能上传文件夹、只支持文件夹等...
*  可定义最外层只支持上传文件夹；
*  详细的错误提示机制；

## 示例
![vue-drop-upload示例](/upload-example1.png)

![vue-drop-upload示例](/upload-example2.png)

## 使用
### init
``` js
import Vue from 'vue'
import uploader from 'vue-drop-upload'
import App from './App.vue'

Vue.use(uploader)

new Vue({
  render(createElement) {
    return createElement(App)
  }
}).$mount('#app')
```
### App.vue
``` vue
<template>
  <upload
    :multiple="uploadOptions.multiple"
    :action="uploadOptions.action"
    :drag="uploadOptions.drag"
    :upload-folder="uploadOptions.uploadFolder"
    :params="uploadOptions.params"
    :onerror="uploadOptions.error"
    ref="upload"
    >
    <i slot="icon">上传图标</i>
    <button type="button" name="file-button" class="upload-default" slot="file">上传文件</button>
    <button type="button" name="folder-button" class="upload-default" slot="folder">上传文件夹</button>
    <button type="button" name="button" class="upload-default" slot="submit">上传至服务器</button>
    <div class="tip-default" slot="tip">
      支持上传文件、文件夹
    </div>
  </upload>
</template>
<script>
  export default {
    data () {
      uploadOptions: {
        multiple: true,
        action: '',
        drag: true,
        uploadFolder: true,
        params: {},
        onerror: this.onerror
      }
    },
    methods: {
      onerror (err) {

      }
    }
  }
</script>
```

### slots
       所有slot都有默认值，都可不传
  ``slot="icon"`` 拖拽监听框中的图标slot

  ``slot="file"`` 选择文件按钮slot，有默认class:upload-default

  ``slot="folder"`` 选择文件夹按钮slot，有默认class:upload-default

  ``slot="submit"`` 上传按钮slot，有默认class:upload-default

  ``slot="tip"`` 补充文字说明，有默认class:tip-default

### props

| prop | type | description | default |
| :-: | :-: | :-: | :-: |
| action | String | 必选参数，上传的地址 | —— |
| headers | Object | 自定义请求头 | —— |
| params | Object | 自定义请求参数 | —— |
| multiple | Boolean | 是否支持多文件上传（只对上传文件的按钮有效） | false |
| drag | Boolean | 是否支持拖拽上传 | false |
| onlyDrag | Boolean | 是否只支持拖拽上传 | false |
| isShowUploadList | Boolean | 是否显示上传列表 | true |
| accept | String | 支持的文件上传格式（只对上传文件的按钮有效） | —— |
| uploadFolder | Boolean | 是否支持上传文件夹 | false |
| limitRootCount | Number | 最外层文件、文件夹支持的一次性上传个数 | 100 |
| allowRootRepeate | Boolean | 是否允许最外层文件、文件夹名称重复上传 | true |
| rootOnlyNeedFolder | Boolean | 最外层是否只支持上传文件夹 | false |
| maxSize | Number | 单文件上传大小限制（单位：B） | —— |
| isPerPiece | Boolean | 是否对大文件进行分片 | false |
| pieceLimit | Number | 分片大小限制（单位：KB） | 5242880 |
| fileNameFilters | Array | 需要过滤的文件名集合 | —— |
| autoUpload | Boolean | 是否选择后自动提交 | false |
| uploadingAllowUpload | Boolean | 正在上传中时是否支持选择、拖拽上传 | true |
| allowChangeRootName | Boolean | 是否支持更改最外层文件、文件夹名称 | true |
| onlyNeedUploadOneRoot | Boolean | 是否只允许上传一个最外层文件、文件夹（二次选择会覆盖前次选择的文件、文件夹） | false |
| allowDeleteRoot | Boolean | 是否允许删除文件、文件夹（上传列表是否显示删除按钮） | true |
| showFileSize | Boolean | 是否显示已经上传的文件大小/总文件大小 | true |
| withCredentials | Boolean | 跨域时是否发送cookie | false |
| onerror | Function | 错误信息回调 | —— |
| uploadStart | Function | 开始上传回调 | —— |
| uploadEnd | Function | 上传结束回调 | —— |
| fileSelected | Function | 点击选择文件按钮，选择后的回调，参数为选择的文件 | —— |
| folderSelected | Function | 点击选择夹文件按钮，选择后的回调，参数为选择的文件夹中的文件列表 | —— |
| droped | Function | 拖拽后文件、文件夹解析完毕后的回调，参数为解析后的拖拽问价、文件夹（形式为目录树对象） | —— |
| deleteRoot | Function | 删除一个根文件、文件夹的回调，参数：删除文件的index， 删除的文件解析对象，next回调（需要在执行完毕业务程序后调用该回调，执行删除,若不调用next则不执行删除文件、文件夹） | null |
| uploadOneFile | Function | 上传完成一个文件的回调，参数：{ file, response }; file（上传文件的相关信息），response（后端返回的参数信息） | —— |
| changeRootName | Function | 更改最外层文件、文件夹名称回调 | —— |

### 实例方法
    调用方式：this.$refs.upload.submit()
| 名称 | 用途 | 注意事项 |
| :-: | :-: | :-: |
| submit | 提交所选择的文件、文件夹 | —— |
| abort | 取消上传，终止正在发送的请求 | —— |
| clear | 清空上传列表 | 正在上传中不会操作，并发送一个code:9 的error |
| setOriginalData | 设置上传列表数据 | 传入参数必须为Array，一项列表数据表示一个最外层文件、文件夹 |

  >关于setOriginalData方法的参数举例：

``` js
[
  {
    name: '文件夹1', // 文件夹名称
    type: 'folder', // 文件夹类型(默认)
  },
  {
    name: '文件1', // 文件夹名称
    type: 'file', // 文件类型
  }
]
```




### 获取全部的上传数据
    调用方式：this.$refs.upload.originalData
    | 该数据包含上传列表中的所有数据，树状对象描述的目录树结构。

### errorMap (重要)
    项目中所有的异常操作都会调用error回调，参数：
  ``` js
  {
    code: 0, // 根据code确定错误类型
    message: '', // 错误提示文案
    data: {} // error对象，主要用于httpError
  }
  ```
| code | type | description |
| :-: | :-: | :-: |
| 1 | typeError | 反应不支持上传文件夹 |
| 2 | httpError | ajax请求onerror捕获的错误 |
| 3 | responseErrorCode | 请求成功，但后端返回status不是100 |
| 4 | limitRootCountError | 外层文件、文件夹超过限制的数量 |
| 5 | rootOnlyFolderError | 外层只支持上传文件夹，却上传了文件 |
| 6 | maxSizeError | 但文件大于最大限制 |
| 7 | emptyUpload | 上传文件为空 |
| 8 | emptyFolderSelect | 选择了空文件夹 |
| 9 | uploadingNotClear | 正在上传中执行了clear |
| 10 | uploadingNotAllowUpload | 正在上传中不允许选择、拖拽文件 |
| 11 | rootNameRepeat | 最外层文件、文件夹名称重复 |
| 12 | callbackError | 调用回调函数过程中捕捉到的错误 |

### 外附说明
> 分片实现，当上传第一个分片时，后端需要回传uploadId参数，作为后续分片的uploadId参数的值，以此来区分多个分片是属于同一文件。

> 由于我自己公司项目，返回状态码200时，同时需要response.status === 100才为请求成功，因此在代码中有依赖于这一个条件，思考良久没有想到方法可以将这个拆分出去。如有建议可以信息我～～～有需要用到此项目的小伙伴，可自行copy稍作更改即可。
