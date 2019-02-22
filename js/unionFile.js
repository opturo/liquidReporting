/**
 * Created by rocco on 2/6/2019.
 * This will handle the union files for SAYS.
 */
var odinLite_unionFiles = {
    /* Variables */
    unionFiles: {},


    /**
     * getUnionWindow
     * This will open the union files window.
     */
    getUnionWindow: function () {
        kendo.ui.progress($("body"), true);//Wait Message

        //Get the window template
        $.get("./html/unionFilesWindow.html", function (unionWindowTemplate) {
            $('#odinLite_unionFilesWindow').remove();
            $('body').append(unionWindowTemplate);
            //Make the window.
            var unionFilesWindow = $('#odinLite_unionFilesWindow').kendoWindow({
                title: "Union Files",
                draggable: false,
                resizable: false,
                width: "310px",
                height: "290px",
                modal: true,
                close: true,
                animation: false,
                actions: [
                    "Minimize",
                    "Close"
                ],
                close: function () {
                    unionFilesWindow = null;
                    $('#odinLite_unionFilesWindow').remove();
                }
            }).data("kendoWindow");

            unionFilesWindow.center();

            //Setup the union list
            var dataSource = [];
            $.each(odinLite_unionFiles.unionFiles,function(n,o){
                dataSource.push({
                    text: n,
                    value: n
                });
            });

            //Setup the Column List
            var listbox = $("#unionFilesList").kendoListBox({
                dataTextField: "text",
                dataValueField: "text",
                dataSource: dataSource
            }).data('kendoListBox');

            $('.unionFiles_deleteFile').click(function(){
                var index = listbox.select().index();
                var dataItem = listbox.dataSource.view()[index];
                delete odinLite_unionFiles.unionFiles[dataItem.value];
                listbox.dataSource.remove(dataItem);

                odinLite_fileFormat.updateFilePreview();
            });


            //Shut off the wait
            kendo.ui.progress($("body"), false);//Wait Message
        });//End Template fetch
    },

    /**
     * getUnionWindow
     * This will open the union files window.
     */
    getFileFormatWindow: function (data) {
        kendo.ui.progress($("body"), true);//Wait Message

        //Get the window template
        $.get("./html/unionFileFormatWindow.html", function (unionWindowTemplate) {
            $('#odinLite_unionFileFormatWindow').remove();
            $('body').append(unionWindowTemplate);
            //Make the window.
            var unionFilesWindow = $('#odinLite_unionFileFormatWindow').kendoWindow({
                title: "Union File Format",
                draggable: false,
                resizable: false,
                width: "90%",
                height: "90%",
                modal: true,
                close: true,
                animation: false,
                actions: [
                    "Close"
                ],
                close: function () {
                    unionFilesWindow = null;
                    $('#odinLite_unionFileFormatWindow').remove();
                }
            }).data("kendoWindow");

            unionFilesWindow.center();

            //Process the upload info
            var form = $('#odinLite_unionFileFormatWindow').find('form')[0];
            var uploadInfo = new UploadInfo(form,data);
            uploadInfo.printData();
            uploadInfo.initUI();

            $('#odinLite_unionFileFormatWindow').data("uploadInfo",uploadInfo);


            //Shut off the wait
            kendo.ui.progress($("body"), false);//Wait Message
        });//End Template fetch
    },

    /**
     * showUploadFiles
     * This will take you back to file upload
     */
    showUnionUpload: function(){
        var win = $('#odinLite_unionFilesWindow').data('kendoWindow');
        if(!via.undef(win)){
            win.close();
        }


        via.kendoAlert("Union File","On the next screen import the files you wish to union to the main data tables.",function(){
            odinLite_fileFormat.isUnionFile=true;
            odinLite_fileFormat.hideFileFormat();
            odinLite_uploadFiles.init(true);
        });
    },

    /**
     * acceptUnionFileFormat
     * This will accept the formatting for the union file.
     */
    acceptUnionFileFormat: function(){
        var uploadInfo = $('#odinLite_unionFileFormatWindow').data("uploadInfo");
        $('#odinLite_unionFileFormatWindow').data('kendoWindow').close();
        uploadInfo.formattingOptions = uploadInfo.getFormattingOptions();
        odinLite_unionFiles.getRowHeaderWindow(uploadInfo);
    },

    /**
     * getRowHeaderWindow
     * This will open the row header chooser window.
     */
    getRowHeaderWindow: function (uploadInfo) {
        kendo.ui.progress($("body"), true);//Wait Message

        //Get the window template
        $.get("./html/unionRowHeaderWindow.html", function (unionWindowTemplate) {
            $('#odinLite_unionRowHeaderWindow').remove();
            $('body').append(unionWindowTemplate);
            //Make the window.
            var unionFilesWindow = $('#odinLite_unionRowHeaderWindow').kendoWindow({
                title: "Choose Row Headers",
                draggable: false,
                resizable: false,
                width: "830px",
                height: "465px",
                modal: true,
                close: true,
                animation: false,
                actions: [
                    "Maximize",
                    "Close"
                ],
                close: function () {
                    unionFilesWindow = null;
                    $('#odinLite_unionRowHeaderWindow').remove();
                }
            }).data("kendoWindow");

            unionFilesWindow.center();

            $('#odinLite_unionRowHeaderWindow').data("uploadInfo",uploadInfo);


            //Row Headers
            var headers = [];
            for(var i=0;i<odinLite_fileFormat.originalHeaders.length;i++){
                var col = odinLite_fileFormat.originalHeaders[i];
                headers.push({ text: col, value: col });
            }
            $("#originalRowHeaders_unselected").kendoListBox({
                dataSource: headers,
                draggable: true,
                connectWith: "originalRowHeaders_selected",
                dropSources: ["originalRowHeaders_selected"],
                dataTextField: "text",
                dataValueField: "value",
                remove: function (e) {
                    //setDiscontinued(e, false);
                },
                add: function (e) {
                    //setDiscontinued(e, true);
                }
            });

            $("#originalRowHeaders_selected").kendoListBox({
                draggable: true,
                connectWith: "originalRowHeaders_unselected",
                dropSources: ["originalRowHeaders_unselected"],
                dataTextField: "text",
                dataValueField: "text"
            });

            //Row Headers - union
            $("#unionRowHeaders_unselected").kendoListBox({
                dataSource: uploadInfo.getColumnHeaderObject(),
                draggable: true,
                connectWith: "unionRowHeaders_selected",
                dropSources: ["unionRowHeaders_selected"],
                dataTextField: "text",
                dataValueField: "text",
                remove: function (e) {
                    //setDiscontinued(e, false);
                },
                add: function (e) {
                    //setDiscontinued(e, true);
                }
            });

            $("#unionRowHeaders_selected").kendoListBox({
                draggable: true,
                connectWith: "unionRowHeaders_unselected",
                dropSources: ["unionRowHeaders_unselected"],
                dataTextField: "text",
                dataValueField: "text"
            });


            //Shut off the wait
            kendo.ui.progress($("body"), false);//Wait Message
        });//End Template fetch
    },

    /**
     * completeUnion
     * This will finish the union.
     */
    completeUnion: function(){
        var uploadInfo = $('#odinLite_unionRowHeaderWindow').data("uploadInfo");

        //Original Row Headers
        var originalSelected = $("#originalRowHeaders_selected").data('kendoListBox');
        var originalRowHeaderArr = originalSelected.dataItems().map(function(o){
            return o.value;
        });

        //Union Row Headers
        var unionSelected = $("#unionRowHeaders_selected").data('kendoListBox');
        var unionRowHeaderArr = unionSelected.dataItems().map(function(o){
            return o.value;
        });

        if(via.undef(originalRowHeaderArr) || originalRowHeaderArr.length < 1){
            via.kendoAlert("Select Row Headers","Select at least one row header for the original file.");
            return;
        }
        if(via.undef(unionRowHeaderArr) || unionRowHeaderArr.length < 1){
            via.kendoAlert("Select Row Headers","Select at least one row header for the union file.")
            return;
        }

        var innerJoin = $('#odinLite_unionRowHeaderWindow').find('.innerJoin').prop("checked");
        var overrideValue = $('#odinLite_unionRowHeaderWindow').find('.overrideValue').prop("checked");

        //Set the row headers and accept the union
        uploadInfo.setRowHeaders(unionRowHeaderArr,originalRowHeaderArr,innerJoin,overrideValue);
        var fileNames = uploadInfo.data.localFiles.join(", ");
        odinLite_unionFiles.unionFiles[fileNames] = uploadInfo;

        //Close the window.
        $('#odinLite_unionRowHeaderWindow').data("kendoWindow").close();

        //Perform the union.
        odinLite_fileFormat.updateFilePreview();
    },


    /**
     * getUnionData
     * This will gather the data the server needs about the union files.
     */
    getUnionData: function(){
        var unionData = [];
        if(!via.undef(odinLite_unionFiles.unionFiles)){
            $.each(odinLite_unionFiles.unionFiles,function(n,o){
                var uploadInfo = {};
                uploadInfo.unionRowHeaderArr = o.unionRowHeaderArr;
                uploadInfo.originalRowHeaderArr = o.originalRowHeaderArr;
                uploadInfo.innerJoin = o.innerJoin;
                uploadInfo.overrideValue = o.overrideValue;
                uploadInfo.type = o.data.type;
                uploadInfo = $.extend(uploadInfo,o.formattingOptions);
                uploadInfo.files = o.data.files;
                uploadInfo.localFiles = o.data.localFiles;
                uploadInfo.isMultiSheet = o.isMultiSheet;
                uploadInfo.sheetNames = o.sheetNames;

                uploadInfo.entityDir = odinLite_modelCache.currentEntity.entityDir;
                uploadInfo.modelId = odinLite_modelCache.currentModel.value;

                unionData.push(uploadInfo);
            });
        }
        return unionData;
    }
};