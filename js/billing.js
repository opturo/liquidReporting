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
    packageTesting: function(){
        var addPackageList = ["VICAP_REPORTING_STANDARD_USER_GROUP"];
        var deletePackageList = ["VICAP_REPORTING_ADVANCED_USER_GROUP"];

        odinLite_billing.updateUserPackage(addPackageList,deletePackageList,true);
        //odinLite_billing.checkBillingIsVerified(addPackageList);
        //odinLite_billing.doInitialSignupBillingByPackage(addPackageList);
    },

    /**
     * signupPackagePricing
     * This method gets the initial signup pricing.
     */
    signupPackagePricing: function(packageList,discountCode){
        if(via.undef(packageList,true)){
            via.alert("Missing Arguments","Specify a Package List.");
            return;
        }

        kendo.ui.progress($("body"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.getSignupPricing',
                packageList: JSON.stringify(packageList),
                discountCode: discountCode
            },
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure getting pricing info:", data.message);
                    via.alert("Failure getting pricing info", data.message,function(){
                    });
                    return;
                }else{//Success
                    via.debug("Pricing Success Info", data);
                    console.log("signupPackagePricing",data);//Testing
                }
            },
            'json');
    },

    /**
     * reoccurringPackagePricing
     * This method gets the reoccurring monthly package pricing.
     */
    reoccurringPackagePricing: function(packageList){
        if(via.undef(packageList,true)){
            via.alert("Missing Arguments","Specify a Package List.");
            return;
        }

        kendo.ui.progress($("body"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.getReoccurringPricing',
                packageList: JSON.stringify(packageList)
            },
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure getting pricing info:", data.message);
                    via.alert("Failure getting pricing info", data.message,function(){
                    });
                    return;
                }else{//Success
                    via.debug("Pricing Success Info", data);
                    console.log("reoccurringPackagePricing",data);//Testing
                }
            },
            'json');
    },

    /**
     * getAutoApplyDiscountCode
     * This method gets the auto apply discount code for the packages sent
     */
    getAutoApplyDiscountCode: function(packageList){
        if(via.undef(packageList,true)){
            via.alert("Missing Arguments","Specify a Package List.");
            return;
        }

        kendo.ui.progress($("body"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.getAutoApplyDiscountCode',
                packageList: JSON.stringify(packageList)
            },
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure getting discount code:", data.message);
                    via.alert("Failure getting discount code", data.message,function(){
                    });
                    return;
                }else{//Success
                    via.debug("Discount code success", data);
                    console.log("getAutoApplyDiscountCode",data);//Testing
                }
            },
            'json');
    },

    /**
     * checkBillingIsVerified
     * This checks to make sure their billing information has been verified. If not it would popup the modal window for credit card entry
     * If they have been verified it will continue to the application.
     */
    checkBillingIsVerified: function(callbackFn){
        var isBillingVerified = odin.getUserSpecificSetting("isBillingVerified");
        var isOdinLiteUser = odin.getUserSpecificSetting("isOdinLiteUser");
        if(via.undef(isOdinLiteUser,true) || isOdinLiteUser !== "true"){//They are not a billable client
            via.debug("Skipping billing, not a billing customer.");
            console.log("checkBillingIsVerified: Skipping billing, not a billing customer.");
            callbackFn();//Call the function to continue the login.
            return;
        }

        //Check if they have been verified.
        if(via.undef(isBillingVerified,true) || isBillingVerified==="false"){



            $('#billing_verifyModal').modal('show');
            /*
            kendo.ui.progress($("body"), true);//Wait Message on
            $.post(odin.SERVLET_PATH,
                {
                    action: 'odinLite.billing.authorizeCard',
                    name: "Chris Fallon",
                    email: "cfallon@opturo.com",
                    ipAddress: "127.0.0.1",
                    streetHouse: "108 Test Road",
                    city: "Rochester",
                    state: "NY",
                    zip: "14580",
                    countryCode: "US",
                    cardNumber: "4111111ss111111111",
                    expirationMonth: "04",
                    expirationYear: "2020",
                    nameOnCard: "Christopher R Fallon",
                    cardCode: "123"
                },
                function(data, status){
                    kendo.ui.progress($("body"), false);//Wait Message off

                    if(!via.undef(data,true) && data.success === false){
                        via.debug("Failure authorizing user:", data.message);
                        via.alert("Failure authorizing user", data.message,function(){
                            console.log("Popup modal window, again. User failed to authorize for whatever reason. Hopefully the error should show.");
                        });
                        return;
                    }else{//Success
                        via.alert("Authorization Success", data.message,function() {
                            console.log("They just got verified. Call the function to continue the login.");
                            odin.USER_INFO.userSettings.isBillingVerified = "true";
                            if (!via.undef(callbackFn)) {
                                callbackFn();//Continue with the login
                            }
                        });
                        return;
                    }
                },
                'json');
             */

        }else{//They are verified. Call the function to continue the login.
            console.log("checkBillingIsVerified: They are verified. Call the function to continue the login.");
            if (!via.undef(callbackFn)) {
                callbackFn();//Call the function to continue the login.
            }
        }
    },


    /**
     * doInitialSignupBillingByPackage
     * Use this for first time billing.
     * This will bill the current user based on the packages selected.
     */
    doInitialSignupBillingByPackage: function(packageList,discountCode){
        if(via.undef(packageList,true)){
            via.alert("Missing Arguments","Specify a Package List.");
            return;
        }

        kendo.ui.progress($("body"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.doInitialSignupBillingByPackage',
                packageList: JSON.stringify(packageList),
                discountCode: discountCode
            },
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure billing for sign-up:", data.message);
                    via.alert("Failure Billing for Sign-up", data.message,function(){
                    });
                    return;
                }else{//Success
                    via.debug("Signup Billing Success Info", data);
                    console.log("doInitialSignupBillingByPackage",data);//Testing
                }
            },
            'json');
    },


    /**
     * updateUserPackage
     * This will update/delete packages and optionally delete the data models associated with the packages that are being deleted.
     */
    updateUserPackage: function(addPackageList,deletePackageList,isDeleteData){
        if(via.undef(addPackageList,true) && via.undef(deletePackageList,true)){
            via.alert("Missing Arguments","Specify an add package list or a delete package List.");
            return;
        }
        if(via.undef(isDeleteData,true)){ isDeleteData = false; }

        kendo.ui.progress($("body"), true);//Wait Message on
        $.post(odin.SERVLET_PATH,
            {
                action: 'odinLite.billing.updateUserPackage',
                addPackageList: JSON.stringify(addPackageList),
                deletePackageList: JSON.stringify(deletePackageList),
                isDeleteData: isDeleteData,
                entityDir: odinLite.ENTITY_DIR
            },
            function(data, status){
                kendo.ui.progress($("body"), false);//Wait Message off

                if(!via.undef(data,true) && data.success === false){
                    via.debug("Failure updating package:", data.message);
                    via.alert("Failure Updating Package", data.message,function(){
                    });
                    return;
                }else{//Success
                    via.debug("Success updating package", data);
                    console.log("updateUserPackage",data);//Testing
                }
            },
            'json');
    },

    /* Converts modal form with credit card information into JSON data
    that will be sent to Paylane for authorization */
    getBillingInfo: function(){

      var data = {};
      
      $("#billing-form").serializeArray().map(function(x){data[x.name] = x.value;});

      return data;

    }
};
