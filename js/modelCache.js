/**
 * Created by rocco on 3/16/2018.
 * This is the model cache file for the ODIN Lite application.
 * This will handle everything to do with models.
 */
var odinLite_modelCache = {
    /* Variables */
    currentModel: null, //Placeholder for the currently selected model.
    currentEntity: null, //Placeholder for the currently selected entity.
    columnTemplate: null, //Placeholder for the html template for each column
    currentPlatform: null, //Placeholder for the current platform
    dataMgmtModel: null, //PLaceholder for the data management model

    /**
     * init
     * This will initialize ODIN Lite Model Cache and set it up
     */
    init: function(){
        $('#modelDefinition_modelPlatforms').hide();

        kendo.ui.progress($("body"), true);//Wait Message

        //Make the call to get the initial values for Model Cache
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.cacheModel.init',
                overrideUser: odinLite.OVERRIDE_USER,
                isDataManagerUser: odinLite.isDataManagerUser,
                appId: odinLite.currentApplication
            },
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure getting model data:", data.message);
                    via.kendoAlert("Load Failure", data.message);
                }else{
                    via.debug("Successful getting model data:", data);

                    //Models Missing
                    if(via.undef(data.modelList)){
                        via.kendoAlert("Load Failure", "No models contained in list.");
                        return;
                    }
                    //Zero Models
                    var modelListLength = Object.keys(data.modelList).length;
                    if(modelListLength === 0){
                        via.kendoAlert("Load Failure", "User not permissioned for any models.");
                        return;
                    }

                    //Required and Optional Models
                    if(via.undef(odinLite.isDataManagerUser) || odinLite.isDataManagerUser !== true) {
                        if (via.undef(data.requiredModels) && via.undef(data.optionalModels)) {
                            via.kendoAlert("Load Failure", "Required and optional models not found.");
                            return;
                        }
                        var requiredModelsLength = 0;
                        if (!via.undef(data.requiredModels)) {
                            requiredModelsLength = Object.keys(data.requiredModels).length;
                        }
                        var optionalModelsLength = 0;
                        if (!via.undef(data.optionalModels)) {
                            optionalModelsLength = Object.keys(data.optionalModels).length;
                        }
                        if (optionalModelsLength === 0 && requiredModelsLength === 0) {
                            via.kendoAlert("Load Failure", "No Data Models defined for Reports in your Profile.");
                            return;
                        }
                    }

                    //Reset in case they were accessed before:
                    $('#entityList_message').fadeIn();
                    $('#entityList_existingEntity').hide();
                    $('#modelDefinition_existingModel').hide();
                    $('#modelDefinition_editModel').hide();

                    //Check for data management model
                    odinLite_modelCache.dataMgmtModel = data.dataMgmtModel;

                    if(via.undef(odinLite.isDataManagerUser) || odinLite.isDataManagerUser !== true) {
                        odinLite_modelCache.createModelTree(data.modelList, data.requiredModels, data.optionalModels);
                    }else{
                        odinLite_modelCache.createDataManagerModelTree(data);
                    }
                    $('#modelCachePanel').fadeIn();
                }
            },
            'json');
    },

    /**
     * createDataManagerModelTree
     * This will create the tree to allow model selection for a data manager user
     */
    createDataManagerModelTree: function(data){
        //Get the data in the correct format.
        var treeData = JSON.parse(JSON.stringify(data.modelList));
        var kendoTreeData = [];
        for(var i=0;i<treeData.length;i++) {
            var node = treeData[i];
            kendoTreeData = renameChildren(kendoTreeData,node,true);
        }
        function renameChildren(kendoTreeData,node,isRoot){//Recursive function. All it does it rename children to items.
            //Recursive - If it has children call this method again.
            if(!via.undef(node.children) && node.children.length > 0 ){
                for(var i=0;i<node.children.length;i++){
                    var childNode = node.children[i];
                    kendoTreeData = renameChildren(kendoTreeData,childNode,false);
                }
                node.items = node.children;
                node.children = null;
                delete node.children;
            }
            if(isRoot === true){
                kendoTreeData.push(node);
            }
            return kendoTreeData;
        }
        //End - Get data

        //Create the Data Source
        var processDataSource = new kendo.data.HierarchicalDataSource({
            sort: { field: "text", dir: "asc" },
            data: kendoTreeData
        });

        //Make the tree
        //$("#modelCacheSelection_treeview").empty();
        if(!via.undef($("#modelCacheSelection_treeview").data('kendoTreeView'))){
            $("#modelCacheSelection_treeview").data('kendoTreeView').destroy();
            $("#modelCacheSelection_treeview").empty();
        }
        $("#modelCacheSelection_treeview").kendoTreeView({
            dataSource: processDataSource,
            dataSpriteCssClassField: "iconCls",
            expand: function(e){
                if ($("#modelCacheSelection_filterText").val() == "") {
                    $(e.node).find("li").show();
                }
            },
            change: function(e) {
                var selected = this.select();
                if(via.undef(selected)){return false;}
                var item = this.dataItem(selected);
                if(via.undef(item)){return false;}
                if(item.hasChildren){return false;}
                if(via.undef(item.value)){return false;}

                //get application
                var parent = this.parent(selected);
                while(!via.undef(this.dataItem(this.parent(parent)))){
                    parent = this.parent(parent);
                }

                //Get the current model
                odinLite_modelCache.currentModel = {
                    value: item.value,
                    text: item.text,
                    description: item.description,
                    application: this.dataItem(parent).text
                };
                odinLite_modelCache.getModelInfo(item.value);
            }
        });

        //Expand and Collapse Tree
        $('#modelCacheSelection_expandButton').click(function(){
            var treeview = $("#modelCacheSelection_treeview").data("kendoTreeView");
            treeview.expand(".k-item");
        });
        $('#modelCacheSelection_collapseButton').click(function(){
            var treeview = $("#modelCacheSelection_treeview").data("kendoTreeView");
            treeview.collapse(".k-item");
        });

        $("#modelCacheSelection_filterText").keyup(function (e) {
            var changeReport_filterText = $(this).val();
            if (changeReport_filterText !== "") {
                $("#modelCacheSelection_treeview .k-group .k-group .k-in").closest("li").hide();
                $("#modelCacheSelection_treeview .k-group").closest("li").hide();
                $("#modelCacheSelection_treeview .k-group .k-group .k-in:containsi(" + changeReport_filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        var treeView = $("#modelCacheSelection_treeview").data("kendoTreeView");
                        treeView.expand($(this).parents("li"));
                        $(this).show();
                    });
                });
            }
            else {
                $("#modelCacheSelection_treeview .k-group").find("li").show();
                var nodes = $("#modelCacheSelection_treeview > .k-group > li");

                $.each(nodes, function (i, val) {
                    if (nodes[i].getAttribute("data-expanded") === null) {
                        $(nodes[i]).find("li").hide();
                    }
                });
            }
        });
    },

    /**
     * createModelTree
     * This will create the tree to allow model selection.
     */
    createModelTree: function(modelList,requiredModels,optionalModels){
        //Build the Tree Data
        var kendoTreeData = [];
        $.each( modelList, function( key, modelArr ) {
            if(via.undef(modelArr)){return;}

            var applicationObj = {};
            applicationObj.text = key;
            applicationObj.value = key;
            applicationObj.expanded = true;
            applicationObj.items = [];
            applicationObj.iconCls = "folderCls";

            var requiredObj = {};
            requiredObj.text = " Required";
            requiredObj.value = "Required";
            requiredObj.expanded = true;
            requiredObj.items = [];
            requiredObj.iconCls = "folderCls";

            var optionalObj = {};
            optionalObj.text = "Optional";
            optionalObj.value = "Optional";
            optionalObj.expanded = true;
            optionalObj.items = [];
            optionalObj.iconCls = "folderCls";

            for(var i=0;i<modelArr.length;i++){
                var modelObj = {};
                modelObj.text = modelArr[i][1];
                modelObj.value = modelArr[i][0];
                if(modelArr[i].length > 2) {
                    modelObj.description = modelArr[i][2];
                }
                modelObj.iconCls = "leafArrowCls";

                //Optional / Required
                if(!via.undef(requiredModels) && $.inArray(modelObj.value,requiredModels)!==-1){
                    requiredObj.items.push(modelObj);
                }else if(!via.undef(optionalModels) && $.inArray(modelObj.value,optionalModels)!==-1){
                    optionalObj.items.push(modelObj);
                }else{
                    continue;
                }
            }
            if(requiredObj.items.length > 0){
                applicationObj.items.push(requiredObj);
            }
            if(optionalObj.items.length > 0){
                applicationObj.items.push(optionalObj);
            }

            if(applicationObj.items.length > 0) {
                kendoTreeData.push(applicationObj);
            }
        });
        //End - Build the Tree Data

        //Create the Data Source
        var processDataSource = new kendo.data.HierarchicalDataSource({
            sort: { field: "text", dir: "asc" },
            data: kendoTreeData
        });

        //Make the tree
        //$("#modelCacheSelection_treeview").empty();
        if(!via.undef($("#modelCacheSelection_treeview").data('kendoTreeView'))){
            $("#modelCacheSelection_treeview").data('kendoTreeView').destroy();
            $("#modelCacheSelection_treeview").empty();
        }
        $("#modelCacheSelection_treeview").kendoTreeView({
            dataSource: processDataSource,
            dataSpriteCssClassField: "iconCls",
            expand: function(e){
                if ($("#modelCacheSelection_filterText").val() == "") {
                    $(e.node).find("li").show();
                }
            },
            change: function(e) {
                var selected = this.select();
                if(via.undef(selected)){return false;}
                var item = this.dataItem(selected);
                if(via.undef(item)){return false;}
                if(item.hasChildren){return false;}
                if(via.undef(item.value)){return false;}

                //get application
                var parent = this.parent(selected);
                while(!via.undef(this.dataItem(this.parent(parent)))){
                    parent = this.parent(parent);
                }

                //Get the current model
                odinLite_modelCache.currentModel = {
                    value: item.value,
                    text: item.text,
                    description: item.description,
                    application: this.dataItem(parent).text
                };
                odinLite_modelCache.getModelInfo(item.value);
            }
        });

        //Expand and Collapse Tree
        $('#modelCacheSelection_expandButton').click(function(){
            var treeview = $("#modelCacheSelection_treeview").data("kendoTreeView");
            treeview.expand(".k-item");
        });
        $('#modelCacheSelection_collapseButton').click(function(){
            var treeview = $("#modelCacheSelection_treeview").data("kendoTreeView");
            treeview.collapse(".k-item");
        });

        $("#modelCacheSelection_filterText").keyup(function (e) {
            var changeReport_filterText = $(this).val();
            if (changeReport_filterText !== "") {
                $("#modelCacheSelection_treeview .k-group .k-group .k-in").closest("li").hide();
                $("#modelCacheSelection_treeview .k-group").closest("li").hide();
                $("#modelCacheSelection_treeview .k-group .k-group .k-in:containsi(" + changeReport_filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        var treeView = $("#modelCacheSelection_treeview").data("kendoTreeView");
                        treeView.expand($(this).parents("li"));
                        $(this).show();
                    });
                });
            }
            else {
                $("#modelCacheSelection_treeview .k-group").find("li").show();
                var nodes = $("#modelCacheSelection_treeview > .k-group > li");

                $.each(nodes, function (i, val) {
                    if (nodes[i].getAttribute("data-expanded") === null) {
                        $(nodes[i]).find("li").hide();
                    }
                });
            }
        });
    },

    /**
     * getModelInfo
     * This will retrieve model information
     */
    getModelInfo: function(modelId,isSkipPlatform){
        kendo.ui.progress($("body"), true);//Wait Message

        var entityDir = odinLite.ENTITY_DIR;

        //Make the call to get the model info
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.cacheModel.getModelInfo',
                modelId: modelId,
                entityDir: entityDir,
                overrideUser: odinLite.OVERRIDE_USER
            },
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off
                odinLite_modelCache.hideModelDefinition();
                $("html, body").animate({
                    scrollTop: 0
                }, 250);

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure getting model:", data.message);
                    via.kendoAlert("Model Failure", data.message);
                }else {
                    via.debug("Successful getting model:", data);
                    if (!via.undef(data.modelInfo.errorString, true)) {
                        via.kendoAlert("Problem with data model", data.modelInfo.errorString);
                        return;
                    }

                    $("#entityList_message").hide();
                    $(".entityList_modelName").html(odinLite_modelCache.currentModel.text);
                    $(".entityList_modelDescription").empty();
                    if (!via.undef(odinLite_modelCache.currentModel.description)) {
                        $(".entityList_modelDescription").html(odinLite_modelCache.currentModel.description);
                    }
                    $("#entityList_existingEntity").fadeIn();

                    //Save the modelInfo
                    data.modelInfo.modelId = modelId;
                    odinLite_modelCache.currentEntity = data.modelInfo;

                    //Display the selected model and get the template to use.
                    $.get('./html/modelCache_columnTemplate.html', function(data) {
                        odinLite_modelCache.columnTemplate = data;

                        //Launch the Platform Chooser or display the saved model.
                        if((!via.undef(isSkipPlatform,true) && isSkipPlatform===true) || (odinLite_modelCache.dataMgmtModel === odinLite_modelCache.currentEntity.modelId)){
                            odinLite_modelCache.displaySelectedModelTemplate();
                        }else {
                            odinLite_modelCache.displayPlatformChooser();
                        }

                        //Check for Demo Account
                        if(modelId.startsWith("DEMO_")){
                            $(".demoButton").prop("disabled",true);
                        }else{
                            $(".demoButton").prop("disabled",false);
                        }
                    }, 'text');
                }
            },
            'json');
    },

    /**
     * createNewEntity
     * This will create a new entity for a user
     */
    createNewEntity: function(callbackFn){
        via.kendoPrompt("Create New Entity","Please enter an entity name.",function(name){
            kendo.ui.progress($("body"), true);//Wait Message off

            //Make the call to create the entity
            $.post(odin.SERVLET_PATH,
                {
                    action: 'odinLite.cacheModel.createApplicationEntity',
                    entityName: name,
                    overrideUser: odinLite.OVERRIDE_USER
                },
                function(data, status){
                    kendo.ui.progress($("body"), false);//Wait Message off

                    if(!via.undef(data,true) && data.success === false){
                        via.debug("Failure creating entity:", data.message);
                        via.kendoAlert("Entity Create Failure", data.message);
                    }else{
                        via.debug("Successful creating entity:", data);
                        via.kendoAlert("Entity Create Success", data.message);
                    }

                    if(!via.undef(callbackFn)){
                        callbackFn(data);
                    }
                },
                'json');
        });
    },

    /**
     * deleteEntity
     * This will delete am entity for a given user
     */
    deleteEntity: function(entityDir,entityName,callbackFn){
        via.confirm("Delete Entity","Are you sure you want to delete the entity " + entityName + "? This action cannot be undone and will purge all data for the entity.",function(){
            via.inputDialog("Confirm Delete","This will <b>purge</b> all data for this entity. Type the word \"<span style=\"color:red;\">delete</span>\" below to confirm.",function(val){
                if(!via.undef(val,true) && val==='delete'){
                    //Make the call to delete the entity
                    $.post(odin.SERVLET_PATH,
                        {
                            action: 'odinLite.cacheModel.deleteApplicationEntity',
                            entityDir: entityDir,
                            overrideUser: odinLite.OVERRIDE_USER
                        },
                        function(data, status){
                            kendo.ui.progress($("body"), false);//Wait Message off

                            if(!via.undef(data,true) && data.success === false){
                                via.debug("Failure deleting entity:", data.message);
                                via.kendoAlert("Entity Delete Failure", data.message);
                            }else{
                                via.debug("Successful deleting entity:", data);
                                via.kendoAlert("Entity Delete Success", data.message);
                            }

                            if(!via.undef(callbackFn)){
                                callbackFn(data);
                            }
                        },
                        'json');
                }else{
                    via.kendoAlert("Delete Entity", "Entity not deleted.");
                }
            });
        });
    },

    /**
     * hideModelDefinition
     * This will hide the model selection
     */
    hideModelDefinition: function(){
        $(".modelColumnContainer").empty();
        $('#modelDefinition_existingModel').hide();
        $("#modelDefinition_editModel").hide();
    },

    /**
     * displayPlatformChooser
     * This will display the platform chooser panel.
     */
    displayPlatformChooser: function(){
        $("#modelDefinition_modelPlatforms").fadeIn();

        //Create the inputs
        $(".modelDefinition_platformNameContainer").empty();
        $(".modelDefinition_platformNameContainer").append('<input style="width:450px;" class="modelDefinition_platformNameInput" />');

        $(".modelDefinition_platformSpecContainer").empty();
        $(".modelDefinition_platformSpecContainer").append('<input style="width:450px;" class="modelDefinition_platformSpecInput" />');

        //Platform Specs
        var platformSpecInput = $(".modelDefinition_platformSpecInput").kendoDropDownList({
            dataTextField: "specification",
            dataValueField: "specification",
            dataSource: [],
            change: function (e) {
                var dataItem = e.sender.dataItem();
                //Update the description
                $('.modelDefinition_platformSpecDefinition').html(dataItem.description);
                if(!via.undef(dataItem.helpLink)) {
                    $(".modelDefinition_platformSpecContainer_helpLink").empty();
                    $(".modelDefinition_platformSpecContainer_helpLink").append(`<button title="Additional Information"
                        onclick="via.displayHelpLink('${dataItem.specification}','${dataItem.helpLink}');"
                        style="margin-left:10px;margin-bottom:2px;" type="button" class="tr btn btn-primary">
                        <i class="fa fa-question-circle"></i></button>
                    `);
                }
            }
        }).data('kendoDropDownList');


        //Platform Names
        var platformNames = getPlatformNames();
        var platformNameInput = $(".modelDefinition_platformNameInput").kendoDropDownList({
            dataTextField: "platform",
            dataValueField: "platform",
            dataSource: platformNames,
            index: 0,
            change: function (e) {
                var dataItem = e.sender.dataItem();
                if(dataItem === undefined){
                    $('.modelDefinition_platformNameDefinition').html("");
                    platformNameInput.dataSource.data([]);
                    return;
                }
                //Update the description
                $('.modelDefinition_platformNameDefinition').html(dataItem.description);

                //Update the specs
                var platformSpecs = getPlatformSpecs(dataItem.platform);
                platformSpecInput.dataSource.data([]);
                platformSpecInput.dataSource.data(platformSpecs);
                platformSpecInput.select(0);
                platformSpecInput.trigger('change');
            }
        }).data('kendoDropDownList');
        if(!via.undef(odinLite_modelCache.currentEntity.savedPlatformList)){
            platformNameInput.search(odinLite_modelCache.currentEntity.savedPlatformList[0][0]);
        }
        platformNameInput.trigger("change");

        /** Button Event **/
        $(".modelDefinition_choosePlatformButton").off("click");
        $(".modelDefinition_choosePlatformButton").click(function(){
            var dataItem = platformSpecInput.dataItem().toJSON();
            odinLite_modelCache.currentPlatform = dataItem;

            //Hide Template
            if(odinLite_modelCache.currentPlatform.platform !== 'Custom'){
                $('.exampleTemplateFile').hide();
            }else{
                $('.exampleTemplateFile').show();
            }

            //Check to see if the model is already a saved model
            var platform = odinLite_modelCache.currentPlatform.platform;
            var usePresavedTemplate = odinLite_modelCache.currentEntity.usePlatformDefinedMetaDataFileMap;
            if(odinLite_modelCache.currentEntity.savedModelExists === true){
                odinLite_modelCache.displaySelectedModelTemplate();
            }else if(!via.undef(usePresavedTemplate,true) && usePresavedTemplate[platform] === true &&
                odinLite_modelCache.currentEntity.savedModelExists === false){

                //Make the call to copy the model
                kendo.ui.progress($("body"), true);//Wait Message off
                $.post(odin.SERVLET_PATH,
                    {
                        action: 'odinLite.cacheModel.saveModelPlatformDefinition',
                        platform: platform,
                        entityDir: odinLite_modelCache.currentEntity.entityDir,
                        modelId: odinLite_modelCache.currentModel.value,
                        overrideUser: odinLite.OVERRIDE_USER
                    },
                    function(data, status){
                        kendo.ui.progress($("body"), false);//Wait Message off

                        if(!via.undef(data,true) && data.success === false){
                            via.debug("Platform Copy Failure:", data.message);
                            via.kendoAlert("Platform Copy Failure", data.message);
                        }else{
                            via.debug("Success copying platform:", data);

                            //Save the modelInfo
                            odinLite_modelCache.currentEntity = data.modelInfo;

                            //Display the saved template
                            odinLite_modelCache.displaySelectedModelTemplate();
                        }
                    },
                    'json');
            }else{
                odinLite_modelCache.displaySelectedModelTemplate();
            }
        });

        /** Functions **/
        //Return a list of platform names
        function getPlatformNames(){
            var platforms = [];
            //Check for data
            if(via.undef(odinLite_modelCache.currentEntity.platformList)){
                via.debug("No Platforms found for this model.");
                return [];
            }
            //Build the dropdown model
            for(var i in odinLite_modelCache.currentEntity.platformList){
                var platform = odinLite_modelCache.currentEntity.platformList[i];
                if(via.undef(platform)){ continue; }
                platforms.push({
                    platform: platform[0],
                    description: platform[1],
                    helpLink: platform.length>3?platform[3]:null
                });
            }
            return platforms;
        }
        //Returns the specs for the passed platform
        function getPlatformSpecs(platformName){
            var specArray = odinLite_modelCache.currentEntity.platformSpecMap[platformName];
            if(via.undef(odinLite_modelCache.currentEntity.platformList)){
                via.debug("No Platforms Specifications found for this model.");
                return [];
            }
            var platformSpecs = [];
            for(var i in specArray){
                var spec = specArray[i];
                if(via.undef(spec)){ continue; }
                platformSpecs.push({
                    platform: spec[0],
                    specification: spec[1],
                    description: spec[2],
                    helpLink: spec.length>3?spec[3]:null
                });
            }
            return platformSpecs;
        }
    },

    /**
     * displaySelectedModelTemplate
     * This will display the current model on the screen for editing
     */
    displaySelectedModelTemplate: function(edit){
        $("#modelDefinition_modelPlatforms").hide();
        odinLite_modelCache.hideModelDefinition();//Hide the Model Definition and reset it.
        if(odinLite_modelCache.currentEntity.savedModelExists === false || edit === true){
            $("#modelDefinition_editModel").fadeIn();
            buildColumnModel();

            //Check to see id it is the data management model.
            if((odinLite_modelCache.dataMgmtModel === odinLite_modelCache.currentEntity.modelId) &&
                (odinLite_modelCache.currentEntity.savedModelExists === false)){
                odinLite_modelCache.saveModelDefinition();
            }
        }else{
            $("#modelDefinition_existingModel").fadeIn();
            if(odinLite_modelCache.dataMgmtModel === odinLite_modelCache.currentEntity.modelId){
                $('.dataMgmtHide').hide();
                odinLite_modelCache.currentPlatform = {"platform":"Custom","specification":"Custom Upload"};
            }else{
                $('.dataMgmtHide').show();
            }
        }

        function buildColumnModel(){
            var isSavedModel = false;
            var modelData = odinLite_modelCache.currentEntity.columnInfo;
            if(odinLite_modelCache.currentEntity.savedModelExists === true &&
                !via.undef(odinLite_modelCache.currentEntity.savedColumnInfo)){
                modelData = updateSavedModelData( odinLite_modelCache.currentEntity.savedColumnInfo, odinLite_modelCache.currentEntity.columnInfo);
                isSavedModel = true;
            }

            var hasCustom = false;//Track if it has a custom column
            for(var i=0;i<modelData.length;i++) {
                var colObj = modelData[i];
                if(!via.undef(colObj.isCustom) && colObj.isCustom===true){hasCustom = true;}
                //if(isSavedModel === false && colObj.isCustom === true){ continue; }//Don't add custom models the first run.
                odinLite_modelCache.addModelColumnTemplate(colObj,odinLite_modelCache.currentEntity.allowEditOfExistingTemplateColumns);
            }

            if(hasCustom === true){
                $('#modelDefinition_editModel').find('.customColumnButton').fadeIn();
            }else{
                $('#modelDefinition_editModel').find('.customColumnButton').hide();
            }

            //Disable the save button
            if(!via.undef(odinLite_modelCache.currentEntity.allowEditOfExistingTemplateColumns) &&
                odinLite_modelCache.currentEntity.allowEditOfExistingTemplateColumns === false){
                $('.modelDefinition_saveModelButton').prop('disabled',true);
            }
        }


        function updateSavedModelData(savedColumnInfo,columnInfo){
            var modelInfo = [];
            for(var i in  savedColumnInfo){
                var savedColumn = savedColumnInfo[i];
                //Make the model for the column
                var columnModel = {};
                columnModel.id = savedColumn.id;
                columnModel.isCustom = savedColumn.isCustom;
                columnModel.isNullAllowed = savedColumn.isNullAllowed;
                columnModel.name = savedColumn.name;

                for(var j in columnInfo){
                    var colInfo = columnInfo[j];
                    if(colInfo.id === savedColumn.id){
                        columnModel.description = colInfo.description;//Update description. it doesn't come through
                        //Define all the params
                        columnModel.applyDataTypeList = $.extend({},colInfo.applyDataTypeList);
                        columnModel.applyFXRateList = $.extend({},colInfo.applyFXRateList);
                        columnModel.applyFXReturnList = $.extend({},colInfo.applyFXReturnList);
                        columnModel.applyFactorList = $.extend({},colInfo.applyFactorList);
                        columnModel.applyUseColumnList = $.extend({},colInfo.applyUseColumnList);
                        columnModel.applyAllowableTextLengthList = $.extend({},colInfo.applyAllowableTextLengthList);
                        columnModel.applyIsNullAllowedList = $.extend({},colInfo.applyIsNullAllowedList);

                        //Get the default Values
                        if(!via.undef(savedColumn.applyDataTypeList) && !via.undef(savedColumn.applyDataTypeList.options) && savedColumn.applyDataTypeList.options.length>0){
                            columnModel.applyDataTypeList.defaultValue = savedColumn.applyDataTypeList.options[0];
                        }
                        if(!via.undef(savedColumn.applyFXRateList) && !via.undef(savedColumn.applyFXRateList.options) && savedColumn.applyFXRateList.options.length>0){
                            columnModel.applyFXRateList.defaultValue = savedColumn.applyFXRateList.options[0];
                        }
                        if(!via.undef(savedColumn.applyFXReturnList) && !via.undef(savedColumn.applyFXReturnList.options) && savedColumn.applyFXReturnList.options.length>0){
                            columnModel.applyFXReturnList.defaultValue = savedColumn.applyFXReturnList.options[0];
                        }
                        if(!via.undef(savedColumn.applyFactorList) && !via.undef(savedColumn.applyFactorList.options) && savedColumn.applyFactorList.options.length>0){
                            columnModel.applyFactorList.defaultValue = savedColumn.applyFactorList.options[0];
                        }
                        if(!via.undef(savedColumn.applyUseColumnList) && !via.undef(savedColumn.applyUseColumnList.options) && savedColumn.applyUseColumnList.options.length>0){
                            columnModel.applyUseColumnList.defaultValue = savedColumn.applyUseColumnList.options[0];
                        }
                        if(!via.undef(savedColumn.applyAllowableTextLengthList) && !via.undef(savedColumn.applyAllowableTextLengthList.options) && savedColumn.applyAllowableTextLengthList.options.length>0){
                            columnModel.applyAllowableTextLengthList.defaultValue = savedColumn.applyAllowableTextLengthList.options[0];
                        }
                        if(!via.undef(savedColumn.applyAllowableTextLengthList) && !via.undef(savedColumn.applyAllowableTextLengthList.defaultValue)){
                            columnModel.applyAllowableTextLengthList.maxLength = savedColumn.applyAllowableTextLengthList.defaultValue;
                        }
                        if(!via.undef(savedColumn.applyIsNullAllowedList) && !via.undef(savedColumn.applyIsNullAllowedList.options) && savedColumn.applyIsNullAllowedList.options.length>0){
                            columnModel.applyIsNullAllowedList.defaultValue = savedColumn.applyIsNullAllowedList.options[0];
                        }
                        break;
                    }
                }
                modelInfo.push(columnModel);
            }
            return modelInfo;
        }
    },

    /**
     * addModelColumnTemplate
     * This will add a column to the template
     */
    addModelColumnTemplate: function(colObj,allowEditOfExistingTemplateColumns){
        if(via.undef(allowEditOfExistingTemplateColumns,true)){//Set to false if it is missing
            allowEditOfExistingTemplateColumns = true;
        }

        var colTemplate = odinLite_modelCache.columnTemplate + "";

        //Edit the column template for this column
        //Replace the ID
        colTemplate = colTemplate.replace(/{column_idName}/g,colObj.id);
        //Replace the name
        colTemplate = colTemplate.replace(/{column_displayName}/g,colObj.name);

        //Add the columns to the template
        var newColumn = $(colTemplate);
        $(".modelColumnContainer").append( newColumn );

        //Apply Data Type List
        if(via.undef(colObj.applyDataTypeList) || via.undef(colObj.applyDataTypeList.label) || via.undef(colObj.applyDataTypeList.comboOptions,true)){
            newColumn.find(".applyDataTypeList_selector").hide();
        }else {
            newColumn.find(".applyDataTypeList_label").html(colObj.applyDataTypeList.label);
            var ddList = newColumn.find(".applyDataTypeList_input").kendoDropDownList({
                dataTextField: "text",
                dataValueField: "value",
                dataSource: colObj.applyDataTypeList.comboOptions,
                index: 0
            }).data('kendoDropDownList');
            if(colObj.applyDataTypeList.comboOptions.length === 1 || allowEditOfExistingTemplateColumns===false){
                ddList.enable(false);
            }
            if(!via.undef(colObj.applyDataTypeList.defaultValue)){
                ddList.value(colObj.applyDataTypeList.defaultValue);
            }
        }

        //applyFXRateList
        if(via.undef(colObj.applyFXRateList) || via.undef(colObj.applyFXRateList.label) || via.undef(colObj.applyFXRateList.comboOptions,true)){
            newColumn.find(".applyFXRateList_selector").hide();
        }else {
            newColumn.find(".applyFXRateList_label").html(colObj.applyFXRateList.label);
            var ddList = newColumn.find(".applyFXRateList_input").kendoDropDownList({
                dataTextField: "text",
                dataValueField: "value",
                dataSource: colObj.applyFXRateList.comboOptions,
                index: 0
            }).data('kendoDropDownList');
            if(colObj.applyFXRateList.comboOptions.length === 1 || allowEditOfExistingTemplateColumns===false){
                ddList.enable(false);
            }
            if(!via.undef(colObj.applyFXRateList.defaultValue)){
                ddList.value(colObj.applyFXRateList.defaultValue);
            }
        }

        //applyFXReturnList
        if(via.undef(colObj.applyFXReturnList) || via.undef(colObj.applyFXReturnList.label) || via.undef(colObj.applyFXReturnList.comboOptions,true)){
            newColumn.find(".applyFXReturnList_selector").hide();
        }else {
            newColumn.find(".applyFXReturnList_label").html(colObj.applyFXReturnList.label);
            var ddList = newColumn.find(".applyFXReturnList_input").kendoDropDownList({
                dataTextField: "text",
                dataValueField: "value",
                dataSource: colObj.applyFXReturnList.comboOptions,
                index: 0
            }).data('kendoDropDownList');
            if(colObj.applyFXReturnList.comboOptions.length === 1 || allowEditOfExistingTemplateColumns===false){
                ddList.enable(false);
            }
            if(!via.undef(colObj.applyFXReturnList.defaultValue)){
                ddList.value(colObj.applyFXReturnList.defaultValue);
            }
        }

        //applyFactorList
        if(via.undef(colObj.applyFactorList) || via.undef(colObj.applyFactorList.label) || via.undef(colObj.applyFactorList.comboOptions,true)){
            newColumn.find(".applyFactorList_selector").hide();
        }else {
            newColumn.find(".applyFactorList_label").html(colObj.applyFactorList.label);
            var ddList = newColumn.find(".applyFactorList_input").kendoDropDownList({
                dataTextField: "text",
                dataValueField: "value",
                dataSource: colObj.applyFactorList.comboOptions,
                index: 0
            }).data('kendoDropDownList');
            if(colObj.applyFactorList.comboOptions.length === 1 || allowEditOfExistingTemplateColumns===false){
                ddList.enable(false);
            }
            if(!via.undef(colObj.applyFactorList.defaultValue)){
                ddList.value(colObj.applyFactorList.defaultValue);
            }
        }

        //applyUseColumnList
        if(via.undef(colObj.applyUseColumnList) || via.undef(colObj.applyUseColumnList.label) || via.undef(colObj.applyUseColumnList.comboOptions,true)){
            newColumn.find(".applyUseColumnList_selector").hide();
        }else {
            newColumn.find(".applyUseColumnList_label").html(colObj.applyUseColumnList.label);
            var ddList = newColumn.find(".applyUseColumnList_input").kendoDropDownList({
                dataTextField: "text",
                dataValueField: "value",
                dataSource: colObj.applyUseColumnList.comboOptions,
                index: 0
            }).data('kendoDropDownList');
            if(colObj.applyUseColumnList.comboOptions.length === 1 || allowEditOfExistingTemplateColumns===false){
                ddList.enable(false);
            }
            if(!via.undef(colObj.applyUseColumnList.defaultValue)){
                ddList.value(colObj.applyUseColumnList.defaultValue);
            }
        }

        //applyAllowableTextLengthList
        if(via.undef(colObj.applyAllowableTextLengthList) || via.undef(colObj.applyAllowableTextLengthList.label) || via.undef(colObj.applyAllowableTextLengthList.comboOptions,true)){
            newColumn.find(".applyAllowableTextLengthList_selector").hide();
            newColumn.find(".applyAllowableTextLengthList_number_selector").hide();
        }else {
            newColumn.find(".applyAllowableTextLengthList_label").html(colObj.applyAllowableTextLengthList.label);
            var ddList = newColumn.find(".applyAllowableTextLengthList_input").kendoDropDownList({
                dataTextField: "text",
                dataValueField: "value",
                dataSource: colObj.applyAllowableTextLengthList.comboOptions,
                index: 0,
                change: function(e){
                    if(e.sender.value()==='DEFINED LENGTH'){
                        newColumn.find('.applyAllowableTextLengthList_number_selector').show();
                    }else{
                        newColumn.find('.applyAllowableTextLengthList_number_selector').hide();
                    }
                }
            }).data('kendoDropDownList');

            var numBox  = newColumn.find(".applyAllowableTextLengthList_number_input").kendoNumericTextBox({
                format: 'n0',
                min: 1,
                max: 8000,
                step: 1,
                decimals: 0,
                restrictDecimals: true
            }).data('kendoNumericTextBox');
            newColumn.data('numbox',numBox);
            if(colObj.applyAllowableTextLengthList.comboOptions.length === 1 || allowEditOfExistingTemplateColumns===false){
                ddList.enable(false);
            }
            if(!via.undef(colObj.applyAllowableTextLengthList.defaultValue)){
                ddList.value(colObj.applyAllowableTextLengthList.defaultValue);
                //Hide the numberic box
                if(colObj.applyAllowableTextLengthList.defaultValue === "DEFINED LENGTH"){
                    newColumn.find('.applyAllowableTextLengthList_number_selector').show();
                    if(!via.undef(colObj.applyAllowableTextLengthList.maxLength)){
                        numBox.value(colObj.applyAllowableTextLengthList.maxLength);
                    }else if(!via.undef(colObj.applyAllowableTextLengthList.additionalDefaultValue)){
                        numBox.value(colObj.applyAllowableTextLengthList.additionalDefaultValue);
                    }
                }else{
                    newColumn.find('.applyAllowableTextLengthList_number_selector').hide();
                }
            }
        }

        //applyIsNullAllowedList
        if(via.undef(colObj.applyIsNullAllowedList) || via.undef(colObj.applyIsNullAllowedList.label) || via.undef(colObj.applyIsNullAllowedList.comboOptions,true)){
            newColumn.find(".applyIsNullAllowedList_selector").hide();
        }else {
            newColumn.find(".applyIsNullAllowedList_label").html(colObj.applyIsNullAllowedList.label);
            var ddList = newColumn.find(".applyIsNullAllowedList_input").kendoDropDownList({
                dataTextField: "text",
                dataValueField: "value",
                dataSource: colObj.applyIsNullAllowedList.comboOptions,
                index: 0
            }).data('kendoDropDownList');
            if(colObj.applyIsNullAllowedList.comboOptions.length === 1 || allowEditOfExistingTemplateColumns===false){
                ddList.enable(false);
            }
            if(!via.undef(colObj.applyIsNullAllowedList.defaultValue)){
                ddList.value(colObj.applyIsNullAllowedList.defaultValue);
            }
        }

        //isCustom
        if(!via.undef(colObj.isCustom) && colObj.isCustom===true && allowEditOfExistingTemplateColumns === true){
            newColumn.find(".column_displayName").removeAttr("disabled");
            newColumn.find(".deleteCustomButton").show();
            newColumn.addClass("customColumnBorder");
            newColumn.find(".column_displayName").css("color","#0066cc");
        }else{
            newColumn.find(".column_displayName").css("color","#808080");
        }
    },

    /**
     * addCustomColumn
     * This will add a custom column to the model column definition
     */
    addCustomColumn: function(){
        var customColumns = [];
        for(var idx in odinLite_modelCache.currentEntity.columnInfo){
            var col = odinLite_modelCache.currentEntity.columnInfo[idx];
            if(col.isCustom === true){
                customColumns.push(col);
            }
        }

        $.get( "./html/modelCache_customColumnWindow.html", function( data ) {
            $('body').append(data);

            //Remove when closed
            $('#customColumnModalWindow').on('hidden.bs.modal', function (e) {
                $('#customColumnModalWindow').remove();
            });

            //Show the window
            $('#customColumnModalWindow').modal('show');
            //Populate the dd list
            var ddList = $('#customColumnModalWindow').find('.customColumnInput').kendoDropDownList({
                dataTextField: "name",
                dataValueField: "id",
                dataSource: customColumns,
                width: "300px",
                index: 0,
                change: function(e){
                    $('#customColumnModalWindow').find('.customColumnDescription').html(customColumns[e.sender.select()].description);
                }
            }).data('kendoDropDownList');
            //Set the Description
            $('#customColumnModalWindow').find('.customColumnDescription').html(customColumns[0].description);
            //Handle the event
            $('#customColumnModalWindow').find('.ok-customColumn-button').click(function(){
                var selectedColumn = customColumns[ddList.select()];
                odinLite_modelCache.addModelColumnTemplate(selectedColumn);
                $('.modelDefinition_saveModelButton').prop('disabled',false);
            });
        });
    },

    /**
     * deleteCustomColumn
     * This will delete a custom column from the model definition
     */
    deleteCustomColumn: function(id,btn){
        via.confirm("Delete Custom Column","Are you sure you want to delete this column?",function(){
            $(btn).parent().remove();
        });
    },

    /**
     * saveModelDefinition
     * This will save the model definition.
     */
    saveModelDefinition: function(){
        kendo.ui.progress($("body"), true);//Wait Message on

        //Get the save column objects
        var container = $('.modelColumnContainer');
        var saveColumns = [];
        for(var idx in odinLite_modelCache.currentEntity.columnInfo){
            var colInfo = odinLite_modelCache.currentEntity.columnInfo[idx];
            var columnContainers = container.find("."+colInfo.id);
            for(var i=0;i<columnContainers.length;i++){
                var colContainer = columnContainers[i];
                var addColumn = odinLite_modelCache.getColumnSaveDefinition(colContainer);
                if(!via.undef(addColumn.applyAllowableTextLength,true) && addColumn.applyAllowableTextLength.startsWith("DEFINED LENGTH") &&
                    addColumn.applyAllowableTextLength.endsWith("null") ) {
                    via.kendoAlert("Maximum Text Length", "Please define a maximum text length for "+addColumn.name+".");
                    kendo.ui.progress($("body"), false);//Wait Message on
                    return;
                }
                saveColumns.push(addColumn);
            }
        }

        //Check to make sure all custom columns that are required have at least one entry.
        //Also check if they have a name
        for(var idx in odinLite_modelCache.currentEntity.columnInfo){
            var col = odinLite_modelCache.currentEntity.columnInfo[idx];
            if(col.isCustom === true &&
                !via.undef(col.applyUseColumnList) &&
                !via.undef(col.applyUseColumnList.options) &&
                col.applyUseColumnList.options.length === 1){
                var isColIncluded = false;
                for(var i in saveColumns){
                    //Name Defined Check
                    if(via.undef(saveColumns[i].name) || saveColumns[i].name.trim().length === 0){
                        via.kendoAlert("Model Save Failed","All Columns required a name. Please check to be sure you named your columns.");
                        return;
                    }
                    //Custom Included Check
                    if(saveColumns[i].id === col.id){
                        isColIncluded = true;
                        break;
                    }
                }
                //Custom Column is required and not found.
                if(isColIncluded === false){
                    via.kendoAlert("Model Save Failed","Custom Column \"" + col.name + "\" is not in the model definition.");
                    return;
                }
            }
        }

        //Make the call to save the model
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.cacheModel.saveModelDefinition',
                saveColumns: JSON.stringify(saveColumns),
                modelId: odinLite_modelCache.currentModel.value,
                entityDir: odinLite.ENTITY_DIR,
                overrideUser: odinLite.OVERRIDE_USER
            },
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure saving model:", data.message);
                    via.kendoAlert("Save Model Failure", data.message);
                }else{
                    via.debug("Successful saving model:", data);
                    odinLite_modelCache.getModelInfo(odinLite_modelCache.currentModel.value,true);
                }
            },
            'json');

    },



    /**
     * downloadModelTemplate
     * download excel template for the saved model.
     */
    downloadModelTemplate: function() {
        if(via.undef(odinLite_modelCache.currentEntity.savedColumnInfo)){return;}

        var url = odin.SERVLET_PATH + "?action=odinLite.cacheModel.downloadTemplate" +
            "&modelId=" + odinLite_modelCache.currentModel.value +
            "&overrideUser=" + odinLite.OVERRIDE_USER +
            "&entityDir=" + odinLite.ENTITY_DIR;
        window.location = url;
    },

    /**
     * getColumnSaveDefinition
     * This will get the save info for a specific column
     */
    getColumnSaveDefinition: function(colContainer){
        var colObj = {};
        //ID
        colObj.id = $(colContainer).data("colid");

        //display name
        var displayName_textBox = $(colContainer).find('.column_displayName');
        if(!via.undef(displayName_textBox) && !via.undef(displayName_textBox.val())){
            colObj.name = displayName_textBox.val();
        };

        //applyUseColumnList
        var applyUseColumnList_dd = $(colContainer).find('span .applyUseColumnList_input').data('kendoDropDownList');
        if(!via.undef(applyUseColumnList_dd) && !via.undef(applyUseColumnList_dd.value())){
            colObj.applyUseColumn = applyUseColumnList_dd.value();
        };

        //applyDataTypeList
        var applyDataTypeList_dd = $(colContainer).find('span .applyDataTypeList_input').data('kendoDropDownList');
        if(!via.undef(applyDataTypeList_dd) && !via.undef(applyDataTypeList_dd.value())){
            colObj.applyDataType = applyDataTypeList_dd.value();
        };

        //applyFXRateList
        var applyFXRateList_dd = $(colContainer).find('span .applyFXRateList_input').data('kendoDropDownList');
        if(!via.undef(applyFXRateList_dd) && !via.undef(applyFXRateList_dd.value())){
            colObj.applyFXRate = applyFXRateList_dd.value();
        };

        //applyFXReturnList
        var applyFXReturnList_dd = $(colContainer).find('span .applyFXReturnList_input').data('kendoDropDownList');
        if(!via.undef(applyFXReturnList_dd) && !via.undef(applyFXReturnList_dd.value())){
            colObj.applyFXReturn = applyFXReturnList_dd.value();
        };

        //applyFactorList
        var applyFactorList_dd = $(colContainer).find('span .applyFactorList_input').data('kendoDropDownList');
        if(!via.undef(applyFactorList_dd) && !via.undef(applyFactorList_dd.value())){
            colObj.applyFactor = applyFactorList_dd.value();
        };

        //applyAllowableTextLengthList
        var applyAllowableTextLengthList_dd = $(colContainer).find('span .applyAllowableTextLengthList_input').data('kendoDropDownList');
        if(!via.undef(applyAllowableTextLengthList_dd) && !via.undef(applyAllowableTextLengthList_dd.value())){
            var applyAllowableTextLengthListVal = applyAllowableTextLengthList_dd.value();
            if(applyAllowableTextLengthListVal === "DEFINED LENGTH"){
                //var applyAllowableTextLengthList_num_dd = $(colContainer).find('.applyAllowableTextLengthList_number_input').data('kendoNumericTextBox');
                var applyAllowableTextLengthList_num_dd = $(colContainer).data('numbox');
                var numericVal = applyAllowableTextLengthList_num_dd.value();
                colObj.applyAllowableTextLength = applyAllowableTextLengthListVal+";"+numericVal;
            }else{
                colObj.applyAllowableTextLength = applyAllowableTextLengthListVal;
            }
        };

        //applyIsNullAllowedList
        var applyIsNullAllowedList_dd = $(colContainer).find('span .applyIsNullAllowedList_input').data('kendoDropDownList');
        if(!via.undef(applyIsNullAllowedList_dd) && !via.undef(applyIsNullAllowedList_dd.value())){
            colObj.applyIsNullAllowed = applyIsNullAllowedList_dd.value();
        };

        return colObj;
    },

    /**
     * getHelpLink
     * displays a help link window for the column
     */
    getHelpLink: function(colId){
        for(var i in odinLite_modelCache.currentEntity.columnInfo){
            var col = odinLite_modelCache.currentEntity.columnInfo[i];
            if(colId.indexOf(col.id)!==-1){
                via.displayHelpLink(col.name,col.description);
                break;
            }
        }
    },

    /**
     * goToUploadFiles
     * This will check to make sure everything is correct and then navigate to upload files.
     */
    goToUploadFiles: function(){
        $("#modelCachePanel").fadeOut(function(){
            //Initialize the upload files portion of the application
            odinLite_uploadFiles.init();
        });

    },

    displayColumnListInfo: function(){
        $.ajax({
            url: '/ODIN/ODINServlet/ODIN_LITE/GET_DISPLAY_COLUMN_LIST?modelId=' + odinLite_modelCache.currentModel.value,
            method: 'POST', // or GET
            success: function (response) {
                var sampleDataJSON = JSON.parse(response);

                odinLite_modelCache.displayGridWindow(sampleDataJSON.columnListSet);
            }
        });
    },

    displaySampleData: function(){
        $.ajax({
            url: '/ODIN/ODINServlet/ODIN_LITE/MODEL_SAMPLE_DATA?modelId=' + odinLite_modelCache.currentModel.value,
            method: 'POST', // or GET
            success: function (response) {
                var sampleDataJSON = JSON.parse(response);
                console.log(sampleDataJSON);

                odinLite_modelCache.displayGridWindow(sampleDataJSON.modelTemplate);
            }
        });
    },

    /** Displays sample input table data in modal **/
    displayGridWindow: function(sampleData) {
        var columnHeaders = sampleData['columnHeaders'];
        var tableSet = sampleData['data'];
        var sampleDataTitle = sampleData['tableLabel'];

        sampleData['columnWidths'] = [];

        $('body').append('<div id="sample-data-modal"><div id="sample-data-table"></div></div>');

        odinTable.createTable("sample-table", sampleData, '#sample-data-table', null);

        var grid = $('#sample-table').data("kendoGrid");
        if(grid.columns.length > 6 && grid.columns[6].title === 'Column Description'){
            var col = grid.columns[6];
            col.template = function(dataItem) {
                console.log(dataItem['_Column_Description6']);
                return dataItem['_Column_Description6'];
            }
            grid.columns[6] = col;
        }
        grid.setOptions({
            columns: grid.columns,
            pageable: false,
            groupable: false,
            scrollable: false
        });

        var dialog = $('#sample-data-modal');

        var window;

        //Make the window.
        window = dialog.kendoWindow({
            title: sampleDataTitle,
            draggable: false,
            modal:true,
            width: "75%",
            height: "75%",
            actions: [
                "Maximize",
                "Close"
            ],
            resize: function () {
            },
            close: function () {
                window = null;
                $('#sample-data-modal').remove();
            }
        }).data("kendoWindow");

        window.center();
    }
};