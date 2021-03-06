/**
 * Created by rocco on 4/17/2018.
 * This is the manage data js file for the ODIN Lite application.
 * This will handle everything to do with the manage data part of the application.
 */
var odinLite_manageData = {
    /* Variables */
    hasBeenLoaded: false,//Whether this has been loaded before.
    tableIndexType: -1, //Table Index Type for the currently selected model.
    currentDataItem: null,//Will hold the last loaded data item
    currentTableData: null, //Will hold the current table
    currentTotalItems: 0, //Will hold the total number of items of the current table
    parentVal: null, //holds the parent val of the last selected node
    currentDataItemList: null,

    /**
     * init
     * This will initialize ODIN Lite Upload Files and set it up
     */
    init: function () {
        kendo.ui.progress($("body"), true);//Wait Message
        //Reset the items
        odinLite_manageData.currentDataItem = null;
        odinLite_manageData.currentTableData = null;
        $('#manageData_tableSelection').hide();
        $("#manageData_existingEntity").removeClass("col-md-12");
        $("#manageData_existingEntity").addClass("col-md-6");
        $(".manageData_tableSpreadhseetContainer").find(".maximizeButton").attr("title", "Maximize");
        $(".manageData_tableSpreadhseetContainer").find(".maximizeButtonIcon").removeClass("fa-compress");
        $(".manageData_tableSpreadhseetContainer").find(".maximizeButtonIcon").addClass("fa-expand");
        $('.manageData_entityInfo').show();
        $('.manageData_modelInfo').show();
        $(".manageData_entitySize").empty();


        //Make the call to get the initial values for Model Cache
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.manageData.init',
                entityDir: odinLite.ENTITY_DIR,
                overrideUser: odinLite.OVERRIDE_USER,
                isDataManagerUser: odinLite.isDataManagerUser,
                appId: odinLite.currentApplication
            },
            function (data, status) {
                odinLite_manageData.hasBeenLoaded = true;//Set the loaded variable after first load.
                kendo.ui.progress($("body"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure getting model data:", data.message);
                    via.kendoAlert("Load Failure", data.message);
                } else {
                    via.debug("Successful getting model data:", data);

                    //Show the panels.
                    $('#viewPanel').fadeIn();

                    var modelListLength = Object.keys(data.modelList).length;
                    if (modelListLength === 0) {
                        via.kendoAlert("Load Failure", "User not permissioned for any models.");
                        return;
                    }

                    //Reset in case they were accessed before:
                    $('#manageData_welcomeMessage').fadeIn();
                    $('#manageData_existingEntity').hide();

                    //Display the size of the entity
                    //Model Size
                    if (!via.undef(data.entitySize)) {
                        var formattedSize = via.getReadableFileSizeString(data.entitySize);
                        $(".manageData_entitySize").html(" <i><small>(size: " + formattedSize + ") </small></i>");
                    }

                    if (!via.undef(odinLite.isDataManagerUser) && odinLite.isDataManagerUser === true) {
                        odinLite_manageData.createDataManagerModelTree(data);
                    } else {
                        odinLite_manageData.createModelTree(data.modelList, data.requiredModels, data.optionalModels);
                    }
                    $('#viewPanel').fadeIn();
                }
            },
            'json');
    },


    /**
     * deleteTablesWindow
     * This will allow choosing of the tables for deletion.
     */
    deleteTablesWindow: function () {
        if (via.undef(odinLite_manageData.currentDataItemList) || odinLite_manageData.currentDataItemList.length === 0) {
            return;
        }
        /** Window Setup **/
        kendo.ui.progress($("body"), true);//Wait Message
        $.get("./html/deleteTablesWindow.html", function (deleteTablesWindowTemplate) {
            kendo.ui.progress($("body"), false);//Wait Message

            $('#odinLite_deleteTablesWindow').remove();
            $('body').append(deleteTablesWindowTemplate);
            //Make the window.
            var deleteTablesWindow = $('#odinLite_deleteTablesWindow').kendoWindow({
                title: "Delete Data Item Chooser",
                draggable: false,
                resizable: false,
                width: "450px",
                height: "450px",
                modal: true,
                close: false,
                actions: [
                    "Maximize",
                    "Close"
                ],
                close: function () {
                    deleteTablesWindow = null;
                    $('#odinLite_deleteTablesWindow').remove();
                }
            }).data("kendoWindow");

            deleteTablesWindow.center();


            //Check for Demo Account
            if (odinLite_manageData.currentModel.value.startsWith("DEMO_")) {
                $(".fileFormat_deleteDataItemButton").prop("disabled", true);
            } else {
                $(".fileFormat_deleteDataItemButton").prop("disabled", false);
            }


            /** Window Setup **/
            $('.fileFormat_deleteDataItemButton').click(function () {
                var checkedNodes = [];
                var parentNodes = [];
                var treeView = $("#manageData_deleteTreeview").data('kendoTreeView');
                checkedNodeIds(treeView.dataSource.view(), checkedNodes, parentNodes);

                //We need to null out port dir.
                if (odinLite_manageData.tableIndexType !== 3) {
                    parentNodes = null;
                }

                if (checkedNodes.length === 0) {
                    return;
                }//Don't delete if zero selected.

                //Close the window.
                deleteTablesWindow.close();
                via.confirm("Delete Data Items", "Are you sure you want to delete " + checkedNodes.length + " data item(s)? This action cannot be undone.", function () {
                    deleteFromServer();
                });

                //Delete form the server.
                function deleteFromServer() {
                    kendo.ui.progress($("#odinLite_deleteTablesWindow"), true);//Wait Message
                    $.post(odin.SERVLET_PATH,
                        {
                            action: 'odinLite.manageData.deleteTableFromCache',
                            modelId: odinLite_manageData.currentModel.value,
                            portDir: (parentNodes === null) ? null : JSON.stringify(parentNodes),
                            dataItems: JSON.stringify(checkedNodes),
                            entityDir: odinLite.ENTITY_DIR,
                            overrideUser: odinLite.OVERRIDE_USER
                        },
                        function (data, status) {
                            kendo.ui.progress($("#odinLite_deleteTablesWindow"), false);//Wait Message off

                            if (!via.undef(data, true) && data.success === false) {
                                via.debug("Failure deleting table:", data.message);
                                via.kendoAlert("Delete Failure", data.message);
                            } else {
                                via.debug("Successful delete:", data);
                                odinLite_manageData.getItemTreeList();
                            }
                        },
                        'json');
                }

            });

            /** For the data item tree **/
            //Create the Data Source
            var processDataSource = new kendo.data.HierarchicalDataSource({
                sort: {field: "text", dir: "asc"},
                data: odinLite_manageData.currentDataItemList
            });

            //Make the tree and get rid of old tree.
            if (!via.undef($("#manageData_deleteTreeview").data('kendoTreeView'))) {
                $("#manageData_tableTreeview").data('kendoTreeView').destroy();
            }
            $("#manageData_deleteTreeview").empty();
            $("#manageData_deleteTreeview").kendoTreeView({
                checkboxes: {
                    checkChildren: true,
                    //template: "<input style='position:relative;top:3px;left:3px;' type='checkbox' name='checkedFiles[#= item.id #]' value='true' />"
                    template: "# if(!item.hasChildren){# <input style='position:relative;top:3px;left:3px;' type='checkbox'  name='checkedFiles[#= item.id #]' value='true' />#}#"
                },
                dataSource: processDataSource,
                //dataSpriteCssClassField: "iconCls",
                expand: function (e) {
                    if ($("#manageData_deleteFilterText").val() == "") {
                        $(e.node).find("li").show();
                    }
                }
            });

            //Check and unchck all nodes
            $('#manageData_selectAllButton').click(function () {
                selectAll();
            });
            $('#manageData_deselectAllButton').click(function () {
                deselectAll();
            });

            //Expand and Collapse Tree
            $('#manageData_deleteExpandButton').click(function () {
                var treeview = $("#manageData_deleteTreeview").data("kendoTreeView");
                treeview.expand(".k-item");
            });
            $('#manageData_deleteCollapseButton').click(function () {
                var treeview = $("#manageData_deleteTreeview").data("kendoTreeView");
                treeview.collapse(".k-item");
            });

            $("#manageData_deleteFilterText").keyup(function (e) {
                if (e.keyCode == 13) {
                    var changeReport_filterText = $(this).val();
                    filterTableList(changeReport_filterText);
                }
            });
            $("#manageData_deleteFilterButton").click(function () {
                var changeReport_filterText = $("#manageData_deleteFilterText").val();
                filterTableList(changeReport_filterText);
            });

            //function that filters the table.
            function filterTableList(changeReport_filterText) {
                deselectAll();

                if (changeReport_filterText !== "") {
                    $("#manageData_deleteTreeview .k-group .k-group .k-in").closest("li").hide();
                    $("#manageData_deleteTreeview .k-group").closest("li").hide();
                    $("#manageData_deleteTreeview .k-group .k-group .k-in:containsi(" + changeReport_filterText + ")").each(function () {
                        $(this).parents("ul, li").each(function () {
                            var treeView = $("#manageData_tableTreeview").data("kendoTreeView");
                            treeView.expand($(this).parents("li"));
                            $(this).show();
                        });
                    });
                    $("#manageData_deleteTreeview .k-group .k-in:contains(" + changeReport_filterText + ")").each(function () {
                        $(this).parents("ul, li").each(function () {
                            $(this).show();
                        });
                    });
                }
                else {
                    $("#manageData_deleteTreeview .k-group").find("li").show();
                    var nodes = $("#manageData_tableTreeview > .k-group > li");

                    $.each(nodes, function (i, val) {
                        if (nodes[i].getAttribute("data-expanded") == null) {
                            $(nodes[i]).find("li").hide();
                        }
                    });
                }

            }

            // function that gathers IDs of checked nodes
            function checkedNodeIds(nodes, checkedNodes, parentNodes) {
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].checked) {
                        checkedNodes.push(nodes[i].text);
                        if (!via.undef(nodes[i].parentNode()) && odinLite_manageData.tableIndexType === 3) {
                            parentNodes.push(nodes[i].parentNode().text);
                        }
                    }
                    if (nodes[i].hasChildren) {
                        checkedNodeIds(nodes[i].children.view(), checkedNodes, parentNodes);
                    }
                }
            }

            // function that unchecks all nodes
            function deselectAll() {
                $("#manageData_deleteTreeview input").prop("checked", false).trigger("change");
            }

            // function that checks all nodes that are visible
            function selectAll() {
                $("#manageData_deleteTreeview input:visible").prop("checked", true).trigger("change");
            }

            /******/

        });


        kendo.ui.progress($("body"), false);//Wait Message
    },

    /**
     * createDataManagerModelTree
     * This will create the tree to allow model selection for Data Manager Users
     */
    createDataManagerModelTree: function (data) {
        odinLite_manageData.currentDataItem = null;
        odinLite_manageData.currentTableData = null;

        //Get the data in the correct format.
        var treeData = JSON.parse(JSON.stringify(data.modelList));
        var kendoTreeData = [];
        for (var i = 0; i < treeData.length; i++) {
            var node = treeData[i];
            kendoTreeData = renameChildren(kendoTreeData, node, true);
        }
        function renameChildren(kendoTreeData, node, isRoot) {//Recursive function. All it does it rename children to items.
            //Recursive - If it has children call this method again.
            if (!via.undef(node.children) && node.children.length > 0) {
                for (var i = 0; i < node.children.length; i++) {
                    var childNode = node.children[i];
                    kendoTreeData = renameChildren(kendoTreeData, childNode, false);
                }
                node.items = node.children;
                node.children = null;
                delete node.children;
            }
            if (isRoot === true) {
                kendoTreeData.push(node);
            }
            return kendoTreeData;
        }

        //End - Get data

        //Create the Data Source
        var processDataSource = new kendo.data.HierarchicalDataSource({
            sort: {field: "text", dir: "asc"},
            data: kendoTreeData
        });

        //Make the tree
        //$("#modelCacheSelection_treeview").empty();
        if (!via.undef($("#manageData_modelTreeview").data('kendoTreeView'))) {
            $("#manageData_modelTreeview").data('kendoTreeView').destroy();
            $("#manageData_modelTreeview").empty();
        }
        $("#manageData_modelTreeview").kendoTreeView({
            dataSource: processDataSource,
            dataSpriteCssClassField: "iconCls",
            expand: function (e) {
                if ($("#modelCacheSelection_filterText").val() == "") {
                    $(e.node).find("li").show();
                }
            },
            change: function (e) {
                var selected = this.select();
                if (via.undef(selected)) {
                    return false;
                }
                var item = this.dataItem(selected);
                if (via.undef(item)) {
                    return false;
                }
                if (item.hasChildren) {
                    return false;
                }
                if (via.undef(item.value)) {
                    return false;
                }

                //Get the current model selected
                odinLite_manageData.currentModel = {
                    value: item.value,
                    text: item.text,
                    description: item.description
                };

                $(".manageData_tableSpreadhseetContainer").hide();
                odinLite_manageData.getItemTreeList();
                //(item.value,true);

                //Check for Demo Account
                if (item.value.startsWith("DEMO_")) {
                    $(".demoButton").prop("disabled", true);
                } else {
                    $(".demoButton").prop("disabled", false);
                }
            }
        });

        //Expand and Collapse Tree
        $('#manageData_modelExpandButton').click(function () {
            var treeview = $("#manageData_modelTreeview").data("kendoTreeView");
            treeview.expand(".k-item");
        });
        $('#manageData_modelCollapseButton').click(function () {
            var treeview = $("#manageData_modelTreeview").data("kendoTreeView");
            treeview.collapse(".k-item");
        });

        $("#manageData_modelFilterText").keyup(function (e) {
            var changeReport_filterText = $(this).val();
            if (changeReport_filterText !== "") {
                $("#manageData_modelTreeview .k-group .k-group .k-in").closest("li").hide();
                $("#manageData_modelTreeview .k-group").closest("li").hide();
                $("#manageData_modelTreeview .k-group .k-group .k-in:containsi(" + changeReport_filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        var treeView = $("#manageData_modelTreeview").data("kendoTreeView");
                        treeView.expand($(this).parents("li"));
                        $(this).show();
                    });
                });
            }
            else {
                $("#manageData_modelTreeview .k-group").find("li").show();
                var nodes = $("#manageData_modelTreeview > .k-group > li");

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
    createModelTree: function (modelList, requiredModels, optionalModels) {
        odinLite_manageData.currentDataItem = null;
        odinLite_manageData.currentTableData = null;

        //Build the Tree Data
        var kendoTreeData = [];
        $.each(modelList, function (key, modelArr) {
            if (via.undef(modelArr)) {
                return;
            }

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

            for (var i = 0; i < modelArr.length; i++) {
                var modelObj = {};
                modelObj.text = modelArr[i][1];
                modelObj.value = modelArr[i][0];
                if (modelArr[i].length > 2) {
                    modelObj.description = modelArr[i][2];
                }
                modelObj.iconCls = "leafArrowCls";

                //Optional / Required
                if (!via.undef(requiredModels) && $.inArray(modelObj.value, requiredModels) !== -1) {
                    requiredObj.items.push(modelObj);
                } else if (!via.undef(optionalModels) && $.inArray(modelObj.value, optionalModels) !== -1) {
                    optionalObj.items.push(modelObj);
                } else {
                    continue;
                }
            }

            if (requiredObj.items.length > 0) {
                applicationObj.items.push(requiredObj);
            }
            if (optionalObj.items.length > 0) {
                applicationObj.items.push(optionalObj);
            }
            if (applicationObj.items.length > 0) {
                kendoTreeData.push(applicationObj);
            }
        });
        //End - Build the Tree Data

        //Create the Data Source
        var processDataSource = new kendo.data.HierarchicalDataSource({
            sort: {field: "text", dir: "asc"},
            data: kendoTreeData
        });

        //Make the tree
        //$("#modelCacheSelection_treeview").empty();
        if (!via.undef($("#manageData_modelTreeview").data('kendoTreeView'))) {
            $("#manageData_modelTreeview").data('kendoTreeView').destroy();
            $("#manageData_modelTreeview").empty();
        }
        $("#manageData_modelTreeview").kendoTreeView({
            dataSource: processDataSource,
            dataSpriteCssClassField: "iconCls",
            expand: function (e) {
                if ($("#modelCacheSelection_filterText").val() == "") {
                    $(e.node).find("li").show();
                }
            },
            change: function (e) {
                var selected = this.select();
                if (via.undef(selected)) {
                    return false;
                }
                var item = this.dataItem(selected);
                if (via.undef(item)) {
                    return false;
                }
                if (item.hasChildren) {
                    return false;
                }
                if (via.undef(item.value)) {
                    return false;
                }

                //Get the current model selected
                odinLite_manageData.currentModel = {
                    value: item.value,
                    text: item.text,
                    description: item.description
                };

                $("#manageData_tableFilterText").val(null);
                $("#manageData_folderFilterText").val(null);
                $(".manageData_tableSpreadhseetContainer").hide();
                odinLite_manageData.getItemTreeList();
                //(item.value,true);

                //Check for Demo Account
                if (item.value.startsWith("DEMO_")) {
                    $(".demoButton").prop("disabled", true);
                } else {
                    $(".demoButton").prop("disabled", false);
                }
            }
        });

        //Expand and Collapse Tree
        $('#manageData_modelExpandButton').click(function () {
            var treeview = $("#manageData_modelTreeview").data("kendoTreeView");
            treeview.expand(".k-item");
        });
        $('#manageData_modelCollapseButton').click(function () {
            var treeview = $("#manageData_modelTreeview").data("kendoTreeView");
            treeview.collapse(".k-item");
        });

        $("#manageData_modelFilterText").keyup(function (e) {
            var changeReport_filterText = $(this).val();
            if (changeReport_filterText !== "") {
                $("#manageData_modelTreeview .k-group .k-group .k-in").closest("li").hide();
                $("#manageData_modelTreeview .k-group").closest("li").hide();
                $("#manageData_modelTreeview .k-group .k-group .k-in:containsi(" + changeReport_filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        var treeView = $("#manageData_modelTreeview").data("kendoTreeView");
                        treeView.expand($(this).parents("li"));
                        $(this).show();
                    });
                });
            }
            else {
                $("#manageData_modelTreeview .k-group").find("li").show();
                var nodes = $("#manageData_modelTreeview > .k-group > li");

                $.each(nodes, function (i, val) {
                    if (nodes[i].getAttribute("data-expanded") === null) {
                        $(nodes[i]).find("li").hide();
                    }
                });
            }
        });
    },

    /**
     * getItemTreeList
     * This will return the tree list of items/tables for the selected model.
     */
    getItemTreeList: function (isFilter,maxElements) {
        if (isFilter) {
            kendo.ui.progress($('#manageData_tableSelection'), true);//Wait Message
        } else {
            kendo.ui.progress($("body"), true);//Wait Message
        }

        var entityDir = odinLite.ENTITY_DIR;
        var modelId = odinLite_manageData.currentModel.value;
        odinLite_manageData.currentDataItem = null;

        //Show the model name and desc
        $("#manageData_existingEntity").fadeIn();
        $("#manageData_welcomeMessage").hide();
        $(".manageData_modelName").html(odinLite_manageData.currentModel.text);
        if (!via.undef(odinLite_manageData.currentModel.description)) {
            $(".manageData_modelDescription").html(odinLite_manageData.currentModel.description);
        }


        if (!isFilter) {
            $('#manageData_tableSelection').hide();
        }
        $(".manageData_tableSpreadhseetContainer").hide();
        $('#manageData_totalRows').empty();
        $('#manageData_deleteTableButton').attr("disabled", true);

        //Make the call to get the initial values for Model Cache
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.manageData.getItemTreeList',
                entityDir: entityDir,
                modelId: modelId,
                itemFilter: $("#manageData_tableFilterText").val(),
                portFilter: $("#manageData_folderFilterText").val(),
                overrideUser: odinLite.OVERRIDE_USER,
                isRefresh: isFilter,
                maxElementsOverride: maxElements
            },
            function (data, status) {
                if (isFilter) {
                    kendo.ui.progress($('#manageData_tableSelection'), false);//Wait Message
                } else {
                    kendo.ui.progress($("body"), false);//Wait Message
                }

                //Model Size
                if (!via.undef(data.modelSize)) {
                    var formattedSize = via.getReadableFileSizeString(data.modelSize);
                    $(".manageData_modelName").append(" <i><small>(size: " + formattedSize + ") </small></i>");
                }

                //Save the index table type
                odinLite_manageData.tableIndexType = data.tableIndexType;

                $(".manageData_zeroTablesFound").hide();
                $(".manageData_tablesFound").hide();
                $(".manageData_zeroTablesFound").empty();
                if (odinLite_manageData.tableIndexType === 3) {
                    $("#manageData_folderFilterText").show();
                } else {
                    $("#manageData_folderFilterText").hide();
                }

                if (!via.undef(data, true) && data.success === false && !isFilter && data.totalItems === 0) {
                    via.debug("Failure getting model items:", data.message);
                    //via.kendoAlert("Load Failure", data.message);
                    $(".manageData_zeroTablesFound").html(data.message);
                    $(".manageData_zeroTablesFound").show();
                    $(".manageData_tableTreeview").hide();
                    $('#manageData_tableSelection').fadeIn();
                    odinLite_manageData.currentDataItemList = null;
                    return;
                }

                //Update Total Rows
                if (via.undef(isFilter) || isFilter !== true) {
                    odinLite_manageData.currentTotalItems = data.totalItems;
                }

                //Found tables
                via.debug("Successful getting model items:", data);
                $(".manageData_tablesFound").show();

                //Show rows
                if (data.totalItems > data.MAX_ELEMENTS || !via.undef(maxElements,true)) {
                    //$('#manageData_totalRows').html("<i>Displaying only " + kendo.toString(data.MAX_ELEMENTS, "#,###") + " of " + kendo.toString(data.totalItems, "#,###") + " items. Please apply Data Item Filter.</i>");

                    $('#manageData_totalRows').html("Displaying only " + "<input style=\"width:85px;\" class=\"itemList_maxElements\"/>" + " of " + kendo.toString(data.totalItems, "#,###") + " items. Please apply Data Item Filter.</i>");
                    $(".itemList_maxElements").kendoDropDownList({
                        dataTextField: "text",
                        dataValueField: "value",
                        dataSource: [
                            {text: "200",value:200},
                            {text: "500",value:500},
                            {text: "1,000",value:1000}
                        ],
                        value: data.MAX_ELEMENTS,
                        change: function(e){
                            var val = e.sender.value();
                            odinLite_manageData.getItemTreeList(false,val);
                        }
                    });
                } else if (!via.undef(isFilter) && isFilter === true) {
                    $('#manageData_totalRows').html("<b>Filter:</b> Displaying " + kendo.toString(data.totalItems, "#,###") + " of " + kendo.toString(odinLite_manageData.currentTotalItems, "#,###") + " items.")
                }

                if (data.totalItems === 0) {
                    $('#manageData_deleteTableButton').attr("disabled", true);
                } else {
                    $('#manageData_deleteTableButton').attr("disabled", false);
                }

                /*******/
                //Populate data item tree
                //Get the data in the correct format.
                var treeData = [];
                if (!via.undef(data) && !via.undef(data.itemList) && data.itemList.length > 0) {
                    treeData = JSON.parse(JSON.stringify(data.itemList));
                }

                var kendoTreeData = [];
                for (var i = 0; i < treeData.length; i++) {
                    var node = treeData[i];
                    kendoTreeData = renameChildren(kendoTreeData, node, true);
                }

                odinLite_manageData.currentDataItemList = kendoTreeData;
                function renameChildren(kendoTreeData, node, isRoot) {//Recursive function. All it does it rename children to items.
                    //Recursive - If it has children call this method again.
                    if (!via.undef(node.children) && node.children.length > 0) {
                        for (var i = 0; i < node.children.length; i++) {
                            var childNode = node.children[i];
                            kendoTreeData = renameChildren(kendoTreeData, childNode, false);
                        }
                        node.items = node.children;
                        node.children = null;
                        delete node.children;
                    }
                    if (isRoot === true) {
                        kendoTreeData.push(node);
                    }
                    return kendoTreeData;
                }

                //End - Get data

                //Create the Data Source
                var processDataSource = new kendo.data.HierarchicalDataSource({
                    sort: {field: "text", dir: "asc"},
                    data: kendoTreeData
                });

                //Make the tree and get rid of old tree.
                var manageData_tableTreeview = $("#manageData_tableTreeview");
                if (!via.undef(manageData_tableTreeview.data('kendoTreeView'))) {
                    manageData_tableTreeview.data('kendoTreeView').destroy();
                }
                manageData_tableTreeview.empty();
                manageData_tableTreeview.kendoTreeView({
                    dataSource: processDataSource,
                    dataSpriteCssClassField: "iconCls",
                    expand: function (e) {
                        if ($("#manageData_tableFilterText").val() == "") {
                            $(e.node).find("li").show();
                        }
                    },
                    change: function (e) {
                        var selected = this.select();
                        if (via.undef(selected)) {
                            return false;
                        }
                        var item = this.dataItem(selected);
                        if (via.undef(item)) {
                            return false;
                        }
                        if (item.hasChildren) {
                            return false;
                        }
                        if (via.undef(item.value)) {
                            return false;
                        }

                        odinLite_manageData.parentVal = null;
                        if (!via.undef(item.parentNode()) && odinLite_manageData.tableIndexType === 3) {
                            odinLite_manageData.parentVal = item.parentNode().value;
                        }
                        odinLite_manageData.getDataItemTable(item.value);//Display the table on the screen
                    }
                });


                //Expand and Collapse Tree
                $('#manageData_tableExpandButton').off();
                $('#manageData_tableExpandButton').click(function () {
                    var treeview = $("#manageData_tableTreeview").data("kendoTreeView");
                    treeview.expand(".k-item");
                });
                $('#manageData_tableCollapseButton').off();
                $('#manageData_tableCollapseButton').click(function () {
                    var treeview = $("#manageData_tableTreeview").data("kendoTreeView");
                    treeview.collapse(".k-item");
                });
                $('#manageData_tableFilterText').off();
                $("#manageData_tableFilterText").keyup(function (e) {
                    if (e.keyCode == 13) {
                        //var changeReport_filterText = $(this).val();
                        //filterTableList(changeReport_filterText);
                        odinLite_manageData.getItemTreeList(true);
                    }
                });
                $('#manageData_folderFilterText').off();
                $("#manageData_folderFilterText").keyup(function (e) {
                    if (e.keyCode == 13) {
                        //var changeReport_filterText = $(this).val();
                        //filterTableList(changeReport_filterText);
                        odinLite_manageData.getItemTreeList(true);
                    }
                });
                $('#manageData_tableSearchButton').off();
                $("#manageData_tableSearchButton").click(function () {
                    //var changeReport_filterText = $("#manageData_tableFilterText").val();
                    //filterTableList(changeReport_filterText);
                    odinLite_manageData.getItemTreeList(true);
                });

                /******/

                $('#manageData_tableSelection').fadeIn();
            },
            'json');

        function filterTableList(changeReport_filterText) {
            if (changeReport_filterText !== "") {
                $("#manageData_tableTreeview .k-group .k-group .k-in").closest("li").hide();
                $("#manageData_tableTreeview .k-group").closest("li").hide();
                $("#manageData_tableTreeview .k-group .k-group .k-in:containsi(" + changeReport_filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        var treeView = $("#manageData_tableTreeview").data("kendoTreeView");
                        treeView.expand($(this).parents("li"));
                        $(this).show();
                    });
                });
                $("#manageData_tableTreeview .k-group .k-in:contains(" + changeReport_filterText + ")").each(function () {
                    $(this).parents("ul, li").each(function () {
                        $(this).show();
                    });
                });
            }
            else {
                $("#manageData_tableTreeview .k-group").find("li").show();
                var nodes = $("#manageData_tableTreeview > .k-group > li");

                $.each(nodes, function (i, val) {
                    if (nodes[i].getAttribute("data-expanded") == null) {
                        $(nodes[i]).find("li").hide();
                    }
                });
            }
        }
    },

    filterDataItemTable: function (portId, item) {
        kendo.ui.progress($("body"), true);//Wait Message off

        //Make the call to get the table selected for this model
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.manageData.getDataItemTable',
                modelId: modelId,
                entityDir: entityDir,
                dataItem: dataItem,
                portDir: odinLite_manageData.parentVal,
                overrideUser: odinLite.OVERRIDE_USER
            },
            function (data, status) {
                kendo.ui.progress($("body"), false);//Wait Message off
                $("html, body").animate({
                    scrollTop: 0
                }, 250);

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure getting data items:", data.message);
                    via.kendoAlert("Get Data Items Failure", data.message);
                } else {
                    via.debug("Successful getting data item:", data);


                }
            },
            'json');
    },

    /**
     * getDataItemTable
     * This will retrieve a data item and display it on the screen
     */
    getDataItemTable: function (dataItem) {
        var entityDir = odinLite.ENTITY_DIR;
        var modelId = odinLite_manageData.currentModel.value;
        $('#manageData_editModeLabel').hide();

        //if(odinLite_manageData.currentDataItem === dataItem && odinLite_manageData.tableIndexType !== 3){ return; }

        odinLite_manageData.currentDataItem = dataItem;
        kendo.ui.progress($("body"), true);//Wait Message


        //Make the call to get the table selected for this model
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.manageData.getDataItemTable',
                modelId: modelId,
                entityDir: entityDir,
                dataItem: dataItem,
                portDir: odinLite_manageData.parentVal,
                overrideUser: odinLite.OVERRIDE_USER
            },
            function (data, status) {
                kendo.ui.progress($("body"), false);//Wait Message off
                $("html, body").animate({
                    scrollTop: 0
                }, 250);

                //JSON parse does not like NaN
                if (!via.undef(data, true)) {
                    data = JSON.parse(data.replace(/\bNaN\b/g, "null"));
                }

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure getting data item:", data.message);
                    via.kendoAlert("Get Data Item Failure", data.message);
                } else {
                    via.debug("Successful getting data item:", data);

                    odinLite_manageData.currentTableData = data.tsEncoded;
                    odinLite_manageData.currentTableData.requiredColumns = data.requiredColumns;
                    var sheetData = odinLite_fileFormat.getSpreadsheetDataFromTableSet(data.tsEncoded, false, false);
                    if (!via.undef(data.tsEncoded.tableLabel, true)) {
                        sheetData.name = data.tsEncoded.tableLabel;
                        $('.manageData_tableSpreadhseetName').html(data.tsEncoded.tableLabel);
                    } else {
                        $('.manageData_tableSpreadhseetName').html("Table Preview");
                    }

                    //Insert the sheet preview.
                    if (!via.undef($("#manageData_tableSpreadhseet").data('kendoSpreadsheet'))) {
                        $("#manageData_tableSpreadhseet").data('kendoSpreadsheet').destroy();
                    }

                    //Freeze the top Row.
                    sheetData.frozenRows = 1;

                    $(".manageData_tableSpreadhseetContainer").show();
                    $("#manageData_tableSpreadhseet").empty();
                    $("#manageData_tableSpreadhseet").kendoSpreadsheet({
                        //height: '200px',
                        headerHeight: 20,
                        //headerWidth: 0,
                        toolbar: false,
                        sheetsbar: false,
                        rows: null,
                        columns: null,
                        sheets: [sheetData]
                    });
                    $("#manageData_tableSpreadhseet .k-spreadsheet-sheets-bar-add").hide();
                    $("#manageData_tableSpreadhseet .k-link").prop("disabled", true);

                    $('.manageData_tableSpreadhseetContainer').fadeIn();
                }
            },
            'text');
    },

    /**
     * maximizeSheet
     * This will attempt to maximize a the spreadsheet
     */
    maximizeSheet: function () {
        $('.manageData_entityInfo').toggle();
        $('.manageData_modelInfo').toggle();
        $('#manageData_tableSelection').toggle();

        if ($("#manageData_existingEntity").hasClass("col-md-6")) {
            $("#manageData_existingEntity").removeClass("col-md-6");
            $("#manageData_existingEntity").addClass("col-md-12");
            $(".manageData_tableSpreadhseetContainer").find(".maximizeButton").attr("title", "Minimize");
            $(".manageData_tableSpreadhseetContainer").find(".maximizeButtonIcon").removeClass("fa-expand");
            $(".manageData_tableSpreadhseetContainer").find(".maximizeButtonIcon").addClass("fa-compress");
            $("#manageData_tableSpreadhseet").data("kendoSpreadsheet").resize();
        } else {
            $("#manageData_existingEntity").removeClass("col-md-12");
            $("#manageData_existingEntity").addClass("col-md-6");
            $(".manageData_tableSpreadhseetContainer").find(".maximizeButton").attr("title", "Maximize");
            $(".manageData_tableSpreadhseetContainer").find(".maximizeButtonIcon").removeClass("fa-compress");
            $(".manageData_tableSpreadhseetContainer").find(".maximizeButtonIcon").addClass("fa-expand");
            $("#manageData_tableSpreadhseet").data("kendoSpreadsheet").resize();
        }

        //Scroll
        $("html, body").animate({
            scrollTop: 0
        }, 250);

    },

    /**
     * exportSheet
     * This will export the sheet to excel
     */
    exportSheet: function () {
        kendo.ui.progress($("body"), true);//Wait Message on
        //via.downloadFile(odin.SERVLET_PATH + "?action=admin.streamFile&reportName=" + encodeURIComponent(data.reportName));

        var portDir = null;
        if(odinLite_manageData.tableIndexType===3){
            portDir = odinLite_manageData.parentVal;
        }

        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.manageData.exportFile',
                modelId: odinLite_manageData.currentModel.value,
                entityDir: odinLite.ENTITY_DIR,
                dataItem: odinLite_manageData.currentDataItem,
                portDir: portDir,
                overrideUser: odinLite.OVERRIDE_USER
            },
            function (data, status) {
                odinLite_manageData.hasBeenLoaded = true;//Set the loaded variable after first load.
                kendo.ui.progress($("body"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure downloading file:", data.message);
                    via.kendoAlert("Download Failure", data.message);
                } else {
                    via.debug("Successful getting model data:", data);
                    via.downloadFile(odin.SERVLET_PATH + "?action=admin.streamFile&reportName=" + encodeURIComponent(data.reportName));
                }
            },
            'json');

