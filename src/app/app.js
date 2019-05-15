const { BrowserWindow } = require('electron').remote;
const electron = require('electron');
const remote = require('electron').remote;
const path = require('path');
const $ = require('jquery');
const fs = require('fs');
const xml2js = require('xml2js');
const builder = require('xmlbuilder');

var config =  JSON.parse(fs.readFileSync('./src/environment/config/config.json'));
const body = $('#body');
const imagecontainer = $('#imagecontainer');
const pass1 = $('#pass1');
const pass2 = $('#pass2');
const fieldlist1 = $('#fieldlist1');
const fieldlist2 = $('#fieldlist2');                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
const inputTextBox = $('#inputTextBox');
const inputText = $('#inputText');
const image = $('#imgPreview');
const getButton = $('#getButton');
const getNextMsg = $('#getNextMsg');
const getNextBox = $('#getNextBox');
const incorrectButtonDiv = $('#incorrectButtonDiv');
const incorrectButton = $('#incorrectButton');
const checkFilesButton = $('#checkFiles');
const addOutputButton = $('#addOutput');
const hiddenButtonHolder = $('#hiddenButtonHolder');
var parser = new xml2js.Parser();
//constants
let nodeID = config.BPOqueries.nodeID;
let domain = config.BPOqueries.domain;
let port = config.BPOqueries.port;
let contextRoot = config.BPOqueries.contextRoot;
let imageFolder = config.imageFolder;
let pass1Folder = config.pass1Folder;
let pass2Folder = config.pass2Folder;
let outputFolder = config.outputFolder;
//variables
let dataEntryWindow = null;
let fileWindow = null;
let workerid = remote.getGlobal('shared').workerid
let xmlArray;
let currentImage;
let doctype;
let pass2Selected = false;
let selectedXML;
let outputFileName;
let images = [];
let supportDocs = [];
let pass1FileList = [];
let pass2FileList = [];
let discrepancies;
let pass1doctype;
let pass2doctype;
// let discrepanciesImageList = [];
let discrepanciesXMLList = [];
let completeFieldList = [];
let discrepanciesFieldList;
let bpoElement;
let elementID;
let index = 0;
let supportIndex = 0;
let fileExtension;
let tifimg;
//booleans for image movement
var keydown_control = false;
var keydown_arrow_up = false;
var keydown_arrow_down = false;
var keydown_arrow_left = false;
var keydown_arrow_right = false;
var keydown_rotateClockwise = false;
var keydown_rotateCounterClockwise = false;
var keydown_zoomIn = false;
var keydown_zoomOut = false;
var keydown_reset = false;
var keydown_I = false;
var rotate = 0;
var scale = 1;
var left = 0;
var top = 0;

async function initialize(){
    if(config.onBPO){
        await clearElement();
        await getElement();
    }
    if(isEmpty(discrepancies)){
        copyFile();
    }else{
        addViewerIndicators();
        getFields();
        loadPass1();
        loadPass2();
        loadImage();
    }
    hiddenButtonHolder.append(incorrectButtonDiv);
    incorrectButton.on('click',()=>{
        if(index == discrepanciesXMLList.length - 1){
            getButton.html('Get Next Element?');
            getNextMsg.html('Element Done');
            completeToNextNode();
            getButton.on('click',getNextElement);
        }else{
            index++;
            getNextMsg.html('Done');
            getButton.html('Get Next Image/File?');
            getButton.on('click',getNextImage);
        }
        getNextBox.show();
    });
}


function copyFile(){
    let dest = bpoElement.fileLocation + path.sep + outputFolder + path.sep + elementID + '_' + config.AFIdentifier + '.xml';
    let src = bpoElement.fileLocation + path.sep + pass1Folder + path.sep + elementID + '_' + config.AFIdentifier + '.xml';
    fs.mkdir(bpoElement.fileLocation + path.sep + outputFolder, { recursive: true }, (err) => {
        if (err) throw err;
      });
    fs.copyFileSync(src,dest);
    completeToNextNode();
    incorrectButton.off('click',getNextImage);
    initialize();
}

