var remote = require('electron').remote;
const $ = require('jquery');
var Tiff = require('tiff.js');
const fs = require('fs'); 
const config = JSON.parse(fs.readFileSync('./src/environment/config/config.json','utf8'));

const fcFileList = $('#fcFileList');
const pass1FileList = $('#pass1FileList');
const pass2FileList = $('#pass2FileList');
const updateButton = $('#updateButton');

function loadFile(){
    readDirectories();
    updateButton.on('click',()=>{
        clearlist();
        readDirectories();
    });
}
function clearlist(){
    fcFileList.empty();
    pass1FileList.empty();
    pass2FileList.empty();
}

function readDirectories(){
    fs.readdir(remote.getGlobal('shared').outputFilePath.QA,(err,dir)=>{
        for(let i in dir){
            let entry = document.createElement('li');
            entry.setAttribute('class','list-group-item');
            entry.setAttribute('style','width:95%');
            entry.innerHTML = dir[i];
            fcFileList.append(entry);
        }
    });
    fs.readdir(remote.getGlobal('shared').outputFilePath.pass1,(err,dir)=>{
        for(let i in dir){
            let entry = document.createElement('li');
            entry.setAttribute('class','list-group-item');
            entry.setAttribute('style','width:90%');
            entry.innerHTML = dir[i];
            pass1FileList.append(entry);
        }
    });
    fs.readdir(remote.getGlobal('shared').outputFilePath.pass2,(err,dir)=>{
        for(let i in dir){
            let entry = document.createElement('li');
            entry.setAttribute('class','list-group-item');
            entry.setAttribute('style','width:90%');
            entry.innerHTML = dir[i];
            pass2FileList.append(entry);
        }
    });
}

$(document).ready(loadFile);
