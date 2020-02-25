function fetch(method, url, cb) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onreadystatechange = function (a) {
        if (this.readyState === 4) {
            cb(this.responseText);
        }
    };
    xhr.send();
}

function GET(url, cb) {
    return fetch('GET', url, cb);
}