async function getElement(){
    data  = await new Promise((resolve,reject)=>{
        $.get( config.BPOqueries.getCurrentWorkload.replace('workerid', workerid)
            .replace('nodeid', nodeID).replace('domain',domain)
                .replace('port',port).replace('contextroot',contextRoot)).done(resolve).fail((result)=>{
            alert('error ' + result.responseJSON.errorCode);
            window.close();
        });
    });
    if(data.elements.length == 0){
        data = await new Promise((resolve,reject)=>{
                $.get( config.BPOqueries.getElement.replace('workerid', workerid)
                    .replace('nodeid', nodeID).replace('domain',domain)
                        .replace('port',port).replace('contextroot',contextRoot)).done(resolve).fail((result)=>{
                        if(result.responseJSON.errorCode != 463){
                            alert('error ' + result.responseJSON.errorCode);
                            window.close();
                        }else{
                            getNextMsg.html('No Existing Elements in Node');
                            getButton.html('Get Next Element?')
                            getNextBox.show();
                            getButton.on('click',getNextElement);
                        }
                });
        });
        bpoElement = data.element;
        elementID = data.element.elementId;         
    }else{
        bpoElement = data.elements[0]; 
        elementID = data.elements[0].elementId; 
    }
    discrepancies = JSON.parse(bpoElement.extraDetails[config.extraDetail]);
    let keys = [];
    for (let k in discrepancies)keys.push(k);
    //wait to make sure images url are already compiled before proceding to generate page
    await new Promise((resolve)=>{
        fs.readdir(bpoElement.fileLocation + path.sep + imageFolder, (err, dir) => {
            frontPage = config.frontPage;
            if(bpoElement.extraDetails[frontPage] != undefined)frontPages = bpoElement.extraDetails[frontPage].split(/\|/);
            let fileTypes = ['tif','jpg','tiff','jpeg'];
            for(let i in dir){
                if(fileTypes.includes(dir[i].split('.').pop())){
                    if(baseName(dir[i]) == bpoElement.elementName){
                        images.push((bpoElement.fileLocation + path.sep + imageFolder + path.sep + dir[i]).replace(/\\/g, "/"));
                    }else{
                        supportDocs.push((bpoElement.fileLocation + path.sep + imageFolder + path.sep + dir[i]).replace(/\\/g, "/"));
                    }
                }
            }
            if(err != null) alert(err);
            resolve();
        });
    });
    for(let i in discrepancies){
        // discrepanciesImageList.push(i.replace('.xml','.' + images[index].split('.').pop()));
        discrepanciesXMLList.push(i);
    }
    await new Promise((resolve)=>{
        fs.readdir(bpoElement.fileLocation + path.sep + pass1Folder, (err,dir) => {
        for(let i in dir){
            for(let key in discrepanciesXMLList){
                if(discrepanciesXMLList[key].split('\|').includes(dir[i])){
                    pass1FileList.push((bpoElement.fileLocation + path.sep + pass1Folder 
                        + path.sep + dir[i]).replace(/\\/g, "/"));
                }
            }
        }
        if(err != null) alert(err);
            resolve();
        });
    });
    await new Promise((resolve)=>{
        fs.readdir(bpoElement.fileLocation + path.sep + pass2Folder, (err,dir) => {
        for(let i in dir){
            for(let key in discrepanciesXMLList){
                if(discrepanciesXMLList[key].split('\|').includes(dir[i])){
                    pass2FileList.push((bpoElement.fileLocation + path.sep + pass2Folder 
                        + path.sep + dir[i]).replace(/\\/g, "/"));
                }
            }
        }
        if(err != null) alert(err);
            resolve();
        });
    });
    discrepanciesXMLList.sort();
    pass1FileList.sort();
    pass2FileList.sort();
}
//check if extradetails is empty
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

//get basename
function baseName(str)
{
   var base = new String(str).substring(str.lastIndexOf('/') + 1); 
    if(base.lastIndexOf(".") != -1)       
        base = base.substring(0, base.lastIndexOf("."));
   return base;
}

function clearElement(){
    data = null;
    bpoElement = null;
    elementID = null;
    images = [];
    supportDocs = [];
    pass1FileList = [];
    pass2FileList = [];
    discrepanciesImageList = [];
    completeFieldList = [];
    discrepanciesXMLList = [];
    discrepanciesFieldList = null;
    discrepancies = null;
    doctype = undefined;
    currentImage = undefined;
    pass1doctype = undefined;
    pass2doctype = undefined;
    outputFileName = undefined;
    image.attr('src',null);
    imagecontainer.css('background-image', '');
    imagecontainer.css('background-position','0px 0px');
    index = 0;
    supportIndex = 0;
}

function clearCurrentImage(){
    completeFieldList = [];
    outputFileName = undefined;
    doctype = undefined;
    currentImage = undefined;
    pass1doctype = undefined;
    pass2doctype = undefined;
    image.attr('src',null);
    imagecontainer.css('background-image', '');
    fieldlist1.empty();
    fieldlist2.empty();
}

function getFields(){
    let output;
        discrepanciesFieldList = (discrepancies[discrepanciesXMLList[index]]).split(/\|/);  
        try{
            if(fs.existsSync(bpoElement.fileLocation + path.sep + pass1Folder + path.sep + discrepanciesXMLList[index].split('\|')[0])){
                output = fs.readFileSync(bpoElement.fileLocation + path.sep + pass1Folder + path.sep + discrepanciesXMLList[index].split('\|')[0],'ascii');
            }else{
                output = fs.readFileSync(bpoElement.fileLocation + path.sep + pass2Folder + path.sep + discrepanciesXMLList[index].split('\|')[0],'ascii');
            }
        
        }catch(err){
            alert(err)
        }
        parser.parseString(output.substring(0, output.length), function (err, result) {
            json = result;
            currentImage = json.xml['Document_Id'][0];
            doctype = json.xml['Document_Type'][0];
        }); 
}

function loadPass1(){
    if(fs.existsSync(bpoElement.fileLocation + path.sep + pass1Folder 
        + path.sep + discrepanciesXMLList[index].split('\|')[0])){
                if(config.onBPO){
                    try{
                        output = fs.readFileSync(bpoElement.fileLocation + path.sep + pass1Folder + path.sep + discrepanciesXMLList[index].split('\|')[0],'ascii');
                    }catch(err){
                        alert(err)
                    }
                }else{
                    try{
                        output = fs.readFileSync(config.testpass1,'ascii');
                    }catch(err){
                        alert(err)
                    }
                }
        createInputsPass1(output);
    }else if(fs.existsSync(bpoElement.fileLocation + path.sep + pass1Folder 
        + path.sep + discrepanciesXMLList[index].split('\|')[1])){
            if(config.onBPO){
                try{
                    output = fs.readFileSync(bpoElement.fileLocation + path.sep + pass1Folder + path.sep + discrepanciesXMLList[index].split('\|')[1],'ascii');
                }catch(err){
                    alert(err)
                }
            }else{
                try{
                    output = fs.readFileSync(config.testpass1,'ascii');
                }catch(err){
                    alert(err)
                }
            }
        createInputsPass1(output);
    }else{
        pass1.append(incorrectButtonDiv);
    }      
}

