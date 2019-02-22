/**
 * Created by rocco on 2/5/2019.
 * This will hold an instance of a file that is being uploaded.
 */
function UploadInfo(form,initialData) {
    this.form = form;
    this.data = initialData;
    this.isMultiSheet = false;
    this.sheetNames = null;

    //For union
    this.unionRowHeaderArr = null;
    this.originalRowHeaderArr = null;
    this.innerJoin = null;
    this.overrideValue = null;

    //Widgets
    this.startRow = null;
    this.endRow = null;
    this.startColumn = null;
    this.endColumn = null;
    this.fileDropdownList = null;
    this.rowDropdown = null;
    this.spreadsheetDiv = null;
    this.totalRows = null;

    /**
     * initUI
     * This will initialize the UI
     */
    this.initUI = function(){
        var self = this;
        kendo.ui.progress($(this.form), true);//Wait Message

        this.spreadsheetDiv = $(this.form).find('.import_spreadsheet');
        this.spreadsheetDiv.empty();//Empty the spreadsheet
        this.data.fileIdx = 0;//Set the initial file.

        // create DropDownList for rows
        this.rowDropdown = $(this.form).find('.import_rows').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: odinLite_fileFormat.rowData,
            index: 0,
            change: function(e){
                self.updateFilePreview();
            }
        }).data('kendoDropDownList');
        this.totalRows = $(this.form).find('.import_totalRows');

        //apply the kendo widgets
        this.startRow = $(this.form).find('.startRow').kendoNumericTextBox({
            format: "n0",
            min: 1,
            decimals: 0,
            restrictDecimals: true
        }).data('kendoNumericTextBox');
        this.endRow = $(this.form).find('.endRow').kendoNumericTextBox({
            format: "n0",
            decimals: 0,
            restrictDecimals: true
        }).data('kendoNumericTextBox');
        this.startColumn = $(this.form).find('.startColumn').kendoNumericTextBox({
            format: "n0",
            min: 1,
            decimals: 0,
            restrictDecimals: true
        }).data('kendoNumericTextBox');
        this.endColumn = $(this.form).find('.endColumn').kendoNumericTextBox({
            format: "n0",
            decimals: 0,
            restrictDecimals: true
        }).data('kendoNumericTextBox');
        //List of files uploaded or sheets if it multi-sheet one excel.
        this.fileDropdownList = $(this.form).find('.fileList').kendoDropDownList({
            dataTextField: "text",
            dataValueField: "value",
            dataSource: [],
            value: this.data.fileIdx,
            change: function(a){
                self.data.fileIdx = self.fileDropdownList.value();
                self.updateFilePreview();
            }
        }).data('kendoDropDownList');


        //Based on the type set the appropriate settings
        if(this.data.isTemplateFile===true){
            $(this.form).find('.delimiterPanel').hide();
            $(this.form).find('.settingText').hide();
            $(this.form).find('.settingsPanel').hide();
        }else if(!this.isExcel()){
            $(this.form).find('.delimiterPanel').show();
            $(this.form).find('.textQualifierBox').show();
        }else{
            $(this.form).find('.delimiterPanel').hide();
            $(this.form).find('.textQualifierBox').hide();
        }

        //Check multiple sheets for excel
        this.isMultiSheet = false;
        if(!via.undef(this.data.sheetNames) && this.data.sheetNames.length > 1
            && this.data.files.length === 1) {
            this.isMultiSheet = true;
            this.excelSheetChooser(function(selectedSheets){
                self.sheetNames = selectedSheets;
                self.fileDropdownList.setDataSource(self.getFileDropdownList());
                self.fileDropdownList.select(0);
                self.setFormattingOptions();
                self.updateFilePreview(null,true);
            });
        }else {
            this.fileDropdownList.setDataSource(self.getFileDropdownList());
            this.fileDropdownList.select(0);
            this.setFormattingOptions();
            self.updateFilePreview(null,true);
        }

        //Event for the preview.
        $(this.form).find('.updatePreviewButton').click(function(){
            self.updateFilePreview();
        });
        //Event for the download
        $(this.form).find('.downloadButton').click(function(){
            var ts = self.data.tsEncoded;
            if(!via.undef(ts)){
                via.downloadLocalTableSet(ts);
            }
        });

        kendo.ui.progress($(this.form), false);//Wait Message
    };


    /**
     * excelSheetChooser
     * This will allow choosing of the sheets the user wants to upload from their excel document.
     */
    this.excelSheetChooser = function(callbackFn){
        var data = this.data;
        //Get the window template
        $.get("./html/excelSheetChooserWindow.html", function (windowTemplate) {
            $('#odinLite_excelSheetChooserWindow').remove();
            $('body').append(windowTemplate);
            //Make the window.
            var excelSheetsWindow = $('#odinLite_excelSheetChooserWindow').kendoWindow({
                title: "Excel Sheet Chooser",
                draggable: false,
                resizable: false,
                width: "450px",
                height: "325px",
                modal: true,
                actions: [
                    //"Maximize"
                ],
                close: function () {
                    excelSheetsWindow = null;
                    $('#odinLite_excelSheetChooserWindow').remove();
                }
            }).data("kendoWindow");

            excelSheetsWindow.center();
            for(var i=0;i<data.sheetNames.length;i++) {
                var sheetName = data.sheetNames[i];
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

                //Get rid of the window
                excelSheetsWindow.close();
                $('#odinLite_excelSheetChooserWindow').remove();

                //Callback
                if(!via.undef(callbackFn)){
                    callbackFn(selectedSheets);
                }
            });


        });

        kendo.ui.progress($("body"), false);//Wait Message
    };

    /**
     * isXLS
     * This will return whether the files are excel or not
     */
    this.isExcel = function(){
        if(this.data.type === ".xls" || this.data.type === ".xlsx"){
            return true;
        }else{
            return false;
        }
    };

    /**
     * getFileDropdownList
     * Returns the dropdown list for the file preview
     */
    this.getFileDropdownList = function(){
        //Setup the file drop down list - sheets or files.
        var dropDownList = this.data.localFiles;//Default to files
        //Check for sheets
        //if(!via.undef(odinLite_fileFormat.FILE_DATA.sheetNames) && odinLite_fileFormat.FILE_DATA.sheetNames.length > 1
        //    && odinLite_fileFormat.FILE_DATA.files.length === 1){
        if(this.isMultiSheet === true){
            dropDownList = this.sheetNames;
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
    };

    /**
     * setFormattingOptions
     * This will set the formatting options into the form boxes from the data var
     */
    this.setFormattingOptions = function(){
        //Column Headers - starts at true
        $(this.form).find('.columnHeaders').prop('checked', true);
        if(!via.undef(this.data.hasColumnHeader,true)){
            $(this.form).find('.columnHeaders').prop('checked', this.data.hasColumnHeader);
        }

        //Delimiter
        if(!via.undef(this.data.delimType,true)) {
            this.data.delimType = this.data.delimType.replace(/\"/g, "");//Fix for legacy saves
        }
        if(!this.isExcel() && !via.undef(this.data.delimType,true)){
            $(this.form).find('input[name="delimiterType"][value="' + this.data.delimType + '"]').prop('checked', true);
        }

        //End Column
        if(!via.undef(this.data.endColumn)) {
            this.endColumn.value(this.data.endColumn);
        }

        //Start Column
        if(!via.undef(this.data.startColumn)) {
            this.startColumn.value(this.data.startColumn);
        }

        //Start Row
        if(!via.undef(this.data.startRow)) {
            this.startRow.value(this.data.startRow);
        }

        //End Row
        if(!via.undef(this.data.endRow)) {
            this.endRow.value(this.data.endRow);
        }

        //Text Qualifier
        if(!via.undef(this.data.textQualifier)) {
            $(this.form).find('.textQualifier').val(this.data.textQualifier);
        }
    };

    /**
     * getFormattingOptions
     * This will get the formatting options in the form boxes and return
     */
    this.getFormattingOptions = function(){
        var formDataObj = {};

        //Delimiter
        if(!this.isExcel()) {
            formDataObj.delimType = $(this.form).find("input:radio[name ='delimiterType']:checked").val();
            if (formDataObj.delimType === 'other') {
                var otherType = $(this.form).find('.delimiterOther_textBox').val();
                if (via.undef(otherType, true)) {
                    via.kendoAlert("Specify a Delimiter", "Please enter a file delimiter.");
                    return null;
                }
                formDataObj.userDefinedDelim = otherType;
            }
        }
        //Text Qual & col headers
        formDataObj.textQualifier = $(this.form).find('.textQualifier').val();
        formDataObj.hasColumnHeader = $(this.form).find(".columnHeaders").prop('checked');

        //Rows & Cols
        formDataObj.startRow = this.startRow.value();
        formDataObj.endRow = this.endRow.value();
        formDataObj.startColumn = this.startColumn.value();
        formDataObj.endColumn = this.endColumn.value();
        formDataObj.type = this.data.type;

        //Sheet Names
        var sheetNames = null;
        if(!via.undef(this.data.sheetNames,true)){
            sheetNames = JSON.stringify(this.data.sheetNames);
        }
        formDataObj.sheetNames = sheetNames;
        //File Names
        formDataObj.files = JSON.stringify(this.data.files);
        formDataObj.localFiles = JSON.stringify(this.data.localFiles);

        return formDataObj;
    };

    /**
     * updateFilePreview
     * Updates the preview of the file.
     */
    this.updateFilePreview = function(callbackFn,overrideInitialValues){
        kendo.ui.progress(this.spreadsheetDiv, true);//Wait Message

        var self = this;

        //Update the formatting options.
        var formattingOptions = this.getFormattingOptions();
        //formattingOptions = $.extend(formattingOptions,this.data);

        //Clear the total rows
        this.totalRows.empty();

        var serverVars = $.extend({
            action: 'odinLite.uploadFiles.getFilePreview',
            idx: this.data.fileIdx,
            overrideInitialValues: overrideInitialValues,
            overrideUser: odinLite.OVERRIDE_USER,
            entityDir: odinLite_modelCache.currentEntity.entityDir,
            modelId: odinLite_modelCache.currentModel.value
        },formattingOptions);

        //Get the file preview from the server based on the settings.
        $.post(odin.SERVLET_PATH,
            serverVars,
            function(data, status){
                kendo.ui.progress(self.spreadsheetDiv, false);//Wait Message off

                //JSON parse does not like NaN
                if(!via.undef(data,true)){
                    data = JSON.parse(data.replace(/\bNaN\b/g, "null"));
                }

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure generating preview:", data.message);
                    if(!via.undef(odinLite_fileFormat.loadedReport,true)){
                        via.kendoAlert("Failure generating preview", data.message,function(){
                            self.spreadsheetDiv.empty();
                        });
                    }else {
                        via.kendoAlert("Failure generating preview", data.message, function () {
                            if (via.undef(data.tsEncoded)) {
                                //odinLite_fileFormat.clearAdvancedSettings();//Clear advanced settings.
                                self.spreadsheetDiv.empty();
                                self.spreadsheetDiv.html("<p style=\"margin:10px;\"><b>Error found.</p>");
                            }
                        });
                    }
                }else{
                    via.debug("Successful generating preview:", data);
                    self.data.tsEncoded = data.tsEncoded;

                    if(overrideInitialValues===true && !via.undef(data.tsEncoded.columnHeaders)){//override the end column if needed.
                        self.endColumn.value(data.tsEncoded.columnHeaders.length);
                        self.data.endColumn = data.tsEncoded.columnHeaders.length;
                    }

                    //Get the # of rows to display
                    var maxRows = self.rowDropdown.value();
                    if(maxRows === "All"){
                        maxRows = null;
                    }
                    //Add the total rows
                    if(!via.undef(self.data.tsEncoded)) {
                        self.totalRows.html(" of " + kendo.toString(self.data.tsEncoded.data.length,"#,##0"));
                    }

                    var sheetData = odinLite_fileFormat.getSpreadsheetDataFromTableSet(self.data.tsEncoded,false,false,maxRows);

                    //Freeze the top Row.
                    sheetData.frozenRows = 1;

                    //Insert the sheet preview.
                    self.spreadsheetDiv.empty();
                    self.spreadsheetDiv.kendoSpreadsheet({
                        height: '200px',
                        headerHeight: 20,
                        //headerWidth: 0,
                        rows: 20,
                        toolbar: false,
                        sheetsbar: false,
                        sheets: [sheetData]
                    });
                    self.spreadsheetDiv.find(".k-spreadsheet-sheets-bar-add").hide();
                    self.spreadsheetDiv.find(".k-link").prop( "disabled", true );
                }

                //Callback function - used in model mapping and in sql
                if(!via.undef(callbackFn)) {
                    callbackFn(data);
                }
            },
            'text');
    };

    /**
     * getColumnHeaderObject
     * Gets the column headers in a format for a kendo dataSource
     */
    this.getColumnHeaderObject = function(){
        if(via.undef(this.data) || via.undef(this.data.tsEncoded) ||
            via.undef(this.data.tsEncoded.columnHeaders)){ return null; }

        var columnHeaders = this.data.tsEncoded.columnHeaders;
        var comboArr = [];
        for(var i=0;i<columnHeaders.length;i++){
            var comboObj = null;
            comboObj = {
                text: columnHeaders[i],
                value: columnHeaders[i]
            };
            comboArr.push(comboObj);
        }
        return comboArr;
    };

    /**
     * setRowHeaders
     * Sets the row headers for the union
     */
    this.setRowHeaders = function(unionRowHeaderArr,originalRowHeaderArr,innerJoin,overrideValue){
        this.unionRowHeaderArr = unionRowHeaderArr;
        this.originalRowHeaderArr = originalRowHeaderArr;
        this.innerJoin = innerJoin;
        this.overrideValue = overrideValue;
    };

    /**
     * printData
     * Prints relevant data about the files
     */
    this.printData = function () {
        console.log("form",this.form);
        console.log("initialData",this.data);
    };
};