/*
        $.post(odin.SERVLET_PATH,
            {
                action: 'admin.createFileFromGrid',
                reportData: JSON.stringify(odinLite_manageData.currentTableData),
                type: 'xlsx',
                overrideUser: odinLite.OVERRIDE_USER
            },
            function (data, status) {
                odinLite_manageData.hasBeenLoaded = true;//Set the loaded variable after first load.
                kendo.ui.progress($("body"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure downloading file:", data.message);
                    via.kendoAlert("Download Failure", data.message);
                } else {
                    via.debug("Successful getting model data:", data);
                    via.downloadFile(odin.SERVLET_PATH + "?action=admin.streamFile&reportName=" + encodeURIComponent(data.reportName));
                }
            },
            'json');
            */
    },

    /**
     * getFolderStructure
     * This will get the folder structure tree for manage data
     */
    getFolderStructure: function(){
        kendo.ui.progress($("body"), true);//Wait Message
        $.get("./html/fileStructureWindow.html", function (deleteTablesWindowTemplate) {
            kendo.ui.progress($("body"), false);//Wait Message

            $('#odinLite_fileStructureWindow').remove();
            $('body').append(deleteTablesWindowTemplate);
            //Make the window.
            var deleteTablesWindow = $('#odinLite_fileStructureWindow').kendoWindow({
                title: odinLite.ENTITY_NAME + " Entity Data Model",
                draggable: false,
                resizable: false,
                width: "800px",
                height: ($( window ).height() * .85) + "px",
                modal: true,
                close: false,
                actions: [
                    "Maximize",
                    "Close"
                ],
                resize: function(){
                    $('#manageData_fileStructureTreeview').css("height",($('#odinLite_fileStructureWindow').height() - 40) + "px");
                },
                close: function () {
                    deleteTablesWindow = null;
                    $('#odinLite_deleteTablesWindow').remove();
                }
            }).data("kendoWindow");

            deleteTablesWindow.center();

            //Set the size
            $('#manageData_fileStructureTreeview').css("height",($('#odinLite_fileStructureWindow').height() - 40) + "px");

            //Make the call to the tree
            odinLite_manageData.getFileTreeGrid("#manageData_fileStructureTreeview");
            $("#manageData_fileStructureTreeview tbody").bind('dblclick', function (e) {
                var tree = $("#manageData_fileStructureTreeview").data('kendoTreeList');
                var selected = tree.select();
                var dataItem = tree.dataItem(selected);
                if (dataItem.hasChildren === true) {
                    if(dataItem.expanded === true) {
                        tree.collapse(selected);
                    }else{
                        tree.expand(selected);
                    }
                }
            });

            //Set the button action
            $('#manageData_downloadFileStructureButton').click(function(){
                var tree = $("#manageData_fileStructureTreeview").data('kendoTreeList');
                var selected = tree.select();
                var dataItem = tree.dataItem(selected);
                //if(dataItem.hasChildren === true){ return; }

                //download the file to csv
                downloadFile(dataItem.path,dataItem.hasChildren);
            });

            /*Functions*/
            //Download the selected file
            function downloadFile(filePath,isFolder){
                odinLite.getExportFilesWindow(function(fileType,delimiter) {
                    kendo.ui.progress($("#odinLite_fileStructureWindow"), true);//Wait Message on
                    $.post(odin.SERVLET_PATH,
                        {
                            action: 'odinLite.manageData.exportCacheFile',
                            filePath: filePath,
                            isFolder: isFolder,
                            entityDir: odinLite.ENTITY_DIR,
                            overrideUser: odinLite.OVERRIDE_USER,
                            fileType: fileType,
                            fileDelimiter: delimiter
                        },
                        function (data, status) {
                            kendo.ui.progress($("#odinLite_fileStructureWindow"), false);//Wait Message off

                            if (!via.undef(data, true) && data.success === false) {
                                via.debug("Failure downloading file:", data.message);
                                via.kendoAlert("Download Failure", data.message);
                            } else {
                                via.debug("Successful download:", data);
                                console.log();
                                via.downloadFile(odin.SERVLET_PATH + "?action=admin.streamFile&reportName=" + encodeURIComponent(data.reportName));
                            }
                        },
                        'json');
                });
            }

        });
    },

    /**
     * getSQLImportWindow
     * This will import the sql tables
     */
    getSQLImportWindow: function(){
        kendo.ui.progress($("body"), true);//Wait Message
        $.get("./html/sqlTableChooserWindow.html", function (sqlWindowTemplate) {
            kendo.ui.progress($("body"), false);//Wait Message

            $('#odinLite_sqlTableWindow').remove();
            $('body').append(sqlWindowTemplate);
            //Make the window.
            var sqlTablesWindow = $('#odinLite_sqlTableWindow').kendoWindow({
                title: "Select Tables to Query",
                draggable: false,
                resizable: false,
                width: "950px",
                height: "580px",
                modal: true,
                close: false,
                actions: [
                    "Maximize",
                    "Close"
                ],
                close: function () {
                    sqlTablesWindow = null;
                    $('#odinLite_sqlTableWindow').remove();
                }
            }).data("kendoWindow");

            sqlTablesWindow.center();

            //Make the call to the tree
            odinLite_manageData.getFileTreeGrid("#odinLite_sqlFolderStructure");
            $("#odinLite_sqlFolderStructure tbody").bind('dblclick', function (e) {
                var tree = $("#odinLite_sqlFolderStructure").data('kendoTreeList');
                var selected = tree.select();
                var dataItem = tree.dataItem(selected);
                if (dataItem.hasChildren === true) {
                    if(dataItem.expanded === true) {
                        tree.collapse(selected);
                    }else{
                        tree.expand(selected);
                    }
                }else {
                    addItemToFileManager();
                }
            });
            getFileManagerGrid();

            //Set the button action
            $('#odinLite_sqlTable_addButton').click(function(){
                addItemToFileManager();
            });
            $('#odinLite_sqlManager_createButton').click(function(){
                var fileManagerGrid = $("#odinLite_sqlFileManager").data('kendoGrid');
                var gridData = fileManagerGrid.dataSource.data();
                if(gridData.length === 0){
                    via.kendoAlert("SQL Table Import","There are no files in the list.");
                    return;
                }

                sqlTablesWindow.close();
                odin.progressBar("SQL Table Import",100,"Importing " + gridData.length + ((gridData.length>1)?" files.":" file."));

                var records = JSON.stringify(gridData);


                $.post(odin.SERVLET_PATH,
                    {
                        action: 'odinLite.manageData.importDatabaseTables',
                        overrideUser: odinLite.OVERRIDE_USER,
                        records: records,
                        entityDir:odinLite.ENTITY_DIR
                    },
                    function (data, status) {
                        odin.progressBar("SQL Table Import",100,null,true);

                        if (!via.undef(data, true) && data.success === false) {
                            via.kendoAlert("SQL Table Import","Error: " + data.message);
                            via.debug("SQL Table Import", data.message);
                        } else {//Success - SQL Import
                            via.debug("SQL Table Import Success:", data.message);

                            odinLite_manageData.getSQLQueryWindow(data);
                        }
                    },
                    'json');
            });

            /*Functions*/
            //Add the item to the file manager grid.
            function addItemToFileManager() {
                var tree = $("#odinLite_sqlFolderStructure").data('kendoTreeList');
                var selected = tree.select();
                var dataItem = tree.dataItem(selected);
                if (dataItem.hasChildren === true) {
                    return;
                }
                var fileManagerGrid = $("#odinLite_sqlFileManager").data('kendoGrid');

                //Prevent Duplicates
                var gridData = fileManagerGrid.dataSource.data();
                for(var i=0;i<gridData.length;i++){
                    if(dataItem.path === gridData[i].path){
                        via.kendoAlert("SQL Import","\""+dataItem.name + "\" has already been added to the list.");
                        return;
                    }
                }
                //Add to grid
                fileManagerGrid.dataSource.add(dataItem);
            }

            //Get the ftp transfer files
            function getFileManagerGrid(){
                $("#odinLite_sqlFileManager").empty();
                $("#odinLite_sqlFileManager").kendoGrid({
                    dataSource: {
                        data: [],
                        schema: {
                            model: {
                                fields: {
                                    path: { field: "path"},
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
                            template: "<img src='#:imageUrl#'/> " + "#: path #",
                            field: "path",
                            expandable: true,
                            title: "Selected Tables",
                            width: 550
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
                            width: 100
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
                            headerAttributes:  { style:"text-align:center" },
                            width: 180
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

        });
    },

    /**
     * getSQLImportWindow
     * This will import the sql tables
     */
    getSQLQueryWindow: function(data){

        kendo.ui.progress($("body"), true);//Wait Message
        $.get("./html/sqlQueryWindow.html", function (sqlWindowTemplate) {
            kendo.ui.progress($("body"), false);//Wait Message

            $('#odinLite_sqlQueryWindow').remove();
            $('body').append(sqlWindowTemplate);
            //Make the window.
            var sqlTablesWindow = $('#odinLite_sqlQueryWindow').kendoWindow({
                title: "Select Tables to Query",
                draggable: false,
                resizable: false,
                width: "950px",
                height: "650px",
                modal: true,
                close: false,
                actions: [
                    "Maximize",
                    "Close"
                ],
                close: function () {
                    sqlTablesWindow = null;
                    $('#odinLite_sqlQueryWindow').remove();
                }
            }).data("kendoWindow");

            sqlTablesWindow.center();

            //Style the code editor
            var editor = CodeMirror.fromTextArea(document.getElementById("manageData_sqlQuery_sqlArea"), {
                mode: "text/x-sql",
                indentWithTabs: true,
                smartIndent: true,
                lineWrapping: true,
                lineNumbers: true,
                matchBrackets: true,
                autofocus: true,
                extraKeys: {"Ctrl-Space": "autocomplete"}
            });
            editor.setSize("100%", 200);
            // store it
            $('#manageData_sqlQuery_sqlArea').data('CodeMirrorInstance', editor);

            //Setup the treeview
            var tableData = [];
            $.each(data.tableColMap,function(t,c){
                var obj = {text: "["+t+"]",items:[]};
                for(var i in c){
                    obj.items.push({text:"["+c[i]+"]"});
                }
                tableData.push(obj);
            });
            var dataSource = new kendo.data.HierarchicalDataSource({
                data: tableData
            });
            //Treeview init
            $("#manageData_sqlColumnNames").kendoTreeView({
                dataSource: dataSource
            });
            $("#manageData_sqlColumnNames li").bind('dblclick', function (e) {
                var tree = $("#manageData_sqlColumnNames").data('kendoTreeView');
                var selected = tree.select();
                var dataItem = tree.dataItem(selected);

                var cm = $('#manageData_sqlQuery_sqlArea').data('CodeMirrorInstance');
                var doc = cm.getDoc();
                doc.replaceRange(dataItem.text, {line: Infinity}); // adds a new line
            });

            //Add Button Events
            $('#manageData_sqlQueryButton').click(function(){
                var codeeditor = $('#manageData_sqlQuery_sqlArea').data('CodeMirrorInstance');
                var sql = codeeditor.getValue();
                if(via.undef(sql,true)){
                    via.kendoAlert("Define Query","Specify a query.");
                    return;
                }

                kendo.ui.progress($("#odinLite_sqlQueryWindow"), true);//Wait Message off
                $('#manageData_dbResultGrid').empty();
                $('#manageData_exportSqlQueryButton').hide();
                $.post(odin.SERVLET_PATH,
                    {
                        action: 'odinLite.manageData.queryDatabaseTables',
                        schema: data.schema,
                        query: sql,
                        overrideUser: odinLite.OVERRIDE_USER
                    },
                    function (data, status) {
                        kendo.ui.progress($("#odinLite_sqlQueryWindow"), false);//Wait Message off

                        if (!via.undef(data, true) && data.success === false) {
                            via.debug("Failure running query:", data.message);
                            via.kendoAlert("Query Failure", data.message);
                            $('#manageData_dbResultGrid').html('<div class="well" style="color:red;margin-top:5px;">'+data.message+"</div>");
                        } else {
                            via.debug("Successful Query:", data);

                            if(via.undef(data.tableData)){
                                via.kendoAlert("Query Failure", "No data found.");
                                return;
                            }

                            odinTable.createTable("sqlQueryTable",data.tableData,"#manageData_dbResultGrid");
                            $('#sqlQueryTable').data('kendoGrid').setOptions({
                                groupable:false,
                                height:'99%',
                                width:'99%'
                            });
                            $('#manageData_dbResultGrid').css("padding","0");
                            $('#manageData_dbResultGrid').data("gridSql",sql);
                            $('#manageData_dbResultGrid').data("schema",data.schema);
                            $('#manageData_exportSqlQueryButton').show();
                        }
                    },
                    'json');
            });
            //Export Data Button
            $('#manageData_exportSqlQueryButton').click(function(){
                var sqlString = $('#manageData_dbResultGrid').data("gridSql");
                var schema = $('#manageData_dbResultGrid').data("schema");
                if(via.undef(sqlString,true)){
                    via.kendoAlert("Define Query","Specify a query.");
                    return;
                }

                kendo.ui.progress($("#odinLite_sqlQueryWindow"), true);//Wait Message off
                $.post(odin.SERVLET_PATH,
                    {
                        action: 'odinLite.manageData.exportDatabaseQuery',
                        schema: schema,
                        query: sqlString,
                        overrideUser: odinLite.OVERRIDE_USER
                    },
                    function (data, status) {
                        kendo.ui.progress($("#odinLite_sqlQueryWindow"), false);//Wait Message off

                        if (!via.undef(data, true) && data.success === false) {
                            via.debug("Failure downloading file:", data.message);
                            via.kendoAlert("Download Failure", data.message);
                        } else {
                            via.debug("Successful Download:", data);

                            via.downloadFile(odin.SERVLET_PATH + "?action=admin.streamFile&reportName=" + encodeURIComponent(data.reportName));
                        }
                    },
                    'json');
            });
        });
    },

    /**
     * getFileTreeGrid
     * This will populate the file tree in the selector.
     */
    getFileTreeGrid: function(selector){
        var dirStructure = new kendo.data.TreeListDataSource({
            transport: {
                read: function(options) {
                    // make JSON request to server
                    $.ajax({
                        url: odin.SERVLET_PATH + "?action=odinLite.manageData.getFolderStructure",
                        data: {
                            entityDir:odinLite.ENTITY_DIR,
                            path:options.data.id
                        },
                        dataType: "json",
                        success: function(result) {
                            if(result.success === false){
                                if(!via.undef(result.message)) {
                                    via.kendoAlert("Error retrieving files",result.message);
                                }else{
                                    via.kendoAlert("Error retrieving files", "Please check your connection.");
                                }
                            }else {
                                // notify the data source that the request succeeded
                                for(var i in result){
                                    if(via.undef(result[i].parentId)) {
                                        result[i].parentId = null;
                                    }
                                }
                                options.success(result);
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

        $(selector).kendoTreeList({
            dataSource: dirStructure,
            selectable: true,
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
            ]
        });
    },

    /**
     * deleteModelData
     * This will delete the model data of the currently selected model
     */
    deleteModelData: function () {
        if (via.undef(odinLite_manageData.currentModel) || via.undef(odinLite_manageData.currentModel.value)) {
            return;
        }//No model selected.

        via.confirm("Confirm Delete", "Are you sure you want to delete the model \"" + odinLite_manageData.currentModel.text + "\"? This action cannot be undone.", function () {
            via.inputDialog("Confirm Delete", "This will <b>purge</b> all data for this model. Type the word \"<span style=\"color:red;\">delete</span>\" below to confirm.", function (val) {
                if (!via.undef(val, true) && val === 'delete') {
                    kendo.ui.progress($("body"), true);//Wait Message on

                    $.post(odin.SERVLET_PATH,
                        {
                            action: 'odinLite.manageData.deleteModelDataItems',
                            modelId: odinLite_manageData.currentModel.value,
                            entityDir: odinLite.ENTITY_DIR,
                            overrideUser: odinLite.OVERRIDE_USER
                        },
                        function (data, status) {
                            kendo.ui.progress($("body"), false);//Wait Message off

                            if (!via.undef(data, true) && data.success === false) {
                                via.debug("Failure deleting model:", data.message);
                                via.kendoAlert("Delete Failure", data.message);
                            } else {
                                via.debug("Successful delete:", data);

                                odinLite_manageData.getItemTreeList();
                                odinLite_manageData.currentModel = null;
                            }
                        },
                        'json');
                }
            });
        });

    },

    /**
     * deleteTable
     * This will delete the table currently displayed
     */
    deleteTable: function () {
        via.confirm("Confirm Delete", "Are you sure you want to delete the \"" + odinLite_manageData.currentDataItem + "\" table?", function () {
            kendo.ui.progress($("body"), true);//Wait Message on

            var portDir = null;
            if (odinLite_manageData.tableIndexType === 3) {//We need port dir if type 3
                portDir = [odinLite_manageData.parentVal];
            }

            $.post(odin.SERVLET_PATH,
                {
                    action: 'odinLite.manageData.deleteTableFromCache',
                    modelId: odinLite_manageData.currentModel.value,
                    portDir: (portDir === null) ? portDir : JSON.stringify(portDir),
                    dataItems: JSON.stringify([odinLite_manageData.currentDataItem]),
                    entityDir: odinLite.ENTITY_DIR,
                    overrideUser: odinLite.OVERRIDE_USER
                },
                function (data, status) {
                    kendo.ui.progress($("body"), false);//Wait Message off

                    if (!via.undef(data, true) && data.success === false) {
                        via.debug("Failure deleting table:", data.message);
                        via.kendoAlert("Delete Failure", data.message);
                    } else {
                        via.debug("Successful delete:", data);

                        odinLite_manageData.getItemTreeList();
                    }
                },
                'json');
        });

    },

    /**
     * editSheet
     * This will put the sheet in edit mode.
     */
    editSheet: function () {
        var sheetData = odinLite_fileFormat.getSpreadsheetDataFromTableSet(odinLite_manageData.currentTableData, true, false);

        //Update the sheetName
        if (!via.undef(odinLite_manageData.currentTableData.tableLabel, true)) {
            sheetData.name = odinLite_manageData.currentTableData.tableLabel;
            $('.manageData_tableSpreadhseetName').html(odinLite_manageData.currentTableData.tableLabel);
        } else {
            $('.manageData_tableSpreadhseetName').html("Table Preview");
        }


        if (!via.undef(sheetData.rows) && !via.undef(sheetData.rows[0])) {

            console.log(sheetData);
            sheetData.rows.push({
                cells:[{},{},{}]
            });

            //First row is not editable
            for (var i = 0; i < sheetData.rows[0].cells.length; i++) {
                sheetData.rows[0].cells[i].enable = false;

                if (!via.undef(odinLite_manageData.currentTableData.requiredColumns, true)) {
                    var isRequired = false;
                    for (var k = 0; k < odinLite_manageData.currentTableData.requiredColumns.length; k++) {
                        if (odinLite_manageData.currentTableData.requiredColumns[k] === sheetData.rows[0].cells[i].value) {
                            isRequired = true;
                            break;
                        }
                    }

                    //Loop through all the rows and shut off required columns
                    if (isRequired) {
                        for (var j = 1; j < sheetData.rows.length-1; j++) {
                            sheetData.rows[j].cells[i].enable = false;
                            sheetData.rows[j].cells[i].color = "#888888";
                        }
                    }
                }
            }
        }

        //Insert the sheet preview.
        if (!via.undef($("#manageData_tableSpreadhseet").data('kendoSpreadsheet'))) {
            $("#manageData_tableSpreadhseet").data('kendoSpreadsheet').destroy();
        }
        $(".manageData_tableSpreadhseetContainer").show();
        $("#manageData_tableSpreadhseet").empty();


        $("#manageData_tableSpreadhseet").kendoSpreadsheet({
            //height: '200px',
            headerHeight: 20,
            //headerWidth: 0,
            toolbar: false,
            sheetsbar: false,
            rows: null,
            columns: null,
            sheets: [sheetData]
        });
        $("#manageData_tableSpreadhseet .k-spreadsheet-sheets-bar-add").hide();
        $("#manageData_tableSpreadhseet .k-link").prop("disabled", true);
        $('#manageData_editModeLabel').show();
    },

    /**
     * editSheet
     * This will save the edits to the current sheet
     */
    saveSheetEdits: function () {
        //kendo.ui.progress($("body"), true);//Wait Message

        var ts = odinLite_manageData.currentTableData;
        $("#manageData_tableSpreadhseet").data('kendoSpreadsheet').refresh();
        var json = $("#manageData_tableSpreadhseet").data('kendoSpreadsheet').toJSON();

        //Check data
        if (via.undef(json.sheets) || json.sheets.length == 0 || via.undef(json.sheets[0].rows)) {
            via.kendoAlert("Save Error", "Invalid sheet data.");
            return;
        }
        if (json.sheets[0].rows.length == 0) {
            via.kendoAlert("Save Error", "Zero rows contained in data.");
            return;
        }

        //Get the idx for the required columns. Those should not be set.
        var requiredMap = {};
        var headerRow = json.sheets[0].rows[0].cells;
        for (var k = 0; k < odinLite_manageData.currentTableData.requiredColumns.length; k++) {
            for (var c = 0; c < headerRow.length; c++) {
                if (headerRow[c].value === odinLite_manageData.currentTableData.requiredColumns[k]) {
                    requiredMap[c] = c;
                    break;
                }
            }
        }

        //Set the data
        for (var r = 1; r < (ts.data.length+1); r++) {//Don't add last row.
            var cells = json.sheets[0].rows[r].cells;
            var rowIdx = r - 1;
            for (var c = 0; c < cells.length; c++) {
                var header = json.sheets[0].rows[0].cells[c].value;
                var value = cells[c].value;
                if (via.undef(requiredMap[c])) {
                    ts.data[rowIdx][c] = value;
                }
            }
        }

        //Check to see if we should add a new row.
        if(json.sheets[0].rows.length > (ts.data.length+1)) {
            console.log('here');
            var lastRow = json.sheets[0].rows[json.sheets[0].rows.length - 1].cells;
            var isValid = true;
            for(var i in requiredMap){
                var idx = requiredMap[i];
                if(via.undef(lastRow[idx],true)){
                    isValid = false;
                }
            }
            if(isValid === true) {
                var row = [];
                for(var j in lastRow){
                    row.push(lastRow[j].value+"");
                }
                ts.data.push(row);
            }
        }



        //Get the variables
        var dataItem = odinLite_manageData.currentDataItem + "";
        odinLite_manageData.currentDataItem = null;//Reset the data item so it updates.
        var entityDir = odinLite.ENTITY_DIR;
        var modelId = odinLite_manageData.currentModel.value;

        //Make the call to update
        via.debug("Saving JSON TS:", ts);

        console.log("Saving JSON TS:", ts);

        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.manageData.persistSheetEditToCache',
                modelId: modelId,
                entityDir: entityDir,
                dataItem: dataItem,
                tsJson: JSON.stringify(ts),
                overrideUser: odinLite.OVERRIDE_USER
            },
            function (data, status) {
                kendo.ui.progress($("body"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure getting data item:", data.message);
                    via.kendoAlert("Get Data Item Failure", data.message);
                } else {
                    via.debug("Successful getting data item:", data);

                    $('#viewPanel').hide();

                    //Review the upload
                    odinLite_modelMapping.reviewPersistErrors(data, function () {
                        $('#modelMappingErrorsPanel').hide();
                        $('#viewPanel').show();
                        odinLite_manageData.getDataItemTable(dataItem);
                    });
                }
            },
            'json');
    },

    /**
     * cancelSheetEdits
     * Cancels the editing without saving
     */
    cancelSheetEdits: function () {
        var dataItem = odinLite_manageData.currentDataItem + "";
        odinLite_manageData.currentDataItem = null;//Reset the data item so it updates.
        odinLite_manageData.getDataItemTable(dataItem);
    }

};