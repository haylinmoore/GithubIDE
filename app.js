String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function makeFile(path, content, remote) {
    let paths = path.split("/");
    let name = paths.pop();
    paths.shift();

    var vdirPath = app.vdir;

    var currentPath = "/";
    for (var i in paths) {
        currentPath += paths[i] + "/";
        if (vdirPath[paths[i]] === undefined) {
            Vue.set(vdirPath, paths[i], { type: "folder", path: currentPath })
        }

        vdirPath = vdirPath[paths[i]];
    }

    var ext = name.split(".").pop();
    var type = "text";

    switch (ext) {
        case "js":
            type = "js";
            break;
        case "html":
            type = "html";
            break;
        case "css":
            type = "css";
            break;
    }

    if (remote) {
        Vue.set(vdirPath, name, { url: content, type: "remote", path: path });
    }
    else {
        Vue.set(vdirPath, name, { content: content, type: type, path: path });
    }
}

function importRepo() {
    // Hug me I'm scared, this isnt going to be fun or pretty. Sorry to future Hampton trying to debug/figure this out <3

    /*
    Data Needed
    Get the commit id - https://api.github.com/repos/herohamp/GithubIDE/branches/master
    Get the contents - https://api.github.com/repos/herohamp/GithubIDE/contents/
    Proxy through jsdelivr, thanks school :( - https://cdn.jsdelivr.net/gh/herohamp/GithubIDE@"commitid"/.gitignore
    */

    // Get ready for the async spaghetti probably

    // GetContent -> GetCommitID -> convertToJSDelivr -> uploadToVDir

    function uploadToVDir(files) {
        console.log(files);
        for (var i in files) {
            let id = i;
            $.ajax({
                type: "get",
                url: files[id].download_url,
                success: function(data, text) {
                    makeFile("/" + files[id].path, data, false);
                },

                error: function(request, status, error) {
                    alert("Error");
                }
            });

        }
    }

    function convertToJSDelivr(gitrepo, files, sha) {
        for (var i in files) {
            files[i].download_url = "https://cdn.jsdelivr.net/gh/" + gitrepo[0] + "/" + gitrepo[1] + "@" + sha + "/" + files[i].name
        }
        uploadToVDir(files);
    }

    function getContent(gitrepo) {
        $.ajax({
            type: "get",
            url: "https://api.github.com/repos/" + gitrepo[0] + "/" + gitrepo[1] + "/contents/?access_token=" + localStorage.getItem("oauth"),
            success: function(data, text) {
                getCommitID(gitrepo, data);
            },

            error: function(request, status, error) {
                alert("Error");
            }
        });
    }

    function getCommitID(gitrepo, files) {
        $.ajax({
            type: "get",
            url: "https://api.github.com/repos/" + gitrepo[0] + "/" + gitrepo[1] + "/branches/master?access_token=" + localStorage.getItem("oauth"),
            success: function(data, text) {
                console.log("Got Commit ID", data.commit.sha);
                convertToJSDelivr(gitrepo, files, data.commit.sha);
            },
            error: function(request, status, error) {
                alert("Error");
            }
        });
    }

    getContent([prompt("Username of Repo Owner"), prompt("Repo")]);

}

function authenticate() {
    var oauth = localStorage.getItem("oauth") || prompt("Paste your oAuth Key. See the README for instructions on generation");

    $.ajax({
        type: "get",
        url: "https://api.github.com/user?access_token=" + oauth,
        success: function(data, text) {
            alert("Login Succesful :D");
            localStorage.setItem("oauth", oauth);
            importRepo();
        },
        error: function(request, status, error) {
            alert("Login Error, please check your oAuth key");
            localStorage.removeItem("oauth");
            authenticate();
        }
    });

}

var currentFile = null;

function runCode() {

    if (currentFile === null) { return };

    switch (currentFile.type) {
        case "js":
            eval(editor.getValue());
            break;
        case "html":
            var w = window.open('', "", "scrollbars=yes");

            var content = editor.getValue();

            w.document.write(content);

            var scripts = w.document.querySelectorAll('script'),
                i;
            console.log(scripts);
            for (i = 0; i < scripts.length; ++i) {

                let src = scripts[i].getAttribute('src');
                console.log(src);
                if (pathToVDir(src) != undefined) {
                    scripts[i].removeAttribute('src');
                    scripts[i].innerHTML = pathToVDir(src).content;
                    let temp = document.createElement("script");
                    temp.innerHTML = pathToVDir(src).content;
                    w.document.body.appendChild(temp);
                    scripts[i].remove();
                }
            }

            var styles = w.document.querySelectorAll('link'),
                i;

            for (i = 0; i < styles.length; ++i) {
                let href = styles[i].getAttribute("href");
                if (href != null) {
                    if (pathToVDir(href)) {
                        styles[i].removeAttribute('href');
                        styles[i].innerHTML = pathToVDir(href).content;
                        let temp = document.createElement("style");
                        temp.innerHTML = pathToVDir(href).content;
                        w.document.body.appendChild(temp);
                        styles[i].remove();
                    }
                }

            }

            var remotes = searchForRemotes(app.vdir);

            for (var i in remotes) {
                w.document.body.innerHTML = w.document.body.innerHTML.replaceAll("." + remotes[i].path, remotes[i].url);
                w.document.body.innerHTML = w.document.body.innerHTML.replaceAll(remotes[i].path, remotes[i].url);
                w.document.body.innerHTML = w.document.body.innerHTML.replaceAll(remotes[i].path.substr(1), remotes[i].url);
            }

            break;

    }
}

