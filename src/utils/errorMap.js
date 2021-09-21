/**
 * error说明
 * 将error对象作为回调函数的参数
 * {
 *    code: 0, // 根据code确定错误类型
 *    message: '', // 错误提示文案
 *    data: {} // error对象，主要用于httpError
 * }
 */

export default {
  typeError: 1, // 反应不支持上传文件夹
  httpError: 2, // ajax请求onerror捕获的错误
  responseErrorCode: 3, // 请求成功，但后端返回status不是100
  limitRootCountError: 4, // 外层文件、文件夹超过限制的数量
  rootOnlyFolderError: 5, // 外层只支持上传文件夹，却上传了文件
  maxSizeError: 6, // 但文件大于最大限制
  emptyUpload: 7, // 上传文件为空
  emptyFolderSelect: 8, // 选择了空文件夹
  uploadingNotClear: 9, // 正在上传中执行了clear
  uploadingNotAllowUpload: 10, // 正在上传中不允许选择、拖拽文件
  rootNameRepeat: 11, // 最外层文件、文件夹名称重复
  callbackError: 12 // 回调函数中有错误
}
