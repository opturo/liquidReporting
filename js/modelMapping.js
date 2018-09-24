/**
 * Created by rocco on 4/10/2018.
 * This is the model mapping js file for the ODIN Lite application.
 * This will handle everything to do with mapping the tableset to the correct columns.
 */
var odinLite_modelMapping = {
    /* Variables */
    hasBeenLoaded: false,//Whether this has been loaded before.
    columnTemplate: null,
    fileIdx: 0,
    dateFormat: null,//Date format of the date based fields for formatting a date

    /**
     * init
     * This will initialize ODIN Lite Import Wizard and set it up
     */
    init: function() {
        $('body').scrollTop(0);
        //Empty the spreadsheet data if it was there before
        $("#modelMapping_spreadsheet").empty();

        //update the preview in case it was not called
        odinLite_fileFormat.updateFilePreview(function(){
            kendo.ui.progress($("body"), true);//Wait Message

            //Hide the Previous Step
            odinLite_fileFormat.hideFileFormat();

            //Show the application and initialize
            if (via.undef(odinLite_modelMapping.columnTemplate)){
                //Get the column template
                $.get('./html/modelMapping_columnTemplate.html', function (data) {
                    odinLite_modelMapping.columnTemplate = data;
                    odinLite_modelMapping.showModelMapping();
                    odinLite_modelMapping.initUI();

                    //Get the initial preview
                    odinLite_modelMapping.updateFilePreview(true);
                    odinLite_modelMapping.hasBeenLoaded = true;//Set the loaded variable after first load.

                    //Enable or diable columns based on the data merge options.
                    odinLite_modelMapping.checkDataMergeOptions();

                    kendo.ui.progress($("body"), false);//Wait Message
                }, 'text');
            }else{//Template already fetched
                odinLite_modelMapping.showModelMapping();
                odinLite_modelMapping.initUI();

                //Get the initial preview
                odinLite_modelMapping.updateFilePreview(true);
                odinLite_modelMapping.hasBeenLoaded = true;//Set the loaded variable after first load.

                //Enable or diable columns based on the data merge options.
                odinLite_modelMapping.checkDataMergeOptions();

                kendo.ui.progress($("body"), false);//Wait Message
            }
        });


        //Enable/Disable Date Format
        var hasDate = false;
        for(var i=0;i<odinLite_modelCache.currentEntity.mappedColumnDataType.length;i++){
            if(odinLite_modelCache.currentEntity.mappedColumnDataType[i] === 3) {
                hasDate = true;
                break;
            }
        }
        if(hasDate === true){
            $('#modelMapping_dateFormatButton').prop("disabled",false);
        }else{
            $('#modelMapping_dateFormatButton').prop("disabled",true);
        }
    },

    /**
     * checkDataMergeOptions
     * This will check to see if the data merge options is enabled and disable/enable columns based on what is checked.
     * NOTE: This is no longer used. It has been moved to advanced settings.
     */
    checkDataMergeOptions: function(){

        //Time Series
        if(!via.undef(odinLite_fileFormat.dataMergeOptions.timeSeries) && odinLite_fileFormat.dataMergeOptions.timeSeries === true){
            //get the columns to be disabled
            var arr = [];
            var savedCol = odinLite_modelCache.currentEntity.savedColumnInfo;
            var timeSeriesCol = odinLite_modelCache.currentEntity.staticToTimeSeriesSavedColumnInfo;
            for(var i=0;i<savedCol.length;i++){
                var saved = savedCol[i];
                var timeSeries = timeSeriesCol[i];
                if(saved.isRequired===true && timeSeries.isRequired===false){
                    arr.push(timeSeries);
                }
            }

            for(var i=0;i<arr.length;i++){
                var columnContainers = $('#modelMappingColumnPanel').find("."+arr[i].id + "_" + via.cleanId(arr[i].name));
                for(var j=0;j<columnContainers.length;j++) {
                    var colContainer = columnContainers[j];
                    console.log('disable',colContainer);
                    $(colContainer).find('span .mappingColumnList_input').data('kendoDropDownList').value(null);
                    $(colContainer).find('span .mappingColumnList_input').data('kendoDropDownList').enable(false);
                }
            }
        }
    },

    /**
     * initUI
     * This will setup the UI elements.
     */
    initUI: function(){
        via.debug("Using Model Cache Current Database",odinLite_modelCache.currentEntity);

        //Remove the columns and redraw using template
        $('#modelMappingColumnPanel').empty();

        //Check for undefined variables which would lead to error.
        if(via.undef(odinLite_modelCache) || via.undef(odinLite_modelCache.currentEntity) || via.undef(odinLite_modelCache.currentEntity.savedColumnInfo,true)){
            via.alert("Model Mapping Error","Please try again.");
            return;
        }

        //Get the column list for the dropdown
        var comboArr = odinLite_modelMapping.getColumnListFromTableSet();

        //Setup the file list combo
        $('#modelMapping_fileList').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: odinLite_fileFormat.getDropdownList(),
            value: odinLite_modelMapping.fileIdx,
            change: function(a){
                odinLite_modelMapping.fileIdx = a.sender.value();
                odinLite_modelMapping.updateFilePreview(false);
            }
        });

        //Get the columns to loop through.
        var columns = odinLite_modelCache.currentEntity.savedColumnInfo;
        for(var i=0;i<columns.length;i++){
            var col = columns[i];
            this.addModelColumnFromTemplate(col,comboArr);
        }
        $("#modelMappingColumnPanel").fadeIn();
    },

    /**
     * getColumnListFromTableSet
     * This will get the column list for the mapping columns.
     */
    getColumnListFromTableSet: function(){
        if(via.undef(odinLite_fileFormat.FILE_DATA) || via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded) ||
            via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded.columnHeaders)){
            via.alert("Model Mapping Error","No data in uploaded file.");
            return null;
        }
        var columnHeaders = odinLite_fileFormat.FILE_DATA.tsEncoded.columnHeaders;
        //var hasHeader = odinLite_fileFormat.FILE_DATA.hasColumnHeader;
        var hasHeader = true;//Changed this. I now apply the column header on the server itself.
        var comboArr = [{text:"",value:null}];
        for(var i=0;i<columnHeaders.length;i++){
            var comboObj = null;
            if(hasHeader && !via.undef(columnHeaders[i],true)){
                comboObj = {
                    text: columnHeaders[i],
                    value: columnHeaders[i]
                };
            }else{
                comboObj = {
                    text: via.toExcelColumnName(i+1),
                    value: i
                };
            }
            comboArr.push(comboObj);
        }
        return comboArr;
    },

    /**
     * updateFilePreview
     * This will update the preview for model mapping. this will call the server
     */
    updateFilePreview: function(){
        $('#modelMapping_updatePreviewButton').removeClass('btn-danger');
        $('#modelMapping_updatePreviewButton').addClass('btn-success');

        kendo.ui.progress($("body"), true);//Wait Message

        //Update the formatting options.
        var formattingOptions = odinLite_fileFormat.getFormattingOptions();
        //Get the Column Mapping
        formattingOptions = odinLite_modelMapping.getColumnMappingValues(formattingOptions,false);
        //Sheet Names
        var sheetNames = null;
        if(!via.undef(odinLite_fileFormat.FILE_DATA.sheetNames,true)){
            sheetNames = JSON.stringify(odinLite_fileFormat.FILE_DATA.sheetNames);
        }

        //Get the advanced settings options
        var advancedSettingsOptions = odinLite_fileFormat.getAdvancedSettingsOptions();

        //Get the file preview from the server based on the settings.
        $.post(odin.SERVLET_PATH,
            $.extend({
                action: 'odinLite.modelMapping.getFilePreview',
                type: odinLite_fileFormat.FILE_DATA.type,
                files: JSON.stringify(odinLite_fileFormat.FILE_DATA.files),
                localFiles: JSON.stringify(odinLite_fileFormat.FILE_DATA.localFiles),
                idx: odinLite_modelMapping.fileIdx,
                sheetNames: sheetNames,
                dateFormat: odinLite_modelMapping.dateFormat,
                overrideUser: odinLite.OVERRIDE_USER
            },formattingOptions,advancedSettingsOptions),
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure generating Model Mapping preview:", data.message);
                    via.alert("Failure generating preview", data.message);
                }else{
                    via.debug("Successful generating Model Mapping preview:", data);
                    var sheetData = odinLite_fileFormat.getSpreadsheetDataFromTableSet(data.tsEncoded,false,false);
                    //Color the headers.
                    if(!via.undef(sheetData.rows) && sheetData.rows.length > 0) {
                        var firstRow = sheetData.rows[0];
                        //Turn red
                        for (var i=0;i<firstRow.cells.length;i++) {
                            firstRow.cells[i].background = "#C0C0C0";
                        }
                        //Turn green
                        if(!via.undef(data.updatedColumns) && data.updatedColumns.length > 0) {
                            for (var i = 0; i < data.updatedColumns.length; i++) {
                                var idx = data.updatedColumns[i];
                                firstRow.cells[idx].background = "green";
                            }
                        }
                    }

                    //Insert the sheet preview.
                    $("#modelMapping_spreadsheet").empty();
                    $("#modelMapping_spreadsheet").kendoSpreadsheet({
                        height: '200px',
                        headerHeight: 20,
                        //headerWidth: 0,
                        rows: 20,
                        toolbar: false,
                        sheetsbar: false,
                        rows: null,
                        columns: null,
                        sheets: [sheetData]
                    });
                    $("#modelMapping_spreadsheet .k-spreadsheet-sheets-bar-add").hide();
                    $("#modelMapping_spreadsheet .k-link").prop( "disabled", true );
                }
            },
            'json');
    },

    /**
     * addModelColumnFromTemplate
     * This will add a column to the model mapping screen
     */
    addModelColumnFromTemplate: function(colObj,comboArr){
        if(!via.undef(colObj.applyUseColumnList) && !via.undef(colObj.applyUseColumnList.options,true) &&
            colObj.applyUseColumnList.options[0]==="FALSE"){
            return;
        }

        var colTemplate = odinLite_modelMapping.columnTemplate + "";

        //Edit the column template for this column
        //Replace the ID
        colTemplate = colTemplate.replace(/{column_idName}/g,colObj.id + "_" + via.cleanId(colObj.name));
        //Replace the name
        colTemplate = colTemplate.replace(/{column_displayName}/g,colObj.name);
        //Replace the type
        var dataType = odinLite_modelCache.currentEntity.columnDataMapList[colObj.name]
        colTemplate = colTemplate.replace(/{column_dataType}/g,dataType);

        //Add the columns to the template
        var newColumn = $(colTemplate);
        $("#modelMappingColumnPanel").append( newColumn );

        //Add the combobox
        var nameArray = comboArr.map(function(o){
            return o.text;
        });

        newColumn.find(".mappingColumnList_input").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: comboArr,
            index: 0,
            value: ($.inArray(colObj.name,nameArray))?colObj.name:null,
            change: function(){
                $('#modelMapping_updatePreviewButton').removeClass('btn-success');
                $('#modelMapping_updatePreviewButton').addClass('btn-danger');;
            }
        }).data('kendoDropDownList');

        if(colObj.isRequired === true){

        }

    },

    /**
     * persistFilesToCache
     * This will persist the data and complete file upload step.
     */
    persistFilesToCache: function(){
        //console.log("odinLite_modelCache",odinLite_modelCache);
        //console.log("odinLite_uploadFiles",odinLite_uploadFiles);
        //console.log("odinLite_fileFormat",odinLite_fileFormat);

        //Get the advanced settings options
        var advancedSettingsOptions = odinLite_fileFormat.getAdvancedSettingsOptions();

        //Will contain the data to be passed to the server. Including the mapping. Includes the advanced settings for processing
        var serverParams = advancedSettingsOptions;

        //Get the mappings
        serverParams = odinLite_modelMapping.getColumnMappingValues(serverParams,true);
        if(serverParams == null){return;}

        //Get the modelID being uploaded to.
        if(via.undef(odinLite_modelCache.currentModel) || via.undef(odinLite_modelCache.currentModel.value)){
            via.alert("Persist Data Error","Cannot find the model ID.");
            return;
        }
        serverParams.modelID = odinLite_modelCache.currentModel.value;

        //Get the databaseDir
        if(via.undef(odinLite_modelCache.currentEntity) || via.undef(odinLite_modelCache.currentEntity.entityDir)){
            via.alert("Persist Data Error","Cannot find the database directory.");
            return;
        }
        serverParams.entityDir = odinLite_modelCache.currentEntity.entityDir;

        //Get the file information
        if(via.undef(odinLite_fileFormat.FILE_DATA)){
            via.alert("Persist Data Error","Cannot find the file data needed to save data.");
            return;
        }
        if(via.undef(odinLite_fileFormat.FILE_DATA.files,true)){
            via.alert("Persist Data Error","Cannot find the files needed to save data.");
            return;
        }
        serverParams.type = odinLite_fileFormat.FILE_DATA.type;
        serverParams.files = JSON.stringify(odinLite_fileFormat.FILE_DATA.files);
        serverParams.localFiles = JSON.stringify(odinLite_fileFormat.FILE_DATA.localFiles);
        serverParams.startRow = odinLite_fileFormat.FILE_DATA.startRow;
        serverParams.endRow = odinLite_fileFormat.FILE_DATA.endRow;
        serverParams.startColumn = odinLite_fileFormat.FILE_DATA.startColumn;
        serverParams.endColumn = odinLite_fileFormat.FILE_DATA.endColumn;
        serverParams.hasColumnHeader = odinLite_fileFormat.FILE_DATA.hasColumnHeader;
        serverParams.overrideUser = odinLite.OVERRIDE_USER;

        //Model and Entity Info
        serverParams.entityDir = odinLite_modelCache.currentEntity.entityDir;
        serverParams.modelId = odinLite_modelCache.currentModel.value;

        if(!via.undef(odinLite_fileFormat.FILE_DATA.sheetNames,true)){
            serverParams.sheetNames = JSON.stringify(odinLite_fileFormat.FILE_DATA.sheetNames);
        }
        if(!via.undef(odinLite_fileFormat.FILE_DATA.delimType,true)){
            serverParams.delimType = odinLite_fileFormat.FILE_DATA.delimType;
        }if(!via.undef(odinLite_fileFormat.FILE_DATA.delimType,true)){
            serverParams.userDefinedDelim = odinLite_fileFormat.FILE_DATA.userDefinedDelim;
        }
        if(!via.undef(odinLite_fileFormat.FILE_DATA.textQualifier,true)){
            serverParams.textQualifier = odinLite_fileFormat.FILE_DATA.textQualifier;
        }

        //Date Format
        serverParams.dateFormat = odinLite_modelMapping.dateFormat;

        //Add the server location
        serverParams.action = 'odinLite.modelMapping.persistFilesToCache';

        //Add the override user
        serverParams.overrideUser = odinLite.OVERRIDE_USER;

        /**************************************/
        /* Call to the server for persisting */
        kendo.ui.progress($("body"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            serverParams,
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Persist Failure:", data);
                    via.alert("Persist Failure", data.message);
                }else{
                    via.debug("Persist Successful", data);

                    //Review the errors and return home when done.
                    $('#modelMappingPanel').hide()
                    odinLite_modelMapping.reviewPersistErrors(data, function(){
                        odinLite.loadHome();
                    });
                }
            },
            'json');
    },

    /**
     * getColumnMappingValues
     * This will contain the mapping data for the columns to be sent to the server for persisting.
     */
    getColumnMappingValues: function(serverParams,emptyCheck){
        serverParams.mappingsNames = [];
        serverParams.mappingsValues = [];
        serverParams.dataTypes = [];
        serverParams.fileOverrideDataTypes = odinLite_fileFormat.FILE_DATA.tsEncoded.columnDataTypes;
        var allDataTypes = odinLite_modelCache.currentEntity.mappedColumnDataType;

        //Get the column mapping info
        var columns = odinLite_modelCache.currentEntity.savedColumnInfo;
        var container = $('#modelMappingColumnPanel');
        var hasRequired = false;

        //Time Series To Port Index Merge
        var timeSeriesToPortIndexMerge = via.undef(odinLite_fileFormat.dataMergeOptions.portIndex,true)?false:odinLite_fileFormat.dataMergeOptions.portIndex;
        if(timeSeriesToPortIndexMerge){
            var idx = 0;
            var hasOptional = false;
            for (var i = 0; i < columns.length; i++) {
                var colInfo = columns[i];
                var columnContainers = container.find("." + colInfo.id + "_" + via.cleanId(colInfo.name));
                for (var j = 0; j < columnContainers.length; j++) {
                    var colContainer = columnContainers[j];
                    var mapping_dd = $(colContainer).find('span .mappingColumnList_input').data('kendoDropDownList');

                    if (!via.undef(mapping_dd)) {
                        if(emptyCheck === true){//Check for unmapped.
                            //Required
                            if(via.undef(odinLite_modelCache.currentEntity.timeSeriesToPortIndexTimeSeriesColumns)){
                                via.alert("Mapping Error", "Cannot find required columns for Time Series To Port Index Merge.");
                                return null;
                            }else if($.inArray(colInfo.name,odinLite_modelCache.currentEntity.timeSeriesToPortIndexTimeSeriesColumns[0]) !== -1 &&
                                via.undef(mapping_dd.value(), true)){
                                via.alert("Mapping Error", "Choose a mapping column for " + colInfo.name + ".");
                                return null;
                            }
                            //Optional
                            if(!via.undef(odinLite_modelCache.currentEntity.timeSeriesToPortIndexTimeSeriesColumns) &&
                                $.inArray(colInfo.name,odinLite_modelCache.currentEntity.timeSeriesToPortIndexTimeSeriesColumns[1]) !== -1 &&
                                !via.undef(mapping_dd.value(),true)){
                                hasOptional = true;
                            }
                        }

                        if (!via.undef(mapping_dd.value(), true)) {
                            serverParams.mappingsNames.push(colInfo.name);
                            serverParams.mappingsValues.push(mapping_dd.value());
                            serverParams.dataTypes.push(allDataTypes[idx]);
                            serverParams.fileOverrideDataTypes[odinLite_modelMapping.getColumnIdx(mapping_dd.value())] = allDataTypes[idx];//This is the override data types to use for preview.
                        }
                        idx++;
                    }
                }
            }
            if(hasOptional === false && emptyCheck === true){
                via.alert("Mapping Error", "Choose at least one optional column.");
                return null;
            }
        }else { //All other types
            var timeSeriesMerge = via.undef(odinLite_fileFormat.dataMergeOptions.timeSeries,true)?false:odinLite_fileFormat.dataMergeOptions.timeSeries;
            if (timeSeriesMerge === true) {
                columns = odinLite_modelCache.currentEntity.staticToTimeSeriesSavedColumnInfo;
            }
            var idx = 0;
            for (var i = 0; i < columns.length; i++) {
                var colInfo = columns[i];
                var columnContainers = container.find("." + colInfo.id + "_" + via.cleanId(colInfo.name));
                for (var j = 0; j < columnContainers.length; j++) {
                    var colContainer = columnContainers[j];
                    var mapping_dd = $(colContainer).find('span .mappingColumnList_input').data('kendoDropDownList');
                    //if(!via.undef(mapping_dd) && !via.undef(mapping_dd.value())){
                    if (!via.undef(mapping_dd)) {
                        //For type 3 - in static merge
                        if ($('#modelMapping_timeSeriesMerge').prop('checked') === true && odinLite_modelCache.currentEntity.tableIndexType === 3 && emptyCheck === true && colInfo.isRequired && !via.undef(mapping_dd.value(), true)) {
                            hasRequired = true;
                        }else if(emptyCheck === true && via.undef(mapping_dd.value(), true) && colInfo.isRequired){
                            via.alert("Mapping Error", "Choose a mapping column for " + colInfo.name + ".");
                            return null;
                        }

                        if (!via.undef(mapping_dd.value(), true)) {
                            serverParams.mappingsNames.push(colInfo.name);
                            serverParams.mappingsValues.push(mapping_dd.value());
                            serverParams.dataTypes.push(allDataTypes[idx]);
                            serverParams.fileOverrideDataTypes[odinLite_modelMapping.getColumnIdx(mapping_dd.value())] = allDataTypes[idx];//This is the override data types to use for preview.
                        }
                        idx++;
                    }
                }
            }

            //For table type 3 only - error if no required columns are checked.
            if ($('#modelMapping_timeSeriesMerge').prop('checked') === true && odinLite_modelCache.currentEntity.tableIndexType === 3 && hasRequired === false && emptyCheck === true) {
                via.alert("Mapping Error", "Choose at least one required column.");
                return null;
            }
        }
        serverParams.mappingsNames = JSON.stringify(serverParams.mappingsNames);
        serverParams.mappingsValues = JSON.stringify(serverParams.mappingsValues);
        serverParams.dataTypes = JSON.stringify(serverParams.dataTypes);
        serverParams.fileOverrideDataTypes = JSON.stringify(serverParams.fileOverrideDataTypes);

        return serverParams;
    },


    /**
     * reviewPersistErrors
     * This will bring up the review screen for persist errors.
     */
    reviewPersistErrors: function(data, callbackFn){
        //Reset
        $('#modelMapping_errorsFound').hide();
        $('#modelMapping_noErrorsFound').hide();
        if(!via.undef($('#modelMapping_errorTSList').data('kendoDropDownList'))){
            $('#modelMapping_errorTSList').data('kendoDropDownList').destroy();
            $('#modelMapping_errorTSList').empty();
        }

        if(!via.undef(data.isErrors) && data.isErrors === true){
            $('#modelMapping_reviewErrorsButton').show();
            var comboArray = [];
            for(var i=0;i<data.errorSetsEncoded.length;i++){
                comboArray.push({ text: "Exception Data " + (i+1), value: i });
            }

            //Setup the error list combo
            $('#modelMapping_errorTSList').kendoDropDownList({
                dataTextField: "text",
                dataValueField: "value",
                dataSource: comboArray,
                value: odinLite_modelMapping.fileIdx,
                change: function(a){
                    odinLite_modelMapping.fileIdx = a.sender.value();
                    odinLite_modelMapping.updateFilePreview(false);
                    updateSheet(data.errorSetsEncoded[a.sender.value()]);
                }
            });

            //Show the first sheet
            $('#modelMapping_errorsFound').show();
            $('#modelMappingErrorsPanel').fadeIn();
            updateSheet(data.errorSetsEncoded[0]);
        }else{//Everything uploaded fine.
            $('#modelMapping_noErrorsFound').show();
            $('#modelMappingErrorsPanel').fadeIn();
        }

        //Setup the event for the button.
        $( ".modelMapping_reviewErrorsButton" ) .off();
        $( ".modelMapping_reviewErrorsButton" ).one( "click", function() {
            if(!via.undef(callbackFn)){
                callbackFn(data);
            }
        });


        function updateSheet(tsEncoded){
            var sheetData = odinLite_fileFormat.getSpreadsheetDataFromTableSet(tsEncoded,false,false);

            //Insert the sheet preview.
            if(!via.undef($("#modelMapping_errorSpreadsheet").data('kendoSpreadsheet'))){
                $("#modelMapping_errorSpreadsheet").data('kendoSpreadsheet').destroy();
            }
            $("#modelMapping_errorSpreadsheet").empty();
            $("#modelMapping_errorSpreadsheet").kendoSpreadsheet({
                height: '200px',
                headerHeight: 20,
                //headerWidth: 0,
                rows: 20,
                toolbar: false,
                sheets: [sheetData]
            });
            $("#modelMapping_errorSpreadsheet .k-spreadsheet-sheets-bar-add").hide();
            $("#modelMapping_errorSpreadsheet .k-link").prop( "disabled", true );
        }
    },


    /**
     * dateFormatWindow
     * This will open the date format window
     */
    dateFormatWindow: function(){

        //Get the window template
        $.get("./html/dateFormatWindow.html", function (dateFormatWindowTemplate) {
            $('#odinLite_dateFormatWindow').remove();
            $('body').append(dateFormatWindowTemplate);
            //Make the window.
            var dateFormatWindow = $('#odinLite_dateFormatWindow').kendoWindow({
                title: "Date Format",
                draggable: false,
                resizable: false,
                width: "340px",
                height: "175px",
                modal: true,
                close: true,
                actions: [
                    "Close"
                ],
                close: function () {
                    dateFormatWindow = null;
                    $('#odinLite_dateFormatWindow').remove();
                }
            }).data("kendoWindow");

            dateFormatWindow.center();

            //Date Columns
            $("#modelMapping_dateColumnDisplay").empty();
            var dateColumns = [];
            for(var i=0;i<odinLite_modelCache.currentEntity.mappedColumnDataType.length;i++){
                if(odinLite_modelCache.currentEntity.mappedColumnDataType[i] === 3) {
                    dateColumns.push(odinLite_modelCache.currentEntity.mappedColumnDisplay[i]);
                }
            }
            $("#modelMapping_dateColumnDisplay").html("Applies to date based column(s): "+ (dateColumns.join(", ")));

            //Date format box.
            $('#modelMapping_dateFormatList').kendoComboBox({
                dataTextField: "text",
                dataValueField: "value",
                autoWidth: true,
                dataSource: odinLite_fileFormat.FILE_DATA.dateFormats,
                change: function(e){
                    //odinLite_modelMapping.dateFormat = e.sender.value();
                }
            });

            //Button Events
            $('.modelMapping_dateFormatButton').click(function(){
                //Set the format
                odinLite_modelMapping.dateFormat = $('#modelMapping_dateFormatList').data('kendoComboBox').value();

                //Update the preview
                odinLite_modelMapping.updateFilePreview();

                //close the window
                dateFormatWindow.close();
            });

            //Shut off the wait
            kendo.ui.progress($("body"), false);//Wait Message
        });//End Template fetch
    },

    /**
     * getColumnIdx
     * This will return the index of the column
     */
    getColumnIdx: function(colName){
        var idx = -1;
        if(odinLite_fileFormat.FILE_DATA.hasColumnHeader === true) {
            idx = odinLite_fileFormat.FILE_DATA.tsEncoded.columnHeaders.indexOf(colName);
        }else{
            return colName;
        }
        return idx;
    },

    /**
     * hideModelMapping
     * This will hide file format
     */
    hideModelMapping: function(){
        $('#fileFormatPanel').hide();
    },

    /**
     * showModelMapping
     * This will hide file format
     */
    showModelMapping: function(){
        $('#modelMappingPanel').show();
    },

    /**
     * showModelMapping
     * This will hide file format
     */
    hideModelMapping: function(){
        $('#modelMappingPanel').hide();
        $('#modelMappingColumnPanel').hide();
    }
};