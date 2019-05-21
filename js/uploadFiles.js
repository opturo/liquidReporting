/**
 * Created by rocco on 3/21/2018.
 * This is the upload files js file for the ODIN Lite application.
 * This will handle everything to do with uploading and parsing the uploaded files.
 */
var odinLite_uploadFiles = {
    /* Variables */
    hasBeenLoaded: false,//Whether this has been loaded before.

    //Platform Settings
    fileExtension: null,
    fileSavedReport: null,
    initialValues: null, //This holds the initial guessed values for fileFormat in case it fails.

    //Max file Settings
    maxSingleFile: null,
    maxTotalFiles: null,

    /**
     * init
     * This will initialize ODIN Lite Upload Files and set it up
     */
    init: function (isUnionFile) {
        if(!via.undef(isUnionFile) && isUnionFile===true) {
            $('.upload_unionFileLabel').show();
        }else{
            $('.upload_unionFileLabel').hide();
            odinLite_fileFormat.isUnionFile = false;
        }

        kendo.ui.progress($("body"), true);//Wait Message

        //Make the call to get the settings for the platform
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.uploadFiles.getPlatformSpecSettings',
                modelId: odinLite_modelCache.currentModel.value,
                platform: odinLite_modelCache.currentPlatform.platform,
                uploadSpec: odinLite_modelCache.currentPlatform.specification
            },
            function (data) {
                kendo.ui.progress($("body"), false);//Wait Message off
                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure getting Platform Settings:", data.message);
                    via.alert("Platform Settings Failure", data.message);
                } else {
                    via.debug("Successful getting Platform Settings:", data);

                    //Max Settings
                    odinLite_uploadFiles.maxSingleFile = via.getReadableFileSizeString(data.maxSingleFile);
                    odinLite_uploadFiles.maxTotalFiles = via.getReadableFileSizeString(data.maxTotalFiles);

                    //Extension - don't worry about if a union file
                    if(odinLite_fileFormat.isUnionFile === false) {
                        if (!via.undef(data.fileSelectionCriteria, true)) {
                            var idx = data.fileSelectionCriteria.lastIndexOf(".");
                            data.fileSelectionCriteria = data.fileSelectionCriteria.substring(idx);
                            odinLite_uploadFiles.fileExtension = data.fileSelectionCriteria;
                        } else {
                            odinLite_uploadFiles.fileExtension = null;
                        }
                        //Save Report
                        if (!via.undef(data.fileFormatReportSetting)) {
                            odinLite_uploadFiles.fileSavedReport = data.fileFormatReportSetting;
                        } else {
                            odinLite_uploadFiles.fileSavedReport = null;
                        }
                    }

                    //init ui and reset if it was accessed before.
                    odinLite_uploadFiles.initUI();

                    //Cleanup the staging area if it needs it
                    odinLite_uploadFiles.deleteStagingAreaFiles();

                    //Show the panels.
                    $("#uploadFilesPanel").show();
                    $("#uploadPanel").show();

                    //Update app and model
                    $(".applicationAndModelName").html("(<strong>Application:</strong>" + odinLite_modelCache.currentModel.application + "; <strong>Model:</strong>" + odinLite_modelCache.currentModel.text + ")");

                    odinLite_uploadFiles.hasBeenLoaded = true;//Set the loaded variable after first load.
                    kendo.ui.progress($("body"), false);//Wait Message
                }
            },
            'json');
    },

    /**
     * initUI
     * This will return the upload files section to its original state and setup the events if need be
     */
    initUI: function () {
        //Hide Panels
        $("#uploadProgressPanel").hide();
        $("#uploadFilesPanel").hide();

        //Hide Template
        if(odinLite_modelCache.currentPlatform.platform !== 'Custom'){
            $('.templateCheckContainer').hide();
        }else{
            $('.templateCheckContainer').show();
        }

        //Setup the events if they have not been setup
        if (!odinLite_uploadFiles.hasBeenLoaded) {
            $("#fileUpload_form").submit(function (e) {
                e.preventDefault();
                var formData = new FormData($(this)[0]);
                odinLite_uploadFiles.uploadFilesToStagingArea(formData);
            });

            //Initializa the tree
            $(".importTypesTree").empty();
            //Datasource for the tree
            var importDataSource = new kendo.data.HierarchicalDataSource({
                data: [
                    {
                        text: "Files",
                        expanded: true,
                        items: [
                            { text: "Local Computer",value: "Local Computer" },
                            { text: "FTP Site",value: "FTP Site" }
                        ]
                    },
                    {
                        text: "Database",
                        expanded: true,
                        items: [
                            { text: "SQL Server",value: "SQL Server" },
                            { text: "MySQL",value: "MySQL" },
                            { text: "Oracle",value: "Oracle" },
                            { text: "DB2",value: "DB2" }
                        ]
                    },
                    {
                        text: "Web Service",
                        expanded: true,
                        items: [
                            { text: "Text",value: "webService Text" }
                        ]
                    }
                ]
            });
            //Make the tree
            var treeview = $(".importTypesTree").kendoTreeView({
                dataSource: importDataSource,
                select: function(e){
                    var dataItem = this.dataItem(e.node);
                    if(dataItem.hasChildren === true){
                        //$(".k-state-selected")
                            //.removeClass("k-state-selected");
                        return;
                    }

                    //Remove Selected Class
                    //$.each($('.importTypesTree li'), function() {
                    //    var node = treeview.dataItem($(this));
                    //    $(this).find('.k-in').removeClass('importSelected');
                    //});

                    //$(e.node).find('.k-in').addClass('importSelected');
                    switch(dataItem.value) {
                        case 'Local Computer':
                            $('#uploadFiles_otherSources').empty();
                            $('#uploadFiles_otherSources').hide();
                            $('#uploadFiles_localComputer').fadeIn();
                            break;
                        case 'FTP Site':
                            odinLite_uploadFiles.createFtpSettingsWindow();
                            break;
                        case 'SQL Server':
                            odinLite_uploadFiles.createDatabaseSettingsWindow("sqlserver",'SQL Server',31);
                            break;
                        case 'MySQL':
                            odinLite_uploadFiles.createDatabaseSettingsWindow("mysql",'MySQL',32);
                            break;
                        case 'Oracle':
                            odinLite_uploadFiles.createDatabaseSettingsWindow("oracle","Oracle",33);
                            break;
                        case 'DB2':
                            odinLite_uploadFiles.createDatabaseSettingsWindow("db2","DB2",34);
                            break;
                        case 'webService Text':
                            odinLite_uploadFiles.createWebServiceSettingsWindow();
                            break;
                    }
                }
            }).data('kendoTreeView');

            //Style the tree
            $.each($('.importTypesTree li'), function() {
                var node = treeview.dataItem($(this));
                if (node.hasChildren === true) {
                    //$(this).find('.k-in').addClass('importFolder');
                    $(this).find('.k-in').addClass('btn');
                    $(this).find('.k-in').addClass('btn-info');
                } else {
                    //$(this).find('.k-in').addClass('importLeaf');
                    //$(this).find('.k-in').removeClass('btn-info');
                    //$(this).find('.k-in').addClass('btn-success');
                    $(this).find('.k-in').removeClass('btn-info');
                    $(this).find('.k-in').addClass('importLeaf');
                    if(node.text === 'Local Computer'){
                        //$(this).find('.k-in').addClass('importSelected');
                        $(this).find('.k-in').addClass('k-state-selected');
                    }
                }
            });

            //FTP Transfer Button
            $('#ftpDownloadButton').show();
            $('#ftpDownloadButton').off();
            $('#ftpDownloadButton').click(function () {
                odinLite_uploadFiles.createFtpSettingsWindow();
            });

            //DB load button
            $('#dbDownloadButton').show();
            $('#dbDownloadButton').off();
            $('#dbDownloadButton').click(function () {
                odinLite_uploadFiles.createDatabaseSettingsWindow();
            });

            //Web Service load button
            $('#webServiceDownloadButton').show();
            $('#webServiceDownloadButton').off();
            $('#webServiceDownloadButton').click(function () {
                odinLite_uploadFiles.createWebServiceSettingsWindow();
            });

            //Style the upload box
            var uploadFilesSettings = {};
            if (!via.undef(odinLite_uploadFiles.fileExtension, true)) {
                uploadFilesSettings.localization = {
                    select: "Select your " + odinLite_uploadFiles.fileExtension + " files..."
                };
                /*
                 uploadFilesSettings.validation = {
                 allowedExtensions: [odinLite_uploadFiles.fileExtension]
                 };
                 */
            } else {
                uploadFilesSettings.localization = {
                    select: "Select your files..."
                };
            }
            $("#uploadFiles").kendoUpload(uploadFilesSettings);

            //Setup the upload progress bar
            $('#uploadProgressbar').kendoProgressBar({
                animation: {
                    duration: 100
                },
                min: 0,
                max: 100,
                //type: "percent",
                change: function (e) {
                    $('.k-progress-status-wrap').css("text-align", "center");
                    this.progressStatus.text(e.value + "% Complete");
                    if (e.value < 33) {
                        this.progressWrapper.css({
                            "background-color": "#EE9F05",
                            "border-color": "#EE9F05",
                            "text-align": "center"
                        });
                    } else if (e.value < 66) {
                        this.progressWrapper.css({
                            "background-color": "#428bca",
                            "border-color": "#428bca",
                            "text-align": "center"
                        });
                    } else {
                        this.progressWrapper.css({
                            "background-color": "#8EBC00",
                            "border-color": "#8EBC00",
                            "text-align": "center"
                        });
                    }
                }
            });
            $('#uploadProgressbar .k-progress-status-wrap').css("text-align", "center");//Center text
            $("#uploadProgressbar").data("kendoProgressBar").value(0);
            $("#uploadProgressbar").data("kendoProgressBar").progressStatus.text("0% Complete");
        } else {
            if (!via.undef(odinLite_uploadFiles.fileExtension, true)) {
                $(".k-upload-button span").html("Select your " + odinLite_uploadFiles.fileExtension + " files...");
            } else {
                $(".k-upload-button span").html("Select your files...");
            }


            //Reset Progress Bar
            if (!via.undef($("#uploadProgressbar").data("kendoProgressBar"))) {
                try {
                    $("#uploadProgressbar").data("kendoProgressBar").value(0);
                } catch (e) {
                }
            }
            //Clear Files
            if (!via.undef($("#uploadFiles").data("kendoUpload"))) {
                try {
                    $("#uploadFiles").data("kendoUpload").clearAllFiles();
                } catch (e) {
                }
            }
            //Reset selection
            var treeview = $(".importTypesTree").data('kendoTreeView');
            var node = treeview.findByText("Local Computer");
            treeview.select(node);
            treeview.trigger( 'select', {node: node} );
        }
    },

    uploadFilesToStagingArea: function (formData) {
        //Check to make sure there are files
        var upload = $("#uploadFiles").data("kendoUpload"),
            files = upload.getFiles();
        via.debug("Uploading these files:", files);
        if (via.undef(files, true)) {
            via.alert("<i class=\"fa fa-file-o\"></i>  Select a file", "No files were selected for upload.");
            return;
        }

        //Run a check on the files to make sure everything is good to upload if not handle it.
        checkFiles(function () {
            //Display warning message if needed.
            if (files.length > 1) {
                via.confirm("<i class=\"fa fa-files-o\"></i> Multiple Files", "You have chosen to upload multiple files. Please confirm that each file you are uploading has the same format.", function () {
                    uploadFiles();
                });
            } else {
                uploadFiles();
            }
        });

        function checkFiles(callbackFn) {
            var fileNames = JSON.stringify(files.map(function (o) {
                return o.name;
            }));
            var fileSizes = JSON.stringify(files.map(function (o) {
                return o.size;
            }));

            $.post(odin.SERVLET_PATH,
                {
                    action: 'odinLite.uploadFiles.preUploadFileCheck',
                    overrideUser: odinLite.OVERRIDE_USER,
                    modelId: odinLite_modelCache.currentModel.value,
                    platform: odinLite_modelCache.currentPlatform.platform,
                    uploadSpec: odinLite_modelCache.currentPlatform.specification,
                    fileNames: fileNames,
                    fileSizes: fileSizes
                },
                function (data, status) {
                    if (!via.undef(data, true) && data.success === false) {
                        via.debug("Check Files Error:", data.message);
                        via.kendoAlert("Check Files Error", data.message);
                    } else {//Success - File Preview
                        via.debug("Check Files Success:", data.message);

                        if (!via.undef(data.validatePlatformErrorString, true)) {
                            via.kendoConfirm("File Check", data.validatePlatformErrorString, callbackFn)
                        } else {
                            callbackFn();
                        }
                    }
                },
                'json');


        }

        function uploadFiles() {

            //Append the srcApp
            formData.append('srcApp', odinLite.APP_NAME);
            //Append the files
            formData.append('fileNames', JSON.stringify(files.map(function (o) {
                return o.name;
            })));

            //Get the template check box.
            var isTemplateFile = $('#uploadFiles_templateCheck').is(':checked');
            formData.append('isTemplateFile', isTemplateFile);
            formData.append('modelId', odinLite_modelCache.currentModel.value);
            formData.append('entityDir', odinLite_modelCache.currentEntity.entityDir);
            formData.append('overrideUser', odinLite.OVERRIDE_USER);

            //Show the progress bar
            $('#uploadPanel').hide();
            $('#cancelUploadButton').prop("disabled", false);
            $('#uploadProgressPanel').fadeIn();
            var pb = $("#uploadProgressbar").data("kendoProgressBar");
            pb.value(0);

            //Make the call to the upload.
            var xhr = $.ajax({
                url: odin.SERVLET_PATH,
                type: 'POST',
                data: formData,
                async: true,
                cache: false,
                contentType: false,
                processData: false,
                dataType: 'json',
                success: function (data) {
                    if (!via.undef(data, true) && data.success === false) {
                        via.debug("File Upload Failure:", data.message);
                        via.alert("File Upload Error", data.message, function () {
                            odinLite_uploadFiles.init();
                        });
                    } else {//Success - Files Uploaded
                        via.debug("Files Uploaded Successfully:", data);

                        $('#cancelUploadButton').prop("disabled", true);
                        $('#uploadProgressPanel').fadeOut(function () {
                            //Move onto the import wizard.
                            data.isTemplateFile = isTemplateFile;

                            //Import Data and move to file format
                            odinLite_uploadFiles.importData(data);
                        });
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    via.debug("Error", jqXHR, textStatus, errorThrown);
                    via.alert("Failure", "Files failed to upload.", function () {
                        odinLite_uploadFiles.init();
                    });
                },
                xhr: function () {
                    var xhr = new window.XMLHttpRequest();
                    //Upload progress
                    xhr.upload.addEventListener("progress", function (evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = evt.loaded / evt.total;
                            percentComplete = Math.round((percentComplete * 100));
                            via.debug("Upload % Complete:", percentComplete);
                            //Update the progress bar
                            pb.value(percentComplete);
                        }
                    }, false);
                    /*
                     //Download progress
                     xhr.addEventListener("progress", function(evt){
                     if (evt.lengthComputable) {
                     var percentComplete = evt.loaded / evt.total;
                     //Do something with download progress
                     console.log('dl',percentComplete);
                     }
                     }, false);
                     */
                    return xhr;
                }
            });

            //Set the event for cancelling the upload.
            $('#cancelUploadButton').one("click", function () {
                $('#cancelUploadButton').prop("disabled", true);
                xhr.abort();
                via.alert("Upload Canceled", "The file upload has been canceled.", function () {
                    odinLite_uploadFiles.init();
                });
            });

        }

    },

    /**
     * createWebServiceSettingsWindow
     * Creates Web Service window for importing data.
     */
    createWebServiceSettingsWindow: function () {
        $('#uploadFiles_localComputer').hide();
        $('#uploadFiles_otherSources').empty();
        $('#uploadFiles_otherSources').show();

        //Get the window template
        $.get("./html/webServiceSettingsWindow.html", function (windowTemplate) {
            $('#odinLite_webServiceSettingsWindow').remove();
            $('#uploadFiles_otherSources').html(windowTemplate);

            //Button Events
            $(".odinLite_webServiceTransfer_connect").on("click", function () {
                var url = $('#odinLite_webService_url').val();
                if(via.undef(url,true)){
                    via.kendoAlert("Missing URL", "Please specify a url.");
                    return;
                }

                kendo.ui.progress($('body'), true);//Wait Message
                $.post(odin.SERVLET_PATH,
                    {
                        action: 'odinLite.uploadFiles.webServiceImport',
                        overrideUser: odinLite.OVERRIDE_USER,
                        url: url
                    },
                    function (data, status) {
                        kendo.ui.progress($('body'), false);//Wait Message

                        if (!via.undef(data, true) && data.success === false) {
                            via.kendoAlert("Web Service Error",data.message);
                            via.debug("Web Service Error:", data.message);
                        } else {//Success - FTP
                            via.debug("Web Service success:", data.message);

                            //Import Data and move to file format
                            odinLite_uploadFiles.importData(data);
                        }
                    },
                    'json');
            });

        });

        /*
        via.kendoPrompt("Web Service Import","Enter the URL of the web service to import data from.",function(url){
            kendo.ui.progress($('body'), true);//Wait Message

            $.post(odin.SERVLET_PATH,
                {
                    action: 'odinLite.uploadFiles.webServiceImport',
                    overrideUser: odinLite.OVERRIDE_USER,
                    url: url
                },
                function (data, status) {
                    kendo.ui.progress($('body'), false);//Wait Message

                    if (!via.undef(data, true) && data.success === false) {
                        via.kendoAlert("Web Service Error",data.message);
                        via.debug("Web Service Error:", data.message);
                    } else {//Success - FTP
                        via.debug("Web Service success:", data.message);

                        odinLite_uploadFiles.initialValues = JSON.parse(JSON.stringify(data));//Store the initial values for possible use later if loading a saved report fails.
                        odinLite_fileFormat.init(data);
                    }
                },
                'json');
        },function(){

        },500);
        */
    },

    /**
     * createDatabaseSettingsWindow
     * Creates Database window for database settings.
     * @param data
     */
    createDatabaseSettingsWindow: function (dbType,dbName,saveId) {
        //Get the window template
        $.get("./html/dbSettingsWindow.html", function (windowTemplate) {
            $('#odinLite_dbSettingsWindow').remove();
            windowTemplate = (windowTemplate + "").replace('loadDatabaseSettingsWindow()','loadDatabaseSettingsWindow('+saveId+')');
            windowTemplate = (windowTemplate + "").replace('saveDatabaseSettingsWindow()','saveDatabaseSettingsWindow('+saveId+')');
            $('#uploadFiles_otherSources').empty();
            $('#uploadFiles_otherSources').html(windowTemplate);

            $('.import_dbName').html(dbName);
            $('#uploadFiles_localComputer').hide();
            $('#uploadFiles_otherSources').fadeIn();

            /*
            //Make the window.
            var dbSettingsWindow = $('#odinLite_dbSettingsWindow').kendoWindow({
                title: "Database Settings",
                draggable: false,
                resizable: false,
                width: "450px",
                height: "410px",
                modal: true,
                close: false,
                actions: [
                    "Close"
                ],
                close: function () {
                    dbSettingsWindow = null;
                    $('#odinLite_dbSettingsWindow').remove();
                }
            }).data("kendoWindow");

            dbSettingsWindow.center();
            */

            //Style the combo
            //$("#odinLite_database_type").kendoDropDownList();
            $("#odinLite_database_type").val(dbType);

            //Button Events
            $(".odinLite_dbTransfer_connect").on("click", function () {
                testDatabaseConnection(dbType,dbName,saveId);
            });
        });

        /* Functions */
        function testDatabaseConnection(dbType,dbName,saveId){
            kendo.ui.progress($('#odinLite_dbSettingsWindow'), true);//Wait Message

            //Get the values for ftp connection
            var formData = new FormData($('#odinLite_dbTransferWindow_form')[0]);
            var serverVars = {};
            formData.forEach(function(value, key){
                serverVars[key] = value;
            });

            $.post(odin.SERVLET_PATH,
                $.extend(serverVars,{
                    action: 'odinLite.uploadFiles.dbTransferTesting',
                    overrideUser: odinLite.OVERRIDE_USER
                }),
                function (data, status) {
                    kendo.ui.progress($('#odinLite_dbSettingsWindow'), false);//Wait Message

                    if (!via.undef(data, true) && data.success === false) {
                        via.kendoAlert("Database Connection Error",data.message);
                        via.debug("Database Connection Error:", data.message);
                    } else {//Success - FTP
                        via.debug("Database Connection success:", data.message);

                        odinLite_uploadFiles.createDatabaseImportWindow(dbType,dbName,serverVars,saveId);
                    }
                },
                'json');

        }
    },

    /**
     * createDatabaseTransferWindow
     * Creates database window for importing data.
     * @param data
     */
    createDatabaseImportWindow: function (dbType,dbName,serverVars,saveId) {
        //Get the window template
        $.get("./html/dbTransferWindow.html", function (ftpWindowTemplate) {
            $('#odinLite_dbTransferWindow').remove();
            $('#uploadFiles_otherSources').empty();
            saveId = saveId + 10;
            ftpWindowTemplate = (ftpWindowTemplate + "").replace('loadDatabaseSQLWindow()','loadDatabaseSQLWindow('+saveId+')');
            ftpWindowTemplate = (ftpWindowTemplate + "").replace('saveDatabaseSQLWindow()','saveDatabaseSQLWindow('+saveId+')');
            $('#uploadFiles_otherSources').html(ftpWindowTemplate);
            $('.import_dbName').html(dbName);
            /*
            //Make the window.
            var dbWindow = $('#odinLite_dbTransferWindow').kendoWindow({
                title: "Database Data Load",
                draggable: false,
                resizable: false,
                width: "850px",
                height: "590px",
                modal: true,
                close: false,
                actions: [
                    "Maximize",
                    "Close"
                ],
                close: function () {
                    dbWindow = null;
                    $('#odinLite_dbTransferWindow').remove();
                }
            }).data("kendoWindow");

            dbWindow.center();

            settingsWindow.close();
            */

            //Style the code editor
            var editor = CodeMirror.fromTextArea(document.getElementById("odinLite_dbTransfer_sqlArea"), {
                mode: "text/x-sql",
                indentWithTabs: true,
                smartIndent: true,
                lineWrapping: true,
                lineNumbers: true,
                matchBrackets : true,
                autofocus: true,
                extraKeys: {"Ctrl-Space": "autocomplete"}
            });
            editor.setSize("100%", 200);
            // store it
            $('#odinLite_dbTransfer_sqlArea').data('CodeMirrorInstance', editor);

            //Button Events
            $("#odinLite_dbQueryButton").on("click", function () {
                runDbQuery(dbType,dbName,serverVars);
            });
            $("#odinLite_dbImportButton").on("click", function () {
                importDbData(dbType,dbName,serverVars);
            });


            /* Functions */
            function importDbData(dbType,dbName,serverVars){
                var sqlString = $('#odinLite_dbResultGrid').data("gridSql");
                if(via.undef(sqlString,true)) {
                    via.kendoAlert("Data Missing","Please run SQL Query.");
                    return;
                }

                kendo.ui.progress($('#odinLite_dbTransferWindow'), true);//Wait Message
                $.post(odin.SERVLET_PATH,
                    $.extend(serverVars, {
                        action: 'odinLite.uploadFiles.dbTransferImport',
                        overrideUser: odinLite.OVERRIDE_USER,
                        query: sqlString
                    }),
                    function (data, status) {
                        kendo.ui.progress($('#odinLite_dbTransferWindow'), false);//Wait Message

                        if (!via.undef(data, true) && data.success === false) {
                            via.kendoAlert("Database Connection Error", data.message);
                            via.debug("Database Import Error:", data.message);
                        } else {//Success - DB Query
                            via.debug("Database Import success:", data.message);

                            //Import Data and move to file format
                            odinLite_uploadFiles.importData(data);
                        }
                    },
                    'json');
            }

            function runDbQuery(dbType,dbName,serverVars){
                //var sqlString = $('#odinLite_dbTransfer_sqlArea').val();
                var sqlString = editor.getValue();

                if(via.undef(sqlString,true)) {
                    via.kendoAlert("SQL Missing","Please enter SQL Query.");
                    return;
                }

                $('#odinLite_dbResultGrid').empty();
                $('#odinLite_dbResultGrid').data("gridSql",null);
                kendo.ui.progress($('#odinLite_dbTransferWindow'), true);//Wait Message
                $.post(odin.SERVLET_PATH,
                    $.extend(serverVars, {
                        action: 'odinLite.uploadFiles.dbTransferTesting',
                        overrideUser: odinLite.OVERRIDE_USER,
                        query: sqlString
                    }),
                    function (data, status) {
                        kendo.ui.progress($('#odinLite_dbTransferWindow'), false);//Wait Message

                        if (!via.undef(data, true) && data.success === false) {
                            via.kendoAlert("Database Connection Error", data.message);
                            via.debug("Database Connection Error:", data.message);
                        } else {//Success - DB Query
                            via.debug("Database Connection success:", data.message);
                            odinTable.createTable("sqlDataTable",data.reportData,"#odinLite_dbResultGrid");
                            $('#sqlDataTable').data('kendoGrid').setOptions({
                                groupable:false,
                                height:'99%'
                            });
                            $('#odinLite_dbResultGrid').css("padding","0");
                            $('#odinLite_dbResultGrid').data("gridSql",sqlString);
                        }
                    },
                    'json');
            }
        });
    },

    /**
     * saveWebServiceSettingsWindow
     * This will save the web service settings sql.
     */
    saveWebServiceSettingsWindow: function(){
        //var formData = new FormData($('#odinLite_dbTransferWindow_form')[0]);
        var saveJson = {};

        var urlString = $('#odinLite_webService_url').val();
        if(via.undef(urlString,true)){
            via.kendoAlert("Missing Value","Specify a URL string to save.");
        }
        saveJson.url = urlString;

        //console.log('saveJson',saveJson);

        //Perform the save.
        via.saveWindow(odin.ODIN_LITE_APP_ID,5,JSON.stringify(saveJson),function(){

        },false);
    },


    /**
     * loadDatabaseSQLWindow
     * This will load database settings.
     */
    loadWebServiceSettingsWindow: function(saveId){
        via.loadWindow(odin.ODIN_LITE_APP_ID,5,function(loadJson){
            $('#odinLite_webService_url').val(loadJson.url);
        });
    },

    /**
     * loadDatabaseSQLWindow
     * This will load database settings.
     */
    loadDatabaseSQLWindow: function(saveId){
        via.loadWindow(odin.ODIN_LITE_APP_ID,saveId,function(loadJson){
            var editor = $('#odinLite_dbTransfer_sqlArea').data('CodeMirrorInstance');
            editor.setValue(loadJson.sql);
        });
    },

    /**
     * saveDatabaseSQLWindow
     * This will save the database sql.
     */
    saveDatabaseSQLWindow: function(saveId){
        //var formData = new FormData($('#odinLite_dbTransferWindow_form')[0]);
        var saveJson = {};

        //var sqlString = $('#odinLite_dbTransfer_sqlArea').val();
        var editor = $('#odinLite_dbTransfer_sqlArea').data('CodeMirrorInstance');
        var sqlString = editor.getValue();
        if(via.undef(sqlString,true)){
            via.kendoAlert("Missing Value","Specify a SQL string to save.");
        }
        saveJson.sql = sqlString;

        //console.log('saveJson',saveJson);

        //Perform the save.
        via.saveWindow(odin.ODIN_LITE_APP_ID,saveId,JSON.stringify(saveJson),function(){

        },false);
    },

    /**
     * loadDatabaseSettingsWindow
     * This will load database settings.
     */
    loadDatabaseSettingsWindow: function(saveId){
        via.loadWindow(odin.ODIN_LITE_APP_ID,saveId,function(loadJson){
            $.each(loadJson,function(key,value){
                if(key === 'password'){
                    value = CryptoJS.AES.decrypt(value, via.ENCRYPT_KEY).toString(CryptoJS.enc.Utf8);
                }

                //if(key === 'type') {
                //    $("#odinLite_database_type").data('kendoDropDownList').value(value);
                //    return;
                //}else {
                    var input = $("#odinLite_dbTransferWindow_form [name='" + key + "']");
                    if (!via.undef(input) && !via.undef(value, true)) {
                        $(input).val(value);
                    }
                //}
            });
        });
    },

    /**
     * saveDatabaseSettingsWindow
     * This will save the database settings.
     */
    saveDatabaseSettingsWindow: function(saveId){

        var formData = new FormData($('#odinLite_dbTransferWindow_form')[0]);
        var saveJson = {};

        var failedVars = [];
        formData.forEach(function(value, key){
            saveJson[key] = value;

            var input = $("#odinLite_dbTransferWindow_form [name='"+key+"']");
            if(!via.undef(input) && !via.undef($(input).attr('required') && $(input).attr('required') === true) && via.undef(value,true)){
                failedVars.push(key);
                return false;
            }
        });
        if(failedVars.length > 0){
            via.kendoAlert("Missing Value","Missing required values: "+failedVars.join(", "));
            return;
        }

        //Encrypt the password
        if(!via.undef(saveJson.password,true)) {
            saveJson.password = CryptoJS.AES.encrypt(saveJson.password, via.ENCRYPT_KEY).toString();
        }

        //Perform the save.
        via.saveWindow(odin.ODIN_LITE_APP_ID,saveId,JSON.stringify(saveJson),function(){
            var win = $('#odinLite_dbTransferWindow').data('kendoWindow');
            if(!via.undef(win)) {
                win.close();
            }
        },false);
    },

    /**
     * createFtpSettingsWindow
     * Creates ftp window for ftp settings.
     * @param data
     */
    createFtpSettingsWindow: function () {

        //Get the window template
        $.get("./html/ftpSettingsWindow.html", function (windowTemplate) {
            $('#odinLite_ftpSettingsWindow').remove();
            $('#uploadFiles_otherSources').empty();
            $('#uploadFiles_otherSources').html(windowTemplate);

            $('#uploadFiles_localComputer').hide();
            $('#uploadFiles_otherSources').fadeIn();

            /*
            //Make the window.
            var ftpWindow = $('#odinLite_ftpSettingsWindow').kendoWindow({
                title: "FTP Settings",
                draggable: false,
                resizable: false,
                width: "450px",
                height: "420px",
                modal: true,
                close: false,
                actions: [
                    "Close"
                ],
                close: function () {
                    ftpWindow = null;
                    $('#odinLite_ftpSettingsWindow').remove();
                }
            }).data("kendoWindow");

            ftpWindow.center();
            */

            //Style the combo
            $("#odinLite_ftpTransfer_type").kendoDropDownList();

            //Button Events
            $(".odinLite_ftpTransfer_connect").on("click", function () {
                odinLite_uploadFiles.createFtpTransferWindow();
            });

        });
    },

    /**
     * createFtpTransferWindow
     * Creates ftp window for transferring files.
     * @param data
     */
    createFtpTransferWindow: function () {
        //Get the values for ftp connection
        var formData = new FormData($('#odinLite_ftpTransferWindow_form')[0]);
        var serverVars = {};
        formData.forEach(function(value, key){
            serverVars[key] = value;
        });

        kendo.ui.progress($('#odinLite_ftpSettingsWindow'), true);//Wait Message

        //Get the window template
        $.get("./html/ftpTransferWindow.html", function (ftpWindowTemplate) {
            kendo.ui.progress($('#odinLite_ftpSettingsWindow'), false);//Wait Message

            $('#odinLite_ftpTransferWindow').remove();
            $('#uploadFiles_otherSources').html(ftpWindowTemplate);

            /*
            //Make the window.
            var ftpWindow = $('#odinLite_ftpTransferWindow').kendoWindow({
                title: "FTP Transfer",
                draggable: false,
                resizable: false,
                width: "850px",
                height: "590px",
                modal: true,
                close: false,
                actions: [
                    "Maximize",
                    "Close"
                ],
                close: function () {
                    ftpWindow = null;
                    $('#odinLite_ftpTransferWindow').remove();
                }
            }).data("kendoWindow");

            ftpWindow.center();
            */

            //Call the grid functions
            getFTPGrid(serverVars);
            getFileManagerGrid();

            //Button Events
            $('#odinLite_ftpTransfer_directoryField').on('keyup',function(e){
                if(e.keyCode === 13){
                    serverVars.path = $('#odinLite_ftpTransfer_directoryField').val();
                    getFTPGrid(serverVars);
                }
            });

            //Set the button action
            $('#odinLite_ftpFileManager_addButton').click(function(){
                addItemToFileManager();
            });
            $('#odinLite_ftpFileManager_transferButton').click(function(){
                transferFtpFiles();
            });

            /* Functions */
            //Transfer the ftp files
            function transferFtpFiles(){
                var fileManagerGrid = $("#odinLite_ftpFileManager").data('kendoGrid');
                var gridData = fileManagerGrid.dataSource.data();
                if(gridData.length === 0){
                    via.kendoAlert("FTP Transfer","There are no files in the list.");
                    return;
                }

                odin.progressBar("FTP Transfer",100,"Transferring " + gridData.length + ((gridData.length>1)?" files.":" file."));

                $.post(odin.SERVLET_PATH,
                    $.extend(serverVars,{
                        action: 'odinLite.uploadFiles.transferFtpFiles',
                        overrideUser: odinLite.OVERRIDE_USER,
                        ftpFiles: JSON.stringify(gridData)
                    }),
                    function (data, status) {
                        odin.progressBar("FTP Transfer",100,null,true);
                        fileManagerGrid.dataSource.data([]);
                        if (!via.undef(data, true) && data.success === false) {
                            via.kendoAlert("FTP Transfer","Error: " + data.message);
                            via.debug("FTP Transfer Error:", data.message);
                        } else {//Success - FTP
                            via.debug("FTP Transfer Success:", data.message);

                            //Import Data and move to file format
                            odinLite_uploadFiles.importData(data);
                        }
                    },
                    'json');

            }

            //Add the item to the file manager grid.
            function addItemToFileManager() {
                var tree = $("#odinLite_ftpTreeview").data('kendoTreeList');
                var selected = tree.select();
                console.log(selected);
                for(var i=0;i<selected.length;i++) {
                    var dataItem = tree.dataItem(selected[i]);
                    if (dataItem.isFolder === true) {
                        continue;
                    }
                    var fileManagerGrid = $("#odinLite_ftpFileManager").data('kendoGrid');

                    //Prevent Duplicates
                    var inGrid = false;
                    var gridData = fileManagerGrid.dataSource.data();
                    for (var i = 0; i < gridData.length; i++) {
                        if (dataItem.path === gridData[i].path) {
                            via.kendoAlert("FTP Transfer", "\"" + dataItem.name + "\" has already been added to the list.");
                            inGrid = true;
                        }
                    }
                    //Add to grid
                    if(!inGrid) {
                        fileManagerGrid.dataSource.add(dataItem);
                    }
                }
            }

            //Get the ftp transfer files
            function getFileManagerGrid(){
                $("#odinLite_ftpFileManager").empty();
                $("#odinLite_ftpFileManager").kendoGrid({
                    dataSource: {
                        data: [],
                        schema: {
                            model: {
                                fields: {
                                    name: { field: "name"},
                                    fileSize: { field: "fileSize",type: "number"},
                                    lastModified: { field: "lastModified",type: "number"}
                                }
                            }
                        }
                    },
                    scrollable: true,
                    editable: false,
                    columns: [
                        {
                            //template: "<img src='#:imageUrl#'/> " + "#: name #",
                            template: "<img src='#:imageUrl#'/> " + "#: name #",
                            field: "name",
                            expandable: true,
                            title: "Selected Files",
                            width: 400
                        },
                        {
                            template: function(dataItem) {
                                if(via.undef(dataItem.fileSize)){
                                    return "";
                                }else{
                                    return via.getReadableFileSizeString(dataItem.fileSize);
                                }
                            },
                            field: "fileSize",
                            title: "Size",
                            attributes: { style:"text-align:right" },
                            headerAttributes:  { style:"text-align:center" },
                            width: 150
                        },
                        {
                            template: function(dataItem) {
                                if(via.undef(dataItem.lastModified)){
                                    return "";
                                }else{
                                    var d = new Date(dataItem.lastModified)
                                    return kendo.toString(d,"g");
                                }
                            },
                            field: "lastModified",
                            title: "Last Modified",
                            headerAttributes:  { style:"text-align:center" }
                        },
                        {
                            title: "Delete",
                            width: "80px",
                            iconClass: "fa fa-trash",
                            command: {
                                text: " ",
                                iconClass: "fa fa-trash",
                                click: function(e){
                                    e.preventDefault();
                                    var dataItem = this.dataItem($(e.currentTarget).closest("tr"));
                                    this.dataSource.remove(dataItem);
                                }
                            }
                        }

                    ]
                });
            }

            //Get the tree data
            function getFTPGrid(serverVars){
                $("#odinLite_ftpTreeview").empty();
                $('#odinLite_ftpTransfer_directoryField').prop("disabled",true);

                var dirStructure = new kendo.data.TreeListDataSource({
                    transport: {
                        read: function(options) {
                            // make JSON request to server
                            $.ajax({
                                url: odin.SERVLET_PATH + "?action=odinLite.uploadFiles.getFtpFilesGrid",
                                data: $.extend(serverVars,{
                                    entityDir:odinLite.ENTITY_DIR,
                                    path:options.data.id
                                }),
                                dataType: "json",
                                success: function(result) {
                                    $('#odinLite_ftpTransfer_directoryField').val("");
                                    $('#odinLite_ftpTransfer_directoryField').prop("disabled",false);

                                    if(result.success === false){
                                        if(!via.undef(result.message)) {
                                            via.kendoAlert("Error retrieving files",result.message);
                                        }else{
                                            via.kendoAlert("Error retrieving files", "Please check your connection.");
                                        }
                                    }else {
                                        $('#odinLite_ftpTransfer_directoryField').val(result.path==="."?"./":result.path);

                                        // notify the data source that the request succeeded
                                        for(var i in result.childNodes){
                                            if(via.undef(result.childNodes[i].parentId)) {
                                                result.childNodes[i].parentId = null;
                                            }
                                        }

                                        $("#odinLite_ftpTreeview").data("maxSingleFileSize");
                                        $("#odinLite_ftpTreeview").data("maxTotalFileSize");

                                        options.success(result.childNodes);
                                    }
                                },
                                error: function(result) {
                                    $('#odinLite_ftpTransfer_directoryField').val("");
                                    $('#odinLite_ftpTransfer_directoryField').prop("disabled",false);

                                    // notify the data source that the request failed
                                    options.error(result);
                                }
                            });
                        }

                    },
                    schema: {
                        model: {
                            id: "path",
                            hasChildren: "hasChildren",
                            //parentId: "parentId",
                            fields: {
                                name: { field: "name"},
                                fileSize: { field: "fileSize",type: "number"},
                                lastModified: { field: "lastModified",type: "number"}
                            }
                        }
                    }
                });

                var grid = $("#odinLite_ftpTreeview").kendoTreeList({
                    dataSource: dirStructure,
                    selectable: "multiple, row",
                    sortable:true,
                    columns: [
                        {
                            //template: "<img src='#:imageUrl#'/> " + "#: name #",
                            template: "<img src='#:imageUrl#'/> " + "#: name #",
                            field: "name",
                            expandable: true,
                            title: "Name",
                            width: 400
                        },
                        {
                            template: function(dataItem) {
                                if(via.undef(dataItem.fileSize)){
                                    return "";
                                }else{
                                    return via.getReadableFileSizeString(dataItem.fileSize);
                                }
                            },
                            field: "fileSize",
                            title: "Size",
                            attributes: { style:"text-align:right" },
                            headerAttributes:  { style:"text-align:center" },
                            width: 150
                        },
                        {
                            template: function(dataItem) {
                                if(via.undef(dataItem.lastModified)){
                                    return "";
                                }else{
                                    var d = new Date(dataItem.lastModified)
                                    return kendo.toString(d,"g");
                                }
                            },
                            field: "lastModified",
                            title: "Last Modified",
                            headerAttributes:  { style:"text-align:center" }
                        }
                    ],
                    dataBound: function (e) {
                        var grid = this;

                        //for paging
                        //if (this.dataSource.total() <= this.dataSource.pageSize) this.options.pageable = false;

                        //For double clicking
                        grid.tbody.find("tr").dblclick(function (e) {
                            var dataItem = grid.dataItem(this);
                            if(dataItem.isFolder === true){
                                if(dataItem.path === ".."){
                                    var currentPath = $('#odinLite_ftpTransfer_directoryField').val();
                                    var pos = currentPath.lastIndexOf("/");
                                    if(pos !== -1){
                                        serverVars.path = currentPath.substring(0,pos);
                                    }
                                }else {
                                    serverVars.path = dataItem.path;
                                }
                                getFTPGrid(serverVars);
                            }else{
                                addItemToFileManager();
                            }
                        });
                    }
                }).data('kendoTreeList');

                //$("#odinLite_ftpTreeview").on("dblclick", "tr.k-state-selected", function () {
                //    console.log(grid.select());
                //});
            }

            /*
            function getFileTree(serverVars){
                $("#odinLite_ftpTreeview").empty();
                var dirStructure = new kendo.data.HierarchicalDataSource({
                    transport: {
                        read: function(options) {
                            console.log('options',options);
                            $('#odinLite_ftpTransfer_directoryField').val("");

                            // make JSON request to server
                            $.ajax({
                                url: odin.SERVLET_PATH + "?action=odinLite.uploadFiles.getFtpFilesGrid",
                                data: $.extend(serverVars,{path:options.data.path}),
                                dataType: "json",
                                success: function(result) {
                                    console.log('getFileTree',getFileTree);
                                    if(result.success === false){
                                        if(!via.undef(result.message)) {
                                            via.kendoAlert("Error retrieving files",result.message);
                                        }else{
                                            via.kendoAlert("Error retrieving files", "Please check your connection.");
                                        }
                                        ftpWindow.close();
                                    }else {
                                        // notify the data source that the request succeeded
                                        options.success(result.childNodes);
                                        $('#odinLite_ftpTransfer_directoryField').val(result.path);
                                        settingsWindow.close();
                                    }
                                },
                                error: function(result) {
                                    // notify the data source that the request failed
                                    options.error(result);
                                }
                            });
                        }
                    },
                    schema: {
                        model: {
                            id: "path",
                            hasChildren: "hasChildren"
                        }
                    }
                });

                $("#odinLite_ftpTreeview").kendoTreeView({
                    dataSource: dirStructure,
                    dataTextField: "name"
                });
            }
            */

        });
    },

    /**
     * loadFtpSettingsWindow
     * This will load ftp settings.
     */
    loadFtpSettingsWindow: function(){
        via.loadWindow(odin.ODIN_LITE_APP_ID,2,function(loadJson){
            $.each(loadJson,function(key,value){
                if(key === 'password' || key === 'keyfile'){
                    value = CryptoJS.AES.decrypt(value, via.ENCRYPT_KEY).toString(CryptoJS.enc.Utf8);
                }

                if(key === 'type') {
                    $("#odinLite_ftpTransfer_type").data('kendoDropDownList').value(value);
                }else {
                    var input = $("#odinLite_ftpTransferWindow_form [name='" + key + "']");
                    if (!via.undef(input) && !via.undef(value, true)) {
                        $(input).val(value);
                    }
                }
            });
        });
    },

    /**
     * saveFtpSettingsWindow
     * This will save ftp settings.
     */
    saveFtpSettingsWindow: function(){
        var formData = new FormData($('#odinLite_ftpTransferWindow_form')[0]);
        var saveJson = {};

        var failedVars = [];
        formData.forEach(function(value, key){
            saveJson[key] = value;

            var input = $("#odinLite_ftpTransferWindow_form [name='"+key+"']");
            if(!via.undef(input) && !via.undef($(input).attr('required') && $(input).attr('required') === true) && via.undef(value,true)){
                failedVars.push(key);
                return false;
            }
        });
        if(failedVars.length > 0){
            via.kendoAlert("Missing Value","Missing required values: "+failedVars.join(", "));
            return;
        }

        //Encrypt the password and key file
        if(!via.undef(saveJson.password,true)) {
            saveJson.password = CryptoJS.AES.encrypt(saveJson.password, via.ENCRYPT_KEY).toString();
        }
        if(!via.undef(saveJson.keyfile,true)) {
            saveJson.keyfile = CryptoJS.AES.encrypt(saveJson.keyfile, via.ENCRYPT_KEY).toString();
        }

        console.log('saveJson',saveJson);

        //Perform the save.
        via.saveWindow(odin.ODIN_LITE_APP_ID,2,JSON.stringify(saveJson),function(){
            var win = $('#odinLite_ftpTransferWindow').data('kendoWindow');
            if(!via.undef(win)) {
                win.close();
            }
        },false);
    },

    /**
     * displayHelpLink
     * This will display a window that shows the help for various fields.
     * @param helpName
     * @param title
     */
    displayHelpLink: function (helpName, title) {
        var isURL = false;
        var content = null;
        var width = "75%";
        var height = "50%";
        switch (helpName) {
            case 'UPLOAD_FILES':
                content = "You can upload one or more files. The files must be of the same type and format if you wish to upload multiple files at once. Max size for a single file is " + odinLite_uploadFiles.maxSingleFile + ". Max upload size for all files combined is " +  odinLite_uploadFiles.maxTotalFiles + ".";
                width = "500px";
                height = "100px";
                break;
            case 'COLUMN_HEADERS':
                content = "This box will determine if your data has <b>column labels</b> to determine the names of the columns.";
                width = "500px";
                height = "100px";
                break;
            case 'START_ROW':
                content = "This is the row that your data starts, inclusive of your columns labels.";
                width = "500px";
                height = "100px";
                break;
            case 'END_ROW':
                content = "This is the last row of your data. This can be determined automatically by leaving this column blank. If your data has a footer you can set this number to negative to remove the last <i>n</i> lines.";
                width = "500px";
                height = "100px";
                break;
            case 'TEMPLATE_FILE':
                content = "If you are using an excel based template file that has been downloaded from the previous template screen check this box.";
                width = "500px";
                height = "100px";
                break;
            case 'START_COLUMN':
                content = "This will be the column where your data starts.";
                width = "500px";
                height = "100px";
                break;
            case 'END_COLUMN':
                content = "This will be the last column of your data.";
                width = "500px";
                height = "100px";
                break;
            case 'TEXT_QUALIFIER':
                content = "This is for use in ',' separated text files. If your data is encased in quotes or another character you may enter it here.";
                width = "500px";
                height = "100px";
                break;
            case 'DATE_FORMAT':
                content = "The format that dates use in the file(s) being uploaded.";
                width = "500px";
                height = "100px";
                break;
            case 'TIME_SERIES_MERGE':
                content = "Allows merge of static data to persisted time series data. For instance, merging account-level currency code which is static through time to account time-series return data.";
                width = "500px";
                height = "100px";
                break;
            case 'TIME_SERIES_PORTFOLIO_MERGE':
                content = "Allows merge of Non-Portfolio specific Time-Series data to Portfolio time series persisted data. For instance, merging security-level price data to portfolio holdings.";
                width = "600px";
                height = "100px";
                break;
            case 'ADVANCED_SETTINGS_COLUMNS':
                content = "If newly Mapped and Added Columns are not in this list, please click 'Apply Settings' before continuing.";
                width = "600px";
                height = "100px";
                break;
            case 'ATTRIBUTE_DATA':
                content = "Generates attribute data set (Columns: Key Column, Start Date Column, End Date Column, Attribute Columns..) from time series account or security time series data. For instance, track the change in sector, industry and country for an account or security over a period of time. Map the Value Date to the Attribute Start Date column.";
                width = "800px";
                height = "200px";
                break;
            default:
                content = "";
        }

        via.displayHelpLink(title, content, height, width);
    },

    /**
     * hideUploadFiles
     * This will hide upload files section
     */
    hideUploadFiles: function () {
        $('#uploadFilesPanel').hide();
        $('#uploadPanel').hide();
        $('#uploadProgressPanel').hide();
    },

    /**
     * deleteStagingAreaFiles
     * This will cleanup the staging area. It does this silently.
     */
    deleteStagingAreaFiles: function () {
        if(odinLite_fileFormat.isUnionFile!==true) {
            $.post(odin.SERVLET_PATH,
                {
                    action: 'odinLite.uploadFiles.deleteStagingAreaFiles',
                    overrideUser: odinLite.OVERRIDE_USER
                },
                function (data, status) {
                    if (!via.undef(data, true) && data.success === false) {
                        via.debug("Delete Files Error:", data.message);
                    } else {//Success - File Preview
                        via.debug("Delete Files Success:", data.message);
                    }
                },
                'json');
        }
    },

    /**
     * importData
     * This method will init the next step of the upload process.
     * It will also check if it is a union file.
     * @param data - the data returned from the file upload.
     */
    importData: function(data){
        if(odinLite_fileFormat.isUnionFile!==true) {
            odinLite_uploadFiles.initialValues = JSON.parse(JSON.stringify(data));//Store the initial values for possible use later if loading a saved report fails.
        }
        odinLite_fileFormat.init(data);
    },

    previousButton: function(){
        if(odinLite_fileFormat.isUnionFile!==true) {
            odinLite.loadModelCacheApplication();
        }else{
            //Show the file format panel
            odinLite_uploadFiles.hideUploadFiles();
            $('#fileFormatPanel').fadeIn();
        }
    },
};