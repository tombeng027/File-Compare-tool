const { BrowserWindow } = require('electron').remote;
const remote = require('electron').remote;
const path = require('path');
const $ = require('jquery');
const fs = require('fs');
const xml2js = require('xml2js');
const builder = require('xmlbuilder');

var config =  JSON.parse(fs.readFileSync('./src/environment/config/config.json'));

var imagecontainer = $('#imagecontainer');
var pass1 = $('#pass1');
var pass2 = $('#pass2');
var fieldlist1 = $('#fieldlist1');
var fieldlist2 = $('#fieldlist2');

var parser = new xml2js.Parser();

function initialize(){
    imagecontainer.css('background-image','url("'+config.testinputimage+'")');
    loadPass1();
    loadPass2();
}

function loadPass1(){
        try{
            output = fs.readFileSync(config.testpass1,'ascii');
            parser.parseString(output.substring(0, output.length), function (err, result) {
                json = result;
            });
        }catch(err){
            alert(err);
        }        
           for(let i in json.xml){
               if(!i.includes('_Annotation') & !i.includes('Document_Id') & !i.includes('Document_Type')){
                   let  field = document.createElement('div');
                   field.setAttribute('id',i + 'div1');
                   field.setAttribute('class', "list-group-item list-group-item-action");
                   let fieldNameAndValue = document.createElement('label');
                   fieldNameAndValue.setAttribute('class', "form-check-label");
                   fieldNameAndValue.setAttribute('for',field+'pass1');
                   fieldNameAndValue.append(i+' : ' + json.xml[i][0]);
                   field.append(fieldNameAndValue);
                   fieldInputCheckBox = document.createElement('input');
                   fieldInputCheckBox.setAttribute('class',"form-check-input");
                   fieldInputCheckBox.setAttribute('type','checkbox');
                   fieldInputCheckBox.setAttribute('id',field+'pass1');
                   fieldInputCheckBox.setAttribute('style','float:right');
                   field.append(fieldInputCheckBox);
                   fieldlist1.append(field);
               }
           }
}

function loadPass2(){
    try{
        output = fs.readFileSync(config.testpass2,'ascii');
        parser.parseString(output.substring(0, output.length), function (err, result) {
            json = result;
        });
    }catch(err){
        alert(err);
    }        
       for(let i in json.xml){
           if(!i.includes('_Annotation') & !i.includes('Document_Id') & !i.includes('Document_Type')){
               let  field = document.createElement('div');
               field.setAttribute('id',i + 'div2');
               field.setAttribute('class', "list-group-item list-group-item-action");
               let fieldNameAndValue = document.createElement('label');
               fieldNameAndValue.setAttribute('class', "form-check-label");
               fieldNameAndValue.setAttribute('for',field+'pass2');
               fieldNameAndValue.append(i+' : ' + json.xml[i][0]);
               field.append(fieldNameAndValue);
               fieldInputCheckBox = document.createElement('input');
               fieldInputCheckBox.setAttribute('class',"form-check-input");
               fieldInputCheckBox.setAttribute('type','checkbox');
               fieldInputCheckBox.setAttribute('id',field+'pass2');
               fieldInputCheckBox.setAttribute('style','float:right');
               field.append(fieldInputCheckBox);
               fieldlist2.append(field);
           }
       }
}

$(document).ready(initialize);