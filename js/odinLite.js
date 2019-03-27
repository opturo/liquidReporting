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

    OVERRIDE_USER: null,//Override user for admin functionality.

    systemNotifications: null,//holds the list of current system notifications
    subscribedPackageList: null,//holds the list of subscribed packages.
    isDataManagerUser: false,

    //Variables used for free only users.
    MAX_SIGNUP_WITHOUT_CARD: null,
    ALLOW_SUB_WITHOUT_CARD: null,
    userSignupMap: null,
    isFreeOnlyUser: false,

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
            if (via.undef(odinLite.ENTITY_CODE, true)) {
                window.location = '../index.jsp?referrer=./' + odin.ODIN_LITE_DIR + '/' + encodeURIComponent(document.location.search);
            } else {
                var params = via.getQueryParams();
                var isFirst = true;
                var queryString = "";
                $.each(params, function (key, value) {
                    if (key === "appname")return;
                    if (isFirst) {
                        queryString = "?" + key + "=" + value;
                    } else {
                        queryString += "&" + key + "=" + value;
                    }
                    isFirst = false;
                });
                window.location = '../index.jsp?referrer=./' + odin.ODIN_LITE_DIR + '/' + encodeURIComponent(queryString) + "&entity=" + odinLite.ENTITY_CODE + "&appName=" + odinLite.APP_NAME;
            }
        });
    },

    /**
     * setupDataManagerUser
     * This will check and setup the initial data manager user
     */
    setupDataManagerUser: function () {
        var dmUser = via.getParamsValue("isdm");
        if (via.undef(dmUser, true) || dmUser.toLowerCase() !== "true") {
            return;
        }
        odinLite.isDataManagerUser = true;

        /*Initialize the screen for the DM user.*/
        //Hide certain elements
        $('.hideDMUser').hide();

        //Fix home page spacing
        $('.home_sideSpacers').removeClass("col-md-3");
        $('.home_sideSpacers').addClass("col-md-4");
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
            function (data, status) {
                kendo.ui.progress($("body"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure Initializing:", data.message);
                    via.alert("Failure Initializing", data.message);
                } else {
                    via.debug("Successful Initializing:", data);

                    /**TESTING**/
                    /* setTimeout(function(){
                     odinLite_billing.packageTesting();

                     },3500);
                     */
                    //var localTs = '{"tableLabel":"10312008.txt","columnHeaders":["Currency Code","FX Rate"],"columnDataTypes":[0,0],"totalRows":4,"data":[["CAD","0.79760718"],["EUR","1.18889948"],["GBP","1.28855020"],["USD","1.00000000"]],"lockedColumns":0}';
                    //via.downloadLocalTableSet(JSON.parse(localTs));
                    /**END TESTING**/

                    //Set some billing vars
                    odinLite.MAX_SIGNUP_WITHOUT_CARD = data.maxSignupWithoutCard;
                    odinLite.ALLOW_SUB_WITHOUT_CARD = data.allowSubWithoutCard;
                    odinLite.userSignupMap = data.userSignupMap;

                    //Check to make sure they have verified billing if they are a billing client.
                    odinLite_billing.checkBillingIsVerified(function () {
                        //Check if an entity was passed from appbuilder
                        if (!via.undef(via.getParamsValue("entityname")) && !via.undef(via.getParamsValue("entitydir"))) {
                            odinLite.ENTITY_DIR = via.getParamsValue("entitydir");
                            odinLite.ENTITY_NAME = via.getParamsValue("entityname");
                            odinLite.OVERRIDE_USER = via.getParamsValue("overrideuser");
                            odinLite.ENTITY_CODE = data.entityCode;
                            odinLite.APP_NAME = data.appName;
                            odinLite.systemNotifications = data.systemNotifications;
                            odinLite.subscribedPackageList = data.packageList;
                            odinLite.isFromAppBuilder = true;

                            //Hide the query string
                            window.history.replaceState("From App Builder", data.appName, "./");

                            odinLite.initOdinLite();

                        } else if (odinLite.isMultiEntity()) {
                            odinLite.createMultiEntityWindow(data, function () {
                                //The entity dir and name is set in the multi entity window
                                odinLite.ENTITY_CODE = data.entityCode;
                                odinLite.APP_NAME = data.appName;
                                odinLite.systemNotifications = data.systemNotifications;
                                odinLite.subscribedPackageList = data.packageList;

                                odinLite.initOdinLite();
                            });
                        } else {

                            if (data.entityList.length === 0) {
                                via.alert("Entity Error", "Cannot find an entity.", function () {
                                    odinLite.setUserLoggedIn();
                                });
                                return;
                            }
                            odinLite.ENTITY_DIR = data.entityList[0][2];
                            odinLite.ENTITY_NAME = data.entityList[0][1];
                            odinLite.ENTITY_CODE = data.entityCode;
                            odinLite.APP_NAME = data.appName;
                            odinLite.systemNotifications = data.systemNotifications;
                            odinLite.subscribedPackageList = data.packageList;

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
    setOverrideHtml: function () {
        var overrideHtml = "";
        if (!via.undef(odinLite.OVERRIDE_USER, true)) {
            overrideHtml = ',<span style="color:red;"> Override User:' + odinLite.OVERRIDE_USER + "</span>";
        }
        $('.appTitle').html(odinLite.APP_NAME + " <i><small>(Entity: " + odinLite.ENTITY_NAME + overrideHtml + ")</small></i>");
    },

    /**
     * initOdinLite
     * Inits the odin lite user
     * @param data
     */
    initOdinLite: function () {
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

        //System Notifications Button
        if (via.undef(params['hidenotifications'], true) || params['hidenotifications'].toLowerCase() !== 'true') {
            if (via.undef(odinLite.systemNotifications, true)) {
                $('#home_systemNotificationButton').prop("disabled", true);
                $('#home_systemNotificationBadge').html("0");
                $('#home_systemNotificationButton').fadeIn();
            } else {
                $('#home_systemNotificationButton').prop("disabled", false);
                $('#home_systemNotificationBadge').html(odinLite.systemNotifications.length);
                $('#home_systemNotificationBadge').css("background-color", "red");
                $('#home_systemNotificationButton').click(function () {
                    odinLite.showSystemNotifications();
                }).fadeIn();
            }
        }

        //Switch User Button
        if (odin.USER_INFO.isAdminUser === true) {
            $('#switchUserButton').fadeIn();
            $('#switchUserButton').off();
            $('#switchUserButton').click(function () {
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

        //Used for Package sign up - hide if they are not a billing customer.
        var isOdinLiteUser = odin.getUserSpecificSetting("isOdinLiteUser");
        if (!via.undef(isOdinLiteUser, true) && isOdinLiteUser === "true") {//They are not a billable client
            //if (via.undef(params['hideaccount'], true) || params['hideaccount'].toLowerCase() !== 'true') {
            $('#home_yourPackagesButton').off();
            $('#home_yourPackagesButton').click(function () {
                odinLite.loadAccountPackages();
            }).fadeIn();

            var packageList = odinLite.subscribedPackageList;
            if (via.undef(packageList, true)) {
                //$('#home_yourPackagesButton').addClass("formError");
                var packageTooltip = $("#home_yourPackagesButton").kendoTooltip({
                    autoHide: false,
                    content: "Start by adding packages to your account.",
                    width: 200,
                    height: 50,
                    position: "top",
                    animation: {
                        open: {
                            effects: "zoom",
                            duration: 250
                        }
                    }
                }).data("kendoTooltip");
                packageTooltip.show();
            }
        }

        //Help Button
        $('#home_helpButton').fadeIn();


        //Check for Data Manager mode
        odinLite.setupDataManagerUser();

        //remove the loading message
        kendo.ui.progress($("body"), false);//Wait Message off


    },

    /**
     * showSystemNotifications
     * Shows the system notifications.
     */
    showSystemNotifications: function () {
        var gridData = [];
        odinLite.systemNotifications.map(function (o) {
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
                                message: {type: "string"}
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
                        title: "System Notification"
                    },
                ]
            });

            //Button Events
            $(".odinLite_systemNotificationCloseButton").click(function () {
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
            function (data, status) {
                kendo.ui.progress($("body"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure getting users:", data.message);
                    via.alert("Failure getting users", data.message);
                } else {
                    via.debug("Successful getting users:", data);

                    //Get the Entity List
                    var userArr = [];
                    if (!via.undef(data.userIdList)) {
                        for (var i = 0; i < data.userIdList.length; i++) {
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
                        change: function (e) {
                            var userId = e.sender.value();
                            var ds = updateEntityList(data, userId);
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
                    var ds = updateEntityList(data, data.userIdList[0]);
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
                title: "Choose a User",
                draggable: false,
                resizable: false,
                width: "450px",
                height: "135px",
                modal: true,
                close: true,
                actions: [
                    //"Maximize",
                    "Close"
                ],
                close: function () {
                    switchUserWindow = null;
                    $('#odinLite_switchUserWindow').remove();
                }
            }).data("kendoWindow");

            switchUserWindow.center();

            //Button Events
            //Switch User
            $(".odinLite_selectSwitchUser").on("click", function () {
                var userDD = $("#odinLite_switchUserName").data('kendoDropDownList');
                var entityDD = $("#odinLite_switchUserEntity").data('kendoDropDownList');

                odinLite.OVERRIDE_USER = userDD.value();
                odinLite.ENTITY_DIR = entityDD.value();
                odinLite.ENTITY_NAME = entityDD.text();

                odinLite.init();
                odinLite.setOverrideHtml();

                switchUserWindow.close();
                $('#odinLite_switchUserWindow').remove();
                switchUserWindow = null;
            });

            //User Info
            $(".odinLite_selectUserInfo").click(function(){
                var userDD = $("#odinLite_switchUserName").data('kendoDropDownList');
                var entityDD = $("#odinLite_switchUserEntity").data('kendoDropDownList');

                var userId = userDD.value();
                var userName = userDD.text();
                var entityDir = entityDD.value();
                var entityName = entityDD.text();

                kendo.ui.progress($("#odinLite_switchUserWindow"), true);//Wait Message off
                $.post(odin.SERVLET_PATH,
                    {
                        action: 'odinLite.getAdminUserInfo',
                        userId: userId,
                        userName: userName
                    },
                    function (data, status) {
                        kendo.ui.progress($("#odinLite_switchUserWindow"), false);//Wait Message off

                        if (!via.undef(data, true) && data.success === false) {
                            via.debug("Failure getting user info:", data.message);
                            via.kendoAlert("Failure getting user info", data.message);
                        } else {
                            via.debug("Successful getting user info:", data);

                            //Get the window template
                            $.get("./html/userInfoWindow.html", function (entityWindowTemplate) {
                                switchUserWindow.close();
                                switchUserWindow = null;
                                $('#odinLite_switchUserWindow').remove();

                                $('#odinLite_userInfoWindow').remove();
                                $('body').append(entityWindowTemplate);

                               //Make the window.
                                var userInfoWindow = $('#odinLite_userInfoWindow').kendoWindow({
                                    title: "User Info",
                                    draggable: false,
                                    resizable: false,
                                    width: "1080px",
                                    height: "75%",
                                    modal: true,
                                    close: true,
                                    actions: [
                                        "Maximize",
                                        "Close"
                                    ],
                                    close: function () {
                                        userInfoWindow = null;
                                        $('#odinLite_userInfoWindow').remove();
                                    }
                                }).data("kendoWindow");

                                userInfoWindow.center();


                                //User Object Data//
                                $('#userInfo_home span').empty();
                                $('#userInfo_home span').append("<pre>" + via.jsonSyntaxHighlight(JSON.stringify(data.userObject, null, 4)) + "</pre>");

                                //User Settings Update
                                function userSettingUpdate(){
                                    if(!via.undef($("#userInfo_settings_key").data('kendoComboBox'))){ return; }

                                    var ds = [];
                                    $.each(data.userSettings,function(k,v){
                                        ds.push({
                                            text: k, value: v
                                        });
                                    });

                                    var userSettingCombo = $("#userInfo_settings_key").kendoComboBox({
                                        dataTextField: "text",
                                        dataValueField: "value",
                                        dataSource: ds,
                                        filter: "contains",
                                        suggest: true,
                                        value: null,
                                        change: function(e){
                                            if(via.undef(e.sender.value(),true) || e.sender.value() === e.sender.text()){
                                                $("#userInfo_settings_value").val(null);
                                            }else{
                                                $("#userInfo_settings_value").val(e.sender.value());
                                            }
                                        }
                                    }).data('kendoComboBox');

                                    //Button Events
                                    //Add/Update
                                    $(".userInfo_settings_update_button").click(function(){
                                        var key = userSettingCombo.text();
                                        var val = $("#userInfo_settings_value").val();
                                        if(via.undef(key,true)){ return; }
                                        if(via.undef(val,true)){ return; }

                                        via.kendoConfirm("Delete User Setting","Are you sure you want to change the user setting <b>"+key+"</b> to:<br/><b>"+val+"</b>.",function(){
                                            //Post to the server
                                            kendo.ui.progress($("#odinLite_userInfoWindow"), true);
                                            $.post(odin.SERVLET_PATH,
                                                {
                                                    action: "admin.setUserSettings",
                                                    userId: userId,
                                                    userName: userName,
                                                    keys: JSON.stringify([key]),
                                                    values: JSON.stringify([val]),
                                                    isOdinLite: true
                                                },
                                                function (data, status) {
                                                    kendo.ui.progress($("#odinLite_userInfoWindow"), false);//Wait Message off

                                                    if (!via.undef(data, true) && data.success === false) {
                                                        via.debug("Failure updating user settings:", data.message);
                                                        via.alert("Failure updating user settings", data.message);
                                                    } else {
                                                        via.debug("Successful updating user settings:", data);

                                                        via.kendoAlert("Update User Settings",data.message,function(){
                                                            //User Object Data//
                                                            $('#userInfo_home span').empty();
                                                            $('#userInfo_home span').append("<pre>" + via.jsonSyntaxHighlight(JSON.stringify(data.userObject, null, 4)) + "</pre>");

                                                            var ds = [];
                                                            $.each(data.userSettings,function(k,v){
                                                                ds.push({
                                                                    text: k, value: v
                                                                });
                                                            });
                                                            userSettingCombo.setDataSource(ds);
                                                            userSettingCombo.value(null);
                                                            $("#userInfo_settings_value").val(null);
                                                        });
                                                    }
                                                },
                                                'json');
                                        });
                                    });

                                    //Delete
                                    $(".userInfo_settings_delete_button").click(function(){
                                        var key = userSettingCombo.text();
                                        if(via.undef(key,true)){ return; }

                                        via.kendoConfirm("Delete User Setting","Are you sure you want to remove the user setting <b>"+key+"</b>.",function(){
                                            //Post to the server
                                            kendo.ui.progress($("#odinLite_userInfoWindow"), true);
                                            $.post(odin.SERVLET_PATH,
                                                {
                                                    action: "admin.deleteUserSettings",
                                                    userId: userId,
                                                    userName: userName,
                                                    keys: JSON.stringify([key]),
                                                    isOdinLite: true
                                                },
                                                function (data, status) {
                                                    kendo.ui.progress($("#odinLite_userInfoWindow"), false);//Wait Message off

                                                    if (!via.undef(data, true) && data.success === false) {
                                                        via.debug("Failure deleting user settings:", data.message);
                                                        via.alert("Failure deleting user settings", data.message);
                                                    } else {
                                                        via.debug("Successful deleting user settings:", data);

                                                        via.kendoAlert("Deleting User Settings",data.message,function(){
                                                            //User Object Data//
                                                            $('#userInfo_home span').empty();
                                                            $('#userInfo_home span').append("<pre>" + via.jsonSyntaxHighlight(JSON.stringify(data.userObject, null, 4)) + "</pre>");

                                                            var ds = [];
                                                            $.each(data.userSettings,function(k,v){
                                                                ds.push({
                                                                    text: k, value: v
                                                                });
                                                            });
                                                            userSettingCombo.setDataSource(ds);
                                                            userSettingCombo.value(null);
                                                            $("#userInfo_settings_value").val(null);
                                                        });
                                                    }
                                                },
                                                'json');
                                        });
                                    });

                                }


                                //Transaction Data//
                                var grid = null;
                                function updateTransactionData(transactionsTs) {
                                    if(via.undef(transactionsTs)){return;}
                                    console.log('updating TransactionData',transactionsTs);
                                    $('#userInfo_transactions span').empty();
                                    odinTable.createTable("odinLite_userInfoTransactionTable", transactionsTs, '#userInfo_transactions span');
                                    grid = $('#odinLite_userInfoTransactionTable').data('kendoGrid');
                                    grid.setOptions({
                                        sortable: true,
                                        groupable: false,
                                        columnMenu: false,
                                        height: "275px",
                                        filterable: false,
                                        pageable: false,
                                        selectable: true
                                    });
                                }
                                $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                                    var target = $(e.target).attr("href"); // activated tab
                                    if(target === '#userInfo_transactions') {
                                        updateTransactionData(data.transactionsTs);
                                    }else if(target === '#userInfo_settings'){
                                        userSettingUpdate();
                                    }
                                });


                                //One Off Billing
                                $('.odinLite_selectUserOneOffBilling').click(function(){
                                    via.kendoPrompt("One off Billing","What is the amount you would like to charge?",function(total){
                                        var regex  = /^\d+(?:\.\d{0,2})$/;
                                        if (!regex.test(total)){
                                            via.kendoAlert("Invalid Total","Total is invalid: " + total);
                                        }else{
                                            via.kendoPrompt("One off Billing","What is the reason for the one off billing?",function(description) {
                                                via.kendoConfirm("Check Charges", "This will charge <b>" + total + "</b> using authorization id <b>" +
                                                    data.userSettings.authorizationId + "</b>.<br/>When complete an email receipt will be sent to <b>" + userName + "</b>.<br/>" +
                                                    "With the reason: <b>"+description+"</b>", function () {

                                                    //Post to the server
                                                    kendo.ui.progress($("#odinLite_userInfoWindow"), true);
                                                    $.post(odin.SERVLET_PATH,
                                                        {
                                                            action: 'odinLite.billing.doAdhocBilling',
                                                            userId: userId,
                                                            userName: userName,
                                                            totalAmount:total,
                                                            billingDescription:description
                                                        },
                                                        function (data, status) {
                                                            kendo.ui.progress($("#odinLite_userInfoWindow"), false);//Wait Message off

                                                            if (!via.undef(data, true) && data.success === false) {
                                                                via.debug("Failure billing user:", data.message);
                                                                via.alert("Failure billing user", data.message);
                                                            } else {
                                                                via.debug("Successful billing user:", data);

                                                                if (!via.undef(data.message, true)) {
                                                                    via.kendoAlert("Billing Successful",data.message,function(){
                                                                        updateTransactionData(data.transactionsTs);
                                                                    });
                                                                }else{
                                                                    via.kendoAlert("Billing Successful","Successfully billed.",function(){
                                                                        updateTransactionData(data.transactionsTs);
                                                                    });
                                                                }
                                                            }
                                                        },
                                                        'json');
                                                });
                                            });
                                        }
                                    });
                                });

                                //Refund Transaction
                                $('.odinLite_selectUserRefundTransaction').click(function(){
                                    //Get Transaction ID
                                    var selectedItem = grid.dataItem(grid.select());
                                    if(via.undef(selectedItem)){return;}
                                    var identifierName = "Transaction ID";
                                    var billingName = "Billing Amount";
                                    var id = null;
                                    var billingAmount = null;
                                    $.each( selectedItem, function(k,v){
                                        if(k.startsWith(via.cleanId(identifierName))){
                                            id = v;
                                        }else if(k.startsWith(via.cleanId(billingName))){
                                            billingAmount = v;
                                        }
                                    });
                                    if(via.undef(id)){return;}

                                    if(via.undef(billingAmount,true) || billingAmount === 0){
                                        via.kendoAlert("Refund Error","There was no charge for this transaction.");
                                        return;
                                    }

                                    via.kendoPrompt("Process Refund","What is the amount you would like to refund for transaction id <b>"+id+"</b>? Total transaction was <b>" + billingAmount + "</b>.",function(total){
                                        var regex  = /^\d+(?:\.\d{0,2})$/;
                                        if (!regex.test(total)){
                                            via.kendoAlert("Invalid Total","Total is invalid: " + total);
                                        }else{
                                            total = parseFloat(total);
                                            if(billingAmount < total){
                                                via.kendoAlert("Refund Error","The total refund is more than the billed amount.");
                                                return;
                                            }
                                            via.kendoPrompt("Process Refund","What is the reason for the refund?",function(description) {
                                                via.kendoConfirm("Check Charges", "This will refund <b>" + total + "</b> for transaction id <b>" +
                                                    id + "</b>.<br/>When complete an email receipt will be sent to <b>" + userName + "</b>.<br/>With the description: <b>"+description+"</b>", function () {

                                                    //Post to the server
                                                    kendo.ui.progress($("#odinLite_userInfoWindow"), true);
                                                    $.post(odin.SERVLET_PATH,
                                                        {
                                                            action: 'odinLite.billing.processRefund',
                                                            userId: userId,
                                                            userName: userName,
                                                            totalAmount:total,
                                                            refundDescription:description,
                                                            saleId: id
                                                        },
                                                        function (data, status) {
                                                            kendo.ui.progress($("#odinLite_userInfoWindow"), false);//Wait Message off

                                                            if (!via.undef(data, true) && data.success === false) {
                                                                via.debug("Failure refunding user:", data.message);
                                                                via.alert("Failure refunding user", data.message);
                                                            } else {
                                                                via.debug("Successful refunding user:", data);

                                                                if (!via.undef(data.message, true)) {
                                                                    via.kendoAlert("Refund Successful",data.message,function(){
                                                                        updateTransactionData(data.transactionsTs);
                                                                    });
                                                                }else{
                                                                    via.kendoAlert("Refund Successful","Successfully refunded.",function(){
                                                                        updateTransactionData(data.transactionsTs);
                                                                    });
                                                                }
                                                            }
                                                        },
                                                        'json');
                                                });
                                            });
                                        }
                                    });
                                });

                                //Transaction Detail
                                $('.odinLite_selectUserTransactionDetail').click(function(){
                                    var selectedItem = grid.dataItem(grid.select());
                                    if(via.undef(selectedItem)){return;}
                                    var identifierName = "Transaction ID";
                                    var id = null;
                                    $.each( selectedItem, function(k,v){
                                        if(k.startsWith(via.cleanId(identifierName))){
                                            id = v;
                                            return;
                                        }
                                    });
                                    if(via.undef(id)){return;}


                                    kendo.ui.progress($("body"), true);
                                    $.post(odin.SERVLET_PATH,
                                        {
                                            action: 'odinLite.billing.getTransactionDetails',
                                            id : id
                                        },
                                        function(data, status){
                                            kendo.ui.progress($("body"), false);
                                            $('#accountSettings_updatePasswordButton').prop( "disabled", false );

                                            if(!via.undef(data,true) && data.success === false){
                                                via.debug("Get Transaction Details Error:", data.message);
                                                via.kendoAlert("Get Transaction Details Error",data.message);
                                            }else{//Success - File Preview
                                                via.debug("Get Transaction Details success:", data);
                                                via.kendoAlert(identifierName +": "+ id,"<pre>" + via.jsonSyntaxHighlight(JSON.stringify(data.transactionResponse, null, 4)) + "</pre>");
                                            }
                                        },
                                        'json');
                                });

                            });

                        }
                    },
                    'json');
            });

            //Become User
            $(".odinLite_becomeUser").on("click", function () {
                kendo.ui.progress($("body"), true);
                var userDD = $("#odinLite_switchUserName").data('kendoDropDownList');
                $.post(odin.SERVLET_PATH,
                    {
                        action: 'admin.becomeAnotherUser',
                        userName: userDD.text(),
                        entity: odinLite.ENTITY_CODE
                    },
                    function (data, status) {
                        kendo.ui.progress($("body"), false);//Wait Message off

                        if (!via.undef(data, true) && data.success === false) {
                            via.debug("Failure getting users:", data.message);
                            via.kendoAlert("Failure getting users", data.message);
                        } else {
                            via.debug("Successful getting users:", data);

                            var loginString = "&user="+data.userName +
                                "&entity="+data.entity +
                                "&apiKey="+encodeURIComponent(data.apiKey) +
                                "&encKey="+encodeURIComponent(data.encKey);

                            if(!via.undef(data.lastAccessTime,true)) {
                                via.kendoConfirm("User Logged In", "User may be logged in. Last access time was: " + data.lastAccessTime, function () {
                                     odin.logoutUser(function(){
                                     window.location = '../index.jsp?referrer=./' + odin.ODIN_LITE_DIR + '/' + loginString;
                                     },true);
                                });
                            }else {
                                 odin.logoutUser(function(){
                                 window.location = '../index.jsp?referrer=./' + odin.ODIN_LITE_DIR + '/' + loginString;
                                 },true);
                            }
                        }
                    },
                    'json');
            });

            $(".odinLite_deleteSwitchUser").on("click", function () {
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
        function updateEntityList(data, userId) {
            var entityArr = data.entityHash[userId];
            if (via.undef(entityArr) || entityArr.length === 0) {
                return [];
            }

            var entityDsArr = [];
            for (var i = 0; i < entityArr.length; i++) {
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
    createMultiEntityWindow: function (data, selectFn) {

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
                modal: false,
                close: false,
                actions: [
                    //"Maximize"
                ],
                close: function () {
                    entityWindow = null;
                    $('#odinLite_entityWindow').remove();
                }
            }).data("kendoWindow");

            entityWindow.center();

            //Get the Entity List
            var entityArr = [];
            if (!via.undef(data.entityList)) {
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
            $(".odinLite_selectEntity").on("click", function () {
                var dataItem = $("#odinLite_multiEntityName").data("kendoDropDownList").dataItem();
                if (via.undef(dataItem, true) || via.undef(dataItem.value, true)) {
                    return;
                }
                odinLite.ENTITY_DIR = dataItem.value;
                odinLite.ENTITY_NAME = dataItem.text;
                entityWindow.close();
                if (!via.undef(selectFn)) {
                    selectFn();
                }
            });
            $(".odinLite_createEntity").on("click", function () {
                odinLite_modelCache.createNewEntity(function (data) {
                    entityWindow.close();
                    odinLite.setUserLoggedIn();
                });
            });
            $(".odinLite_deleteEntity").on("click", function () {
                var dataItem = $("#odinLite_multiEntityName").data("kendoDropDownList").dataItem();
                if (via.undef(dataItem, true) || via.undef(dataItem.value, true)) {
                    return;
                }
                odinLite_modelCache.deleteEntity(dataItem.value, dataItem.text, function (data) {
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
        var params = via.getQueryParams();
        var debug = "";
        if(!via.undef(params.debug,true)){
            debug = "&debug=true";
        }
        $('body').fadeOut(function () {
            window.location = "../appBuilder/?entityDir=" + odinLite.ENTITY_DIR + "&entityName=" + odinLite.ENTITY_NAME + "&appName=" + odinLite.APP_NAME +
                "&overrideUser=" + ((via.undef(odinLite.OVERRIDE_USER, true) ? "" : odinLite.OVERRIDE_USER) + debug + "&isFreeOnlyUser=" + odinLite.isFreeOnlyUser);
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

        var tooltip = $("#home_yourPackagesButton").data('kendoTooltip');
        if (!via.undef(tooltip)) {
            tooltip.hide();
        }

        window.scrollTo(0, 0);
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

        $('#payment').fadeIn(function(){
            window.scrollTo(0, 0);
        });

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
        if (via.undef(isMultiEntity, true)) {
            return false;
        } else if (isMultiEntity === "true" || isMultiEntity === true) {
            return true;
        } else {
            return false;
        }
    }
};
