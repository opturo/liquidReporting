/**
 * Created by rocco on 9/6/2018.
 * This is the billing section of ODIN Lite.
 * This will handle everything to do with billing and pricing.
 */
var odinLite_billing = {

    /**
     * packageTesting
     * FOR TESTING ONLY
     */
    packageTesting: function () {
        var addPackageList = ["VICAP_REPORTING_STANDARD_USER_GROUP"];
        var deletePackageList = ["VICAP_REPORTING_ADVANCED_USER_GROUP"];

        odinLite_billing.updateUserPackage(addPackageList, deletePackageList, true);
        //odinLite_billing.checkBillingIsVerified(addPackageList);
        //odinLite_billing.doInitialSignupBillingByPackage(addPackageList);
    },

    /**
     * signupPackagePricing
     * This method gets the initial signup pricing.
     */
    signupPackagePricing: function (packageList, discountCode, callbackFn,failCallbackFn) {
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.getSignupPackagePricing',
                addPackageList: JSON.stringify(packageList),
                discountCode: discountCode
            },
            function (data, status) {

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure getting pricing info:", data.message);

                    if (!via.undef(data.failureType, true) &&
                        (data.failureType === "billing_paylaneRequest" || data.failureType === "billing_paylaneResponse")) {
                        via.alert("Billing Data Expired.", "Please update you billing information on the next screen. <br>Error: " + data.message, function () {
                            location.reload();
                        });
                    }else {
                        via.alert("Failure getting pricing info", data.message, function () {
                            if(!via.undef(failCallbackFn)){
                                failCallbackFn(data);
                            }
                        });
                    }
                    return;
                } else {//Success
                    via.debug("Pricing Success Info", data);
                    if(!via.undef(callbackFn)){
                        callbackFn(data);
                    }
                }
            },
            'json');
    },

    /**
     * reoccurringPackagePricing
     * This method gets the reoccurring monthly package pricing.
     */
    reoccurringPackagePricing: function (packageList) {
        if (via.undef(packageList, true)) {
            via.alert("Missing Arguments", "Specify a Package List.");
            return;
        }

        kendo.ui.progress($("body"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.getReoccurringPricing',
                packageList: JSON.stringify(packageList)
            },
            function (data, status) {
                kendo.ui.progress($("body"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure getting pricing info:", data.message);
                    via.alert("Failure getting pricing info", data.message, function () {
                    });
                    return;
                } else {//Success
                    via.debug("Pricing Success Info", data);
                    console.log("reoccurringPackagePricing", data);//Testing
                }
            },
            'json');
    },

    /**
     * getAutoApplyDiscountCode
     * This method gets the auto apply discount code for the packages sent
     */
    getAutoApplyDiscountCode: function (packageList) {
        if (via.undef(packageList, true)) {
            via.alert("Missing Arguments", "Specify a Package List.");
            return;
        }

        kendo.ui.progress($("body"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.getAutoApplyDiscountCode',
                packageList: JSON.stringify(packageList)
            },
            function (data, status) {
                kendo.ui.progress($("body"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure getting discount code:", data.message);
                    via.alert("Failure getting discount code", data.message, function () {
                    });
                    return;
                } else {//Success
                    via.debug("Discount code success", data);
                }
            },
            'json');
    },

    /**
     * checkBillingIsVerified
     * This checks to make sure their billing information has been verified. If not it would popup the modal window for credit card entry
     * If they have been verified it will continue to the application.
     */
    checkBillingIsVerified: function (callbackFn) {
        var isBillingVerified = odin.getUserSpecificSetting("isBillingVerified");
        var isOdinLiteUser = odin.getUserSpecificSetting("isOdinLiteUser");
        if (via.undef(isOdinLiteUser, true) || isOdinLiteUser !== "true") {//They are not a billable client
            via.debug("Skipping billing, not a billing customer.");
            console.log("checkBillingIsVerified: Skipping billing, not a billing customer.");
            callbackFn();//Call the function to continue the login.
            return;
        }

        //Check if they have been verified.
        if (via.undef(isBillingVerified, true) || isBillingVerified === "false") {//Not Verified
            /*For the text in the header of the popup window.*/
            var popupType = -1;
            if(via.undef(isBillingVerified, true)){
                //New user
                popupType = 1;
            }else{
                //Existing user
                popupType = 2;
            }
            /** Not verified popup billing window. **/
            console.log("checkBillingIsVerified: Not verified. Make them enter credit card info.");
            if (via.undef(via.getParamsValue("entityname")) && via.undef(via.getParamsValue("entitydir"))) {
                odinLite_billing.billingWindowPopup(popupType, callbackFn, false, odinLite.ALLOW_SUB_WITHOUT_CARD);
            }else if(!via.undef(callbackFn)){
                callbackFn();
            }
        } else {//They are verified. Call the function to continue the login.
            console.log("checkBillingIsVerified: They are verified. Call the function to continue the login.");

            //See if there is any past due balance.
            odinLite_billing.pastDueWindowPopup();

            if (!via.undef(callbackFn)) {
                callbackFn();//Call the function to continue the login.
            }
        }
    },

    /**
     * pastDueWindowPopup
     * This is used for initial billing, expired or failed billing as well as updating a payment type.
     */
    pastDueWindowPopup: function(){
        var billingDataSet = odin.getUserSpecificSetting("billingDataSet");
        var billingFailureDate = odin.getUserSpecificSetting("billingFailureDate");
        //Check to see if they have a past due bill. Otherwise return.
        if(via.undef(billingDataSet,true) || via.undef(billingFailureDate,true)){ return; }

        billingDataSet = JSON.parse(billingDataSet);//Parse the table

        $.get("./html/pastDueBillWindow.html", function (billingWindowTemplate) {
            $('#odinLite_pastDueBillingWindow').remove();
            $('body').append(billingWindowTemplate);

            var billingWindow = $('#odinLite_pastDueBillingWindow').kendoWindow({
                title: "Past Due Bill  ",
                draggable: false,
                resizable: false,
                width: "850px",
                height: "500px",
                modal: true,
                close: false,
                actions: [],
                close: function () {
                    billingWindow = null;
                    $('#odinLite_pastDueBillingWindow').remove();
                }
            }).data("kendoWindow");

            billingWindow.center();
            billingWindow.open();

            //Update - Empty
            var updateTable = $("#pastDue-update-table tbody");
            updateTable.empty();

            //Get the packages to be billed
            var itemizedArr = [];
            var itemizedSet =  billingDataSet.tablesets[0];
            for(var r=0;r<itemizedSet.data.length;r++){
                var data = itemizedSet.data[r];
                itemizedArr.push({
                    application: data[0],
                    package: data[1],
                    cost: kendo.toString(data[2], "c"),
                });
            }

            //Loop through the lines and build the table.
            $.each(itemizedArr, function (index, row) {
                var html = null;
                if (via.undef(row.package, true) && via.undef(row.cost, true)) {
                    html = "<tr><td colspan='5'>{{application}}</td></tr>";
                } else if (!via.undef(row.application, true) && row.application.toLowerCase() === 'total') {
                    html = "<tr><td><b>{{application}}</b></td><td>{{package}}</td><td align='right' style='color:red;font-weight:bold;'>{{cost}}</td></tr>";
                } else {
                    html = "<tr><td>{{application}}</td><td>{{package}}</td><td align='right'>{{cost}}</td></tr>";
                }
                var output = Mustache.render(html, row);

                updateTable.append(output);
            });

            //Update the due date.
            $('#odinLite_pastDueBillingWindow .failedBillingDate').append(billingFailureDate + ".");

            var totalSet =  billingDataSet.tablesets[1];
            var total = totalSet.data[0][0];
            if(via.undef(total,true)){
                via.kendoAlert("Billing Error","Total owed is undefined.");
            }

            $('#pastDue-makePayment-button').click(function(){
                var submitText = "Your credit card will be charged <b>" + kendo.toString(total, "c") + "</b> for the past-due bill period. Click OK to continue.";
                via.kendoConfirm("Submit Past-Due Payment",submitText,function(){
                    odinLite_billing.pastDueBilling(billingDataSet,function(data){
                        billingWindow.close();
                        via.kendoAlert("Billing Complete",data.message,function(){
                            odin.USER_INFO.userSettings = data.userSettings;
                        });
                    });
                });
            });
        });
    },

    /**
     * pastDueBilling
     * Use this for billing a past due bill.
     */
    pastDueBilling: function (datasetJson,successCallbackFn,failCallbackFn) {
        if (via.undef(datasetJson, true) && via.undef(removePackageList, true)) {
            via.alert("Missing Arguments", "No DataSet Specified.");
            return;
        }

        kendo.ui.progress($("#odinLite_pastDueBillingWindow"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.performPastDueBilling',
                datasetJson: JSON.stringify(datasetJson)
            },
            function (data, status) {
                kendo.ui.progress($("#odinLite_pastDueBillingWindow"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure Past-Due Billing:", data.message);
                    via.alert("Failure Past-Due Billing", data.message, function () {
                        if(!via.undef(failCallbackFn)){
                            failCallbackFn(data);
                        }
                    });
                    return;
                } else {//Success
                    via.debug("Past-Due Billing Success", data);
                    if(!via.undef(successCallbackFn)){
                        successCallbackFn(data);
                    }
                }
            },
            'json');
    },

    /**
     * billingWindowPopup
     * This is used for initial billing, expired or failed billing as well as updating a payment type.
     */
    billingWindowPopup: function (popupType,callbackFn,allowClosing,allowSubWithoutCard) {

        kendo.ui.progress($("body"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.init'
            },
            function (data, status) {
                //console.log('odinLite.billing.init', data);
                kendo.ui.progress($("body"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {//Failure
                    via.debug("Failure getting billing info:", data.message);
                    via.alert("Failure getting billing info", data.message);
                    return;
                } else {//Success
                    //Get the window template
                    $.get("./html/ccBillingWindow.html", function (billingWindowTemplate) {
                        $('#odinLite_ccBillingWindow').remove();
                        $('body').append(billingWindowTemplate);

                        //Populate known values
                        $("#cc-billing-form input[name='name']").val(odin.USER_INFO.firstName + " " + odin.USER_INFO.lastName);
                        $("#cc-billing-form input[name='email']").val(odin.USER_INFO.userName);

                        //Add Country Box
                        var ccDropDown = $("#cc-billing-form input[name='countryCode']").kendoDropDownList({
                            dataTextField: "text",
                            dataValueField: "value",
                            dataSource: data.countryCombo,
                            value: 'US',
                            change: function(e){
                                var value = e.sender.value();
                                if(value === 'US'){
                                    $('.ccBillingSpan').show();
                                }else{
                                    $('.ccBillingSpan').hide();
                                }
                            }
                        }).data('kendoDropDownList');
                        ccDropDown.trigger('change');

                        //Add State Box
                        $("#cc-billing-form input[name='state']").kendoDropDownList({
                            dataTextField: "text",
                            dataValueField: "value",
                            dataSource: data.states,
                            index: 1
                        });

                        //Add Months
                        $("#cc-billing-form input[name='expirationMonth']").kendoDropDownList({
                            dataTextField: "text",
                            dataValueField: "value",
                            dataSource: data.expirationMonths,
                            index: 0
                        });

                        //Add Months
                        $("#cc-billing-form input[name='expirationYear']").kendoDropDownList({
                            dataTextField: "text",
                            dataValueField: "value",
                            dataSource: data.expirationYears,
                            index: 0
                        });

                        //Validation zip code
                        $("#cc-billing-form input[name='zip']").keyup(function () {
                            this.value = this.value.replace(/[^0-9-]/g, '');
                        });
                        //Validation Credit Card
                        $("#cc-billing-form input[name='cardNumber']").keyup(function () {
                            this.value = this.value.replace(/[^0-9-]/g, '');
                        });
                        //Validation CVV
                        $("#cc-billing-form input[name='cardCode']").keyup(function () {
                            this.value = this.value.replace(/[^0-9]/g, '');
                        });

                        //Check for first time user and update.
                        var isFirstTimeUser = false;
                        if (popupType === 1) {
                            isFirstTimeUser = true;
                            //$('#billing_verifyModal .modal-title').append(" - First Time User");
                            $('#odinLite_ccBillingWindow .panel-heading-color').removeClass('panel-danger');
                            $('#odinLite_ccBillingWindow .panel-heading-color').addClass('panel-warning');
                            $('#odinLite_ccBillingWindow .panel-heading-title').html("First Time User: Billing Information");
                        }else if(popupType === 3){
                            $('#odinLite_ccBillingWindow .panel-heading-color').removeClass('panel-danger');
                            $('#odinLite_ccBillingWindow .panel-heading-color').addClass('panel-warning');
                            $('#odinLite_ccBillingWindow .panel-heading-title').html("Update Billing Information");
                        }

                        //Launch the modal and make it non-dismiss
                        /*$('#billing_verifyModal').modal({
                            backdrop: 'static',
                            keyboard: false
                        });*/
                        //Make the window.
                        var actions = [];
                        if(allowClosing===true){
                            actions.push("Close");
                        }

                        var billingWindow = $('#odinLite_ccBillingWindow').kendoWindow({
                            title: "Credit Card Authorization",
                            draggable: false,
                            resizable: false,
                            width: "850px",
                            height: "90%",
                            modal: true,
                            close: (allowClosing===true)?true:false,
                            actions: actions,
                            close: function () {
                                billingWindow = null;
                                $('#odinLite_ccBillingWindow').remove();
                            }
                        }).data("kendoWindow");

                        billingWindow.center();
                        billingWindow.open();
                        //Set the HTML title
                        billingWindow.wrapper.find('.k-window-title').html("<div class='creditCardIcon'></div> Credit Card Authorization");

                        /** Button Events **/
                        if(!via.undef(allowSubWithoutCard) && allowSubWithoutCard === "true") {//Check to make sure they can subscribe without cards.
                            //Check to make sure their number if subscriptions are less then the max amount allowed.
                            var isMaxSignupAttempts = false;
                            if(!via.undef(odinLite.MAX_SIGNUP_WITHOUT_CARD) ){
                                odinLite.MAX_SIGNUP_WITHOUT_CARD = parseInt(odinLite.MAX_SIGNUP_WITHOUT_CARD+"");
                                if(!via.undef(odinLite.userSignupMap) && !via.undef(odinLite.userSignupMap['SignUp Attempts'])) {
                                    odinLite.userSignupMap['SignUp Attempts'] = parseInt(odinLite.userSignupMap['SignUp Attempts'] + "");
                                    if(odinLite.userSignupMap['SignUp Attempts'] > odinLite.MAX_SIGNUP_WITHOUT_CARD){
                                        isMaxSignupAttempts = true;
                                    }
                                }
                            }

                            //Check to make sure they do not have a past due bill.
                            var hasPastDueBill = false;
                            var billingDataSet = odin.getUserSpecificSetting("billingDataSet");
                            var billingFailureDate = odin.getUserSpecificSetting("billingFailureDate");
                            if(!via.undef(billingDataSet,true) && !via.undef(billingFailureDate,true)){
                                hasPastDueBill = true;
                            }

                            //Enable the skip if needed.
                            if(isMaxSignupAttempts === false && hasPastDueBill === false) {
                                $(".skip-billing-button").show();
                                $(".skip-billing-button").click(function (e) {
                                    e.preventDefault();
                                    via.kendoConfirm("Skip this step", "Please confirm that you would like to skip this step. <br/>" +
                                        "Without a credit card on file, you can only subscribe to Free and Demo Reports.", function () {
                                        billingWindow.close();
                                        odinLite.isFreeOnlyUser = true;

                                        if (!via.undef(callbackFn)) {
                                            callbackFn(isFirstTimeUser);//Continue with the login
                                        }
                                    })
                                });
                            }
                        }

                        $('#cc-billing-form').submit(function (e) {
                            //Don't submit
                            e.preventDefault();

                            //Get everything into form values
                            var formValues = {};
                            $.each($('#cc-billing-form').serializeArray(), function (i, field) {
                                formValues[field.name] = field.value;
                            });

                            /* Validate */
                            //Zip Code
                            $("#cc-billing-form input[name='zip']").removeClass("formError");//Clear error
                            if (formValues.countryCode === "US") {
                                var isValidZip = /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(formValues.zip);
                                if (isValidZip === false) {
                                    via.kendoAlert("Invalid Zip Code", "Please Enter a valid zip code.");
                                    $("#cc-billing-form input[name='zip']").addClass("formError");
                                    return;
                                }
                            }

                            //CVV
                            $("#cc-billing-form input[name='cardCode']").removeClass("formError");//Clear error
                            var isValidCVV = /(^\d{3}$)|(^\d{4}$)/.test(formValues.cardCode);
                            if (isValidCVV === false) {
                                via.kendoAlert("Invalid CVV", "Please Enter a valid Card Verification Value.");
                                $("#cc-billing-form input[name='cardCode']").addClass("formError");
                                return;
                            }
                            /* End - Validate */

                            /* Authorize card on server. */
                            odinLite_billing.authorizeCard(formValues,callbackFn,isFirstTimeUser);
                        });
                    });
                }
            },
            'json');
    },

    /**
     * authorizeCard
     * This will make a call to the server to authorize the card.
     */
    authorizeCard: function (formValues,callbackFn,isFirstTimeUser) {
        kendo.ui.progress($("#odinLite_ccBillingWindow"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            $.extend(formValues, {
                action: 'odinLite.billing.authorizeCard'
            }),
            function (data, status) {
                kendo.ui.progress($("#odinLite_ccBillingWindow"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure authorizing user:", data.message);
                    via.kendoAlert("Failure authorizing", data.message, function () {
                        //console.log("Popup modal window, again. User failed to authorize for whatever reason.");
                    });
                    return;
                } else {//Success
                    //Hide the billing screen.
                    $('#odinLite_ccBillingWindow').data('kendoWindow').close();

                    via.alert("Credit Card Authorization Successful", data.message, function () {
                        odin.USER_INFO.userSettings = data.userSettings;//Update user settings with the new values.
                        if (!via.undef(callbackFn)) {
                            callbackFn(isFirstTimeUser);//Continue with the login
                        }

                        //See if there is any past due balance.
                        odinLite_billing.pastDueWindowPopup();
                    });
                    return;
                }
            },
            'json');
    },

    /**
     * chargeBillingByPackage
     * Use this for billing packages.
     * This will bill the current user based on the packages selected.
     */
    chargeBillingByPackage: function (addPackageList,removePackageList,discountCode,countryCode,successCallbackFn,failCallbackFn) {
        if (via.undef(addPackageList, true) && via.undef(removePackageList, true)) {
            via.alert("Missing Arguments", "No packages specified.");
            return;
        }

        kendo.ui.progress($("body"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.chargeBillingByPackage',
                addPackageList: addPackageList, //The packages to be added
                removePackageList: removePackageList, //This is the list of packages to be removed and deleted.
                discountCode: discountCode,
                countryCode: countryCode
            },
            function (data, status) {
                kendo.ui.progress($("body"), false);//Wait Message off

                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure billing for sign-up:", data.message);
                    via.alert("Failure Billing for Sign-up", data.message, function () {
                        if(!via.undef(failCallbackFn)){
                            failCallbackFn(data);
                        }
                    });
                    return;
                } else {//Success
                    via.debug("Signup Billing Success Info", data);
                    if(!via.undef(data.message)){
                        via.kendoAlert("Signup Message",data.message,function(){
                            if(!via.undef(successCallbackFn)){
                                successCallbackFn(data);
                            }
                        });
                    }else if(!via.undef(successCallbackFn)){
                        successCallbackFn(data);
                    }
                }
            },
            'json');
    },


    /**
     * updateUserPackage
     * This will update/delete packages and optionally delete the data models associated with the packages that are being deleted.
     */
    updateUserPackage: function (addPackageList, deletePackageList, isDeleteData) {
        if (via.undef(addPackageList, true) && via.undef(deletePackageList, true)) {
            via.alert("Missing Arguments", "Specify an add package list or a delete package List.");
            return;
        }
        if (via.undef(isDeleteData, true)) {
            isDeleteData = false;
        }

        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.updateUserPackage',
                addPackageList: JSON.stringify(addPackageList),
                deletePackageList: JSON.stringify(deletePackageList),
                isDeleteData: isDeleteData,
                entityDir: odinLite.ENTITY_DIR
            },
            function (data, status) {
                if (!via.undef(data, true) && data.success === false) {
                    via.debug("Failure updating package:", data.message);
                    via.alert("Failure Updating Package", data.message, function () {
                    });
                    return;
                } else {//Success
                    via.debug("Success updating package", data);
                }
            },
            'json');
    },

    /* Converts modal form with credit card information into JSON data
     that will be sent to Paylane for authorization */
    getBillingInfo: function () {

        var data = {};

        $("#billing-form").serializeArray().map(function (x) {
            data[x.name] = x.value;
        });

        return data;

    }
};
