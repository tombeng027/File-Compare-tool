var remote = require('electron').remote;
const $ = require('jquery');
var Tiff = require('tiff.js');
const fs = require('fs'); 
const config = JSON.parse(fs.readFileSync('./src/environment/config/config.json','utf8'));

const builder = require('xmlbuilder');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const Moment = require('moment');
const body = $('#body');
const inputcontainer = $('#inputcontainer');
const path = require('path');

var schemaBox = $('#schemaBox');
var schemaButton = $('#selectSchemaButton');
var schemaSelection = $('#schemaSelection');
var input;
//constants
const sectioncoords = 'sectionCoordinates';
const validity = 'validity';
const regexformat = 'regexformat';
const date = 'date';
const numeric = 'numeric';
const alphanumeric = 'alphanumeric';
const mandatory = 'mandatory';
const specific = 'specific';
const invalidcharacters = 'invalidcharacters';
let bpoElement = remote.getGlobal('shared').bpoElement;
let imageFileName = remote.getGlobal('shared').imageFileName;
let workerid = remote.getGlobal('shared').workerid;

function initialize(){
    createSchemaBox();
}

async function createSchemaBox(){
    inputcontainer.append(schemaButton);
    let schemaList = await getSchemaList();
        for(let i in schemaList){
            let entry = document.createElement('a');
            let list = document.createElement('li');
            list.setAttribute('role','presentation');
            entry.setAttribute('role','menuitem');
            entry.setAttribute('tab-index','-1');
            entry.setAttribute('href','#');
            entry.addEventListener('click',async (e)=>{
                e.stopPropagation();
                input = await getSchema(schemaList[i]);
                body.append(schemaButton)
                inputcontainer.empty();
                createInputFields();
                doctype = schemaList[i];
                schemaBox.html(schemaList[i].toLocaleUpperCase());
            });
            entry.innerHTML = schemaList[i].toLocaleUpperCase();
            list.append(entry);
            schemaSelection.append(list);
        }
}

async function getSchemaList(){
    var msg = $.ajax({type: "GET", url: config.GDERestClient.schemaFolder, async: false}).responseText;
    return msg.split('|');
}

async function getSchema(schemaId){
    let schema =  await new Promise((resolve,reject)=>{
        $.get(config.GDERestClient.schemaFolder + schemaId).done(resolve);
        // $.get(config.GDERestClient.schemaFolder + elementID.substring(0,elementID.indexOf('.')).toLowerCase()).done(resolve);
    });
    return schema;
}

function createInputFields(){
        //creation of the input forms
        var inputdiv = $('<div class="form-group form-group-sm">');
        let x = 1;
        for(let n in input){
            for(let i in input[n]){
                if(i != sectioncoords){
                    let inputprep = $('<div class="input-group">');
                    let inputlinetitle = $('<span class="input-group-addon">').append(input[n][i].fieldLabel);
                    if(input[n][i].validation.mandatory != undefined) inputlinetitle.css('color','rgb(253, 107, 107)');
                    //inputlinetitle.css();
                    inputprep.css('float','left');
                    inputprep.css('box-sizing','border-box');
                    inputprep.append(inputlinetitle);
                    let inputline = document.createElement('input');
                    inputline.setAttribute('id', i);
                    inputline.setAttribute('type','text');
                    if(input[n][i].validation.regexformat != undefined)inputline.setAttribute('placeholder', input[n][i].validation.regexformat);
                    inputline.setAttribute('class', 'form-control form-control-sm');
                    inputprep.append(inputline);
                    inputline.setAttribute('tabIndex', x++);
                    if(input[n][i].validation.locked){
                        inputline.setAttribute("disabled",true);
                    }
                    inputdiv.append(inputprep);
                }
            }
        }
        inputcontainer.append(inputdiv);
        //create save button
        savebutton = $('<button type="button" class="btn btn-sm btn-primary">');
        savebutton.attr('margin','10% 30% 10% 5%');
        savebutton.attr('tabIndex',x)
        savebutton.html('SAVE');
        savebutton.click(writejsonoutput);
        inputcontainer.append(savebutton);
}


//get basename
function baseName(str)
{
   var base = new String(str).substring(str.lastIndexOf('/') + 1); 
    if(base.lastIndexOf(".") != -1)       
        base = base.substring(0, base.lastIndexOf("."));
   return base;
}

async function writejsonoutput(){
    // let data = {};
    console.log(doctype.split(' - '))
    let doc = builder.create('xml');
    doc.ele('Document_Id')
        .txt(baseName(imageFileName)).up();
    doc.ele('Document_Type')
        .txt(doctype).up();
    doc.ele('Worker_Id')
        .txt(workerid).up();
    for(let n in input){
        for(let i in input[n]){
            //loop for no parent child
                if(i != 'sectionCoordinates'){
                    // data[i] = $('#'+i).val();
                    if(input[n][i].validation.collection == date){
                        let outputDate = new Moment($('#'+i).val());
                        doc.ele(i)
                        .txt(outputDate.format(input[n][i].validation.regexformat)).up();
                    }else{
                        doc.ele(i)
                        .txt($('#'+i).val().trim()).up();
                    }
                        let annotationValue = '';
                    if(input[n][i].lowerLeftx != null){
                        annotationValue = input[n][i].lowerLeftx + ',' +
                                          input[n][i].lowerLefty + ',' +
                                          input[n][i].topRightx + ',' +
                                          input[n][i].topRighty;
                    }
                    doc.ele(i + '_Annotation')
                        .txt(annotationValue).doc();
                }
        }
    }
    var filePath = config.GDERestClient.schemaFolder;
    var fileName = filePath.replace(/^.*[\\\/]/, '').replace(".json", '');
    outputFolder = config.outputFolder;
    if(!fs.existsSync(bpoElement.fileLocation + path.sep + outputFolder)){
        fs.mkdirSync(bpoElement.fileLocation + path.sep + outputFolder, { recursive: true });
    }
    fs.writeFileSync(bpoElement.fileLocation + path.sep + outputFolder + path.sep + bpoElement.elementId + "_" + doctype.split(' - ')[1].toLocaleUpperCase() + ".xml",  doc.toString( { pretty : true }), function(err){
        if(err) throw err;
    });
    remote.getGlobal('shared').imageDone = true;
    window.close();
}


$(document).ready(initialize);
