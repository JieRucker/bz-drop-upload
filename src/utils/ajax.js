function getError(action, option, xhr) {
  let msg;
  if (xhr.response) {
    msg = `${xhr.response.error || xhr.response}`;
  } else if (xhr.responseText) {
    msg = `${xhr.responseText}`;
  } else {
    msg = `fail to post ${action} ${xhr.status}`;
  }

  const err = new Error(msg);
  err.status = xhr.status;
  err.method = 'post';
  err.url = action;
  return err;
}

function getBody(xhr) {
  const text = xhr.responseText || xhr.response;
  if (!text) {
    return text;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}

let uploadXHR

function httpRequest(option) {
  return new Promise((resolve, reject) => {
    if (typeof XMLHttpRequest === 'undefined') {
      reject('不支持XMLHttpRequest');
    }

    const xhr = new XMLHttpRequest();
    const action = option.action;

    xhr.onerror = function error(e) {
      reject(e)
    };

    xhr.onload = function onload() {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(getError(action, option, xhr))
      }
      resolve(getBody(xhr))
    };

    xhr.open('post', action, true);

    if (xhr.upload) {
      xhr.upload.onprogress = function progress(e) {
        option.onProgress(e);
      };
    }

    if (option.withCredentials && 'withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    const headers = option.headers || {};

    for (let item in headers) {
      if (headers.hasOwnProperty(item) && headers[item] !== null) {
        xhr.setRequestHeader(item, headers[item]);
      }
    }
    xhr.send(option.formData);
    uploadXHR = xhr
  })
}

export {
  uploadXHR,
  httpRequest
}