function searchForRemotes(vdir) {
    var list = [];
    for (var i in vdir) {
        if (typeof vdir[i] != 'object') { continue; }
        if (vdir[i].type === 'folder') {
            list = list.concat(searchForRemotes(vdir[i]));
        }
        else if (vdir[i].type == 'remote') {
            list.push(vdir[i]);
        }
    }
    return list;
}

function pathToVDir(path) {
    try {
        let paths = path.split("/");
        if (paths[0] == "." || paths[0] == "") {
            paths.shift();
        }


        var vdirPath = app.vdir;

        var currentPath = "/";
        for (var i in paths) {
            currentPath += paths[i] + "/";

            vdirPath = vdirPath[paths[i]];
        }

        return vdirPath;
    }
    catch (err) {
        return undefined;
    }
}


Vue.component('file-listing', {
    props: ['file'],
    methods: {
        load: function(event) {

            if (this._props.file.type == "remote") {
                window.open(this._props.file.url, '_blank');
                return;
            }

            if (currentFile != null)
                currentFile.content = editor.getValue();

            let path = pathToVDir(this._props.file.path);
            editor.setValue(path.content);
            currentFile = path;

            switch (currentFile.type) {
                case "js":
                    editor.session.setMode("ace/mode/javascript");
                    break;
                case "html":
                    editor.session.setMode("ace/mode/html");
                    break;
                case "css":
                    editor.session.setMode("ace/mode/css");
                    break;
                default:
                    editor.session.setMode("ace/mode/text");
            }
        }
    },
    template: `<div class="card"> <div class="card-header"> <a class="collapsed card-link" href="#" v-on:click="load">{{file.path}}</a> </div> </div>`
});

Vue.component('folder-listing', {
    id: "",
    props: ['file'],
    template: `<div class="card">
                <div class="card-header">
                  <a class="card-link" data-toggle="collapse" v-bind:href="'#collapese-'+this.id">
                    {{file.path}}
                  </a>
                </div>
                <div v-bind:id="'collapese-'+this.id" class="collapse">
                  <div class="card-body" style="padding: 0px !important; padding-left: 10px;">
                    <div v-for="iFile in file" id="accordion">
                        <file-listing v-bind:file="iFile" v-if="iFile.type != 'folder' && iFile.type != undefined"></file-listing>
                        <folder-listing v-bind:file="iFile" v-if="iFile.type === 'folder'"></folder-listing>
                    </div>
                  </div>
                </div>
              </div>`,
    created() {
        this.id = this._props.file.path.replace(/\//g, '');
    }

});

var app = new Vue({
    el: '#app',
    data: {
        accordion: 0,
        vdir: {

        }
    }
})

var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/text");


/*makeFile("/js/main.js", "alert(1);");
makeFile("/css/main.css", "html, body {\n\tbackground-color:red; \n\tbackground-image: url('./imgs/mountain.jpg'); \n\twidth:100%\n}");
makeFile("/imgs/test.png", "https://dummyimage.com/600x400/000/fff", true);
makeFile("/imgs/mountain.jpg", "https://www.w3schools.com/css/mountain.jpg", true)
makeFile("/index.html", "<link rel='stylesheet' href='./css/main.css' type='text/css' />\n<h1>Hello :D</h1>\n<img src='./imgs/test.png'>\n<script src='/js/main.js'></script>");
*/

document.getElementById("runCode").onclick = runCode;
document.getElementById("createFile").onclick = function() {

    var type = prompt("Type 'remote' for remote file") === 'remote' ? true : false;

    var name = "";
    while (name === "" || name.charAt(0) != "/") {
        name = prompt("Path of file, Start with /");
    }

    if (type) {
        var url = "";
        while (url === "") {
            url = prompt("Remote Path");
        }
        makeFile(name, url, type);
    }
    else {
        makeFile(name, "");
    }
}

authenticate();
