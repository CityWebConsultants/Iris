var chat = {};

chat.request = function request(url, method, parameters, callback) {
   
    var http = new XMLHttpRequest(),
        params = encodeURIComponent(JSON.stringify(parameters));
    
    http.open(method, url, true);

    http.onreadystatechange = function () {
        if (http.readyState === 4 && http.status === 200) {
            callback(http.responseText);
        }
    };
    
    http.send(params);
    return parameters;
};

chat.login = function (id) {

    chat.request("http://localhost:5000/auth", "POST", {id : id}, function (token) {
    
        document.getElementById("accesstoken").innerHTML = token;
    
    });
    
};

document.getElementById("login").onclick = function () {
  
    chat.login(1);
    
};