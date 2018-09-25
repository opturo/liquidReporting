/**
 * Created by rocco on 3/16/2018.
 * This is the main file for the ODIN Lite application.
 */
var odinLite = {
    //Variables
    APP_NAME: null,//Name of the application
    ENTITY_CODE: null,//This is the ODIN Entity Code
    ENTITY_DIR: null,//Holds the directory of the current entity
    ENTITY_NAME: null,//Holds the current entity being worked with
    LOGIN_SETTINGS: null,

    OVERRIDE_USER:null,//Override user for admin functionality.

    systemNotifications:null,//holds the list of current system notifications

    /**
     * init
     * This will initialize ODIN Lite and check if a user is properly logged in.
     */
    init: function () {
        kendo.ui.progress($("body"), true);//Wait Message

        //Add a case insensitive contains selector to jquery. Used for Filtering Report Names
        $.extend($.expr[':'], {
            'containsi': function (elem, i, match, array) {
                return (elem.textContent || elem.innerText || '').toLowerCase()
                        .indexOf((match[3] || "").toLowerCase()) >= 0;
            }
        });

        //Check if a user is logged in and setup the application if they are.
        odin.userIsLoggedIn(odinLite.setUserLoggedIn, function (data) {
            odinLite.ENTITY_CODE = data.ODIN_LITE_ENTITY_CODE;
            odinLite.APP_NAME = data.ODIN_LITE_APP_NAME;
            if(via.undef(odinLite.ENTITY_CODE,true)){
                window.location = '../index.jsp?referrer=./liquidReporting/' + encodeURIComponent(document.location.search);
            }else {
                window.location = '../index.jsp?referrer=./liquidReporting/' + encodeURIComponent(document.location.search) + "&entity=" + odinLite.ENTITY_CODE + "&appName=" + odinLite.APP_NAME;
            }
        });
    },

    /**
     * setUserLoggedIn
     * This will setup ODIN Lite and will get called only if a user is logged into ODIN.
     */
    setUserLoggedIn: function () {
        //Make the call to initialize the application
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.init',
                overrideUser: odinLite.OVERRIDE_USER
            },
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure Initializing:", data.message);
                    via.alert("Failure Initializing", data.message);
                }else{
                    via.debug("Successful Initializing:", data);

                    /**TESTING**/
                    /* setTimeout(function(){
                        odinLite_billing.packageTesting();
                    },3500);
                    */
                    /**END TESTING**/

                    /** Testing billing modal **/
                    $('#billing_verifyModal').modal('show');

                    odinLite_billing.checkBillingIsVerified(function(){//Check to make sure they have verified billing if they are a billing client.
                        //Check if an entity was passed from appbuilder
                        if(!via.undef(via.getParamsValue("entityname")) && !via.undef(via.getParamsValue("entitydir"))){
                            odinLite.ENTITY_DIR = via.getParamsValue("entitydir");
                            odinLite.ENTITY_NAME = via.getParamsValue("entityname");
                            odinLite.OVERRIDE_USER = via.getParamsValue("overrideuser");
                            odinLite.ENTITY_CODE = data.entityCode;
                            odinLite.APP_NAME = data.appName;

                            //Hide the query string
                            window.history.replaceState("From App Builder", data.appName, "./");

                            odinLite.initOdinLite();

                        }else if(odinLite.isMultiEntity()){
                            odinLite.createMultiEntityWindow(data,function(){
                                //odinLite.ENTITY_DIR = "9xWHiDUj";
                                //odinLite.ENTITY_NAME = "Default";
                                //odinLite.OVERRIDE_USER = "190";

                                odinLite.initOdinLite();
                            });
                        }else{

                            if(data.entityList.length === 0){
                                via.alert("Entity Error","Cannot find an entity.",function(){
                                    odinLite.setUserLoggedIn();
                                });
                                return;
                            }
                            odinLite.ENTITY_DIR = data.entityList[0][2];
                            odinLite.ENTITY_NAME = data.entityList[0][1];
                            odinLite.ENTITY_CODE = data.entityCode;
                            odinLite.APP_NAME = data.appName;
                            odinLite.systemNotifications = data.systemNotifications;
                            odinLite.initOdinLite();

                        }
                    });
                }

            },
            'json');

    },


    /**
     * setOverrideHtml
     * for an override user
     */
    setOverrideHtml: function(){
        var overrideHtml = "";
        if(!via.undef(odinLite.OVERRIDE_USER,true)){
            overrideHtml = ',<span style="color:red;"> Override User:' + odinLite.OVERRIDE_USER + "</span>";
        }
        $('.appTitle').html(odinLite.APP_NAME + " <i><small>(Entity: " + odinLite.ENTITY_NAME + overrideHtml + ")</small></i>");
    },

    /**
     * initOdinLite
     * Inits the odin lite user
     * @param data
     */
    initOdinLite: function (){
        //For the override user
        odinLite.setOverrideHtml();

        //Perform translation if needed.
        odin.performTranslation('body');

        //Change the theme if needed
        via.changeThemeApplicationOptions(odin.getUserSpecificSetting("theme"));

        //Get the Query String Parameters
        var params = via.getQueryParams();

        //Logout Button Visible and Set Action
        if (via.undef(params['hideLogout'], true) || params['hideLogout'].toLowerCase() !== 'true') {
            $('#odinLogoutButton').click(function () {
                //Log the user out
                odin.logoutUser();
            }).fadeIn();
        } else {
            $('.resultDivider').hide();
        }

        //Account Button
        if (via.undef(params['hideaccount'], true) || params['hideaccount'].toLowerCase() !== 'true') {
            $('#accountButton').click(function () {
                odinLite.loadAccountSettings();
            }).fadeIn();

            //$('#accountSettings').load('accountSettings.html',function() {
            //    odin.initAccountSettings();
            //});
            odin.initAccountSettings();
        }

        //Account Button
        if (via.undef(params['hidenotifications'], true) || params['hidenotifications'].toLowerCase() !== 'true') {
            if(via.undef(odinLite.systemNotifications,true)){
                $('#home_systemNotificationButton').prop("disabled",true);
                $('#home_systemNotificationBadge').html("0");
                $('#home_systemNotificationButton').fadeIn();
            }else {
                $('#home_systemNotificationButton').prop("disabled",false);
                $('#home_systemNotificationBadge').html(odinLite.systemNotifications.length);
                $('#home_systemNotificationBadge').css("background-color","red");
                $('#home_systemNotificationButton').click(function () {
                    odinLite.showSystemNotifications();
                }).fadeIn();
            }
        }

        //Switch User Button
        if(odin.USER_INFO.isAdminUser === true && odin.USER_INFO.userName === "rocco"){
            $('#switchUserButton').fadeIn();
            $('#switchUserButton').off();
            $('#switchUserButton').click(function(){
                odinLite.createSwitchUserWindow();
            });
        }

        //Setup the Landing Page
        if (via.undef(params['hidehome'], true) || params['hidehome'].toLowerCase() !== 'true') {
            $('#homeButton').off();
            $('#homeButton').click(function () {
                odinLite.navigateToOption('HOME');
            }).fadeIn();
        }
        $('#homePanel').fadeIn();

        //Show the Opturo logo
        $('.poweredPanel').fadeIn();

        //Used for Package sign up
        if (via.undef(params['hideaccount'], true) || params['hideaccount'].toLowerCase() !== 'true') {
            $('#home_yourPackagesButton').off();
            $('#home_yourPackagesButton').click(function () {
                odinLite.loadAccountPackages();
            }).fadeIn();
        }

        //Help Button
        $('#home_helpButton').fadeIn();

        //remove the loading message
        kendo.ui.progress($("body"), false);//Wait Message off


    },

    /**
     * showSystemNotifications
     * Shows the system notifications.
     */
    showSystemNotifications: function(){
        console.log('odinLite.systemNotifications',odinLite.systemNotifications);
        var gridData = [];
        odinLite.systemNotifications.map(function(o){
            gridData.push({
                message: o
            })
        });

        //Get the window template
        $.get("./html/systemNotificationWindow.html", function (entityWindowTemplate) {
            $('#odinLite_systemNotificationWindow').remove();
            $('body').append(entityWindowTemplate);

            //Make the window.
            var switchUserWindow = $('#odinLite_systemNotificationWindow').kendoWindow({
                title: "System Notification Window",
                draggable: false,
                resizable: false,
                width: "850px",
                height: "500px",
                modal: true,
                close: true,
                actions: [
                    //"Maximize"
                    "Close"
                ],
                close: function () {
                    switchUserWindow = null;
                    $('#odinLite_systemNotificationWindow').remove();
                }
            }).data("kendoWindow");

            switchUserWindow.center();

            //Grid
            $('#odinLite_systemNotificationGrid').kendoGrid({
                dataSource: {
                    data: gridData,
                    schema: {
                        model: {
                            fields: {
                                message: { type: "string" }
                            }
                        }
                    },
                    pageSize: 20
                },
                height: 430,
                scrollable: true,
                sortable: false,
                filterable: false,
                pageable: {
                    input: true,
                    numeric: false
                },
                columns: [
                    {
                        template: "<img src='../images/24_mail.png'/> #: message #",
                        //template: "<span class='glyphicon glyphicon-envelope' aria-hidden='true'></span> #: message #",
                        field: "message",
                        title: "System Notification"},
                ]
            });

            //Button Events
            $(".odinLite_systemNotificationCloseButton").click(function(){
                switchUserWindow.close();
                switchUserWindow = null;
                $('#odinLite_systemNotificationWindow').remove();
            });
        });
    },

    /**
     * createSwitchUserWindow
     * Creates the window for switching users
     */
    createSwitchUserWindow: function () {
        kendo.ui.progress($("body"), true);
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.getODINLiteUserList'
            },
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure getting users:", data.message);
                    via.alert("Failure getting users", data.message);
                }else{
                    via.debug("Successful getting users:", data);

                    //Get the Entity List
                    var userArr = [];
                    if(!via.undef(data.userIdList)) {
                        for(var i=0;i<data.userIdList.length;i++){
                            userArr.push({
                                text: data.userNameList[i],
                                value: data.userIdList[i]
                            });
                        }
                    }

                    //DD List
                    $("#odinLite_switchUserName").kendoDropDownList({
                        dataTextField: "text",
                        dataValueField: "value",
                        dataSource: userArr,
                        index: 0,
                        change: function(e){
                            var userId = e.sender.value();
                            var ds = updateEntityList(data,userId);
                            $("#odinLite_switchUserEntity").data('kendoDropDownList').setDataSource(ds);
                            $("#odinLite_switchUserEntity").data('kendoDropDownList').select(0);
                        }
                    });

                    //DD EntityList
                    $("#odinLite_switchUserEntity").kendoDropDownList({
                        dataTextField: "text",
                        dataValueField: "value",
                        dataSource: userArr,
                        index: 0
                    });

                    //Set the initial value
                    var ds = updateEntityList(data,data.userIdList[0]);
                    $("#odinLite_switchUserEntity").data('kendoDropDownList').setDataSource(ds);
                    $("#odinLite_switchUserEntity").data('kendoDropDownList').select(0);
                }
            },
            'json');

        //Get the window template
        $.get("./html/switchUserWindow.html", function (entityWindowTemplate) {
            $('#odinLite_switchUserWindow').remove();
            $('body').append(entityWindowTemplate);

            //Make the window.
            var switchUserWindow = $('#odinLite_switchUserWindow').kendoWindow({
                title: "Choose an User",
                draggable: false,
                resizable: false,
                width: "450px",
                height: "165px",
                modal:true,
                close:true,
                actions: [
                    //"Maximize"
                    "Close"
                ],
                close: function() {
                    switchUserWindow = null;
                    $('#odinLite_switchUserWindow').remove();
                }
            }).data("kendoWindow");

            switchUserWindow.center();

            //Button Events
            $(".odinLite_selectSwitchUser").on("click",function(){
                var userDD = $("#odinLite_switchUserName").data('kendoDropDownList');
                var entityDD = $("#odinLite_switchUserEntity").data('kendoDropDownList');

                odinLite.OVERRIDE_USER = userDD.value();
                odinLite.ENTITY_DIR = entityDD.value();
                odinLite.ENTITY_NAME = entityDD.text();

                odinLite.setOverrideHtml();

                switchUserWindow.close();
                $('#odinLite_switchUserWindow').remove();
                switchUserWindow = null;
            });

            $(".odinLite_deleteSwitchUser").on("click",function() {
                /*
                odinLite.OVERRIDE_USER = null;
                odinLite.ENTITY_DIR = null;
                odinLite.ENTITY_NAME = null;

                odinLite.setOverrideHtml();

                switchUserWindow.close();
                $('#odinLite_switchUserWindow').remove();
                switchUserWindow = null;
                */
                location.reload();
            });
        });


        //To update the entity list
        function updateEntityList(data,userId){
            var entityArr = data.entityHash[userId];
            if(via.undef(entityArr) || entityArr.length === 0){
                return [];
            }

            var entityDsArr = [];
            for(var i=0;i<entityArr.length;i++){
                entityDsArr.push({
                    text: entityArr[i][1],
                    value: entityArr[i][0]
                });
            }

            return entityDsArr;
        }
    },

    /**
     * createMultiEntityWindow
     * Creates the window for multi entity
     * @param data
     */
    createMultiEntityWindow: function (data,selectFn) {

        //Get the window template
        $.get("./html/entityWindow.html", function (entityWindowTemplate) {
            $('#odinLite_entityWindow').remove();
            $('body').append(entityWindowTemplate);

            //Make the window.
            var entityWindow = $('#odinLite_entityWindow').kendoWindow({
                title: "Choose an Entity",
                draggable: false,
                resizable: false,
                width: "450px",
                height: "90px",
                modal:false,
                close:false,
                actions: [
                    //"Maximize"
                ],
                close: function() {
                    entityWindow = null;
                    $('#odinLite_entityWindow').remove();
                }
            }).data("kendoWindow");

            entityWindow.center();

            //Get the Entity List
            var entityArr = [];
            if(!via.undef(data.entityList)) {
                entityArr = data.entityList.map(function (item) {
                    return {
                        text: item[1],
                        value: item[2]
                    }
                });
            }
            //DD List
            $("#odinLite_multiEntityName").kendoDropDownList({
                dataTextField: "text",
                dataValueField: "value",
                dataSource: entityArr,
                index: 0
            });

            //Button Events
            $(".odinLite_selectEntity").on("click",function(){
                var dataItem = $("#odinLite_multiEntityName").data("kendoDropDownList").dataItem();
                if(via.undef(dataItem,true) || via.undef(dataItem.value,true)){ return; }
                odinLite.ENTITY_DIR = dataItem.value;
                odinLite.ENTITY_NAME = dataItem.text;
                odinLite.ENTITY_CODE = data.entityCode;
                odinLite.APP_NAME = data.appName;
                entityWindow.close();
                if(!via.undef(selectFn)){
                    selectFn();
                }
            });
            $(".odinLite_createEntity").on("click",function(){
                odinLite_modelCache.createNewEntity(function(data){
                    entityWindow.close();
                    odinLite.setUserLoggedIn();
                });
            });
            $(".odinLite_deleteEntity").on("click",function(){
                var dataItem = $("#odinLite_multiEntityName").data("kendoDropDownList").dataItem();
                if(via.undef(dataItem,true) || via.undef(dataItem.value,true)){ return; }
                odinLite_modelCache.deleteEntity(dataItem.value,dataItem.text,function(data){
                    entityWindow.close();
                    odinLite.setUserLoggedIn();
                });
            });

        });
    },

    /**
     * navigateToOption
     * Navigate to a particular application location.
     * @param option
     */
    navigateToOption: function (option) {
        switch (option) {
            case "HOME":
                odinLite.loadHome();
                break;
            case "UPLOAD":
                odinLite.loadModelCacheApplication();
                break;
            case "VIEW":
                odinLite.loadViewApplication();
                break;
            case "REPORTING":
                odinLite.loadReportingApplication();
                break;
            default:
                odinLite.goToJob(option);
        }
    },

    /**
     * loadHome
     * This will bring a user home.
     * This is the starting screen.
     */
    loadHome: function () {
        //Hide the other panels
        odinLite.hideAllApplications();

        $('#homePanel').fadeIn();
    },

    /**
     * Hides all the applications
     */
    hideAllApplications: function () {
        odinLite.hideModelCacheApplication();
        odinLite.hideViewApplication();
        odinLite.hideReportingApplication();
        odinLite.hideAccountSettings();
        odinLite.hideAccountPackages();
        odinLite.hidePaymentPage();

        $('#homePanel').hide();
    },

    /**
     * ----------------------
     * Model Application
     */
    /**
     * loadUploadApplication
     * This will load the upload application.
     * It will default on the screen where you can choose files to upload.
     */
    loadModelCacheApplication: function () {
        odinLite.hideAllApplications();

        //Model Cache init();
        odinLite_modelCache.init();
    },

    /**
     * Hides the components of the application
     */
    hideModelCacheApplication: function () {
        $('#modelCachePanel').hide();
        $('#uploadFilesPanel').hide();
        $('#fileFormatPanel').hide();
        $('#modelMappingPanel').hide();
        $('#modelMappingErrorsPanel').hide();
    },
    /**
     * End Model Application
     * ----------------------
     */

    /**
     * ----------------------
     * View Application
     */
    loadViewApplication: function () {
        odinLite.hideAllApplications();

        //Model Cache init();
        odinLite_manageData.init();
    },


    /**
     * Hides the components of the view application
     */
    hideViewApplication: function () {
        $('#viewPanel').hide();
    },
    /**
     * End View Application
     * ----------------------
     */

    /**
     * ----------------------
     * Reporting Application
     */
    loadReportingApplication: function () {
        $('body').fadeOut(function(){
            window.location = "../appBuilder/?entityDir="+odinLite.ENTITY_DIR+"&entityName="+odinLite.ENTITY_NAME+"&appName="+odinLite.APP_NAME+"&overrideUser="+(via.undef(odinLite.OVERRIDE_USER,true)?"":odinLite.OVERRIDE_USER);
        });
    },

    /**
     * Hides the components of the reporting application
     */
    hideReportingApplication: function () {
        $('#reportPanel').hide();
    },
    /**
     * End Reporting Application
     * ----------------------
     */

    /**
     * ----------------------
     * Account Settings
     */
    loadAccountSettings: function () {
        //Hide the other panels
        odinLite.hideAllApplications();

        $('#accountSettings').fadeIn();
    },

    hideAccountSettings: function () {
        $('#accountSettings').hide();
    },
    /**
     * End Account Settings
     * ----------------------
     */


     /**
     * ----------------------
     * Account Packages
     */
    loadAccountPackages: function () {
        //Hide the other panels
        odinLite.hideAllApplications();

        $('#packages').fadeIn();
        packageSelection.init();

    },

    hideAccountPackages: function () {
        $('#packages').hide();
    },
    /**
    * End Account Packages
    * ----------------------
    */

    /**
    * ----------------------
    * Payment Confirmation Page
    */
   loadPaymentPage: function (packageUpdates) {
       //Hide the other panels
       odinLite.hideAllApplications();

       $('#payment').fadeIn();

       packageSelection.getPackageUpdateDetails(packageUpdates);
   },

   hidePaymentPage: function () {
       $('#payment').hide();
   },

   /**
   * End Payment Confirmation Page
   * ----------------------
   */

    /**
     * isMultiEntity
     * this will display the help link. it will test if it is a url and if it is then display the url other wise the text
     */
    isMultiEntity: function () {
        var isMultiEntity = odin.getUserSpecificSetting("isMultiEntity");
        if(via.undef(isMultiEntity,true)){
            return false;
        }else if(isMultiEntity === "true" || isMultiEntity === true){
            return true;
        }else{
            return false;
        }
    }
};