function createInputsPass1(output){
        parser.parseString(output.substring(0, output.length), function (err, result) {
            json = result;
        }); 
       for(let i in json.xml){
            let included = false;
            let exTags = config.exemptedTags.split(/\|/);
                for(let skip in exTags){
                    if(!i.includes(exTags[skip])){
                        included = true;
                        continue;
                    }else{
                        included = false;
                        break;
                    }
                }
                if(included){
                    completeFieldList.push(i);
                    let  field = document.createElement('div');
                    field.setAttribute('id',i + 'div1');
                    field.setAttribute('class', "list-group-item fieldvalue");
                    field.setAttribute('style','display:table;width:100%');
                    let fieldInfo = document.createElement('div');
                        fieldInfo.setAttribute('class','fieldInfo');
                    let fieldName = document.createElement('label');
                    fieldName.setAttribute('class', "form-check-label");
                    fieldName.setAttribute('for',i+'check1');
                    fieldName.append(i+' : ');
                    fieldInfo.append(fieldName);
                    let fieldValue = document.createElement('span');
                    fieldValue.setAttribute('class','form-check-label');
                    fieldValue.setAttribute('id',i+'value1');
                    fieldValue.append(json.xml[i][0]);
                    fieldInfo.append(fieldValue);
                    field.append(fieldInfo);
                    let fieldInputs = document.createElement('span');
                    fieldInputs.setAttribute('class','fieldInputs');
                    fieldInputs.setAttribute('type','text');
                    let fieldChangeButton = document.createElement('button');
                    fieldChangeButton.setAttribute('class','btn btn-sm btn-secondary textchange');
                    fieldChangeButton.setAttribute('id',i+'changeButton1');
                    fieldChangeButton.innerHTML = "CHANGE";
                    fieldInputs.append(fieldChangeButton);
                    fieldChangeButton.addEventListener('click',()=>{
                        inputText.val($('#'+i+'value1').html());
                        inputTextBox.show();
                        inputText.focus();
                        inputText.on('keyup',(e)=>{
                            if(e.keyCode == 13){
                                if(keydown_control){
                                    fieldValue.innerHTML = inputText.val();
                                    inputText.off().blur();
                                    if(!fieldInputCheckBox.checked)fieldInputCheckBox.click();
                                    inputTextBox.hide();
                                }
                            }else if(e.key == 'Escape'){
                                inputText.off().blur();
                                inputTextBox.hide();
                            }
                        });
                    });
                    let fieldInputCheckBox = document.createElement('input');
                    fieldInputCheckBox.setAttribute('class',"form-check-input");
                    fieldInputCheckBox.setAttribute('type','checkbox');
                    fieldInputCheckBox.setAttribute('id',i+'check1');
                    fieldInputCheckBox.setAttribute('style','float:right');
                    fieldInputCheckBox.addEventListener('click',()=>{
                        if(fieldInputCheckBox.checked){
                            $('#'+i+'check2').attr('disabled',true);
                        }else{
                            $('#'+i+'check2').attr('disabled',false);
                        }
                    });
                    fieldInputs.append(fieldInputCheckBox);
                    if(discrepanciesFieldList != "" & !discrepanciesFieldList.includes(i)){
                        field.setAttribute('style','display:none');
                    }
                    field.append(fieldInputs);
                    fieldlist1.append(field);
                    fieldName.addEventListener('click',(e)=>{e.stopPropagation();});
                    fieldInputs.addEventListener('click',(e)=>{e.stopPropagation();});
                    field.addEventListener('click',()=>{
                        fieldInputCheckBox.click();
                    });
                }
       }  
}

function loadPass2(){
    if(fs.existsSync(bpoElement.fileLocation + path.sep + pass2Folder + path.sep + discrepanciesXMLList[index].split('\|')[0])){
        if(config.onBPO){
            try{
                output = fs.readFileSync(bpoElement.fileLocation + path.sep + pass2Folder + path.sep + discrepanciesXMLList[index].split('\|')[0],'ascii');
            }catch(err){
                alert(err)
            }
        }else{
            try{
                output = fs.readFileSync(config.testpass2,'ascii');
            }catch(err){
                alert(err)
            }
        }
        createInputsPass2(output);
    }else if(fs.existsSync(bpoElement.fileLocation + path.sep + pass2Folder + path.sep + discrepanciesXMLList[index].split('\|')[1])){
        if(config.onBPO){
            try{
                output = fs.readFileSync(bpoElement.fileLocation + path.sep + pass2Folder + path.sep + discrepanciesXMLList[index].split('\|')[1],'ascii');
            }catch(err){
                alert(err)
            }
        }else{
            try{
                output = fs.readFileSync(config.testpass2,'ascii');
            }catch(err){
                alert(err)
            }
        }
        createInputsPass2(output);
    }else{
        pass2.append(incorrectButtonDiv);
    } 
}

