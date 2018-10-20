function makeFile(path, content) {
    let paths = path.split("/");
    let name = paths.pop();
    paths.shift();

    var vdirPath = app.vdir;

    var currentPath = "/";
    for (var i in paths) {
        currentPath += paths[i] + "/";
        if (vdirPath[paths[i]] === undefined) {
            console.log("Spawning");
            Vue.set(vdirPath, paths[i], { type: "folder", path: currentPath })
        }

        vdirPath = vdirPath[paths[i]];
    }

    console.log(name, path)

    var ext = name.split(".").pop();
    var type = "text";

    switch (ext) {
        case "js":
            type = "js";
            break;
    }

    Vue.set(vdirPath, name, { content: content, type: type, path: path });
}

var currentFile = null;

function runCode() {

    if (currentFile === null) { return };

    switch (currentFile.type) {
        case "js":
            eval(editor.getValue());
            break;
    }
}

function pathToVDir(path) {
    let paths = path.split("/");
    paths.shift();

    var vdirPath = app.vdir;

    var currentPath = "/";
    for (var i in paths) {
        currentPath += paths[i] + "/";

        vdirPath = vdirPath[paths[i]];
    }

    return vdirPath;
}


Vue.component('file-listing', {
    props: ['file'],
    methods: {
        load: function(event) {
            if (currentFile != null)
                currentFile.content = editor.getValue();

            let path = pathToVDir(this._props.file.path);
            editor.setValue(path.content);
            currentFile = path;
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
        console.log(this._props.file.path);
        this.id = this._props.file.path.replace(/\//g, '');
        console.log(this._props.file.path);
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
editor.session.setMode("ace/mode/javascript");


makeFile("/test/alert.js", "alert(1);");

makeFile("/test/boop/console.js", "console.log(1);");

document.getElementById("runCode").onclick = runCode;