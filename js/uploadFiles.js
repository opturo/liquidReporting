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

    /**
     * init
     * This will initialize ODIN Lite Upload Files and set it up
     */
    init: function () {
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

                    //Extension
                    if (!via.undef(data.fileSelectionCriteria, true)) {
                        var idx = data.fileSelectionCriteria.lastIndexOf(".");
                        data.fileSelectionCriteria = data.fileSelectionCriteria.substring(idx);
                        odinLite_uploadFiles.fileExtension = data.fileSelectionCriteria;
                    }else{
                        odinLite_uploadFiles.fileExtension = null;
                    }
                    //Save Report
                    if (!via.undef(data.fileFormatReportSetting)) {
                        odinLite_uploadFiles.fileSavedReport = data.fileFormatReportSetting;
                    } else {
                        odinLite_uploadFiles.fileSavedReport = null;
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

        //Setup the events if they have not been setup
        if (!odinLite_uploadFiles.hasBeenLoaded) {
            $("#fileUpload_form").submit(function (e) {
                e.preventDefault();
                var formData = new FormData($(this)[0]);
                odinLite_uploadFiles.uploadFilesToStagingArea(formData);
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
                    duration: 500
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

            $.post(odin.SERVLET_PATH,
                {
                    action: 'odinLite.uploadFiles.preUploadFileCheck',
                    overrideUser: odinLite.OVERRIDE_USER,
                    modelId: odinLite_modelCache.currentModel.value,
                    platform: odinLite_modelCache.currentPlatform.platform,
                    uploadSpec: odinLite_modelCache.currentPlatform.specification,
                    fileNames: fileNames
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

                        odinLite_uploadFiles.initialValues = JSON.parse(JSON.stringify(data));//Store the initial values for possible use later if loading a saved report fails.

                        $('#cancelUploadButton').prop("disabled", true);
                        $('#uploadProgressPanel').fadeOut(function () {
                            //Move onto the import wizard.
                            data.isTemplateFile = isTemplateFile;
                            odinLite_fileFormat.init(data);
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
                content = "You can upload one or more files. The files must be of the same type and format if you wish to upload multiple files at once.";
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
                content = "This allows you to merge static data to already uploaded time series data.";
                width = "500px";
                height = "100px";
                break;
            case 'TIME_SERIES_PORTFOLIO_MERGE':
                content = "This allows you to merge static data to already uploaded time series data by portfolio.";
                width = "600px";
                height = "100px";
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
    },
};