function createInputsPass2(output){
    parser.parseString(output.substring(0, output.length), function (err, result) {
        json = result;
    });        
    for(let i in json.xml){
        let included = false;
        let exTags = config.exemptedTags.split(/\|/);
        for(let skip in exTags){
            if(!i.includes(exTags[skip])){
                included = true;
                continue;
            }else{
                included = false;
                break;
            }
        }
        if(included){
            let  field = document.createElement('div');
            field.setAttribute('id',i + 'div2');
            field.setAttribute('class', "list-group-item list-group-item-action");
            let fieldInfo = document.createElement('div');
                fieldInfo.setAttribute('class','fieldInfo');
            let fieldName = document.createElement('label');
                    fieldName.setAttribute('class', "form-check-label");
                    fieldName.setAttribute('for',i+'check2');
                    fieldName.append(i+' : ');
                    fieldInfo.append(fieldName);
                    let fieldValue = document.createElement('span');
                    fieldValue.setAttribute('class','form-check-label');
                    fieldValue.setAttribute('id',i+'value2');
                    fieldValue.append(json.xml[i][0]);
                    fieldInfo.append(fieldValue);
            field.append(fieldInfo);
            let fieldInputs = document.createElement('span');
                fieldInputs.setAttribute('class','fieldInputs');
                fieldInputs.setAttribute('type','text');
            let fieldChangeButton = document.createElement('button');
                fieldChangeButton.setAttribute('class','btn btn-sm btn-secondary textchange');
                fieldChangeButton.setAttribute('id',i+'changeButton2');
                fieldChangeButton.addEventListener('click',()=>{
                    inputText.val($('#'+i+'value2').html());
                    inputTextBox.show();
                    inputText.focus();
                    inputText.on('keyup',(e)=>{
                            if(e.keyCode == 13){
                                if(keydown_control){
                                    fieldValue.innerHTML = inputText.val();
                                    inputText.off().blur();
                                    if(!fieldInputCheckBox.checked)fieldInputCheckBox.click();
                                    inputTextBox.hide();
                                    return false;
                                }
                            }else if(e.key == 'Escape'){
                                inputText.off().blur();
                                inputTextBox.hide();
                            }
                    });
                });
                fieldChangeButton.innerHTML = "CHANGE";
                fieldInputs.append(fieldChangeButton);
            let fieldInputCheckBox = document.createElement('input');
                fieldInputCheckBox.setAttribute('class',"form-check-input");
                fieldInputCheckBox.setAttribute('type','checkbox');
                fieldInputCheckBox.setAttribute('id',i+'check2');
                fieldInputCheckBox.setAttribute('style','float:right');
                fieldInputCheckBox.addEventListener('click',()=>{
                if(fieldInputCheckBox.checked){
                    $('#'+i+'check1').attr('disabled',true);
                }else{
                    $('#'+i+'check1').attr('disabled',false);
                }
            });
            fieldInputs.append(fieldInputCheckBox);
            if(discrepanciesFieldList != "" & !discrepanciesFieldList.includes(i)){
                field.setAttribute('style','display:none');
            }
            field.append(fieldInputs);
            fieldlist2.append(field);
            fieldName.addEventListener('click',(e)=>{e.stopPropagation();});
            fieldInputs.addEventListener('click',(e)=>{e.stopPropagation();});
            field.addEventListener('click',()=>{
                fieldInputCheckBox.click();
            });
       }
   }
}

function loadImage(){
    fileExtension = currentImage.split('.').pop();
    imagecontainer.css('background-position','0px 0px');
    let imageSrc = bpoElement.fileLocation + '/' + currentImage;
    if( fileExtension == "jpg"){
            image.attr('src', imageSrc);
            imagecontainer.css('background-image','url("'+ image.attr('src') +'")');
            image.on('load',()=>{
                imagecontainer.css('background-size', image.get(0).naturalWidth 
                                + 'px ' + image.get(0).naturalHeight + 'px');
            });
    }else if(fileExtension == "tif"){
            let tiffile = imageSrc;
            let tifinput = fs.readFileSync(tiffile);
            tifimg = new Tiff({buffer:tifinput});
            let tifdataurl = tifimg.toCanvas().toDataURL();
            image.attr('src', tifdataurl);
            imagecontainer.css('background-image','url("'+ image.attr('src') +'")');
            imagecontainer.css('background-size', image.width() + 'px ' + image.height() + 'px');
    }
}

// function loadSupportingImage(){
//     fileExtension = supportDocs[supportIndex].split('.').pop();
//     imagecontainer.css('background-position','0px 0px');
//     if( fileExtension == "jpg"){
//             // image.attr('src', supportDocs[supportIndex]);
//             imagecontainer.css('background-image','url("'+ supportDocs[supportIndex] +'")');
//     }else if(fileExtension == "tif"){
//             let tiffile = supportDocs[supportIndex];
//             let tifinput = fs.readFileSync(tiffile);
//             let tifimg = new Tiff({buffer:tifinput});
//             let tifdataurl = tifimg.toCanvas().toDataURL();
//             imagecontainer.css('background-image','url("'+ tifdataurl +'")');
//             // image.attr('src', tifdataurl);
//     }
// }

