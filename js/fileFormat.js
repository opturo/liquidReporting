/**
 * Created by rocco on 3/23/2018.
 * This is the import wizard js file for the ODIN Lite application.
 * This will handle everything to do with importing uploaded files.
 */
var odinLite_fileFormat = {
    /* Variables */
    hasBeenLoaded: false,//Whether this has been loaded before.
    FILE_DATA: null, //This holds the data for the files.

    //Advanced Settings
    staticColumns: [], //This will hold all the static columns, their value, and type
    mappedColumns: [],
    dataMergeOptions: {},
    dataManagementPlugin: null,
    filterRules: [],
    validationRules: [],
    loadedReport: null, //holds the name of the currently loaded report.
    rowData: [
        {text: "50",value:50},
        {text: "500",value:500},
        {text: "1,000",value:1000},
        {text: "2,500",value:2500},
        {text: "5,000",value:5000},
        {text: "10,000",value:10000},
        {text: "20,000",value:20000},
        {text: "All Rows",value:"All"}
    ], //Holds the row variables.

    /**
     * init
     * This will initialize ODIN Lite Import Wizard and set it up
     */
    init: function(data){
        $('body').scrollTop(0);

        //Check to see if this is a Union file. If so handle it
        if(odinLite_fileFormat.isUnionFile===true){
            odinLite_fileFormat.isUnionFile=false;

            //Show the file format panel
            odinLite_uploadFiles.hideUploadFiles();
            $('#fileFormatPanel').fadeIn();

            odinLite_unionFiles.getFileFormatWindow(data);

            return;
        }

        //Reset the union
        odinLite_unionFiles.unionFiles = {};
        //Empty the preview
        $('#import_fileFormat_spreadsheet').empty();

        kendo.ui.progress($("body"), true);//Wait Message
        odinLite_fileFormat.FILE_DATA = null;
        odinLite_fileFormat.clearAdvancedSettings();//Clear advanced settings
        odinLite_uploadFiles.hideUploadFiles();
        $('.fileFormat_reportName').empty();//Clear the saved report.

        //Assign the uploaded files. That way we know what files we are working with.
        odinLite_fileFormat.FILE_DATA = data;
        odinLite_fileFormat.FILE_DATA.fileIdx = 0;
        delete(odinLite_fileFormat.FILE_DATA.message);
        delete(odinLite_fileFormat.FILE_DATA.success);

        // create DropDownList for rows
        $("#import_fileFormat_rows").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: odinLite_fileFormat.rowData,
            index: 0,
            change: function(e){
                odinLite_fileFormat.updateFilePreview();
            }
        });

        //Hide the next button if it is a data management model
        if(odinLite_modelCache.dataMgmtModel === odinLite_modelCache.currentEntity.modelId){
            $('#fileFormat_nextButton').hide();
            $('#fileFormat_exportFilesButton_bottom').show();
            $('#fileFormat_exportFilesButton').show();
        }else{
            $('#fileFormat_exportFilesButton_bottom').hide();
            $('#fileFormat_exportFilesButton').hide();
            $('#fileFormat_nextButton').show();
        }

        //Check multiple sheets for excel
        odinLite_fileFormat.isMultiSheet = false;
        if(!via.undef(odinLite_fileFormat.FILE_DATA.sheetNames) && odinLite_fileFormat.FILE_DATA.sheetNames.length > 1
            && odinLite_fileFormat.FILE_DATA.files.length === 1) {
            odinLite_fileFormat.isMultiSheet = true;
            odinLite_fileFormat.excelSheetChooser(function(){
                //Go to step 1 of the import wizard using the new data
                odinLite_fileFormat.initFilePreview(true);//Override the Initial Values


                odinLite_fileFormat.hasBeenLoaded = true;//Set the loaded variable after first load.
                kendo.ui.progress($("body"), false);//Wait Message
            });
        }else {
            //Go to step 1 of the import wizard using the new data
            odinLite_fileFormat.initFilePreview();

            odinLite_fileFormat.hasBeenLoaded = true;//Set the loaded variable after first load.
            kendo.ui.progress($("body"), false);//Wait Message
        }
    },

    /**
     * excelSheetChooser
     * This will allow choosing of the sheets the user wants to upload from their excel document.
     */
    excelSheetChooser: function(callbackFn){
        //Get the window template
        $.get("./html/excelSheetChooserWindow.html", function (entityWindowTemplate) {
            $('#odinLite_excelSheetChooserWindow').remove();
            $('body').append(entityWindowTemplate);
            //Make the window.
            var excelSheetsWindow = $('#odinLite_excelSheetChooserWindow').kendoWindow({
                title: "Excel Sheet Chooser",
                draggable: false,
                resizable: false,
                width: "450px",
                height: "325px",
                modal: false,
                close: false,
                actions: [
                    //"Maximize"
                ],
                close: function () {
                    excelSheetsWindow = null;
                    $('#odinLite_excelSheetChooserWindow').remove();
                }
            }).data("kendoWindow");

            excelSheetsWindow.center();

            for(var i=0;i<odinLite_fileFormat.FILE_DATA.sheetNames.length;i++) {
                var sheetName = odinLite_fileFormat.FILE_DATA.sheetNames[i];
                $('#odinLite_excelSheetChooserWindow').find(".sheetList").append(
                    '<li>'+
                        '<input type="checkbox" id="sheet'+i+'" class="excelSheetsCheckbox k-checkbox" checked="checked" data-sheet-name="'+ sheetName +'">'+
                        '<label class="k-checkbox-label" for="sheet'+i+'">'+sheetName+'</label>'+
                    '</li>');
            }
            //Button Events
            $("#fileFormat_excelSheetsSelectButton").on("click",function(){
                $(".excelSheetsCheckbox").prop('checked', true);
            });
            $("#fileFormat_excelSheetsDeselectButton").on("click",function(){
                $(".excelSheetsCheckbox").prop('checked', false);
            });
            $(".fileFormat_selectExcelSheets").on("click",function(){//Callback function when finished.
                //Reset sheets
                var selectedSheets = [];
                var checkboxes = $(".excelSheetsCheckbox");
                for(var i=0;i<checkboxes.length;i++){
                    var check = checkboxes[i];
                    if($(check).prop("checked") === true){
                        selectedSheets.push($(check).data("sheetName"));
                    }
                }
                //Assign the selected sheets
                if(selectedSheets.length === 0){
                    via.kendoAlert("Excel Sheet Select","Select at least one sheet to upload.");
                    return;
                }
                odinLite_fileFormat.FILE_DATA.sheetNames = selectedSheets;

                //Get rid of the window
                excelSheetsWindow.close();
                $('#odinLite_excelSheetChooserWindow').remove();

                //Callback
                if(!via.undef(callbackFn)){
                    callbackFn();
                }
            });


        });


        kendo.ui.progress($("body"), false);//Wait Message
    },

    /**
     * advancedSettingsWindow_addColumn
     * This is for the add column tab
     */
    advancedSettingsWindow_addColumn: function(){
        //Dropdown box of columns
        var columnList = [];
        for(var i=0;i<odinLite_modelCache.currentEntity.mappedColumnDisplay.length;i++){
            var col = odinLite_modelCache.currentEntity.mappedColumnDisplay[i];
            columnList.push({ text: col, value: col });
        }

        //Check for data management
        if(odinLite_modelCache.dataMgmtModel === odinLite_modelCache.currentEntity.modelId){
            columnList = [];
        }


        $('#fileFormat_addColumn_columnList').kendoComboBox({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: columnList,
            value: 0,
            change: function(a){
                checkTemplateColumn(a.sender.value());

                addInputBox(a.sender.value());
            }
        });
        if(!via.undef(columnList) && columnList.length > 0) {
            addInputBox(columnList[0].text);
        }
        //Column Type
        $("#fileFormat_addColumn_columnType").kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            autoWidth: true,
            index: 0,
            dataSource: [
                {text:"Assign Value",value:"Assign Value"},
                {text:"Extract Value from File/Sheet Name",value:"Extract Value from File/Sheet Name"},
                {text:"Multi-Column Operation",value:"Multi-Column Operation"},
                {text:"Create Index",value:"Create Index"}
            ],
            change: function(e){
                if(e.sender.value() === 'Extract Value from File/Sheet Name') {
                    $('#fileFormat_testExtractContainer').show();
                    $('.fileFormat_addColumn_assignContainer').hide();
                    $('.fileFormat_addColumn_multiContainer').hide();
                    $('.fileFormat_addColumn_extractContainer').show();
                }else if(e.sender.value() === 'Multi-Column Operation') {
                    $('#fileFormat_testExtractContainer').hide();
                    $('.fileFormat_addColumn_extractContainer').hide();
                    $('.fileFormat_addColumn_assignContainer').hide();
                    $('.fileFormat_addColumn_multiContainer').show();
                }else if(e.sender.value() === 'Create Index') {
                    $('#fileFormat_testExtractContainer').hide();
                    $('.fileFormat_addColumn_extractContainer').hide();
                    $('.fileFormat_addColumn_assignContainer').hide();
                    $('.fileFormat_addColumn_multiContainer').hide();
                    $("#fileFormat_addColumn_columnList").data("kendoComboBox").value(null);
                }else{;
                    $('#fileFormat_testExtractContainer').hide();
                    $('.fileFormat_addColumn_extractContainer').hide();
                    $('.fileFormat_addColumn_multiContainer').hide();
                    $('.fileFormat_addColumn_assignContainer').show();
                }
            }
        });


        /** Data Type **/
        var dataTypeList = [];
        for(var i=0;i<odinLite_modelCache.currentEntity.compareDataTypes.length;i++){
            var col = odinLite_modelCache.currentEntity.compareDataTypes[i];
            dataTypeList.push({ text: col, value: col });
        }
        $('#fileFormat_addColumn_dataType').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: dataTypeList,
            index: 0,
            change: function(e){
                addInputBox($('#fileFormat_addColumn_columnList').data('kendoComboBox').value());
            }
        });


        //Extract - Date format combo
        $('#fileFormat_addColumn_dateFormat').kendoComboBox({
            dataTextField: "text",
            dataValueField: "value",
            autoWidth: true,
            dataSource: odinLite_fileFormat.FILE_DATA.dateFormats
        });

        //Multi-column - Operation List
        var operationList = [];
        for(var i=0;i<odinLite_modelCache.currentEntity.multiColumnOperations.length;i++){
            var col = odinLite_modelCache.currentEntity.multiColumnOperations[i];
            operationList.push({ text: col, value: col });
        }
        $('#fileFormat_addColumn_multiColumnOperationType').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            autoWidth: true,
            dataSource: operationList
        });

        //Multi-column - Header List
        var headers = odinLite_modelMapping.getColumnListFromTableSet();
        headers.splice(0,1);
        $('#fileFormat_addColumn_multiColumnColumnList').kendoMultiSelect({
            dataTextField: "text",
            dataValueField: "text",
            autoWidth: true,
            dataSource: headers
        });

        //Add Column to Grid - Button Click
        $(".fileFormat_addColumnButton").on("click",function(){
            var colObject = {};
            colObject.columnType = $("#fileFormat_addColumn_columnType").data("kendoDropDownList").value();
            colObject.columnName = $("#fileFormat_addColumn_columnList").data("kendoComboBox").value();
            colObject.type = getCurrentType();

            //sanity checks to make sure the column does not already exist
            //Check the tableset
            /*
            if(!via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded) &&
                !via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded.columnHeaders) &&
                odinLite_fileFormat.FILE_DATA.tsEncoded.columnHeaders.length>0){
                for(var i=0;i<odinLite_fileFormat.FILE_DATA.tsEncoded.columnHeaders.length;i++){
                    if(colObject.columnName === odinLite_fileFormat.FILE_DATA.tsEncoded.columnHeaders[i]){
                        via.kendoAlert("Add Column Error","Column Name already exists in dataset.");
                        return;
                    }
                }
            }
            */

            //check the other static columns
            if(!via.undef(odinLite_fileFormat.staticColumns) &&
                odinLite_fileFormat.staticColumns.length>0){
                for(var i=0;i<odinLite_fileFormat.staticColumns.length;i++){
                    var staticCol = odinLite_fileFormat.staticColumns[i];
                    if(colObject.columnName === staticCol.columnName){
                        via.kendoAlert("Add Column Error","Column Name already exists in static columns.");
                        return;
                    }
                }
            }
            //End Column Checks

            //Extract
            if(colObject.columnType === 'Extract Value from File/Sheet Name'){
                colObject.prefix = $('#fileFormat_addColumn_prefix').val();
                colObject.suffix = $('#fileFormat_addColumn_suffix').val();
                colObject.prefixRegex = $('#fileFormat_addColumn_prefixIsRegex').prop('checked');
                colObject.suffixRegex = $('#fileFormat_addColumn_suffixIsRegex').prop('checked');
                /*if(via.undef(colObject.prefix,true) && via.undef(colObject.suffix,true)){
                    via.kendoAlert("Add Column Error","Enter a prefix or a suffix.");
                    return;
                }*/

                if(colObject.type===3) {
                    colObject.dateFormat = $('#fileFormat_addColumn_dateFormat').data('kendoComboBox').value();
                }
                if(colObject.type===3 && via.undef(colObject.dateFormat)){
                    via.kendoAlert("Add Column Error","Select a date format.");
                    return;
                }
            }else if(colObject.columnType === 'Multi-Column Operation'){
                var operationType = $('#fileFormat_addColumn_multiColumnOperationType').data("kendoDropDownList").value();
                if(via.undef(operationType,true)){
                    via.kendoAlert("Add Column Error","Select an operation type.");
                    return;
                }
                var columnList = $('#fileFormat_addColumn_multiColumnColumnList').data("kendoMultiSelect").value();
                if(via.undef(operationType,true) || columnList.length === 0){
                    via.kendoAlert("Add Column Error","Select at least one column.");
                    return;
                }
                /*if(columnList.length < 2 && operationType !== 'Inverse Value'){
                    via.kendoAlert("Add Column Error","Select two or more columns for this operation.");
                    return;
                }*/
                if(columnList.length > 1 && operationType === 'Inverse Value'){
                    via.kendoAlert("Add Column Error","Select only one column for this operation.");
                    return;
                }

                colObject.operationType = operationType;
                colObject.columnList = columnList.join("::");
            }else if(colObject.columnType === 'Create Index'){//Create Index

            }else{//Assign
                //Check the value
                colObject.value = getInputBoxValue();
                //Add the data type if it is a custom column
                if($('#fileFormat_addColumn_dataType').prop("disabled") === false) {
                    colObject.dataType = $('#fileFormat_addColumn_dataType').data('kendoDropDownList').value();
                }

                //Check for a value
                if(via.undef(colObject.value,true)){
                    via.kendoAlert("Add Column Error","Set a value for the column you want to add.");
                    return;
                }
            }

            //Add everything to the grid
            var grid = $("#fileFormat_addColumn_grid").data('kendoGrid');
            grid.dataSource.add(colObject);

            //Reset form
            $("#fileFormat_addColumn_columnList").data("kendoComboBox").value(null);
            $('#fileFormat_addColumn_dataType').data('kendoDropDownList').select(0);
            $('#fileFormat_addColumn_prefix').val(null);
            $('#fileFormat_addColumn_suffix').val(null);
            $('#fileFormat_addColumn_dateFormat').data('kendoComboBox').value(null);
            $('#fileFormat_addColumn_prefixIsRegex').prop('checked',false);
            $('#fileFormat_addColumn_suffixIsRegex').prop('checked',false);
            $("#fileFormat_addColumn_columnList").data("kendoComboBox").trigger('change');
            $('#fileFormat_addColumn_multiColumnOperationType').data("kendoDropDownList").value(null);
            $('#fileFormat_addColumn_multiColumnColumnList').data("kendoMultiSelect").value(null);
        });

        //Grid for add column
        $("#fileFormat_addColumn_grid").kendoGrid({
            height: 145,
            dataSource: {
                data: odinLite_fileFormat.staticColumns,
                schema: {
                    model: {
                        fields: {
                            columnName: { type: "string" },
                            columnType: { type: "string" },
                            dataType: { type: "string" },
                            value: { type: "string" },
                            prefix: { type: "string" },
                            prefixRegex: { type: "boolean" },
                            suffix: { type: "string" },
                            suffixRegex: { type: "boolean" },
                            dateFormat: { type: "string" },
                            operationType: { type: "string" },
                            columnList: { type: "string" }
                        }
                    }
                }
            },
            scrollable: true,
            sortable: false,
            filterable: false,
            columns: [
                { field: "columnName", title: "Column Name", width: "130px" },
                { field: "columnType", title: "Column Type", width: "100px" },
                { field: "dataType", title: "Data Type", width: "100px" },
                { field: "value", title: "Value", width: "100px"},
                { field: "prefix", title: "Prefix", width: "100px" },
                { field: "prefixRegex", title: "Regex", width: "60px" },
                { field: "suffix", title: "Suffix", width: "100px" },
                { field: "suffixRegex", title: "Regex", width: "60px" },
                { field: "dateFormat", title: "Date Format", width: "100px" },
                { field: "operationType", title: "Operation Type", width: "100px" },
                { field: "columnList", title: "Column List", width: "100px" },
                { title: "Edit", width: "85px",
                    command: {
                        text: "Edit",
                        click: editColumn
                    }
                },
                { title: "Delete", width: "85px",
                    command: {
                        text: "Delete",
                        click: deleteColumn
                    }
                }
            ]
        });

        //Load the initial/saved settings
        var grid = $("#fileFormat_addColumn_grid").data('kendoGrid');
        grid.dataSource.data([]);
        grid.dataSource.data(odinLite_fileFormat.staticColumns);



        /****************/
        /*  Function   */
        /***************/
        //Check to see if it is a template column
        function checkTemplateColumn(colName){
            var isTemplate = false;
            var cols = odinLite_modelCache.currentEntity.mappedColumnDisplay;
            for(var i in cols){
                if(via.undef(cols[i])){ continue; }
                if(cols[i].toUpperCase() === colName.toUpperCase()){
                    isTemplate = true;
                    break;
                }
            }

            var dataTypeInput = $('#fileFormat_addColumn_dataType').data('kendoDropDownList');
            if(isTemplate !== true){
                dataTypeInput.select(0);
                $('#fileFormat_addColumn_dataType').prop("disabled",false);
                $('#fileFormat_addColumn_dataType').data('kendoDropDownList').enable(true);
            }else{
                dataTypeInput.select(0);
                $('#fileFormat_addColumn_dataType').prop("disabled",true);
                $('#fileFormat_addColumn_dataType').data('kendoDropDownList').enable(false);
            }
        }

        //Edits a column from the table
        function editColumn(e) {
            e.preventDefault();
            var dataItem = this.dataItem($(e.currentTarget).closest("tr"));

            //Remove from the grid
            var grid = $("#fileFormat_addColumn_grid").data('kendoGrid');
            grid.dataSource.remove(dataItem);

            //Remove from the static
            var idx = -1;
            for(var i=0;i<odinLite_fileFormat.staticColumns.length;i++){
                var col = odinLite_fileFormat.staticColumns[i];
                if(col.columnName === dataItem.columnName){
                    idx = i;
                    break;
                }
            }
            if(idx!==-1){
                odinLite_fileFormat.staticColumns.splice(i,1);
            }

            //Set the column type
            $("#fileFormat_addColumn_columnType").data('kendoDropDownList').value(dataItem.columnType);
            $("#fileFormat_addColumn_columnList").data("kendoComboBox").value(dataItem.columnName);
            if(dataItem.columnType === 'Extract Value from File/Sheet Name'){
                $('#fileFormat_addColumn_dateFormat').data('kendoComboBox').value(dataItem.dateFormat);
                $('#fileFormat_addColumn_prefix').val(dataItem.prefix);
                $('#fileFormat_addColumn_suffix').val(dataItem.suffix);
                $('#fileFormat_addColumn_prefixIsRegex').prop('checked',dataItem.prefixRegex);
                $('#fileFormat_addColumn_suffixIsRegex').prop('checked',dataItem.suffixRegex);
            }else if(dataItem.columnType === 'Multi-Column Operation'){
                $('#fileFormat_addColumn_multiColumnOperationType').data('kendoDropDownList').value(dataItem.operationType);
                var arr = [];
                if(!via.undef(dataItem.columnList,true)){ arr = dataItem.columnList.split(";");}
                $('#fileFormat_addColumn_multiColumnColumnList').data('kendoMultiSelect').value(arr);
            }else{
                if(!via.undef(dataItem.dataType,true)) {
                    $("#fileFormat_addColumn_dataType").prop("disabled",false);
                    $("#fileFormat_addColumn_dataType").data('kendoDropDownList').enable();
                    $("#fileFormat_addColumn_dataType").data('kendoDropDownList').value(dataItem.dataType);
                    $("#fileFormat_addColumn_dataType").data('kendoDropDownList').trigger("change");
                }else{
                    $("#fileFormat_addColumn_dataType").prop("diabled",true);
                    $("#fileFormat_addColumn_dataType").data('kendoDropDownList').enable(false);
                    $("#fileFormat_addColumn_dataType").data('kendoDropDownList').select(0);
                    //$("#fileFormat_addColumn_dataType").data('kendoDropDownList').trigger("change");
                }
                addInputBox(dataItem.columnName);
                getInputBoxValue(dataItem.value);
            }
            $("#fileFormat_addColumn_columnType").data('kendoDropDownList').trigger("change")
        }

        //Delete a column from the table
        function deleteColumn(e){
            e.preventDefault();

            var dataItem = this.dataItem($(e.currentTarget).closest("tr"));

            //Remove from the grid
            var grid = $("#fileFormat_addColumn_grid").data('kendoGrid');
            grid.dataSource.remove(dataItem);

            //Remove from the static
            var idx = -1;
            for(var i=0;i<odinLite_fileFormat.staticColumns.length;i++){
                var col = odinLite_fileFormat.staticColumns[i];
                if(col.columnName === dataItem.columnName){
                    idx = i;
                    break;
                }
            }
            if(idx!==-1){
                odinLite_fileFormat.staticColumns.splice(i,1);
            }
        }

        //addInputBox - adds an input box based on the type.
        function addInputBox(columnName){
            $(".fileFormat_addColumn_columnValue").empty();
            $(".fileFormat_addColumn_columnValue").append('<input style="width:300px;" id="fileFormat_addColumn_value"/>');

            var idx = $.inArray(columnName,odinLite_modelCache.currentEntity.mappedColumnDisplay);
            var type = 0;
            if(idx !== -1){
                type = odinLite_modelCache.currentEntity.mappedColumnDataType[idx];
            }else if($('#fileFormat_addColumn_dataType').prop("disabled") === false){
                var textType = $('#fileFormat_addColumn_dataType').data('kendoDropDownList').value();
                type = odinLite_modelCache.currentEntity.compareDataTypeCodes[textType];
            }
            switch(type){
                case 1:
                    $('#fileFormat_addColumn_value').kendoNumericTextBox();
                    break;
                case 4:
                    $('#fileFormat_addColumn_value').kendoNumericTextBox({
                        decimals: 0,
                        restrictDecimals: true
                    });
                    break;
                case 3:
                    $("#fileFormat_addColumn_value").kendoDatePicker();
                    break;
                default://Text
                    $('#fileFormat_addColumn_value').addClass("k-textbox");
            }
        }

        //getInputBoxValue - can get or set the value of the input box
        function getInputBoxValue(setValue){
            var columnName = $("#fileFormat_addColumn_columnList").data("kendoComboBox").value();
            var idx = $.inArray(columnName,odinLite_modelCache.currentEntity.mappedColumnDisplay);
            var type = 0;
            if(idx !== -1){
                type = odinLite_modelCache.currentEntity.mappedColumnDataType[idx];
            }else if($('#fileFormat_addColumn_dataType').prop("disabled") === false){
                var textType = $('#fileFormat_addColumn_dataType').data('kendoDropDownList').value();
                type = odinLite_modelCache.currentEntity.compareDataTypeCodes[textType];
            }

            var value = null;
            switch(type){
                case 1:
                case 4:
                    value = $('#fileFormat_addColumn_value').data("kendoNumericTextBox").value();
                    if(!via.undef(setValue,true)){
                        $('#fileFormat_addColumn_value').data("kendoNumericTextBox").value(setValue);
                    }
                    break;
                case 3:
                    var date = $("#fileFormat_addColumn_value").data("kendoDatePicker").value();
                    if(!via.undef(setValue,true)){
                        $('#fileFormat_addColumn_value').data("kendoDatePicker").value(kendo.parseDate(setValue, "yyyyMMdd"));
                    }
                    if(date===null){return null;}
                    value = (date.getFullYear() +
                    ('0' + (date.getMonth() + 1)).slice(-2) +
                    ('0' + (date.getDate())).slice(-2));
                    break;
                default://Text
                    value = $('#fileFormat_addColumn_value').val();
                    if(!via.undef(setValue,true)){
                        $('#fileFormat_addColumn_value').val(setValue);
                    }
            }

            return value;
        }

        //getCurrentType - get the type of the current column chosen
        function getCurrentType(){
            var columnName = $("#fileFormat_addColumn_columnList").data("kendoComboBox").value();
            var idx = $.inArray(columnName,odinLite_modelCache.currentEntity.mappedColumnDisplay);
            var type = 0;
            if(idx !== -1){
                type = odinLite_modelCache.currentEntity.mappedColumnDataType[idx];
            }
            return type;
        }
    },

    advancedSettingsWindow_addColumn_regexHelp: function(){
        kendo.ui.progress($("body"), true);
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.uploadFiles.getRegexExamples'
            },
            function(data, status){
                kendo.ui.progress($("body"), false);//wait off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Regex Help Error:", data.message);
                    via.alert("Regex Help Error",data.message);
                }else{//Success - RegEx
                    via.debug("Regex Help Successful:", data);
                    if(!via.undef(data.tsEncoded)) {
                        var grid = via.displayPopupGrid("Regex Help", data.tsEncoded, 400, 900);
                        grid.setOptions({
                            groupable: false
                        });
                    }
                }
            },
            'json');
    },

    /**
     * advancedSettingsWindow_mapColumn
     * This is for the map column tab
     */
    advancedSettingsWindow_mapColumn: function(){
        //Header List
        //var headers = odinLite_modelMapping.getColumnListFromTableSet();
        //headers.splice(0,1);
        var headerArr = (!via.undef(odinLite_fileFormat.unionHeaders))?odinLite_fileFormat.unionHeaders:odinLite_fileFormat.originalHeaders;
        var headers = [];
        for(var i=0;i<headerArr.length;i++){
            var col = headerArr[i];
            headers.push({ text: col, value: col });
        }

        //Dropdown box of columns
        var columnList = [];
        for(var i=0;i<odinLite_modelCache.currentEntity.mappedColumnDisplay.length;i++){
            var col = odinLite_modelCache.currentEntity.mappedColumnDisplay[i];
            columnList.push({ text: col, value: col });
        }
        //Check for data management
        if(odinLite_modelCache.dataMgmtModel === odinLite_modelCache.currentEntity.modelId){
            columnList = [];
        }

        $('#fileFormat_mapColumn_columnList').kendoComboBox({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: columnList,
            value: null,
            change: function(e){
                //Check the template Column
                checkTemplateColumn(e.sender.value());

                //Set the date format
                setDateFormat();
            }
        });

        //Extract - Date format combo
        $('#fileFormat_mapColumn_dateFormat').kendoComboBox({
            dataTextField: "text",
            dataValueField: "value",
            autoWidth: true,
            value: null,
            dataSource: odinLite_fileFormat.FILE_DATA.dateFormats
        });
        setDateFormat();

        //Header List
        $('#fileFormat_mapColumn_headerList').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "text",
            autoWidth: true,
            dataSource: headers,
            value: null
        });


        /** Data Type **/
        var dataTypeList = [];
        for(var i=0;i<odinLite_modelCache.currentEntity.compareDataTypes.length;i++){
            var col = odinLite_modelCache.currentEntity.compareDataTypes[i];
            dataTypeList.push({ text: col, value: col });
        }
        $('#fileFormat_mapColumn_dataType').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: dataTypeList,
            value: null,
            change: function(e){
                //Set the date format
                setDateFormat();
            }
        });

        //Add Column to Grid - Button Click
        $(".fileFormat_mapColumnButton").on("click",function(){
            var colObject = {};
            colObject.dataColumn = $("#fileFormat_mapColumn_headerList").data("kendoDropDownList").value();
            colObject.templateColumn = $("#fileFormat_mapColumn_columnList").data("kendoComboBox").value();
            if($("#fileFormat_mapColumn_dataType").prop("disabled") === false) {
                colObject.dataType = $("#fileFormat_mapColumn_dataType").data("kendoDropDownList").value();
            }
            colObject.dateFormat = $("#fileFormat_mapColumn_dateFormat").data("kendoComboBox").value();
            colObject.type = getCurrentType();

            //Data Column Check
            if(via.undef(colObject.dataColumn,true)){
                via.kendoAlert("Map Column Error","Choose a data column.");
                return;
            }

            //Template Column Check
            if(via.undef(colObject.templateColumn,true)){
                via.kendoAlert("Map Column Error","Choose a template column.");
                return;
            }

            //Date Format Check
            if(via.undef(colObject.dateFormat,true) && colObject.type === 3){
                via.kendoAlert("Map Column Error","Choose a date format.");
                return;
            }
            if(colObject.dataType === "Date" && via.undef(colObject.dateFormat,true)){
                via.kendoAlert("Map Column Error","Choose a date format.");
                return;
            }

            //Mapped Column Check
            for(var i in odinLite_fileFormat.mappedColumns){
                var obj = odinLite_fileFormat.mappedColumns[i];
                if(obj.dataColumn === colObject.dataColumn){
                    via.kendoAlert("Map Column Error","Data Column already mapped.");
                    return;
                }
                if(obj.templateColumn === colObject.templateColumn){
                    via.kendoAlert("Map Column Error","Template Column already mapped.");
                    return;
                }
            }

            //Add everything to the grid
            var grid = $("#fileFormat_mapColumn_grid").data('kendoGrid');
            grid.dataSource.add(colObject);

            //Reset form
            $("#fileFormat_mapColumn_headerList").data("kendoDropDownList").value(null);
            $("#fileFormat_mapColumn_dataType").data("kendoDropDownList").value(null);
            $("#fileFormat_mapColumn_columnList").data("kendoComboBox").value(null);
            $('#fileFormat_mapColumn_dateFormat').data('kendoComboBox').value(null);
        });

        //Grid for add column
        $("#fileFormat_mapColumn_grid").kendoGrid({
            height: 190,
            dataSource: {
                data: odinLite_fileFormat.staticColumns,
                schema: {
                    model: {
                        fields: {
                            dataColumn: { type: "string" },
                            templateColumn: { type: "string" },
                            dataType: { type: "string" },
                            dateFormat: { type: "string" }
                        }
                    }
                }
            },
            scrollable: true,
            sortable: false,
            filterable: false,
            columns: [
                { field: "dataColumn", title: "Data Column", width: "130px" },
                { field: "templateColumn", title: "Template Column", width: "100px" },
                { field: "dataType", title: "Data Type", width: "100px"},
                { field: "dateFormat", title: "Date Format", width: "100px"},
                { title: "Delete", width: "85px",
                    command: {
                        text: "Delete",
                        click: deleteColumn
                    }
                }
            ]
        });

        //Load the initial/saved settings
        var grid = $("#fileFormat_mapColumn_grid").data('kendoGrid');
        grid.dataSource.data([]);
        grid.dataSource.data(odinLite_fileFormat.mappedColumns);


        /****************/
        /*  Function   */
        /***************/

        //Check to see if it is a template column
        function checkTemplateColumn(colName){
            var isTemplate = false;
            var cols = odinLite_modelCache.currentEntity.mappedColumnDisplay;
            for(var i in cols){
                if(via.undef(cols[i])){ continue; }
                if(cols[i].toUpperCase() === colName.toUpperCase()){
                    isTemplate = true;
                    break;
                }
            }

            var dataTypeInput = $('#fileFormat_mapColumn_dataType').data('kendoDropDownList');
            if(isTemplate !== true){
                dataTypeInput.select(0);
                $('#fileFormat_mapColumn_dataType').prop("disabled",false);
                $('#fileFormat_mapColumn_dataType').data('kendoDropDownList').enable(true);
            }else{
                dataTypeInput.select(0);
                $('#fileFormat_mapColumn_dataType').prop("disabled",true);
                $('#fileFormat_mapColumn_dataType').data('kendoDropDownList').enable(false);
            }
        }

        //Delete a column from the table
        function deleteColumn(e){
            e.preventDefault();

            var dataItem = this.dataItem($(e.currentTarget).closest("tr"));

            //Remove from the grid
            var grid = $("#fileFormat_mapColumn_grid").data('kendoGrid');
            grid.dataSource.remove(dataItem);

            //Remove from the mapped array
            var idx = -1;
            for(var i=0;i<odinLite_fileFormat.mappedColumns.length;i++){
                var col = odinLite_fileFormat.mappedColumns[i];
                if(col.dataColumn === dataItem.dataColumn){
                    idx = i;
                    break;
                }
            }
            if(idx!==-1){
                odinLite_fileFormat.mappedColumns.splice(i,1);
            }
        }

        //getCurrentType - get the type of the current column chosen
        function setDateFormat(){
            var type = getCurrentType();
            if(type === 3){
                $('#fileFormat_mapColumn_dateFormat').prop("disabled",false);
                $('#fileFormat_mapColumn_dateFormat').data('kendoComboBox').enable(true);
                $('#fileFormat_mapColumn_dateFormat').data('kendoComboBox').select(0);
            }else{
                $('#fileFormat_mapColumn_dateFormat').data('kendoComboBox').value(null);
                $('#fileFormat_mapColumn_dateFormat').data('kendoComboBox').enable(false);
            }

            //This is for a custom column / not a template
            if($('#fileFormat_mapColumn_dataType').prop("disabled") === false &&
                $('#fileFormat_mapColumn_dataType').data("kendoDropDownList").value() === "Date"){
                $('#fileFormat_mapColumn_dateFormat').prop("disabled",false);
                $('#fileFormat_mapColumn_dateFormat').data('kendoComboBox').enable(true);
            }

            return type;
        }

        //getCurrentType - get the type of the current column chosen
        function getCurrentType(){
            var columnName = $("#fileFormat_mapColumn_columnList").data("kendoComboBox").value();
            var idx = $.inArray(columnName,odinLite_modelCache.currentEntity.mappedColumnDisplay);
            var type = 0;
            if(idx !== -1){
                type = odinLite_modelCache.currentEntity.mappedColumnDataType[idx];
            }

            return type;
        }
    },

    /**
     * advancedSettingsWindow_dataMergeOptions
     * This will setup the data merge options
     */
    advancedSettingsWindow_dataMergeOptions: function(){
        //Initial Values
        if(!via.undef(odinLite_fileFormat.dataMergeOptions.timeSeries) && odinLite_fileFormat.dataMergeOptions.timeSeries === true){
            $('#modelMapping_timeSeriesMerge').prop("checked",odinLite_fileFormat.dataMergeOptions.timeSeries);
            $('#modelMapping_timeSeriesToPortIndexMerge').prop("checked",false);
            $('#modelMapping_attributeData').prop("checked",false);
        }else if(!via.undef(odinLite_fileFormat.dataMergeOptions.portIndex)  && odinLite_fileFormat.dataMergeOptions.portIndex === true){
            $('#modelMapping_timeSeriesToPortIndexMerge').prop("checked",odinLite_fileFormat.dataMergeOptions.portIndex);
            $('#modelMapping_timeSeriesMerge').prop("checked",false);
            $('#modelMapping_attributeData').prop("checked",false);
        }else if(!via.undef(odinLite_fileFormat.dataMergeOptions.attributeData)  && odinLite_fileFormat.dataMergeOptions.attributeData === true){
            $('#modelMapping_attributeData').prop("checked",odinLite_fileFormat.dataMergeOptions.attributeData);
            $('#modelMapping_timeSeriesToPortIndexMerge').prop("checked",false);
            $('#modelMapping_timeSeriesMerge').prop("checked",false);
        }

        //Check to see if it is enabled. Disable and uncheck if it is not.
        if(odinLite_modelCache.currentEntity.isTimeSeriesToPortIndexTimeSeriesAllowed === false){
            $('#modelMapping_timeSeriesToPortIndexMerge').prop("checked",false);
            $('#modelMapping_timeSeriesToPortIndexMerge').prop("disabled",true);
        }
        if(odinLite_modelCache.currentEntity.isStaticToTimeSeriesAllowed === false){
            $('#modelMapping_timeSeriesMerge').prop("checked",false);
            $('#modelMapping_timeSeriesMerge').prop("disabled",true);
        }
        if(odinLite_modelCache.currentEntity.isAttributeAllowed === false){
            $('#modelMapping_attributeData').prop("checked",false);
            $('#modelMapping_attributeData').prop("disabled",true);
        }

        //Events - disable the other if checked
        $('#modelMapping_timeSeriesToPortIndexMerge').on('change',function() {
            if($('#modelMapping_timeSeriesToPortIndexMerge').prop('checked')) {
                $('#modelMapping_timeSeriesMerge').prop("checked",false);
                $('#modelMapping_attributeData').prop("checked",false);
            }
        });
        $('#modelMapping_timeSeriesMerge').on('change',function() {
            if($('#modelMapping_timeSeriesMerge').prop('checked')) {
                $('#modelMapping_timeSeriesToPortIndexMerge').prop("checked",false);
                $('#modelMapping_attributeData').prop("checked",false);
            }
        });
        $('#modelMapping_attributeData').on('change',function() {
            if($('#modelMapping_attributeData').prop('checked')) {
                $('#modelMapping_timeSeriesToPortIndexMerge').prop("checked",false);
                $('#modelMapping_timeSeriesMerge').prop("checked",false);
            }
        });
    },

    /**
     * advancedSettingsWindow_dataManagementPlugins
     * This handle the data management plugins tab
     */
    advancedSettingsWindow_dataManagementPlugins: function(){
        var plugins = [{ text: "", value: null }];
        if(!via.undef(odinLite_modelCache.currentEntity.dataManagementPlugins)) {
            for(var i=0;i<odinLite_modelCache.currentEntity.dataManagementPlugins.length;i++){
                var plug = odinLite_modelCache.currentEntity.dataManagementPlugins[i];
                plugins.push({ text: plug, value: plug });
            }
        }

        $('#fileFormat_dataManagementPlugin').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: plugins,
            value: odinLite_fileFormat.dataManagementPlugin
        });
    },

    /**
     * advancedSettingsWindow_filterData
     * This handles the filter data tab
     */
    advancedSettingsWindow_filterData: function(){
        /** Where Clause Type **/
        $('#fileFormat_filterData_whereClauseType').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: [{text:'OR',value:'OR'},{text:'AND',value:'AND'}],
            index: 0,
            change: function(e){}
        });

        /** Data Column **/
        $('#fileFormat_filterData_dataColumn').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "text",
            dataSource: odinLite_fileFormat.getColumnListWithAdvancedColumns(),
            index: 0,
            change: function(e){
                $('#fileFormat_filterData_dataType').data('kendoDropDownList').value(null);
                enableComparisonValueInputBox(false);
            }
        });

        /** Data Type **/
        var dataTypeList = [];
        for(var i=0;i<odinLite_modelCache.currentEntity.compareDataTypes.length;i++){
            var col = odinLite_modelCache.currentEntity.compareDataTypes[i];
            dataTypeList.push({ text: col, value: col });
        }
        $('#fileFormat_filterData_dataType').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: dataTypeList,
            index: 0,
            change: function(e){
                updateDataTypeOperations();
                addComparisonValueInputBox();
            }
        });

        /** Comparison Operation **/
        $('#fileFormat_filterData_operation').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: [],
            change: function(e){
                var comparisonTypeDD = $('#fileFormat_filterData_comparisonType').data('kendoDropDownList');
                var comparisonColumnDD = $('#fileFormat_filterData_comparisonColumn').data('kendoDropDownList');

                //Enable the boxes
                comparisonTypeDD.enable(true);
                comparisonColumnDD.enable(true);
                enableComparisonValueInputBox(true);

                var val = e.sender.value();
                if(val === 'Is Missing' || val==='Not Missing'){
                    comparisonTypeDD.value('Value');
                    comparisonTypeDD.enable(false);

                    comparisonColumnDD.value(null);
                    comparisonColumnDD.enable(false);

                    getComparisonValueInputBoxValue(null);
                    enableComparisonValueInputBox(false);
                }else if(val === 'Contains' || val==='Not Contains' || val==='Between' || val==='Not Between'){
                    comparisonTypeDD.value('Value');
                    comparisonTypeDD.enable(false);

                    comparisonColumnDD.value(null);
                    comparisonColumnDD.enable(false);

                    getComparisonValueInputBoxValue(null);
                }else{
                    comparisonColumnDD.value(null);
                    getComparisonValueInputBoxValue(null);
                }
            }
        });
        //Function to update the data type operations.
        function updateDataTypeOperations(){
            //Reset the values
            var ddList = $('#fileFormat_filterData_operation').data('kendoDropDownList');
            ddList.dataSource.data([]);

            //get the list for the currently selected data type.
            var value = $('#fileFormat_filterData_dataType').data('kendoDropDownList').value();
            var list = odinLite_modelCache.currentEntity.compareOperations[value];
            if(via.undef(list,true)){return;}
            var operationList = [];
            for(var i=0;i<list.length;i++){
                var col = list[i];
                operationList.push({ text: col, value: col });
            }
            ddList.dataSource.data(operationList);
        }
        updateDataTypeOperations();

        /** Comparison Type **/
        $('#fileFormat_filterData_comparisonType').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: [{text:'Value',value:'Value'},{text:'Column',value:'Column'}],
            change: function(e){
                updateComparisonType();
            }
        });
        function updateComparisonType(){
            var val = $('#fileFormat_filterData_comparisonType').data('kendoDropDownList').value();
            if(val === "Column"){
                enableComparisonValueInputBox(false);
                getComparisonValueInputBoxValue(null);
                $('#fileFormat_filterData_comparisonColumn').data('kendoDropDownList').enable(true);
            }else{
                enableComparisonValueInputBox(true);
                $('#fileFormat_filterData_comparisonColumn').data('kendoDropDownList').enable(false);
            }
        }

        /** Comparison Value **/
        addComparisonValueInputBox();
        //addInputBox - adds an input box based on the type.
        function addComparisonValueInputBox(){
            $(".fileFormat_filterData_comparisonValue").empty();
            $(".fileFormat_filterData_comparisonValue").append('<input style="width:200px;" id="fileFormat_filterData_comparisonValue"/>');

            var type = $("#fileFormat_filterData_dataType").data("kendoDropDownList").value();
            switch(type){
                case "Number":
                    $('#fileFormat_filterData_comparisonValue').addClass("k-textbox");
                    $('#fileFormat_filterData_comparisonValue').keyup(function () {
                        this.value = this.value.replace(/[^0-9\.-]/g,'');
                    });
                    break;
                case "Date":
                    $("#fileFormat_filterData_comparisonValue").kendoDatePicker();
                    break;
                default://Text
                    $('#fileFormat_filterData_comparisonValue').addClass("k-textbox");
            }
        }
        function enableComparisonValueInputBox(enable){
            var type = $("#fileFormat_filterData_dataType").data("kendoDropDownList").value();
            switch(type){
                case "Number":
                    //$('#fileFormat_filterData_comparisonValue').data('kendoNumericTextBox').enable(enable);
                    $('#fileFormat_filterData_comparisonValue').prop("disabled",!enable);
                    break;
                case "Date":
                    $('#fileFormat_filterData_comparisonValue').data('kendoDatePicker').enable(enable);
                    break;
                default://Text
                    $('#fileFormat_filterData_comparisonValue').prop("disabled",!enable);
            }
        }

        //getInputBoxValue - can get or set the value of the input box
        function getComparisonValueInputBoxValue(setValue){
            var type = $("#fileFormat_filterData_dataType").data("kendoDropDownList").value();
            switch(type){
                /*
                case "Number":
                    value = $('#fileFormat_filterData_comparisonValue').data("kendoNumericTextBox").value();
                    if(setValue!==undefined){
                        $('#fileFormat_filterData_comparisonValue').data("kendoNumericTextBox").value(setValue);
                    }
                    break;
                */
                case "Date":
                    var date = $("#fileFormat_filterData_comparisonValue").data("kendoDatePicker").value();
                    if(setValue!==undefined){
                        $('#fileFormat_filterData_comparisonValue').data("kendoDatePicker").value(setValue);
                    }
                    if(date===null){return null;}
                    value = (date.getFullYear() +
                    ('0' + (date.getMonth() + 1)).slice(-2) +
                    ('0' + (date.getDate())).slice(-2));
                    break;
                case "Number":
                default://Text
                    value = $('#fileFormat_filterData_comparisonValue').val();
                    if(setValue!==undefined){
                        $('#fileFormat_filterData_comparisonValue').val(setValue);
                    }
            }

            return value;
        }


        /** Comparison Column **/
        $('#fileFormat_filterData_comparisonColumn').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "text",
            dataSource: odinLite_fileFormat.getColumnListWithAdvancedColumns(),
            value: null,
            change: function(e){}
        });

        /** Trigger events **/
        $('#fileFormat_filterData_comparisonType').data('kendoDropDownList').trigger('change');
        updateComparisonType();

        /** Intermediate Rules Grid **/
        $("#fileFormat_filterData_intermediateGrid").kendoGrid({
            height: 120,
            dataSource: {
                data: [],
                schema: {
                    model: {
                        fields: {
                            whereClauseType: { type: "string" },
                            dataColumn: { type: "string" },
                            dataType: { type: "string" },
                            operation: { type: "string" },
                            comparisonType: { type: "string" },
                            comparisonValue: { type: "string" },
                            comparisonColumn: { type: "string" }
                        }
                    }
                }
            },
            scrollable: true,
            sortable: false,
            filterable: false,
            columns: [
                { field: "whereClauseType", title: "Where Clause Type", width: "120px" },
                { field: "dataColumn", title: "Data Column", width: "130px" },
                { field: "dataType", title: "Data Type", width: "120px" },
                { field: "operation", title: "Operation", width: "120px" },
                { field: "comparisonType", title: "Comparison Type", width: "130px" },
                { field: "comparisonValue", title: "Comparison Value", width: "130px" },
                { field: "comparisonColumn", title: "Comparison Column", width: "130px" },
                { title: "Delete", width: "85px",
                    command: {
                        text: "Delete",
                        click: deleteRowIntermediate
                    }
                }
            ]
        });

        //Delete a column from the table
        function deleteRowIntermediate(e){
            e.preventDefault();

            var dataItem = this.dataItem($(e.currentTarget).closest("tr"));

            //Remove from the grid
            var grid = $("#fileFormat_filterData_intermediateGrid").data('kendoGrid');
            grid.dataSource.remove(dataItem);
        }

        /** Final Rules Grid **/
        $("#fileFormat_filterData_finalGrid").kendoGrid({
            height: 120,
            dataSource: {
                data: odinLite_fileFormat.filterRules,
                schema: {
                    model: {
                        fields: {
                            whereClause: { type: "string" }
                        }
                    }
                }
            },
            scrollable: true,
            sortable: false,
            filterable: false,
            columns: [
                { field: "whereClause", title: "Where Clause"},
                { title: "Delete", width: "85px",
                    command: {
                        text: "Delete",
                        click: deleteRowFinal
                    }
                }
            ]
        });

        //Delete a column from the table
        function deleteRowFinal(e){
            e.preventDefault();

            var dataItem = this.dataItem($(e.currentTarget).closest("tr"));

            //Remove from the grid
            var grid = $("#fileFormat_filterData_finalGrid").data('kendoGrid');
            grid.dataSource.remove(dataItem);

            //Remove from the Filter Rules array
            var idx = -1;
            for(var i=0;i<odinLite_fileFormat.filterRules.length;i++){
                var col = odinLite_fileFormat.filterRules[i];

                if(col.whereClause === dataItem.whereClause){
                    idx = i;
                    break;
                }
            }
            if(idx!==-1){
                odinLite_fileFormat.filterRules.splice(i,1);
            }
        }



        /** Button events **/
        //Intermediate add button
        $('.fileFormat_addFilterIntermediateButton').click(function(){
            var comparisonObj = {};
            comparisonObj.whereClauseType = $('#fileFormat_filterData_whereClauseType').data('kendoDropDownList').value();
            comparisonObj.dataColumn = $('#fileFormat_filterData_dataColumn').data('kendoDropDownList').value();
            comparisonObj.dataType = $('#fileFormat_filterData_dataType').data('kendoDropDownList').value();
            comparisonObj.operation = $('#fileFormat_filterData_operation').data('kendoDropDownList').value();
            if(via.undef(comparisonObj.operation,true)){
                via.kendoAlert("Add Filter Error","Select a value for operation.");
                return;
            }
            comparisonObj.comparisonType = $('#fileFormat_filterData_comparisonType').data('kendoDropDownList').value();
            if(comparisonObj.comparisonType === "Column"){
                comparisonObj.comparisonColumn = $('#fileFormat_filterData_comparisonColumn').data('kendoDropDownList').value();
                if(comparisonObj.comparisonColumn === comparisonObj.dataColumn){
                    via.kendoAlert("Add Filter Error","Data column and comparison column cannot be the same.");
                    return;
                }
            }else{
                comparisonObj.comparisonValue = getComparisonValueInputBoxValue();
                if(via.undef(comparisonObj.comparisonValue,true) &&
                    (comparisonObj.operation!=="Is Missing" && comparisonObj.operation!=="Not Missing")){
                    via.kendoAlert("Add Filter Error","Select a value for comparison.");
                    return;
                }
            }

            $("#fileFormat_filterData_intermediateGrid").data('kendoGrid').dataSource.add(comparisonObj);
        });

        //Final add button
        $('.fileFormat_addFilterFinalButton').click(function(){
            var data = $("#fileFormat_filterData_intermediateGrid").data('kendoGrid').dataSource.data();
            //check for blanks
            if(via.undef(data) || data.length === 0){
                return;
            }
            //Populate the rule string in the right format
            var ruleString = "";
            for(var i=0;i<data.length;i++){
                var whereClause = data[i];

                ruleString += "[";//Open Rule

                /* Collect Variables */
                ruleString += whereClause.whereClauseType + ";";
                ruleString += whereClause.dataColumn + ";";
                ruleString += whereClause.dataType + ";";
                ruleString += whereClause.operation + ";";
                ruleString += whereClause.comparisonType + ";";
                ruleString += (via.undef(whereClause.comparisonValue,true))?";":whereClause.comparisonValue  + ";";
                ruleString += (via.undef(whereClause.comparisonColumn,true))?"":whereClause.comparisonColumn;

                ruleString += "]";//Close Rule
            }

            //Clear the intermediate grid
            $("#fileFormat_filterData_intermediateGrid").data('kendoGrid').dataSource.data([]);

            //Add to final grid and the filter rule array
            $("#fileFormat_filterData_finalGrid").data('kendoGrid').dataSource.add({whereClause:ruleString});
        });
    },

    /**
     * advancedSettingsWindow_validateData
     * This handles the validate data tab
     */
    advancedSettingsWindow_validateData: function(){
        /** Where Clause Type **/
        $('#fileFormat_validateData_whereClauseType').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: [{text:'OR',value:'OR'},{text:'AND',value:'AND'}],
            value: odinLite_fileFormat.dataManagementPlugin,
            change: function(e){}
        });

        /** Data Column **/
        $('#fileFormat_validateData_dataColumn').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "text",
            dataSource: odinLite_fileFormat.getColumnListWithAdvancedColumns(),
            index: 0,
            change: function(e){
                $('#fileFormat_validateData_dataType').data('kendoDropDownList').value(null);
                enableComparisonValueInputBox(false);
            }
        });

        /** Data Type **/
        var dataTypeList = [];
        for(var i=0;i<odinLite_modelCache.currentEntity.compareDataTypes.length;i++){
            var col = odinLite_modelCache.currentEntity.compareDataTypes[i];
            dataTypeList.push({ text: col, value: col });
        }
        $('#fileFormat_validateData_dataType').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: dataTypeList,
            index: 0,
            change: function(e){
                updateDataTypeOperations();
                addComparisonValueInputBox();
            }
        });

        /** Comparison Operation **/
        $('#fileFormat_validateData_operation').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: [],
            change: function(e){
                var comparisonTypeDD = $('#fileFormat_validateData_comparisonType').data('kendoDropDownList');
                var comparisonColumnDD = $('#fileFormat_validateData_comparisonColumn').data('kendoDropDownList');

                //Enable the boxes
                comparisonTypeDD.enable(true);
                comparisonColumnDD.enable(true);
                enableComparisonValueInputBox(true);

                var val = e.sender.value();
                if(val === 'Is Missing' || val==='Not Missing'){
                    comparisonTypeDD.value('Value');
                    comparisonTypeDD.enable(false);

                    comparisonColumnDD.value(null);
                    comparisonColumnDD.enable(false);

                    getComparisonValueInputBoxValue(null);
                    enableComparisonValueInputBox(false);
                }else if(val === 'Contains' || val==='Not Contains' || val==='Between' || val==='Not Between'){
                    comparisonTypeDD.value('Value');
                    comparisonTypeDD.enable(false);

                    comparisonColumnDD.value(null);
                    comparisonColumnDD.enable(false);

                    getComparisonValueInputBoxValue(null);
                }else{
                    comparisonColumnDD.value(null);
                    getComparisonValueInputBoxValue(null);
                }
            }
        });
        //Function to update the data type operations.
        function updateDataTypeOperations(){
            //Reset the values
            var ddList = $('#fileFormat_validateData_operation').data('kendoDropDownList');
            ddList.dataSource.data([]);

            //get the list for the currently selected data type.
            var value = $('#fileFormat_validateData_dataType').data('kendoDropDownList').value();
            var list = odinLite_modelCache.currentEntity.compareOperations[value];
            if(via.undef(list,true)){return;}
            var operationList = [];
            for(var i=0;i<list.length;i++){
                var col = list[i];
                operationList.push({ text: col, value: col });
            }
            ddList.dataSource.data(operationList);
        }
        updateDataTypeOperations();

        /** Comparison Type **/
        $('#fileFormat_validateData_comparisonType').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: [{text:'Value',value:'Value'},{text:'Column',value:'Column'}],
            change: function(e){
                updateComparisonType();
            }
        });
        function updateComparisonType(){
            var val = $('#fileFormat_validateData_comparisonType').data('kendoDropDownList').value();
            if(val === "Column"){
                enableComparisonValueInputBox(false);
                getComparisonValueInputBoxValue(null);
                $('#fileFormat_validateData_comparisonColumn').data('kendoDropDownList').enable(true);
            }else{
                enableComparisonValueInputBox(true);
                $('#fileFormat_validateData_comparisonColumn').data('kendoDropDownList').enable(false);
            }
        }
        enableComparisonValueInputBox(false);

        /** Comparison Value **/
        addComparisonValueInputBox();
        //addInputBox - adds an input box based on the type.
        function addComparisonValueInputBox(){
            $(".fileFormat_validateData_comparisonValue").empty();
            $(".fileFormat_validateData_comparisonValue").append('<input style="width:200px;" id="fileFormat_validateData_comparisonValue"/>');

            var type = $("#fileFormat_validateData_dataType").data("kendoDropDownList").value();
            switch(type){
                case "Number":
                    $('#fileFormat_validateData_comparisonValue').addClass("k-textbox");
                    $('#fileFormat_validateData_comparisonValue').keyup(function () {
                        this.value = this.value.replace(/[^0-9\.-]/g,'');
                    });
                    break;
                case "Date":
                    $("#fileFormat_validateData_comparisonValue").kendoDatePicker();
                    break;
                default://Text
                    $('#fileFormat_validateData_comparisonValue').addClass("k-textbox");
            }
        }
        function enableComparisonValueInputBox(enable){
            var type = $("#fileFormat_validateData_dataType").data("kendoDropDownList").value();
            switch(type){
                case "Number":
                    //$('#fileFormat_validateData_comparisonValue').data('kendoNumericTextBox').enable(enable);
                    $('#fileFormat_validateData_comparisonValue').prop("disabled",!enable);
                    break;
                case "Date":
                    $('#fileFormat_validateData_comparisonValue').data('kendoDatePicker').enable(enable);
                    break;
                default://Text
                    $('#fileFormat_validateData_comparisonValue').prop("disabled",!enable);
            }
        }
        //getInputBoxValue - can get or set the value of the input box
        function getComparisonValueInputBoxValue(setValue){
            var type = $("#fileFormat_validateData_dataType").data("kendoDropDownList").value();
            switch(type){
                /*
                 case "Number":
                 value = $('#fileFormat_validateData_comparisonValue').data("kendoNumericTextBox").value();
                 if(setValue!==undefined){
                 $('#fileFormat_validateData_comparisonValue').data("kendoNumericTextBox").value(setValue);
                 }
                 break;
                 */
                case "Date":
                    var date = $("#fileFormat_validateData_comparisonValue").data("kendoDatePicker").value();
                    if(setValue!==undefined){
                        $('#fileFormat_validateData_comparisonValue').data("kendoDatePicker").value(setValue);
                    }
                    if(date===null){return null;}
                    value = (date.getFullYear() +
                    ('0' + (date.getMonth() + 1)).slice(-2) +
                    ('0' + (date.getDate())).slice(-2));
                    break;
                case "Number":
                default://Text
                    value = $('#fileFormat_validateData_comparisonValue').val();
                    if(setValue!==undefined){
                        $('#fileFormat_validateData_comparisonValue').val(setValue);
                    }
            }

            return value;
        }


        /** Comparison Column **/
        $('#fileFormat_validateData_comparisonColumn').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "text",
            dataSource: odinLite_fileFormat.getColumnListWithAdvancedColumns(),
            value: null,
            change: function(e){}
        });

        /** Validation Operation **/
        var validationOperationList = [];
        for(var i=0;i<odinLite_modelCache.currentEntity.dataValidationOperations.length;i++){
            var col = odinLite_modelCache.currentEntity.dataValidationOperations[i];
            validationOperationList.push({ text: col, value: col });
        }
        $('#fileFormat_validateData_validationOperation').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: validationOperationList,
            index: 0,
            change: function(e){
                updateValidationOperation();
            }
        });
        function updateValidationOperation(){
            var val = $('#fileFormat_validateData_validationOperation').data('kendoDropDownList').value();
            if(val === "Replace Value" || val ===  "Multiply Factor"){
                getValidationValueInputBoxValue(null);
                enableValidationValueInputBox(true);
                $('#fileFormat_validateData_validationValueFetchColumn').data('kendoDropDownList').enable(false);
            }else if(val === "Fetch Value"){
                getValidationValueInputBoxValue(null);
                enableValidationValueInputBox(false);
                $('#fileFormat_validateData_validationValueFetchColumn').data('kendoDropDownList').enable(true);
            }else{
                enableComparisonValueInputBox(true);
                $('#fileFormat_validateData_validationValueFetchColumn').data('kendoDropDownList').enable(true);
            }
        }

        /** Validation Column **/
        $('#fileFormat_validateData_validationColumn').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "text",
            dataSource: odinLite_fileFormat.getColumnListWithAdvancedColumns(),
            index: 0,
            change: function(e){
                addValidationValueInputBox();
            }
        });

        /** Validation Value **/
        //fileFormat_validateData_validationValue
        addValidationValueInputBox();
        //addInputBox - adds an input box based on the type.
        function addValidationValueInputBox(){
            $(".fileFormat_validateData_validationValue").empty();
            $(".fileFormat_validateData_validationValue").append('<input style="width:200px;" id="fileFormat_validateData_validationValue"/>');
            var colSelected = $("#fileFormat_validateData_validationColumn").data("kendoDropDownList").value();
            var type = getColumnDataType(colSelected);
            switch(type){
                case 1:
                    $('#fileFormat_validateData_validationValue').addClass("k-textbox");
                    $('#fileFormat_validateData_validationValue').keyup(function () {
                        this.value = this.value.replace(/[^0-9\.-]/g,'');
                    });
                    break;
                case 3:
                    $("#fileFormat_validateData_validationValue").kendoDatePicker();
                    break;
                default://Text
                    $('#fileFormat_validateData_validationValue').addClass("k-textbox");
            }
        }
        function enableValidationValueInputBox(enable){
            var colSelected = $("#fileFormat_validateData_validationColumn").data("kendoDropDownList").value();
            var type = getColumnDataType(colSelected);
            switch(type){
                case 1:
                    //$('#fileFormat_validateData_validationValue').data('kendoNumericTextBox').enable(enable);
                    $('#fileFormat_validateData_validationValue').prop("disabled",!enable);
                    break;
                case 3:
                    $('#fileFormat_validateData_validationValue').data('kendoDatePicker').enable(enable);
                    break;
                default://Text
                    $('#fileFormat_validateData_validationValue').prop("disabled",!enable);
            }
        }
        //getColumnDataType - get the data type of the selected column.
        function getColumnDataType(columnName){
            //Check Mapped Columns
            for(var i=0;i<odinLite_fileFormat.mappedColumns.length;i++){
                var col = odinLite_fileFormat.mappedColumns[i];
                if(col.templateColumn === columnName){
                    return col.type;
                }
            }

            //Check Add Columns
            for(var i=0;i<odinLite_fileFormat.staticColumns.length;i++){
                var col = odinLite_fileFormat.staticColumns[i];
                if(col.columnName === columnName){
                    return col.type;
                }
            }

            //Check tableset
            var index = $('#fileFormat_validateData_validationColumn').data('kendoDropDownList').select();
            if(via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded) || via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded.columnDataTypes) || index === -1){
                return 0;
            }
            return odinLite_fileFormat.FILE_DATA.tsEncoded.columnDataTypes[index];
        }
        //getInputBoxValue - can get or set the value of the input box
        function getValidationValueInputBoxValue(setValue){
            var colSelected = $("#fileFormat_validateData_validationColumn").data("kendoDropDownList").value();
            var type = getColumnDataType(colSelected);
            switch(type){
                /*
                 case "Number":
                 value = $('#fileFormat_validateData_validationValue').data("kendoNumericTextBox").value();
                 if(setValue!==undefined){
                 $('#fileFormat_validateData_validationValue').data("kendoNumericTextBox").value(setValue);
                 }
                 break;
                 */
                case 3:
                    var date = $("#fileFormat_validateData_validationValue").data("kendoDatePicker").value();
                    if(setValue!==undefined){
                        $('#fileFormat_validateData_validationValue').data("kendoDatePicker").value(setValue);
                    }
                    if(date===null){return null;}
                    value = (date.getFullYear() +
                    ('0' + (date.getMonth() + 1)).slice(-2) +
                    ('0' + (date.getDate())).slice(-2));
                    break;
                case 1:
                default://Text
                    value = $('#fileFormat_validateData_validationValue').val();
                    if(setValue!==undefined){
                        $('#fileFormat_validateData_validationValue').val(setValue);
                    }
            }

            return value;
        }
        /** Validation Fetch Column **/
        //var validationHeaders = odinLite_modelMapping.getColumnListFromTableSet();
        //validationHeaders.splice(0,1);
        $('#fileFormat_validateData_validationValueFetchColumn').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "text",
            dataSource: odinLite_fileFormat.getColumnListWithAdvancedColumns(),
            index: 0,
            change: function(e){}
        });
        updateValidationOperation();//Call this to set the intital enabled disabled

        /** Trigger events **/
        $('#fileFormat_validateData_comparisonType').data('kendoDropDownList').trigger('change');
        updateComparisonType();

        /** Intermediate Rules Grid **/
        $("#fileFormat_validateData_intermediateGrid").kendoGrid({
            height: 120,
            dataSource: {
                data: [],
                schema: {
                    model: {
                        fields: {
                            whereClauseType: { type: "string" },
                            dataColumn: { type: "string" },
                            dataType: { type: "string" },
                            operation: { type: "string" },
                            comparisonType: { type: "string" },
                            comparisonValue: { type: "string" },
                            comparisonColumn: { type: "string" }
                        }
                    }
                }
            },
            scrollable: true,
            sortable: false,
            filterable: false,
            columns: [
                { field: "whereClauseType", title: "Where Clause Type", width: "120px" },
                { field: "dataColumn", title: "Data Column", width: "130px" },
                { field: "dataType", title: "Data Type", width: "120px" },
                { field: "operation", title: "Operation", width: "120px" },
                { field: "comparisonType", title: "Comparison Type", width: "130px" },
                { field: "comparisonValue", title: "Comparison Value", width: "130px" },
                { field: "comparisonColumn", title: "Comparison Column", width: "130px" },
                { title: "Delete", width: "85px",
                    command: {
                        text: "Delete",
                        click: deleteRowIntermediate
                    }
                }
            ]
        });

        //Delete a column from the table
        function deleteRowIntermediate(e){
            e.preventDefault();

            var dataItem = this.dataItem($(e.currentTarget).closest("tr"));

            //Remove from the grid
            var grid = $("#fileFormat_validateData_intermediateGrid").data('kendoGrid');
            grid.dataSource.remove(dataItem);
        }

        /** Final Rules Grid **/
        $("#fileFormat_validateData_finalGrid").kendoGrid({
            height: 120,
            dataSource: {
                data: odinLite_fileFormat.validationRules,
                schema: {
                    model: {
                        fields: {
                            whereClause: { type: "string" },
                            validationOperation: { type: "string" },
                            validationColumn: { type: "string" },
                            validationValue: { type: "string" },
                            validationFetchColumn: { type: "string" }
                        }
                    }
                }
            },
            scrollable: true,
            sortable: false,
            filterable: false,
            columns: [
                { field: "whereClause", title: "Where Clause"},
                { field: "validationOperation", title: "Data Validation Operation"},
                { field: "validationColumn", title: "Data Validation Column"},
                { field: "validationValue", title: "Validation Value"},
                { field: "validationFetchColumn", title: "Validation Value Fetch Column "},
                { title: "Delete", width: "85px",
                    command: {
                        text: "Delete",
                        click: deleteRowFinal
                    }
                }
            ]
        });

        //Delete a column from the final table
        function deleteRowFinal(e){
            e.preventDefault();

            var dataItem = this.dataItem($(e.currentTarget).closest("tr"));

            //Remove from the grid
            var grid = $("#fileFormat_validateData_finalGrid").data('kendoGrid');
            grid.dataSource.remove(dataItem);

            //Remove from the Filter Rules array
            var idx = -1;
            for(var i=0;i<odinLite_fileFormat.validationRules.length;i++){
                var col = odinLite_fileFormat.validationRules[i];
                if(col.whereClause === dataItem.whereClause){
                    idx = i;
                    break;
                }
            }
            if(idx!==-1){
                odinLite_fileFormat.validationRules.splice(i,1);
            }
        }

        /** Button events **/
            //Intermediate add button
        $('.fileFormat_addValidateIntermediateButton').click(function(){
            var comparisonObj = {};
            comparisonObj.whereClauseType = $('#fileFormat_validateData_whereClauseType').data('kendoDropDownList').value();
            comparisonObj.dataColumn = $('#fileFormat_validateData_dataColumn').data('kendoDropDownList').value();
            comparisonObj.dataType = $('#fileFormat_validateData_dataType').data('kendoDropDownList').value();
            comparisonObj.operation = $('#fileFormat_validateData_operation').data('kendoDropDownList').value();
            if(via.undef(comparisonObj.operation,true)){
                via.kendoAlert("Add Validation Error","Select a value for operation.");
                return;
            }
            comparisonObj.comparisonType = $('#fileFormat_validateData_comparisonType').data('kendoDropDownList').value();
            if(comparisonObj.comparisonType === "Column"){
                comparisonObj.comparisonColumn = $('#fileFormat_validateData_comparisonColumn').data('kendoDropDownList').value();
                if(comparisonObj.comparisonColumn === comparisonObj.dataColumn){
                    via.kendoAlert("Add Filter Error","Data column and comparison column cannot be the same.");
                    return;
                }
            }else{
                comparisonObj.comparisonValue = getComparisonValueInputBoxValue();
                if(via.undef(comparisonObj.comparisonValue,true) &&
                    (comparisonObj.operation!=="Is Missing" && comparisonObj.operation!=="Not Missing")){
                    via.kendoAlert("Add Validation Error","Select a value for comparison.");
                    return;
                }
            }
            $("#fileFormat_validateData_intermediateGrid").data('kendoGrid').dataSource.add(comparisonObj);
        });

        //Final add button
        $('.fileFormat_addValidationRuleFinalButton').click(function(){
            var data = $("#fileFormat_validateData_intermediateGrid").data('kendoGrid').dataSource.data();
            //check for blanks
            if(via.undef(data) || data.length === 0){
                return;
            }
            //Populate the rule string in the right format
            var ruleString = "";
            for(var i=0;i<data.length;i++){
                var whereClause = data[i];

                ruleString += "[";//Open Rule

                /* Collect Variables */
                ruleString += whereClause.whereClauseType + ";";
                ruleString += whereClause.dataColumn + ";";
                ruleString += whereClause.dataType + ";";
                ruleString += whereClause.operation + ";";
                ruleString += whereClause.comparisonType + ";";
                ruleString += (via.undef(whereClause.comparisonValue,true))?";":whereClause.comparisonValue  + ";";
                ruleString += (via.undef(whereClause.comparisonColumn,true))?"":whereClause.comparisonColumn;

                ruleString += "]";//Close Rule
            }

            var colObj = {};
            colObj.whereClause = ruleString;
            colObj.validationOperation = $("#fileFormat_validateData_validationOperation").data('kendoDropDownList').value();
            colObj.validationColumn = $("#fileFormat_validateData_validationColumn").data('kendoDropDownList').value();
            colObj.validationValue = getValidationValueInputBoxValue();
            colObj.validationFetchColumn = $("#fileFormat_validateData_validationValueFetchColumn").data('kendoDropDownList').value();

            //Check the values and columns for errors
            if(colObj.validationOperation === "Fetch Value"){
                colObj.validationValue = "";
                if(colObj.validationColumn === colObj.validationFetchColumn){
                    via.kendoAlert("Add Validation Error","Fetch Column cannot match Validation Column.");
                    return;
                }
            }else{
                colObj.validationFetchColumn = "";
                if(via.undef(colObj.validationValue,true)){
                    via.kendoAlert("Add Validation Error","Select a validation value.");
                    return;
                }
            }

            //Add to final grid and the filter rule array
            $("#fileFormat_validateData_finalGrid").data('kendoGrid').dataSource.add(colObj);

            //Clear the intermediate grid
            $("#fileFormat_validateData_intermediateGrid").data('kendoGrid').dataSource.data([]);

            //Clear the form
            getValidationValueInputBoxValue(null);
        });
    },

    /**
     * getColumnListWithAdvancedColumns
     * This will get the column list with the mappings
     */
    getColumnListWithAdvancedColumns: function(){
        if(via.undef(odinLite_fileFormat.FILE_DATA) || via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded) ||
            via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded.columnHeaders)){
            via.kendoAlert("Model Mapping Error","No data in uploaded file.");
            return null;
        }
        var columnHeaders = odinLite_fileFormat.FILE_DATA.tsEncoded.columnHeaders;
        var hasHeader = odinLite_fileFormat.FILE_DATA.hasColumnHeader;
        var comboArr = [];
        for(var i=0;i<columnHeaders.length;i++){
            var comboObj = null;
            //if(hasHeader){
                comboObj = {
                    text: columnHeaders[i],
                    value: columnHeaders[i]
                };
            /*}else{
                comboObj = {
                    text: via.toExcelColumnName(i+1),
                    value: i
                };
            }*/
            comboArr.push(comboObj);
        }

        /*
        //Add Column Columns
        if(!via.undef(odinLite_fileFormat.staticColumns,true)){
            for (var i in odinLite_fileFormat.staticColumns) {
                var addColumn  = odinLite_fileFormat.staticColumns[i];
                var comboObj = {};
                comboObj.text = addColumn.columnName;
                comboObj.value = addColumn.columnName;
                comboArr.push(comboObj);
            }
        }

        //Mapping Column Columns
        if(!via.undef(odinLite_fileFormat.mappedColumns,true)) {
            for (var i in odinLite_fileFormat.mappedColumns) {
                var mapColumn  = odinLite_fileFormat.mappedColumns[i];
                var idx = getColumnIndex(mapColumn.dataColumn);
                if(idx === -1){
                    //via.kendoAlert("Get Column Error","Cannot find ("+mapColumn.dataColumn+") in dataset.");
                    //return;
                    continue;
                }
                comboArr[idx].text = mapColumn.templateColumn;
                comboArr[idx].value = mapColumn.templateColumn;
            }
        }
        */
        return comboArr;

        /** Functions **/
        function getColumnIndex(columnName){
            var headers = odinLite_modelMapping.getColumnListFromTableSet();
            headers.splice(0,1);
            for(var i=0;i<headers.length;i++){
                if(headers[i].text === columnName){
                    return i;
                }
            }
            return -1;
        }
    },

    /**
     * advancedSettingsWindow
     * This will a user to add a static column
     */
    advancedSettingsWindow: function(tabName){
        if(via.undef(odinLite_fileFormat.FILE_DATA) || via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded) ||
            via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded.columnHeaders)){
           return;
        }

        //Get the window template
        $.get("./html/advancedSettingsWindow.html", function (entityWindowTemplate) {
            $('#odinLite_advancedSettingsWindow').remove();
            $('body').append(entityWindowTemplate);
            //Make the window.
            var addColumnWindow = $('#odinLite_advancedSettingsWindow').kendoWindow({
                title: "Advanced ETL Settings",
                draggable: false,
                resizable: false,
                width: "1050px",
                height: "550px",
                modal: true,
                close: true,
                animation: false,
                actions: [
                    "Minimize",
                    "Maximize",
                    "Close"
                ],
                close: function () {
                    addColumnWindow = null;
                    $('#odinLite_advancedSettingsWindow').remove();
                }
            }).data("kendoWindow");

            addColumnWindow.center();

            var isSqlLoaded = false;
            var tab = $("#advancedSettings_tabstrip").kendoTabStrip({
                animation: {
                    open: {
                        effects: "fadeIn"
                    }
                },
                select: function(e){
                    var selectedTab = $(e.item).find("> .k-link").text();
                    if(selectedTab === 'Data Merge Options'){
                        $('.fileFormat_runToAdvancedSettingsButton').hide();
                    }else{
                        $('.fileFormat_runToAdvancedSettingsButton').show();
                    }
                    //SQL Query
                    if(selectedTab === 'SQL Engine'){

                        //Get the file preview from the server based on the settings.
                        $.post(odin.SERVLET_PATH,
                            {
                                action: 'odinLite.uploadFiles.getH2SqlDefaultQuery',
                                columnHeaders: JSON.stringify(odinLite_fileFormat.FILE_DATA.tsEncoded.columnHeaders)
                            },
                            function(data, status){
                                if(!via.undef(data,true) && data.success === false) {
                                    via.debug("Failure getting default query:", data.message);
                                    via.kendoAlert("Failure getting default query", data.message);
                                    odinLite_fileFormat.defaultSQLQuery = null;
                                    odinLite_fileFormat.sqlQuery = null;
                                }else{
                                    //Populate the default query
                                    if(!via.undef(data.defaultQuery,true) && isSqlLoaded === false) {
                                        $('#fileFormat_dbTransfer_sqlArea').val(data.defaultQuery);
                                        odinLite_fileFormat.defaultSQLQuery = data.defaultQuery;

                                        if(!via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded)) {
                                            odinTable.createTable("fileFormat_sqlDataTable", odinLite_fileFormat.FILE_DATA.tsEncoded, "#fileFormat_dbResultGrid");
                                            $('#fileFormat_sqlDataTable').data('kendoGrid').setOptions({
                                                groupable: false,
                                                height: '99%'
                                            });
                                            $('#odinLite_dbResultGrid').css("padding", "0");
                                        }
                                    }
                                    //Update the column list
                                    if(!via.undef(data.columnHeaders)) {
                                        var listBox = $("#fileFormat_sqlColumnNames").data('kendoListBox');
                                        var colArr = [];
                                        for (var i = 0; i < data.columnHeaders.length; i++) {
                                            colArr.push({text: data.columnHeaders[i]});
                                        }
                                        listBox.setDataSource(colArr);

                                        $(".fileFormat_sqlColumnNames li").bind('dblclick', function (e) {
                                            var tree = $("#fileFormat_sqlColumnNames").data('kendoListBox');
                                            var selected = tree.select();
                                            var dataItem = tree.dataItem(selected);
                                            var cm = $('#fileFormat_dbTransfer_sqlArea').data('CodeMirrorInstance');
                                            var doc = cm.getDoc();
                                            doc.replaceRange(" "+dataItem.text, {line: Infinity}); // adds a new line
                                        });
                                    }

                                    //Style the code editor
                                    if(via.undef($('#fileFormat_dbTransfer_sqlArea').data('CodeMirrorInstance'))){
                                        kendo.ui.progress($('#odinLite_advancedSettingsWindow'), true);//Wait Message
                                        $("#fileFormat_dbTransfer_sqlArea").hide();
                                        setTimeout(function () {
                                            $("#fileFormat_dbTransfer_sqlArea").show();
                                            var editor = CodeMirror.fromTextArea(document.getElementById("fileFormat_dbTransfer_sqlArea"), {
                                                mode: "text/x-sql",
                                                indentWithTabs: true,
                                                smartIndent: true,
                                                lineWrapping: true,
                                                lineNumbers: true,
                                                matchBrackets: true,
                                                autofocus: true,
                                                extraKeys: {"Ctrl-Space": "autocomplete"},
                                                value: (via.undef(odinLite_fileFormat.sqlQuery, true)) ? "" : odinLite_fileFormat.sqlQuery
                                            });
                                            editor.setSize("100%", 200);
                                            kendo.ui.progress($('#odinLite_advancedSettingsWindow'), false);//Wait Message
                                            // store it
                                            $('#fileFormat_dbTransfer_sqlArea').data('CodeMirrorInstance', editor);
                                        }, 500);
                                    }

                                    isSqlLoaded = true;
                                }
                            },
                            'json');
                    }
                },
                value: tabName
            });
/*
            if(!via.undef(selectedTab,true)) {
                console.log('selecting ' + selectedTab);
                tab.activateTab(selectedTab);
            }
*/
            //Button Events
            $('.fileFormat_applyAdvancedSettingsButton').click(function(){
                /** Set the Data **/
                odinLite_fileFormat.mappedColumns = $("#fileFormat_mapColumn_grid").data('kendoGrid').dataSource.data().toJSON();
                odinLite_fileFormat.staticColumns = $("#fileFormat_addColumn_grid").data('kendoGrid').dataSource.data().toJSON();
                odinLite_fileFormat.filterRules = $("#fileFormat_filterData_finalGrid").data('kendoGrid').dataSource.data().toJSON();
                odinLite_fileFormat.validationRules = $("#fileFormat_validateData_finalGrid").data('kendoGrid').dataSource.data().toJSON();
                odinLite_fileFormat.dataManagementPlugin = $('#fileFormat_dataManagementPlugin').data('kendoDropDownList').value();
                odinLite_fileFormat.dataMergeOptions.timeSeries = $('#modelMapping_timeSeriesMerge').prop("checked");
                odinLite_fileFormat.dataMergeOptions.portIndex = $('#modelMapping_timeSeriesToPortIndexMerge').prop("checked");
                odinLite_fileFormat.dataMergeOptions.attributeData = $('#modelMapping_attributeData').prop("checked");
                //SQL editor
                var codeEditor = $('#fileFormat_dbTransfer_sqlArea').data('CodeMirrorInstance');
                if(!via.undef(codeEditor)) {
                    odinLite_fileFormat.sqlQuery = codeEditor.getValue();
                }

                //Close the window
                addColumnWindow.close();

                //Update the preview based on the settings
                odinLite_fileFormat.updateFilePreview();
            });

            //Run to here data.
            $('.fileFormat_runToAdvancedSettingsButton').click(function(){
                var tabstrip = $("#advancedSettings_tabstrip").data('kendoTabStrip');
                var selectedTab = tabstrip.select();
                var tabName = $(selectedTab).children(".k-link").text();

                var settingTypes = [];
                switch(tabName){
                    case 'Data Management Plug-in':
                        settingTypes = ['dataManagementPlugin'];
                        break;
                    case 'Map Column':
                        settingTypes = ['dataManagementPlugin','mappedColumns'];
                        break;
                    case 'Add Column':
                        settingTypes = ['dataManagementPlugin','mappedColumns','staticColumns'];
                        break;
                    case 'Filter Data':
                        settingTypes = ['dataManagementPlugin','mappedColumns','staticColumns','filterRules'];
                        break;
                    case 'Validate Data':
                        settingTypes = ['dataManagementPlugin','mappedColumns','staticColumns','filterRules','validationRules'];
                        break;
                    case 'SQL Engine':
                        settingTypes = ['dataManagementPlugin','mappedColumns','staticColumns','filterRules','validationRules','sqlQuery'];
                        break;
                };

                //Store the temp values
                var tmpMappedColumns = $("#fileFormat_mapColumn_grid").data('kendoGrid').dataSource.data().toJSON();
                var tmpStaticColumns = $("#fileFormat_addColumn_grid").data('kendoGrid').dataSource.data().toJSON();
                var tmpFilterRules = $("#fileFormat_filterData_finalGrid").data('kendoGrid').dataSource.data().toJSON();
                var tmpValidationRules = $("#fileFormat_validateData_finalGrid").data('kendoGrid').dataSource.data().toJSON();
                var tmpDataManagementPlugin = $('#fileFormat_dataManagementPlugin').data('kendoDropDownList').value();
                var tmpDataMergeOptions = {};
                tmpDataMergeOptions.timeSeries = $('#modelMapping_timeSeriesMerge').prop("checked");
                tmpDataMergeOptions.portIndex = $('#modelMapping_timeSeriesToPortIndexMerge').prop("checked");
                tmpDataMergeOptions.attributeData = $('#modelMapping_attributeData').prop("checked");
                //SQL editor
                var tmpSqlQuery = null;
                var codeEditor = $('#fileFormat_dbTransfer_sqlArea').data('CodeMirrorInstance');
                if(!via.undef(codeEditor)) {
                    tmpSqlQuery = codeEditor.getValue();
                }

                //Reset the Advanced Setting
                odinLite_fileFormat.mappedColumns = [];
                odinLite_fileFormat.staticColumns = [];
                odinLite_fileFormat.filterRules = [];
                odinLite_fileFormat.validationRules = [];
                odinLite_fileFormat.dataManagementPlugin = null;
                odinLite_fileFormat.dataMergeOptions = {};
                odinLite_fileFormat.sqlQuery = null;

                //Build the Advanced Settings
                if($.inArray('dataManagementPlugin',settingTypes)!== -1){
                    odinLite_fileFormat.dataManagementPlugin = $('#fileFormat_dataManagementPlugin').data('kendoDropDownList').value();
                }
                if($.inArray('mappedColumns',settingTypes)!== -1){
                    odinLite_fileFormat.mappedColumns = $("#fileFormat_mapColumn_grid").data('kendoGrid').dataSource.data().toJSON();
                }
                if($.inArray('staticColumns',settingTypes)!== -1){
                    odinLite_fileFormat.staticColumns = $("#fileFormat_addColumn_grid").data('kendoGrid').dataSource.data().toJSON();
                }
                if($.inArray('filterRules',settingTypes)!== -1){
                    odinLite_fileFormat.filterRules = $("#fileFormat_filterData_finalGrid").data('kendoGrid').dataSource.data().toJSON();
                }
                if($.inArray('validationRules',settingTypes)!== -1){
                    odinLite_fileFormat.validationRules = $("#fileFormat_validateData_finalGrid").data('kendoGrid').dataSource.data().toJSON();
                }
                if($.inArray('sqlQuery',settingTypes)!== -1){
                    odinLite_fileFormat.sqlQuery = tmpSqlQuery + "";
                }
                odinLite_fileFormat.dataMergeOptions.timeSeries = $('#modelMapping_timeSeriesMerge').prop("checked");
                odinLite_fileFormat.dataMergeOptions.portIndex = $('#modelMapping_timeSeriesToPortIndexMerge').prop("checked");
                odinLite_fileFormat.dataMergeOptions.attributeData = $('#modelMapping_attributeData').prop("checked");


                //Update the preview based on the settings
                odinLite_fileFormat.updateFilePreview(function(){
                    //Close the window
                    addColumnWindow.close();

                    //Launch the window
                    odinLite_fileFormat.advancedSettingsWindow(tabName);
                });

                //Reset the values
                odinLite_fileFormat.mappedColumns = tmpMappedColumns;
                odinLite_fileFormat.staticColumns = tmpStaticColumns;
                odinLite_fileFormat.filterRules = tmpFilterRules;
                odinLite_fileFormat.validationRules = tmpValidationRules;
                odinLite_fileFormat.dataManagementPlugin = tmpDataManagementPlugin;
                odinLite_fileFormat.dataMergeOptions = tmpDataMergeOptions;
                odinLite_fileFormat.sqlQuery = tmpSqlQuery + "";
            });


            /* Add Column */
            odinLite_fileFormat.advancedSettingsWindow_addColumn();

            /* Map Column */
            odinLite_fileFormat.advancedSettingsWindow_mapColumn();

            /* Data Merge Options */
            odinLite_fileFormat.advancedSettingsWindow_dataMergeOptions();

            /* Data Management Plugins */
            odinLite_fileFormat.advancedSettingsWindow_dataManagementPlugins();

            /* Filter Data */
            odinLite_fileFormat.advancedSettingsWindow_filterData();

            /* Validate Data */
            odinLite_fileFormat.advancedSettingsWindow_validateData();

            /* SQL Query */
            isSqlLoaded = odinLite_fileFormat.advancedSettingsWindow_sqlQuery(isSqlLoaded);

            //Shut off the wait
            kendo.ui.progress($("body"), false);//Wait Message
        });//End Template fetch
    },

    /**
     * advancedSettingsWindow_sqlQuery
     * Setup the advanced settings for SQL query
     */
    advancedSettingsWindow_sqlQuery: function(isSqlLoaded){

        //Setup the Column List
        $("#fileFormat_sqlColumnNames").kendoListBox({
            dataTextField: "text",
            dataValueField: "text",
            dataSource: []
        });

        //Button Events
        $('.fileFormat_sqlQuery_refresh').click(function(){
            console.log('here!!!');
            var codeeditor = $('#fileFormat_dbTransfer_sqlArea').data('CodeMirrorInstance');
            codeeditor.setValue(via.undef(odinLite_fileFormat.defaultSQLQuery)?"":odinLite_fileFormat.defaultSQLQuery);
        });

        $('#fileFormat_dbQueryButton').click(function(){
            kendo.ui.progress($('#odinLite_advancedSettingsWindow'), true);//Wait Message
            var tmpSql = odinLite_fileFormat.sqlQuery;
            var codeeditor = $('#fileFormat_dbTransfer_sqlArea').data('CodeMirrorInstance');
            odinLite_fileFormat.sqlQuery = codeeditor.getValue(odinLite_fileFormat.sqlQuery);

            odinLite_fileFormat.updateFilePreview(function(data){
                kendo.ui.progress($('#odinLite_advancedSettingsWindow'), false);//Wait Message

                $('#fileFormat_dbResultGrid').empty();
                if(data.success === false && !via.undef(data.message)) {
                    var dialog = $('.k-dialog').data('kendoDialog');
                    if (!via.undef(dialog)) {
                        dialog.close();
                    }
                    $('#fileFormat_dbResultGrid').html('<div class="well" style="color:red;margin-top:5px;">'+data.message+"</div>");
                }else if(!via.undef(data.tsEncoded)) {
                    odinLite_fileFormat.sqlQuery = tmpSql;
                    odinTable.createTable("fileFormat_sqlDataTable", data.tsEncoded, "#fileFormat_dbResultGrid");
                    $('#fileFormat_sqlDataTable').data('kendoGrid').setOptions({
                        groupable: false,
                        height: '99%'
                    });
                    $('#odinLite_dbResultGrid').css("padding", "0");
                }

                if(!via.undef($('#odinLite_advancedSettingsWindow').data('kendoWindow'))) {
                    $('#odinLite_advancedSettingsWindow').data('kendoWindow').center();
                }
            });
        });

        return isSqlLoaded;
    },

    /**
     * getAdvancedSettingsOptions
     * Returns the advanced settings in the format they need to be for the server.
     */
    getAdvancedSettingsOptions: function() {
        var advancedSettingsOptions = {};
        //Add Column
        advancedSettingsOptions.staticColumns = JSON.stringify(odinLite_fileFormat.staticColumns);
        //Map Column
        advancedSettingsOptions.mappedColumns = JSON.stringify(odinLite_fileFormat.mappedColumns);
        //Data Merge Options
        advancedSettingsOptions.dataMergeTimeSeries = false;
        advancedSettingsOptions.dataMergePortfolioIndexed = false;
        advancedSettingsOptions.attributeData = false;
        if(!via.undef(odinLite_fileFormat.dataMergeOptions,true)){
            advancedSettingsOptions.dataMergeTimeSeries = via.undef(odinLite_fileFormat.dataMergeOptions.timeSeries,true)?false:odinLite_fileFormat.dataMergeOptions.timeSeries;
            advancedSettingsOptions.dataMergePortfolioIndexed = via.undef(odinLite_fileFormat.dataMergeOptions.portIndex,true)?false:odinLite_fileFormat.dataMergeOptions.portIndex;
            advancedSettingsOptions.attributeData = via.undef(odinLite_fileFormat.dataMergeOptions.attributeData,true)?false:odinLite_fileFormat.dataMergeOptions.attributeData;
        }

        //Data Management Plugin
        advancedSettingsOptions.dataManagementPlugin = null;
        if(!via.undef(odinLite_fileFormat.dataManagementPlugin,true)){
            advancedSettingsOptions.dataManagementPlugin = odinLite_fileFormat.dataManagementPlugin;
        }
        //Filter Rules
        advancedSettingsOptions.filterRules = JSON.stringify(odinLite_fileFormat.filterRules);
        //Validation Rules
        advancedSettingsOptions.validationRules = JSON.stringify(odinLite_fileFormat.validationRules);
        //SQL Query
        if(odinLite_fileFormat.sqlQuery !== odinLite_fileFormat.defaultSQLQuery) {
            advancedSettingsOptions.sqlQuery = odinLite_fileFormat.sqlQuery;
        }

        //console.log('advancedSettingsOptions',advancedSettingsOptions);

        return advancedSettingsOptions;
    },


    //getAdvancedSettingsOptionsOLD: function() {
    //    var advancedSettingsOptions = {};
    //
    //    /** Static Columns **/
    //    advancedSettingsOptions.staticColumns = null;
    //    if(!via.undef(odinLite_fileFormat.staticColumns,true)){
    //        //Rows: List of row they added. Save in format:
    //        // Template Column 1; Operation Type 1; Assign Value; Prefix Value 1; Prefix Is RegEx Format 1; Suffix Value 1; Suffix Is RegEx Format 1; Value Date Format 1;Column Operation Type 1;Column List 1|||Template Column 2; Operation Type 2; Assign Value; Prefix Value 2; Prefix Is RegEx Format 2; Suffix Value 2; Suffix Is RegEx Format 2; Value Date Format 2;Column Operation Type 2;Column List 2
    //        var addString = "";
    //        for(var i in odinLite_fileFormat.staticColumns) {
    //            var col = odinLite_fileFormat.staticColumns[i];
    //
    //            //Separate
    //            if(addString.length > 0){
    //                addString+="|||";
    //            }
    //
    //            //Template Column
    //            addString += (via.undef(col.columnName)?"":col.columnName) + ";";
    //
    //            //Operation Type
    //            addString += (via.undef(col.columnType)?"":col.columnType) + ";";
    //
    //            //Data Type
    //            addString += (via.undef(col.dataType)?"":col.dataType) + ";";
    //
    //            //Assign Value
    //            addString += (via.undef(col.value)?"":col.value) + ";";
    //
    //            //Prefix Value
    //            addString += (via.undef(col.prefix)?"":col.prefix) + ";";
    //
    //            //Prefix Is RegEx Format
    //            addString += (via.undef(col.prefixRegex)?"false":col.prefixRegex) + ";";
    //
    //            //Suffix Value
    //            addString += (via.undef(col.suffix)?"":col.suffix) + ";";
    //
    //            //Suffix Is RegEx Format
    //            addString += (via.undef(col.suffixRegex)?"false":col.suffixRegex) + ";";
    //
    //            //Value Date Format
    //            addString += (via.undef(col.dateFormat)?"":col.dateFormat) + ";";
    //
    //            //Column Operation Type
    //            addString += (via.undef(col.operationType)?"":col.operationType) + ";";
    //
    //            //Column List
    //            addString += (via.undef(col.columnList)?"":col.columnList);
    //        }
    //        advancedSettingsOptions.staticColumns = addString;
    //    }
    //
    //
    //
    //    /** Mapped Columns **/
    //    advancedSettingsOptions.mappedColumns = null;
    //    if(!via.undef(odinLite_fileFormat.mappedColumns,true)){
    //        //Data Column 1;Template Column 1;Data Type 1;Date Format 1|||Data Column 2;Template Column 2;Data Type 2;Date Format 2
    //        var mapString = "";
    //        for(var i in odinLite_fileFormat.mappedColumns){
    //            var col = odinLite_fileFormat.mappedColumns[i];
    //            if(mapString.length > 0){
    //                mapString+="|||";
    //            }
    //            //Column and template col
    //            mapString += col.dataColumn +";"+ col.templateColumn;
    //            //Data Type
    //            mapString += ";";
    //            mapString += ((via.undef(col.dataType,true))?"":col.dataType);
    //            //Date Format
    //            mapString += ";";
    //            mapString += ((via.undef(col.dateFormat,true))?"":col.dateFormat);
    //        }
    //        advancedSettingsOptions.mappedColumns = mapString;
    //    }
    //
    //    /** Data Merge Options **/
    //    advancedSettingsOptions.dataMergeTimeSeries = false;
    //    advancedSettingsOptions.dataMergePortfolioIndexed = false;
    //    if(!via.undef(odinLite_fileFormat.dataMergeOptions,true)){
    //        advancedSettingsOptions.dataMergeTimeSeries = via.undef(odinLite_fileFormat.dataMergeOptions.timeSeries,true)?false:odinLite_fileFormat.dataMergeOptions.timeSeries;
    //        advancedSettingsOptions.dataMergePortfolioIndexed = via.undef(odinLite_fileFormat.dataMergeOptions.portIndex,true)?false:odinLite_fileFormat.dataMergeOptions.portIndex;
    //    }
    //
    //    /** Data Management Plugin **/
    //    advancedSettingsOptions.dataManagementPlugin = null;
    //    if(!via.undef(odinLite_fileFormat.dataManagementPlugin,true)){
    //        advancedSettingsOptions.dataManagementPlugin = odinLite_fileFormat.dataManagementPlugin;
    //    }
    //
    //    /** Filter Rules **/
    //    advancedSettingsOptions.filterRules = null;
    //    if(!via.undef(odinLite_fileFormat.filterRules,true)){
    //        //[Where Clause Type 1; Data Column 1;  Date Type 1; Operation 1; Comparison Type 1; Comparison Value 1; Comparison Column 1][Where Clause Type 2; Data Column 2; ; Date Type 2; Operation 2; Comparison Type 2; Comparison Value 2; Comparison Column 2]
    //        var filterString = "";
    //        for(var i in odinLite_fileFormat.filterRules){
    //            //Seperate
    //            if(i>0){
    //                filterString += "|||";
    //            }
    //            filterString += odinLite_fileFormat.filterRules[i].whereClause;
    //        }
    //        advancedSettingsOptions.filterRules = filterString;
    //    }
    //
    //    /** Validation Rules **/
    //    advancedSettingsOptions.validationRules = null;
    //    if(!via.undef(odinLite_fileFormat.validationRules,true)){
    //        var validationString = "";
    //        for(var i in odinLite_fileFormat.validationRules){
    //            //Seperate
    //            if(i>0){
    //                validationString += "|||";
    //            }
    //            //Add the where clause
    //            validationString += odinLite_fileFormat.validationRules[i].whereClause;
    //
    //            //Add the Validation rules.
    //            validationString += ":::";
    //            validationString += odinLite_fileFormat.validationRules[i].validationOperation + ";";
    //            validationString += odinLite_fileFormat.validationRules[i].validationColumn + ";";
    //            validationString += (via.undef(odinLite_fileFormat.validationRules[i].validationValue,true))?";":(odinLite_fileFormat.validationRules[i].validationValue + ";");
    //            validationString += (via.undef(odinLite_fileFormat.validationRules[i].validationFetchColumn,true))?";":(odinLite_fileFormat.validationRules[i].validationFetchColumn);
    //        }
    //        advancedSettingsOptions.validationRules = validationString;
    //    }
    //
    //    console.log("advancedSettingsOptions old",advancedSettingsOptions);
    //    return advancedSettingsOptions;
    //},

    /**
     * saveSettings
     * This will save the file format settings to the server.
     */
    saveSettings: function(){
        var formattingObj = odinLite_fileFormat.getFormattingOptions();

        var saveJson = {
            //Save the file formatting
            delimType:formattingObj.delimType,
            endColumn:JSON.stringify(formattingObj.endColumn),
            endRow:JSON.stringify(formattingObj.endRow),
            hasColumnHeader:JSON.stringify(formattingObj.hasColumnHeader),
            startColumn:JSON.stringify(formattingObj.startColumn),
            startRow:JSON.stringify(formattingObj.startRow),
            textQualifier:JSON.stringify(formattingObj.textQualifier),

            //Save the Advanced Settings
            //staticColumns: JSON.stringify(odinLite_fileFormat.staticColumns),
            //mappedColumns: JSON.stringify(odinLite_fileFormat.mappedColumns),
            //dataMergeOptions: JSON.stringify(odinLite_fileFormat.dataMergeOptions),
            //dataManagementPlugin: odinLite_fileFormat.dataManagementPlugin,
            //filterRules: JSON.stringify(odinLite_fileFormat.filterRules),
            //validationRules: JSON.stringify(odinLite_fileFormat.validationRules)
        };
        $.extend(saveJson,odinLite_fileFormat.getAdvancedSettingsOptions());

        //console.log('saveJson',saveJson);
        //console.log('saveJsonStr',JSON.stringify(saveJson));
        via.saveWindow(odin.ODIN_LITE_APP_ID,odinLite_modelCache.currentEntity.saveId,JSON.stringify(saveJson),function(reportName){
            $('.fileFormat_reportName').html("<b>Loaded: </b>" + reportName);
        },true);
    },

    /**
     * loadSettings
     * This will load launch the load window.
     */
    loadSettingsWindow: function(){
        via.loadWindow(odin.ODIN_LITE_APP_ID,odinLite_modelCache.currentEntity.saveId,function(loadJson){
            //console.log('loadJson',loadJson);
            odinLite_fileFormat.loadSettings(loadJson);
        });
    },

    /**
     * loadSettings
     * This will load the saved file format settings from the passed json and update the preview.
     */
    loadSettings: function(loadJson){
        if(via.undef(loadJson,true)){
            via.kendoAlert("Load Error","Report not found.");
            return;
        }
        //console.log('loadJson',loadJson);

        //Display the name of the report.
        odinLite_fileFormat.loadedReport = null;
        $('.fileFormat_reportName').empty();
        if(!via.undef(loadJson.reportName)){
            odinLite_fileFormat.loadedReport = loadJson.reportName;
            $('.fileFormat_reportName').html("<b>Loaded: </b>" + loadJson.reportName);
        }

        //Load the file formatting
        odinLite_fileFormat.FILE_DATA.endColumn = JSON.parse(loadJson.endColumn);
        odinLite_fileFormat.FILE_DATA.endRow = JSON.parse(loadJson.endRow);
        odinLite_fileFormat.FILE_DATA.hasColumnHeader = JSON.parse(loadJson.hasColumnHeader);
        odinLite_fileFormat.FILE_DATA.isTemplateFile = via.undef(loadJson.isTemplateFile,true)?false:JSON.parse(loadJson.isTemplateFile);
        odinLite_fileFormat.FILE_DATA.startColumn = JSON.parse(loadJson.startColumn);
        odinLite_fileFormat.FILE_DATA.startRow = JSON.parse(loadJson.startRow);
        odinLite_fileFormat.FILE_DATA.textQualifier = JSON.parse(loadJson.textQualifier);
        odinLite_fileFormat.FILE_DATA.delimType = loadJson.delimType;

        //Load the Advanced Settings
        odinLite_fileFormat.staticColumns = JSON.parse(loadJson.staticColumns);
        odinLite_fileFormat.mappedColumns = JSON.parse(loadJson.mappedColumns);
        odinLite_fileFormat.dataMergeOptions = {};
        odinLite_fileFormat.dataMergeOptions.portIndex = via.undef(loadJson.dataMergePortfolioIndexed,true)?false:JSON.parse(loadJson.dataMergePortfolioIndexed);
        odinLite_fileFormat.dataMergeOptions.timeSeries = via.undef(loadJson.dataMergeTimeSeries,true)?false:JSON.parse(loadJson.dataMergeTimeSeries);
        odinLite_fileFormat.dataMergeOptions.attributeData = via.undef(loadJson.attributeData,true)?false:JSON.parse(loadJson.attributeData);
        odinLite_fileFormat.dataManagementPlugin = loadJson.dataManagementPlugin;
        odinLite_fileFormat.filterRules = JSON.parse(loadJson.filterRules);
        odinLite_fileFormat.validationRules = JSON.parse(loadJson.validationRules);
        odinLite_fileFormat.sqlQuery = loadJson.sqlQuery;

        //Set the formatting
        odinLite_fileFormat.setFormattingOptions();

        //Update the preview
        odinLite_fileFormat.updateFilePreview();
    },


    /**
     * initFilePreview
     * This will setup the file preview section
     * overrideInitialValues - this is for the excel sheet viewer to override the start row and end column
     */
    initFilePreview: function(overrideInitialValues){
        kendo.ui.progress($("body"), true);//Wait Message
        //Show the panel
        $('#fileFormatPanel').fadeIn();

        //List of files uploaded or sheets if it multi-sheet one excel.
        $('#fileFormat_fileList').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: odinLite_fileFormat.getDropdownList(),
            value: odinLite_fileFormat.FILE_DATA.fileIdx,
            change: function(a){
                odinLite_fileFormat.FILE_DATA.fileIdx = a.sender.value();
                odinLite_fileFormat.updateFilePreview();
            }
        });

        //Based on the type set the appropriate settings
        if(odinLite_fileFormat.FILE_DATA.isTemplateFile===true){
            $("#fileFormatDelimiterPanel").hide();
            $(".fileFormat_settingText").hide();
            $("#fileFormat_settingsPanel").hide();
        }else if(!odinLite_fileFormat.isExcel()){
            $("#fileFormatDelimiterPanel").show();
            $("#fileFormat_textQualifierBox").show();
        }else{
            $("#fileFormatDelimiterPanel").hide();
            $("#fileFormat_textQualifierBox").hide();
        }

        //apply the kendo widgets
        if(odinLite_fileFormat.hasBeenLoaded === false) {
            $("#fileFormat_startRow").kendoNumericTextBox({
                format: "n0",
                min: 1,
                decimals: 0,
                restrictDecimals: true
            });
            $("#fileFormat_endRow").kendoNumericTextBox({
                format: "n0",
                decimals: 0,
                restrictDecimals: true
            });
            $("#fileFormat_startColumn").kendoNumericTextBox({
                format: "n0",
                min: 1,
                decimals: 0,
                restrictDecimals: true
            });
            $("#fileFormat_endColumn").kendoNumericTextBox({
                format: "n0",
                decimals: 0,
                restrictDecimals: true
            });
        }

        //See if there is a Platform Saved Report otherwise look for default, then just try to guess.
        if(!via.undef(odinLite_uploadFiles.fileSavedReport)){
            via.confirm("Load System Report","Would you like to load the system report: " + odinLite_uploadFiles.fileSavedReport,function(){
                via.debug("Loading System Report:",odinLite_uploadFiles.fileSavedReport);

                //Load the system saved report.
                via.loadReport(odin.ODIN_LITE_APP_ID,odinLite_modelCache.currentEntity.saveId,odinLite_uploadFiles.fileSavedReport,"Common",
                    function(loadJson){
                        odinLite_fileFormat.loadSettings(loadJson);
                    });
            },
            function(){//No
                //Update the initial values
                odinLite_fileFormat.setFormattingOptions();

                //Update the preview for the first time.
                odinLite_fileFormat.updateFilePreview(null, overrideInitialValues);
            });
        }else {
            //Check for a default report. Otherwise guess at the format.
            via.loadDefaultReport(odin.ODIN_LITE_APP_ID, odinLite_modelCache.currentEntity.saveId,
                function (loadJson) {//There is a default report.
                    odinLite_fileFormat.loadSettings(loadJson);
                },
                function () {//No Default Report Exists
                    //Update the initial values
                    odinLite_fileFormat.setFormattingOptions();

                    //Update the preview for the first time.
                    odinLite_fileFormat.updateFilePreview(null, overrideInitialValues);
                }
            );
        }
    },

    /**
     * getDropdownList
     * Returns the dropdown list for the file preview / also used in Model Mapping
     */
    getDropdownList: function(){
        //Setup the file drop down list - sheets or files.
        var dropDownList = odinLite_fileFormat.FILE_DATA.localFiles;//Default to files
        //Check for sheets
        //if(!via.undef(odinLite_fileFormat.FILE_DATA.sheetNames) && odinLite_fileFormat.FILE_DATA.sheetNames.length > 1
        //    && odinLite_fileFormat.FILE_DATA.files.length === 1){
        if(odinLite_fileFormat.isMultiSheet === true){
            dropDownList = odinLite_fileFormat.FILE_DATA.sheetNames;
        }
        var fileData = [];
        for(var i=0;i<dropDownList.length;i++){
            fileData.push({ text: dropDownList[i], value: i });
        }

        //Sort the object.
        fileData.sort(function(a, b){
            var textA=null;
            if(!via.undef(a) && !via.undef(a.text,true)){
                textA=(a.text+"").toLowerCase();
            }
            var textB=null;
            if(!via.undef(b) && !via.undef(b.text,true)){
                textB=(b.text+"").toLowerCase();
            }
            if (textA < textB) //sort string ascending
                return -1;
            if (textA > textB)
                return 1;
            return 0;
        });

        return fileData;
    },

    /**
     * updateFilePreview
     * Updates the file preview based on the settings passed.
     */
    updateFilePreview: function(callbackFn,overrideInitialValues){
        kendo.ui.progress($("#import_fileFormat_spreadsheet"), true);//Wait Message

        //Update the formatting options.
        var formattingOptions = odinLite_fileFormat.getFormattingOptions();
        $.extend(odinLite_fileFormat.FILE_DATA,formattingOptions);

        //Get the advanced settings options
        var advancedSettingsOptions = odinLite_fileFormat.getAdvancedSettingsOptions();
        //Sheet Names
        var sheetNames = null;
        if(!via.undef(odinLite_fileFormat.FILE_DATA.sheetNames,true)){
            sheetNames = JSON.stringify(odinLite_fileFormat.FILE_DATA.sheetNames);
        }

        //Clear the total rows
        $('#import_fileFormat_totalRows').empty();

        var serverVars = $.extend({
            action: 'odinLite.uploadFiles.getFilePreview',
            type: odinLite_fileFormat.FILE_DATA.type,
            files: JSON.stringify(odinLite_fileFormat.FILE_DATA.files),
            localFiles: JSON.stringify(odinLite_fileFormat.FILE_DATA.localFiles),
            idx: odinLite_fileFormat.FILE_DATA.fileIdx,
            sheetNames: sheetNames,
            overrideInitialValues: overrideInitialValues,
            unionData: JSON.stringify(odinLite_unionFiles.getUnionData()),
            overrideUser: odinLite.OVERRIDE_USER
        },formattingOptions,advancedSettingsOptions);

        //Get the file preview from the server based on the settings.
        $.post(odin.SERVLET_PATH,
            serverVars,
            function(data, status){
                kendo.ui.progress($("#import_fileFormat_spreadsheet"), false);//Wait Message off

                //JSON parse does not like NaN
                if(!via.undef(data,true)){
                    data = JSON.parse(data.replace(/\bNaN\b/g, "null"));
                }

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure generating preview:", data.message);
                    if(!via.undef(odinLite_fileFormat.loadedReport,true)){
                        via.kendoAlert("Failure generating preview", data.message,function(){
                            $('#import_fileFormat_spreadsheet').empty();
                        });
                        /*via.kendoAlert("Failure generating preview", data.message + "<br/><b>Unloading saved report:</b> " + odinLite_fileFormat.loadedReport, function () {
                            odinLite_fileFormat.loadedReport = null;
                            $('.fileFormat_reportName').empty();//Remove the loaded report text
                            odinLite_fileFormat.clearAdvancedSettings();//Clear advanced settings.

                            //Update the initial values
                            odinLite_fileFormat.setInitialValues();
                            odinLite_fileFormat.setFormattingOptions();

                            //Update the preview for the first time.
                            odinLite_fileFormat.updateFilePreview(null, overrideInitialValues);
                            $('#fileFormat_nextButton').prop("disabled",false);
                            $('#fileFormat_downloadButton').prop("disabled",false);
                        });*/
                    }else {
                        via.kendoAlert("Failure generating preview", data.message, function () {
                            if (via.undef(data.tsEncoded)) {
                                //odinLite_fileFormat.clearAdvancedSettings();//Clear advanced settings.
                                $("#import_fileFormat_spreadsheet").empty();
                                $("#import_fileFormat_spreadsheet").html("<p style=\"margin:10px;\"><b>Error found:</b> Please review Advanced Settings.</p>");
                                $('#fileFormat_nextButton').prop("disabled",true);
                                $('#fileFormat_downloadButton').prop("disabled",true);
                            }
                        });
                    }
                }else{
                    //Re-enable the next button and the download button.
                    $('#fileFormat_nextButton').prop("disabled",false);
                    $('#fileFormat_downloadButton').prop("disabled",false);

                    via.debug("Successful generating preview:", data);
                    odinLite_fileFormat.originalHeaders = data.originalHeaders;
                    odinLite_fileFormat.unionHeaders = data.unionHeaders;
                    odinLite_fileFormat.FILE_DATA.tsEncoded = data.tsEncoded;
                    //if(via.undef(data.tsEncoded)){//Clear the advanced settings if the tableset is null
                    //    odinLite_fileFormat.clearAdvancedSettings();
                    //}

                    if(overrideInitialValues===true && !via.undef(data.tsEncoded.columnHeaders)){//override the end column if needed.
                        $('#fileFormat_endColumn').data("kendoNumericTextBox").value(data.tsEncoded.columnHeaders.length);
                        odinLite_fileFormat.FILE_DATA.endColumn = data.tsEncoded.columnHeaders.length;
                    }

                    $('#fileFormat_advancedSettingsButton').prop("disabled",false);//Enable the advanced settings button

                    //Get the # of rows to display
                    var maxRows = $("#import_fileFormat_rows").data('kendoDropDownList').value();
                    if(maxRows === "All"){
                        maxRows = null;
                    }
                    //Add the total rows
                    if(!via.undef(odinLite_fileFormat.FILE_DATA.tsEncoded)) {
                        $('#import_fileFormat_totalRows').html(" of " + kendo.toString(odinLite_fileFormat.FILE_DATA.tsEncoded.data.length,"#,##0"));
                    }

                    var sheetData = odinLite_fileFormat.getSpreadsheetDataFromTableSet(odinLite_fileFormat.FILE_DATA.tsEncoded,false,false,maxRows);

                    //Freeze the top Row.
                    sheetData.frozenRows = 1;

                    //Insert the sheet preview.
                    $("#import_fileFormat_spreadsheet").empty();
                    $("#import_fileFormat_spreadsheet").kendoSpreadsheet({
                        height: '200px',
                        headerHeight: 20,
                        //headerWidth: 0,
                        rows: 20,
                        toolbar: false,
                        sheetsbar: false,
                        sheets: [sheetData]
                    });
                    $("#import_fileFormat_spreadsheet .k-spreadsheet-sheets-bar-add").hide();
                    $("#import_fileFormat_spreadsheet .k-link").prop( "disabled", true );
                }

                //Callback function - used in model mapping and in sql
                if(!via.undef(callbackFn)) {
                    callbackFn(data);
                }
            },
            'text');
    },

    /**
     * This will get the file export window that will export the files and figure out the type.
     */
    getExportFilesWindow: function(){
        odinLite.getExportFilesWindow(function(fileType,delimiter){

            kendo.ui.progress($("body"), true);//Wait Message

            //Update the formatting options.
            var formattingOptions = odinLite_fileFormat.getFormattingOptions();
            $.extend(odinLite_fileFormat.FILE_DATA,formattingOptions);

            //Get the advanced settings options
            var advancedSettingsOptions = odinLite_fileFormat.getAdvancedSettingsOptions();

            //Sheet Names
            var sheetNames = null;
            if(!via.undef(odinLite_fileFormat.FILE_DATA.sheetNames,true)){
                sheetNames = JSON.stringify(odinLite_fileFormat.FILE_DATA.sheetNames);
            }

            var serverVars = $.extend({
                action: 'odinLite.uploadFilesExport.exportFiles',
                type: odinLite_fileFormat.FILE_DATA.type,
                files: JSON.stringify(odinLite_fileFormat.FILE_DATA.files),
                localFiles: JSON.stringify(odinLite_fileFormat.FILE_DATA.localFiles),
                idx: odinLite_fileFormat.FILE_DATA.fileIdx,
                sheetNames: sheetNames,
                unionData: JSON.stringify(odinLite_unionFiles.getUnionData()),
                overrideUser: odinLite.OVERRIDE_USER,
                fileType: fileType,
                fileDelimiter: delimiter
            },formattingOptions,advancedSettingsOptions);

            $.post(odin.SERVLET_PATH,
                serverVars,
                function(data, status){
                    kendo.ui.progress($("body"), false);//wait off

                    if(!via.undef(data,true) && data.success === false){
                        via.debug("File Export Error:", data.message);
                        via.alert("File Export Error",data.message);
                    }else{//Success - export
                        via.debug("File Export Successful:", data);
                        via.downloadFile(odin.SERVLET_PATH + "?action=admin.streamFile&reportName=" + encodeURIComponent(data.fileName));
                    }
                },
                'json');

            console.log(serverVars);
        });
    },

    /**
     * clearAdvancedSettings
     * This will reset the advanced settings
     */
    clearAdvancedSettings: function() {
        odinLite_fileFormat.staticColumns = [];
        odinLite_fileFormat.mappedColumns = [];
        odinLite_fileFormat.dataMergeOptions = {};
        odinLite_fileFormat.dataManagementPlugin = null;
        odinLite_fileFormat.filterRules = [];
        odinLite_fileFormat.validationRules = [];
        odinLite_fileFormat.sqlQuery = null;
    },

    /**
     * setInitialValues
     * This will set the intial values back to what was oringinally guessed by the system
     */
    setInitialValues: function(){
        odinLite_fileFormat.FILE_DATA.hasColumnHeader = odinLite_uploadFiles.initialValues.hasColumnHeader;
        odinLite_fileFormat.FILE_DATA.delimType = odinLite_uploadFiles.initialValues.delimType;
        odinLite_fileFormat.FILE_DATA.startColumn = odinLite_uploadFiles.initialValues.startColumn;
        odinLite_fileFormat.FILE_DATA.endColumn = odinLite_uploadFiles.initialValues.endColumn;
        odinLite_fileFormat.FILE_DATA.startRow = odinLite_uploadFiles.initialValues.startRow;
        odinLite_fileFormat.FILE_DATA.endRow = odinLite_uploadFiles.initialValues.endRow;
        odinLite_fileFormat.FILE_DATA.textQualifier = odinLite_uploadFiles.initialValues.textQualifier;
    },

    /**
     * setFormattingOptions
     * This will set the formatting options into the form boxes from the FILE_DATA var
     */
    setFormattingOptions: function(){
        //Column Headers - starts at true
        $('#fileFormat_columnHeaders').prop('checked', true);
        if(!via.undef(odinLite_fileFormat.FILE_DATA.hasColumnHeader,true)){
            $('#fileFormat_columnHeaders').prop('checked', odinLite_fileFormat.FILE_DATA.hasColumnHeader)
        }

        //Delimiter
        if(!via.undef(odinLite_fileFormat.FILE_DATA.delimType,true)) {
            odinLite_fileFormat.FILE_DATA.delimType = odinLite_fileFormat.FILE_DATA.delimType.replace(/\"/g, "");//Fix for legacy saves
        }
        if(!odinLite_fileFormat.isExcel() && !via.undef(odinLite_fileFormat.FILE_DATA.delimType,true)){
            $('input[name="fileFormat_delimiterType"][value="' + odinLite_fileFormat.FILE_DATA.delimType + '"]').prop('checked', true);
        }

        //End Column
        if(!via.undef(odinLite_fileFormat.FILE_DATA.endColumn)) {
            $('#fileFormat_endColumn').data("kendoNumericTextBox").value(odinLite_fileFormat.FILE_DATA.endColumn);
        }

        //Start Column
        if(!via.undef(odinLite_fileFormat.FILE_DATA.startColumn)) {
            $('#fileFormat_startColumn').data("kendoNumericTextBox").value(odinLite_fileFormat.FILE_DATA.startColumn);
        }

        //Start Row
        if(!via.undef(odinLite_fileFormat.FILE_DATA.startRow)) {
            $('#fileFormat_startRow').data("kendoNumericTextBox").value(odinLite_fileFormat.FILE_DATA.startRow);
        }

        //End Row
        if(!via.undef(odinLite_fileFormat.FILE_DATA.endRow)) {
            $('#fileFormat_endRow').data("kendoNumericTextBox").value(odinLite_fileFormat.FILE_DATA.endRow);
        }

        //Text Qualifier
        if(!via.undef(odinLite_fileFormat.FILE_DATA.textQualifier)) {
            $('#fileFormat_textQualifier').val(odinLite_fileFormat.FILE_DATA.textQualifier);
        }
    },

    /**
     * getFormattingOptions
     * This will get the formatting options in the form boxes and put them in the FILE_DATA var
     */
    getFormattingOptions: function(){
        var formDataObj = {};

        //Delimiter
        if(!odinLite_fileFormat.isExcel()) {
            formDataObj.delimType = $("input:radio[name ='fileFormat_delimiterType']:checked").val();
            if (formDataObj.delimType === 'other') {
                var otherType = $('#fileFormat_delimiterOther_textBox').val();
                if (via.undef(otherType, true)) {
                    via.kendoAlert("Specify a Delimiter", "Please enter a file delimiter.");
                    return null;
                }
                formDataObj.userDefinedDelim = otherType;
            }
        }
        //Text Qual & col headers
        formDataObj.textQualifier = $('#fileFormat_textQualifier').val();
        formDataObj.hasColumnHeader = $("#fileFormat_columnHeaders").prop('checked');

        //Rows & Cols
        formDataObj.startRow = $('#fileFormat_startRow').data("kendoNumericTextBox").value();
        formDataObj.endRow = $('#fileFormat_endRow').data("kendoNumericTextBox").value();
        formDataObj.startColumn = $('#fileFormat_startColumn').data("kendoNumericTextBox").value();
        formDataObj.endColumn = $('#fileFormat_endColumn').data("kendoNumericTextBox").value();

        //Model and Entity Info
        formDataObj.entityDir = odinLite_modelCache.currentEntity.entityDir;
        formDataObj.modelId = odinLite_modelCache.currentModel.value;

        return formDataObj;
    },

    /**
     * isXLS
     * This will return whether the files are excel or not
     */
    isExcel: function(){
        if(odinLite_fileFormat.FILE_DATA.type === ".xls" || odinLite_fileFormat.FILE_DATA.type === ".xlsx"){
            return true;
        }else{
            return false;
        }
    },

    /**
     * buildSpreadsheetFromTableSet
     * Makes a spreadsheet form tableset data
     */
    getSpreadsheetDataFromTableSet: function(tsData,isEnabled,displayDataTypes,maxRows){
        var rows = [];
        var columns = [];
        if(via.undef(isEnabled,true)){ isEnabled = true; }
        if(via.undef(maxRows,true)) {
            maxRows = tsData.data.length;
        }
        if(maxRows > tsData.data.length){
            maxRows = tsData.data.length;
        }

        //Display the data types
        if(!via.undef(displayDataTypes) && displayDataTypes===true){
            var row = [];
            for(var i=0;i<tsData.columnDataTypes.length;i++){
                var cellObject = {value: via.getStringDataTypeName(tsData.columnDataTypes[i]),textAlign: "center", enable: isEnabled, color: "#ffffff", background:"#800000",
                    borderBottom:{ size: 2, color: "black" },borderRight:{ size: 1, color: "black" }};
                row.push(cellObject);
            }
            rows.push({cells: row});
        }

        //Add the column headers
        if(!via.undef(tsData) && !via.undef(tsData.columnHeaders,true)){
            var row = [];
            for(var i=0;i<tsData.columnHeaders.length;i++){
                var cellObject = {value: tsData.columnHeaders[i],textAlign: "center", enable: isEnabled, color: "#ffffff", background:"#00a5d0"};
                row.push(cellObject);
            }
            rows.push({cells: row});
        }

        //Add the row data
        if(!via.undef(tsData) && !via.undef(tsData.data,true)) {
            for (var i = 0; i < maxRows; i++) {
                var row = [];
                var rowData = tsData.data[i];
                var cellObject = null;
                for (var j = 0; j < rowData.length; j++) {
                    if (i === 0) {
                        columns.push({width: 250});
                    }
                    var cellValue = rowData[j];
                    var cellDataType = tsData.columnDataTypes[j];
                    switch (cellDataType) {
                        case via.DATA_TYPE_DOUBLE:
                            var value = parseFloat(cellValue);
                            value = isNaN(value) ? null : value;
                            cellObject = {
                                value: kendo.toString(value, "#,###0.00####"),
                                textAlign: "right",
                                enable: isEnabled,
                                color: "rgb(0,0,0)"
                            };
                            break;
                        case via.DATA_TYPE_LONG:
                            var value = parseInt(cellValue);
                            value = isNaN(value) ? null : value;
                            cellObject = {
                                value: value,
                                textAlign: "right",
                                enable: isEnabled,
                                color: "rgb(0,0,0)",
                                format: "#,###0"
                            };
                            break;
                        case via.DATA_TYPE_DATE:
                            var dteFormat = 'yyyyMMdd';
                            var dateVar = kendo.parseDate(cellValue, dteFormat);
                            var formattedDate = null;
                            if (via.undef(cellValue, true)){
                                formattedDate = null;
                            }else if (dateVar !== null) {
                                formattedDate = kendo.toString(dateVar, odin.DEFAULT_DATE_FORMAT);
                            } else {
                                formattedDate = "Unparsable Date";
                            }
                            cellObject = {
                                value: formattedDate,
                                textAlign: "right",
                                enable: isEnabled,
                                color: "rgb(0,0,0)"
                            };
                            break;
                        case via.DATA_TYPE_INTEGER:
                            var value = parseInt(cellValue);
                            value = isNaN(value)?null:value;
                            cellObject = {
                                value: value,
                                textAlign: "right",
                                enable: isEnabled,
                                color: "rgb(0,0,0)",
                                format: "#,###0"
                            };
                            break;
                        case via.DATA_TYPE_BOOLEAN:
                            cellObject = {
                                value: cellValue,
                                textAlign: "center",
                                enable: isEnabled,
                                color: "rgb(0,0,0)"
                            };
                            break;
                        case via.DATA_TYPE_FLOAT:
                            var value = parseFloat(cellValue);
                            value = isNaN(value)?null:value;
                            cellObject = {
                                value: value,
                                textAlign: "right",
                                enable: isEnabled,
                                color: "rgb(0,0,0)",
                                format: "#,###0.000000"
                            };
                            break;
                        case via.DATA_TYPE_SKIP:
                            cellObject = {value: cellValue, textAlign: "left", enable: isEnabled, color: "#adadad"};
                            break;
                        case via.DATA_TYPE_STRING:
                        case via.DATA_TYPE_OBJECT:
                        default:
                            cellObject = {value: cellValue, textAlign: "left", enable: isEnabled, color: "#000000"};
                    }
                    row.push(cellObject);
                }
                rows.push({cells: row});
            }
        }

        return {
            name: "File Preview",
            rows: rows,
            columns: columns
        };
    },

    /**
     * testFileNameExtract
     * This will ttest the fileName extract.
     */
    testFileNameExtract: function(){
        var colObject = {};
        colObject.prefix = $('#fileFormat_addColumn_prefix').val();
        colObject.suffix = $('#fileFormat_addColumn_suffix').val();
        colObject.prefixRegex = $('#fileFormat_addColumn_prefixIsRegex').prop('checked');
        colObject.suffixRegex = $('#fileFormat_addColumn_suffixIsRegex').prop('checked');

        colObject.type = getCurrentType();
        if(colObject.type===3) {
            colObject.dateFormat = $('#fileFormat_addColumn_dateFormat').data('kendoComboBox').value();
        }
        if(colObject.type===3 && via.undef(colObject.dateFormat,true)){
            via.kendoAlert("Add Column Error","Select a date format.");
            return;
        }

        var files = null;
        if(odinLite_fileFormat.isMultiSheet === true){
            files = odinLite_fileFormat.FILE_DATA.sheetNames;
        }else{
            files = odinLite_fileFormat.FILE_DATA.localFiles;
        }

        //Get the file preview from the server based on the settings.
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.uploadFiles.testFileNameExtract',
                settings: JSON.stringify(colObject),
                fileJson: JSON.stringify(files)
            },
            function(data, status){
                data = JSON.parse(data);
                if(!via.undef(data,true) && data.success === false) {
                    via.debug("Failure getting filename extract:", data.message);
                    via.kendoAlert("Failure getting filename extract", data.message);
                }else{
                    var idx = $('#fileFormat_fileList').data('kendoDropDownList').value();
                    if(!via.undef(data.fileNameExtract)){
                        //var fileNames = data.fileNameExtract.join(", ");
                        via.kendoAlert("File Name Extract",data.fileNameExtract[idx]);
                    }else if(!via.undef(data.dateFileNameExtract)){
                        //var fileNames = data.dateFileNameExtract.join(", ");
                        via.kendoAlert("File Name Extract",data.dateFileNameExtract[idx]);
                    }else{
                        via.kendoAlert("File Name Extract","No data contasined in extract.");
                    }
                }
            },
            'text');

        //getCurrentType - get the type of the current column chosen
        function getCurrentType(){
            var columnName = $("#fileFormat_addColumn_columnList").data("kendoComboBox").value();
            var idx = $.inArray(columnName,odinLite_modelCache.currentEntity.mappedColumnDisplay);
            var type = 0;
            if(idx !== -1){
                type = odinLite_modelCache.currentEntity.mappedColumnDataType[idx];
            }
            return type;
        }
    },


    /**
     * showUploadFiles
     * This will take you back to file upload
     */
    showUploadFiles: function(){
        odinLite_fileFormat.hideFileFormat();
        odinLite_uploadFiles.init();
    },

    /**
     * hideFileFormat
     * This will hide file format
     */
    hideFileFormat: function(){
        $('#fileFormatPanel').hide();
    },

    /**
     * showFileFormat
     * This will show file format
     */
    showFileFormat: function(){
        odinLite_modelMapping.hideModelMapping();
        $('#fileFormatPanel').show();
    },
};