var express = require('express');
const http = require('http');
const sync_request = require('sync-request');
const asyn_request = require('request');
const fs = require('fs');
const dicomParser = require('dicom-parser');

//add configuration file

var server = express();

server.use(express.json());
server.use(express.urlencoded({ extended: true }));


Global_token ="";
generageToken();
setInterval(generageToken,3500000);



//Get all patient List
server.get('/patient', function (request, response) {
    asyn_request('http://45.25.214.242/openemr/apis/api/patient', {
        method: 'GET',
        json: true,
        auth: {
            bearer: Global_token
        }
    }, (err, res, body) => {
        if (err) { return console.log(err); }
        response.write(JSON.stringify(body));
        response.end();
    });
});

//get patient with specified puuid
server.get('/patient/:puuid', function (request, response) {
    asyn_request('http://45.25.214.242/openemr/apis/api/patient/'+request.params.puuid, {
        method: 'GET',
        json: true,
        auth: {
            bearer: Global_token
        }
    }, (err, res, body) => {
        if (err) { return console.log(err); }
        response.write(JSON.stringify(body));
        response.end();
    });
});

//Add new patient
server.post('/patient' ,function(request,response){
    asyn_request('http://45.25.214.242/openemr/apis/api/patient',{
        method: 'POST',
        json : true,
        auth: {
            bearer: Global_token
        },
        body: request.body
    },(err,res,body) => {
        if(err) { return console.log(err);}
        response.write(JSON.stringify(body));
        response.end();
    });
});

//get all DICOM information
server.get('/patient_DICOM', function (request, response) {
    asyn_request('http://45.25.214.242/openemr/apis/api/patient_DICOM', {
        method: 'GET',
        json: true,
        auth: {
            bearer: Global_token
        }
    }, (err, res, body) => {
        if (err) { return console.log(err); }
        response.write(JSON.stringify(body));
        response.end();
    });
});


//get specified DICOM information
server.get('/patient_DICOM/:pid', function (request, response) {
    asyn_request('http://45.25.214.242/openemr/apis/api/patient_DICOM/'+request.params.pid, {
        method: 'GET',
        json: true,
        auth: {
            bearer: Global_token
        }
    }, (err, res, body) => {
        if (err) { return console.log(err); }
        response.write(JSON.stringify(body));
        response.end();
    });
});

//Add DICOM information
server.post('/patient_DICOM' ,function(request,response){
    asyn_request('http://45.25.214.242/openemr/apis/api/patient_DICOM',{
        method: 'POST',
        json : true,
        auth: {
            bearer: Global_token
        },
        body: request.body
    },(err,res,body) => {
        if(err) { return console.log(err);}
        response.write(JSON.stringify(body));
        response.end();
    });
});

//Update DICOM information
server.put('/patient_DICOM/:id',function(request,response){
    asyn_request('http://45.25.214.242/openemr/apis/api/patient_DICOM/'+request.params.id,{
        method: 'PUT',
        json : true,
        auth: {
            bearer: Global_token
        },
        body: request.body
    },(err,res,body) => {
        if(err) { return console.log(err);}
        response.write(JSON.stringify(body));
        response.end();
    });
});

//Delete DICOM information
server.delete('/patient_DICOM/:id',function(request,response){
    asyn_request('http://45.25.214.242/openemr/apis/api/patient_DICOM/'+request.params.id,{
        method: 'DELETE',
        json : true,
        auth: {
            bearer: Global_token
        },
    },(err,res,body) => {
        if(err) { return console.log(err);}
        response.write(JSON.stringify(body));
        response.end();
    });
});

//sending DICOM file
server.post('/uploadDICOM',function(request, response){
    var auth = "Basic " + new Buffer( "admin:admin").toString("base64");
    parser(request.body.path);
    asyn_request({
        url: 'http://45.25.214.242:8042/instances',
        method: 'POST',
        headers: {
            'content-type' : 'application/dicom',
            'authorization' : auth,
        },
        encoding: null,
        body: fs.readFileSync(request.body.path)
    }, (error, res, body) => {
        if (error) {
            console.log(error);
        } else {
            console.log(res.statusCode);
            response.write('200');
            response.end();
        }
    });
});


function generageToken() {
    var res = sync_request('POST','http://45.25.214.242/openemr/apis/api/auth', {
        json: {
            grant_type: 'password',
            username: 'PIQ-admin-20',
            password: 'stratus2009%',
            scope: 'default'
        }
    });
    var token = JSON.parse(res.getBody('utf8'));
    Global_token = token.access_token;
};



function parser(fPath) {

    var slashIndex = fPath.lastIndexOf('\/');  
    var path = fPath.substring(0, slashIndex);
    var fname = fPath.substring(slashIndex + 1, fPath.length);
    var dotIndex = fPath.lastIndexOf('\.');
    var formatVersion = fPath.substring(dotIndex+1, fPath.length);
    
    var dicomFileAsBuffer = fs.readFileSync(fPath);
    var stats = fs.statSync(fPath);
    var modifiedData = stats.mtime;
    var fileSize = stats.size;
    try{
        var dataSet = dicomParser.parseDicom(dicomFileAsBuffer);
        
        var patientID = dataSet.string('x00100020');
        var width = dataSet.uint16('x00280010');
        var height = dataSet.uint16('x00280011');
        var bigDepth = dataSet.uint16('x00280100');
        var colorType = dataSet.string('x00280004');
        var fileMetaInformationGroupLength = dataSet.uint32('x00020000');
        var FileMetaInformationVersion = dataSet.uint32('x00020001');
        var MediaStorageSOPClassUID = dataSet.string('x00020002');
        var MediaStorageSOPInstanceUID = dataSet.string('x00020003');
        var syntaxUID = dataSet.string('x00020010');
        var ImplementationClassUID = dataSet.string('x00020012');
        
        asyn_request('http://45.25.214.242/openemr/apis/api/patient_DICOM',{
            method: 'POST',
            json : true,
            auth: {
                bearer: Global_token
            },
            body: {
                patient_data_id: patientID,
                DICOM_path: path,
                filename: fname,
                fileModDate: modifiedData,
                fileSize: fileSize,
                formatVersion:formatVersion,
                width: width,
                height: height,
                bigDepth: bigDepth,
                colorType: colorType,
                fileMetaInformationGroupLength: fileMetaInformationGroupLength,
                FileMetaInformationVersion: FileMetaInformationVersion,
                MediaStorageSOPClassUID: MediaStorageSOPClassUID,
                MediaStorageSOPInstanceUID: MediaStorageSOPInstanceUID,
                TransferSyntaxUID: syntaxUID,
                ImplementationClassUID: ImplementationClassUID,
                history_data_id: 1,
            }
        },(err,res,body) => {
            if(err) {  console.log(err);}
            console.log(res.statusCode);
        });
    }catch(error){
        console.log(error);
    }
}

server.listen(4040);
console.log('Starting Port : 4040');