async function checkIfAllDone(){
    let imageDone = true;
    if(discrepanciesXMLList[index].split('\|').length == 1 & discrepanciesFieldList != ""){
        for(let i in discrepanciesFieldList){
            // if(discrepanciesFieldList[i] == 'Worker_Id')continue;
                if($('#'+discrepanciesFieldList[i]+'check1').prop('checked') == 
                    $('#'+discrepanciesFieldList[i]+'check2').prop('checked')){
                        $('#'+discrepanciesFieldList[i]+'check1').css('outline','2px solid rgb(252, 107, 97)');
                        $('#'+discrepanciesFieldList[i]+'check2').css('outline','2px solid rgb(252, 107, 97)');
                        setTimeout(()=>{
                            $('#'+discrepanciesFieldList[i]+'check1').css('outline','0 none rgb(51, 51, 51)');
                            $('#'+discrepanciesFieldList[i]+'check2').css('outline','0 none rgb(51, 51, 51)');
                        },5000);
                    imageDone = false;
                }
        }            
    }else{
        let tempXml;
        let json;
        if(pass2Selected){
            if(fs.existsSync(bpoElement.fileLocation + path.sep + pass2Folder + path.sep + discrepanciesXMLList[index].split('\|')[0])){   
               tempXml = fs.readFileSync(bpoElement.fileLocation + path.sep + pass2Folder + path.sep + discrepanciesXMLList[index].split('\|')[0],'ascii');
            }else{
                tempXml = fs.readFileSync(bpoElement.fileLocation + path.sep + pass2Folder + path.sep + discrepanciesXMLList[index].split('\|')[1],'ascii');
            }
        }else{
            if(fs.existsSync(bpoElement.fileLocation + path.sep + pass1Folder + path.sep + discrepanciesXMLList[index].split('\|')[0])){
                tempXml = fs.readFileSync(bpoElement.fileLocation + path.sep + pass1Folder + path.sep + discrepanciesXMLList[index].split('\|')[0],'ascii');
            }else{
                tempXml = fs.readFileSync(bpoElement.fileLocation + path.sep + pass1Folder + path.sep + discrepanciesXMLList[index].split('\|')[1],'ascii');
            }
        }
        await parser.parseString(tempXml.substring(0, tempXml.length), function (err, result) {
            json = result;
            if(err != null)alert(err);
        });
        for(let i in json.xml){
            let included = false;
            let exTags = config.exemptedTags.split(/\|/);
            for(let skip in exTags){
                if(!i.includes(exTags[skip])){
                    included = true;
                    continue;
                }else{
                    if(exTags[skip].includes('_Annotation')){
                        included=true; 
                        break;
                    }
                    included = false;
                    break;
                }
            }
            if(included){
                if(pass2Selected){
                    check = 'check2';
                }else{
                    check = 'check1';
                }
                if($('#'+i+check).prop('checked') == false){
                    $('#'+i+check).css('outline','2px solid rgb(252, 107, 97)');
                    setTimeout(()=>{
                        $('#'+i+check).css('outline','0 none rgb(51, 51, 51)');
                    },3000);
                    imageDone = false;
                }
            }
        }
        if(discrepanciesXMLList[index].split('\|').length != 1){
            if(outputFileName == undefined || doctype == undefined){
                imageDone = false;
                $('#indicator1').css('outline','2px solid rgb(252, 107, 97)');
                $('#indicator2').css('outline','2px solid rgb(252, 107, 97)');
                setTimeout(()=>{
                    $('#indicator1').css('outline','0 none rgb(51, 51, 51)');
                    $('#indicator2').css('outline','0 none rgb(51, 51, 51)');
                },3000);
            }
        }
    }
    if(imageDone){
        saveOutput();
    }
}

function saveOutput(){
    let data = {};
    let doc = builder.create('xml');
    let copyOfInput;
    if(pass2Selected){
        if(fs.existsSync(bpoElement.fileLocation + path.sep + pass2Folder + path.sep + discrepanciesXMLList[index].split('\|')[0])){
            copyOfInput = fs.readFileSync(bpoElement.fileLocation + path.sep + pass2Folder + path.sep + discrepanciesXMLList[index].split('\|')[0],'ascii');
        }else{
            copyOfInput = fs.readFileSync(bpoElement.fileLocation + path.sep + pass2Folder + path.sep + discrepanciesXMLList[index].split('\|')[1],'ascii');
        }
    }else{
        if(fs.existsSync(bpoElement.fileLocation + path.sep + pass1Folder + path.sep + discrepanciesXMLList[index].split('\|')[0])){
            copyOfInput = fs.readFileSync(bpoElement.fileLocation + path.sep + pass1Folder + path.sep + discrepanciesXMLList[index].split('\|')[0],'ascii');
        }else{
            copyOfInput = fs.readFileSync(bpoElement.fileLocation + path.sep + pass1Folder + path.sep + discrepanciesXMLList[index].split('\|')[1],'ascii');
        }
    }
    let documentId;
    parser.parseString(copyOfInput.substring(0, copyOfInput.length), function (err, result) {
        json = result;
        documentId = json.xml['Document_Id'][0];
    });
    doc.ele('Document_Id')
        .txt(documentId).up();
    doc.ele('Document_Type')
        .txt(doctype).up();
    doc.ele('Worker_Id')
        .txt(workerid);
        for(let i in json.xml){
            let included = false;
            let exTags = config.exemptedTags.split(/\|/);
                for(let skip in exTags){
                    if(!i.includes(exTags[skip])){
                        included = true;
                        continue;
                    }else{
                        if(exTags[skip].includes('_Annotation')){
                            included=true; 
                            break;
                        }
                        included = false;
                        break;
                    }
                }
                if(included){
                    if(discrepanciesFieldList.includes(i)){
                        if($('#'+i+"check1").prop('checked')){
                            doc.ele(i)
                            .txt($('#'+i+'value1').html()).up();
                        }else{
                            doc.ele(i)
                            .txt($('#'+i+'value2').html()).up();
                        }
                    }else{
                        doc.ele(i)
                            .txt(json.xml[i][0]).up();
                    }
                }
        }
        if(!fs.existsSync(bpoElement.fileLocation + path.sep + outputFolder)){
            fs.mkdirSync(bpoElement.fileLocation + path.sep + outputFolder, { recursive: true });
        }

        fs.writeFileSync(bpoElement.fileLocation + path.sep + outputFolder + path.sep + outputFileName,  doc.toString( { pretty : true }), function(err){
            if(err) throw err;
        });
        if(outputFileName.split('_').pop() == config.AFIdentifier + ".xml"){
            let src = bpoElement.fileLocation + path.sep + outputFolder + path.sep + outputFileName;
            let dest = bpoElement.fileLocation + path.sep + outputFileName;
            fs.copyFileSync(src,dest);
        }
        if(index == discrepanciesXMLList.length - 1){
            getButton.html('Get Next Element?');
            getNextMsg.html('Element Done');
            completeToNextNode();
            getButton.on('click',getNextElement);
        }else{
            index++;
            getNextMsg.html('Done');
            getButton.html('Get Next Image/File?');
            getButton.on('click',getNextImage);
        }
        hiddenButtonHolder.append(incorrectButtonDiv);
        getNextBox.show();
}

async function getNextImage(){
    getNextBox.hide();
    getButton.off();
    await clearCurrentImage();
    await addViewerIndicators();
    await getFields();   
    loadImage();
    loadPass1();
    loadPass2();
}

function addViewerIndicators(){
    xmlArray = discrepanciesXMLList[index].split('\|');
        if(xmlArray.length > 1){
            pass1doctype = xmlArray[0].split('_').pop().replace('.xml','');
            pass2doctype = xmlArray[1].split('_').pop().replace('.xml','');
        }else{
            pass1doctype = xmlArray[0].split('_').pop().replace('.xml','');
            pass2doctype = xmlArray[0].split('_').pop().replace('.xml','');
        }
    let p1 = document.createElement('a');
    p1.setAttribute('class','indicator list-group-item list-group-item-action');
    p1.setAttribute('href','#');
    p1.setAttribute('id','indicator1');
    p1.innerHTML = '&#9660 Pass 1 | Document Type : ' + pass1doctype;
    fieldlist1.append(p1);
    let p2 = document.createElement('a');
    p2.setAttribute('class','indicator list-group-item list-group-item-action');
    p2.setAttribute('href','#');
    p2.setAttribute('id','indicator2');
    p2.innerHTML = '&#9660 Pass 2 | Document Type : ' + pass2doctype;
    fieldlist2.append(p2);
    if(discrepanciesXMLList[index].split('\|').length > 1){
        p1.addEventListener('click',()=>{
            pass2Selected = false;
            doctype = pass1doctype;
            p1.setAttribute('style','background-color:greenyellow');
            p2.removeAttribute('style','background-color:greenyellow');
            outputFileName = discrepanciesXMLList[index].split('\|')[0];
        });
        p2.addEventListener('click',()=>{
            pass2Selected = true;
            doctype = pass1doctype;
            p2.setAttribute('style','background-color:greenyellow');
            p1.removeAttribute('style','background-color:greenyellow');
            outputFileName = discrepanciesXMLList[index].split('\|')[1];
        });
    }else{
        doctype = pass1doctype;
        outputFileName = discrepanciesXMLList[index]
        if(discrepancies[discrepanciesXMLList[index]] == ""){
            if(fs.existsSync(bpoElement.fileLocation + path.sep + pass1Folder + path.sep + discrepanciesXMLList[index].split('\|')[0])){
                pass2Selected = false;
                doctype = pass1doctype;
            }else{
                pass2Selected = true;
                doctype = pass1doctype;
            }
        }
    }
}

function getNextElement(){
    clearCurrentImage();
    clearElement();
    initialize();
    // addViewerIndicators();
    getNextBox.hide();
    getButton.off();
}

function completeToNextNode(){
    let completeQuery = config.BPOqueries.completeElement.replace('workerid', workerid)
        .replace('nodeid', nodeID).replace('elementid', elementID).replace('domain',domain)
        .replace('port',port).replace('contextroot',contextRoot).replace('nextnode',config.BPOqueries.nextNodeID);
    $.postJSON(completeQuery,config.BPOqueries.completeInputJSON).done();
}

//TODO complete to next node
$.postJSON = function(url, data, callback) {
    return $.ajax({
        headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json' 
        },
        type: 'POST',
        url: url,
        data: JSON.stringify(data),
        dataType: 'application/json',
        success: callback
    });
};



$(document).ready(function(){
    let body = $('body');
    body.on('keydown',(e)=>{
        if(e.key == "Control"){
            keydown_control = true;
        }else if(e.key == "ArrowUp"){
            keydown_arrow_up = true;
        }else if(e.key == "ArrowDown"){
            keydown_arrow_down = true;
        }else if(e.key == "ArrowLeft"){
            keydown_arrow_left = true;
        }else if(e.key == "ArrowRight"){
            keydown_arrow_right = true;
        }else if(e.key == 'r'){
            keydown_reset = true;
        }else if(e.key == 'PageUp'){
            keydown_rotateCounterClockwise = true;
        }else if(e.key == 'PageDown'){
            keydown_rotateClockwise = true;
        }else if(e.key =='+'){
            keydown_zoomIn = true;
        }else if(e.key =='-'){
            keydown_zoomOut = true;
        }else if(e.key == 'I'){
            keydown_I = true;
        }
        // else if(e.key == 'F1'){
        //     if(index > 0){
        //         index--;
        //     }else{
        //         index = 0;
        //     }
        //     getNextImage();
        //     //change to previous
        // }else if(e.key == 'F2'){
        //     if(index < discrepanciesXMLList.length - 1){
        //         index++;
        //     }else{
        //         index = discrepanciesXMLList.length - 1;
        //     }
        //     getNextImage();
        //     //index++ or view supportdocs
        //     //change to next
        // }
        else if(e.key == 'F6'){
                checkIfAllDone();
            //save
        }else if(e.key == 'F4'){
            // image.css('width', imagecontainer.width() + 'px ');
            // image.css('top',0);
            // image.css('left',0);
            if(fileExtension == 'jpg'){
                imagecontainer.css('backgroundSize', imagecontainer.width() + 'px ' + (image.get(0).naturalHeight) + 'px');
            }else{
                imagecontainer.css('backgroundSize', imagecontainer.width() + 'px ' + (tifimg.height()) + 'px');
            }
            imagecontainer.css('backgroundPosition-x',0);
            imagecontainer.css('backgroundPosition-y',0);
        }
        //image manipulation
        if(keydown_control){
            if(keydown_zoomIn){
                // scale += .1;
                // image.css('transform', 'rotate('+ rotate +'deg) scale(' + scale + ')');
                let bgSizeText = imagecontainer.css('backgroundSize').split(' ');
                let initWidth = parseFloat(bgSizeText[0].replace('px', ' '));
                let initHeight = parseFloat(bgSizeText[1].replace('px', ' '));
                let width = initWidth + (initWidth*.1);
                let height = initHeight + (initHeight*.1);
                imagecontainer.css('backgroundSize', width + 'px ' + height + 'px');
            }else if(keydown_zoomOut){
                // scale -= .1;
                // image.css('transform', 'rotate('+ rotate +'deg) scale(' + scale + ')');
                let bgSizeText = imagecontainer.css('backgroundSize').split(' ');
                let initWidth = parseFloat(bgSizeText[0].replace('px', ' '));
                let initHeight = parseFloat(bgSizeText[1].replace('px', ' '));
                let width = initWidth - (initWidth*.1);
                let height = initHeight - (initHeight*.1);
                imagecontainer.css('backgroundSize', width + 'px ' + height + 'px');
            }else if(keydown_arrow_up){
                // top--;
                // image.css('top', top + '%');
                let initial = imagecontainer.css('backgroundPosition-y');
                imagecontainer.css('backgroundPosition-y', 'calc('+ initial + ' - 30px)');
            }else if(keydown_arrow_down){
                // top++;
                // image.css('top', top + '%');
                let initial = imagecontainer.css('backgroundPosition-y');
                imagecontainer.css('backgroundPosition-y', 'calc('+ initial + ' + 30px)');
            }else if(keydown_arrow_right){ 
                // left++;
                // image.css('left', left + '%');
                let initial = imagecontainer.css('backgroundPosition-x');
                imagecontainer.css('backgroundPosition-x', 'calc('+ initial + ' + 30px)');
            }else if(keydown_arrow_left){
                // left--;
                // image.css('left', left + '%');
                let initial = imagecontainer.css('backgroundPosition-x');
                imagecontainer.css('backgroundPosition-x', 'calc('+ initial + ' - 30px)');
            }else if(keydown_rotateCounterClockwise){ 
                rotate -= 90;
                imagecontainer.css('transform', 'rotate('+ rotate +'deg) scale(' + scale + ')');
            }else if(keydown_rotateClockwise){
                rotate += 90;
                imagecontainer.css('transform', 'rotate('+ rotate +'deg) scale(' + scale + ')');
            }else if(keydown_I){
                // e.preventDefault();  ctrl + i no function yet
            }else if(keydown_reset){
                e.preventDefault();
                imagecontainer.css('transform', 'rotate('+ 0 +'deg) scale(' + 1 + ')');
                if(fileExtension == "tif"){
                    imagecontainer.css('backgroundSize', (tifimg.width()) + 'px ' + (tifimg.height()) + 'px');
                }else{
                    imagecontainer.css('backgroundSize', (image.get(0).naturalWidth) + 'px ' + (image.get(0).naturalHeight) + 'px');
                }
                if(fileExtension == 'jpg' || fileExtension == 'jpeg'){
                    imagecontainer.css('backgroundSize', image.width + 'px ' + image.height + 'px')
                }else{
                    imagecontainer.css('backgroundSize', tifimg.width() + 'px ' + tifimg.height() + 'px')
                }
                imagecontainer.css('backgroundPosition-x',0);
                imagecontainer.css('backgroundPosition-y',0);
                rotate = 0;
            }
        }
    });

    
    imagecontainer.on('mousewheel', function(e){
        if(e.originalEvent.wheelDelta /120 > 0) {
            // scale += .1;
            // imagecontainer.css('transform', 'rotate('+ rotate +'deg) scale(' + scale + ')');
            let bgSizeText = imagecontainer.css('backgroundSize').split(' ');
                let initWidth = parseFloat(bgSizeText[0].replace('px', ' '));
                let initHeight = parseFloat(bgSizeText[1].replace('px', ' '));
                let width = initWidth + (initWidth*.1);
                let height = initHeight + (initHeight*.1);
                imagecontainer.css('backgroundSize', width + 'px ' + height + 'px');
        }
        else{
            // scale -= .1;
            // imagecontainer.css('transform', 'rotate('+ rotate +'deg) scale(' + scale + ')');
            let bgSizeText = imagecontainer.css('backgroundSize').split(' ');
                let initWidth = parseFloat(bgSizeText[0].replace('px', ' '));
                let initHeight = parseFloat(bgSizeText[1].replace('px', ' '));
                let width = initWidth - (initWidth*.1);
                let height = initHeight - (initHeight*.1);
                imagecontainer.css('backgroundSize', width + 'px ' + height + 'px');
        }
    });
    body.on('keyup',(e)=>{
        if(e.key == "Control"){
            keydown_control = false;
        }else if(e.key == "ArrowUp"){
            keydown_arrow_up = false;
        }else if(e.key == "ArrowDown"){
            keydown_arrow_down = false;
        }else if(e.key == "ArrowLeft"){
            keydown_arrow_left = false;
        }else if(e.key == "ArrowRight"){
            keydown_arrow_right = false;
        }else if(e.key == 'PageUp'){
            keydown_rotateCounterClockwise = false;
        }else if(e.key == 'r'){
            keydown_reset = false;
        }else if(e.key == 'PageDown'){
            keydown_rotateClockwise = false;
        }else if(e.key == '+'){
            keydown_zoomIn = false;
        }else if(e.key == '-'){
            keydown_zoomOut = false;
        }else if(e.key == 'I'){
            keydown_I = false;
        }
    });  
});

//make image viewer draggable
$(document).ready(function(){
    var $bg = $('#imagecontainer'),
        origin = {x: 0, y: 0},
        start = {x: 0, y: 0},
        movecontinue = false;
    
    function move (e){
        var moveby = {
            x: origin.x - e.clientX, 
            y: origin.y - e.clientY
        };
        
        if (movecontinue === true) {
            start.x = start.x - moveby.x;
            start.y = start.y - moveby.y;
            
            $(this).css('background-position', start.x + 'px ' + start.y + 'px');
        }
        
        origin.x = e.clientX;
        origin.y = e.clientY;
        
        e.stopPropagation();
        return false;
    }
    
    function handle (e){
        movecontinue = false;
        $bg.unbind('mousemove', move);
        if (e.type == 'mousedown') {
            if(e.clientX != $bg.width - 10)origin.x = e.clientX;
            if(e.clientY != $bg.height - 10)origin.y = e.clientY;
            movecontinue = true;
            $bg.bind('mousemove', move);
        } else {
            $(document.body).focus();
        }
        
        e.stopPropagation();
        return false;
    }
    
    function reset (){
        start = {x: 0, y: 0};
        $(this).css('backgroundPosition', '0 0');
    }
    
    $bg.bind('mousedown mouseup mouseleave', handle);
    $bg.bind('dblclick', reset);
});

var isSyncingLeftScroll = false;
var isSyncingRightScroll = false;
var leftDiv = document.getElementById('pass1');
var rightDiv = document.getElementById('pass2');

leftDiv.onscroll = function() {
	if (!isSyncingLeftScroll) {
  	isSyncingRightScroll = true;
  	rightDiv.scrollTop = this.scrollTop;
  }
  isSyncingLeftScroll = false;
}

rightDiv.onscroll = function() {
	if (!isSyncingRightScroll) {
  	isSyncingLeftScroll = true;
  	leftDiv.scrollTop = this.scrollTop;
  }
  isSyncingRightScroll = false;
}

checkFilesButton.on('click',()=>{
    remote.getGlobal('shared').outputFilePath.QA = bpoElement.fileLocation + path.sep + config.outputFolder;
    remote.getGlobal('shared').outputFilePath.pass1 = bpoElement.fileLocation + path.sep + config.pass1Folder;
    remote.getGlobal('shared').outputFilePath.pass2 = bpoElement.fileLocation + path.sep + config.pass2Folder;
    createFileWindow();
});

addOutputButton.on('click',()=>{
    remote.getGlobal('shared').bpoElement = bpoElement;
    remote.getGlobal('shared').imageFileName = currentImage;
    remote.getGlobal('shared').workerid = workerid;
    createDataEntryWindow();
});

//create preview window to show the whole document can be zoomed and rotated
function createFileWindow(){
    if(fileWindow == null){
        fileWindow = new BrowserWindow({parent:remote.getGlobal('mainWindow'),
        width:500,height:600, resizable:false, webPreferences: { nodeIntegration:true, plugins: true }});
        fileWindow.loadFile('./src/app/viewer/viewer.html');
        fileWindow.setMenuBarVisibility(false);
        fileWindow.on('close',()=>{
            fileWindow = null;
            remote.getGlobal('mainWindow').focus();
        });
    }
}

function createDataEntryWindow(){
    if(dataEntryWindow == null){
        let display = electron.screen.getPrimaryDisplay();
        let width = display.bounds.width;
        dataEntryWindow = new BrowserWindow({parent:remote.getGlobal('mainWindow'),
        width:700,height:800,x:width-700,y:0, resizable:false, webPreferences: { nodeIntegration:true, plugins: true }});
        dataEntryWindow.loadFile('./src/app/data-entry/data-entry.html');
        dataEntryWindow.setMenuBarVisibility(false);
        dataEntryWindow.on('close',()=>{
            dataEntryWindow = null;
            remote.getGlobal('mainWindow').focus();
            if(remote.getGlobal('shared').imageDone){
                if(index == discrepanciesXMLList.length - 1){
                    getButton.html('Get Next Element?');
                    getNextMsg.html('Element Done');
                    completeToNextNode();
                    getButton.on('click',getNextElement);
                }else{
                    index++;
                    getNextMsg.html('Done');
                    getButton.html('Get Next Image/File?');
                    getButton.on('click',getNextImage);
                }
                getNextBox.show();
            }
        });
    }
}

$(document).ready(initialize);