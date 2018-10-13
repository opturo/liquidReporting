var packageSelection = {

    PACKAGES_URL: odin.SERVLET_PATH + "/ODIN_LITE/PRICING_PACKAGE_USAGE",
    DATA_USAGE_URL: odin.SERVLET_PATH + "/ODIN_LITE/PRICING_DATA_USAGE",
    DISCOUNT_CODE_URL: odin.SERVLET_PATH + "/ODIN_LITE/VALIDATE_DISCOUNT_CODE",

    userPackages: null,
    //userPackages: [{"packageId": "TEST_1", "packageName": "Test 1"},{"packageId": "TEST_2", "packageName": "Test 2"},{"packageId": "TEST_3", "packageName": "Test 3"}],
    newPackages: [],
    cancelPackages: [],

    /* Loads user current packages, and clears all the lists when the page is loaded */
    init: function () {
        packageSelection.clearLists();

        packageSelection.getDataUsageCosts();
        packageSelection.getPackageList();
        packageSelection.getCurrentPackages();

        packageSelection.checkList();
    },

    /* Monitors when the form changes and updates the packages that are being added by the users */
    checkList: function () {
        $("#package-selection-form").on('change input', function () {
            // Re check the radio buttons each time the form changes
            packageSelection.newPackages.length = 0;

            var formInputs = $("#package-selection-form :radio:checked");

            $.each(formInputs, function (key, input) {
                if ($.inArray(input.value, packageSelection.newPackages) == -1) {
                    packageSelection.newPackages.push({
                        name: $(input).data("packageName"),
                        id: input.value
                    });
                }
            })
            packageSelection.updateSelectedPackages();
        });
    },

    /* When the page is loaded reset the selected and canceled package lists */
    clearLists: function () {
        var currentPackageList = $("#current-package-list");
        currentPackageList.find("ul").empty();

        var packageSelectionForm = $("#package-selection-form");
        packageSelectionForm.empty();

        var dataUsageTable = $("#data-usage-table tbody");
        dataUsageTable.empty();

        if(packageSelection.isBackButton !== true) {
            var selectedPackageList = $("#selected-package-list");
            if (selectedPackageList.find("ul").find("li")) {
                selectedPackageList.find("ul").empty();
                selectedPackageList.find("p").empty();
            }

            var deletePackageList = $("#delete-package-list");
            if (deletePackageList.find("ul").find("li")) {
                deletePackageList.find("ul").empty();
                deletePackageList.find("p").empty();
            }

            packageSelection.newPackages.length = 0;
            packageSelection.cancelPackages.length = 0;
        }
        packageSelection.isBackButton = false;
    },

    /* Gets the current costs of data usage in SAYS */
    getDataUsageCosts: function () {
        $.get(packageSelection.DATA_USAGE_URL,
            function (data) {
                packageSelection.displayDataUsageCosts(jQuery.parseJSON(data));
            }
        );
    },

    /* Displays the current costs of data usage in SAYS */
    displayDataUsageCosts: function (data) {
        var dataPricing = data["dataPricing"]["data"];

        var dataCosts = [];
        $.each(dataPricing, function (index, prices) {
            dataCosts.push({"interval": prices[0], "cost": prices[1]});
        });

        packageSelection.getDataUsageHTML(dataCosts);
    },

    /* Template HTML for the Data Usage table */
    getDataUsageHTML: function (dataCosts) {
        var dataUsageTable = $("#data-usage-table tbody");

        $.each(dataCosts, function (index, row) {

            var html = "<tr><td>{{interval}}</td><td>{{cost}}</td></tr>"
            var output = Mustache.render(html, row);

            dataUsageTable.append(output);
        });

    },

    /* Displays the list of currently available packages in SAYS */
    getPackageList: function () {
        $.get(packageSelection.PACKAGES_URL,
            function (data) {
                packageSelection.displayPackages(jQuery.parseJSON(data));
            }
        );
    },

    /* Format json from web service call to display package pricing */
    displayPackages: function (data) {
        var packagePricing = data["packagePricing"];
        var pricingData = packagePricing["data"];

        var applications = {};
        $.each(pricingData, function (idx, packageArr) {
            var applicationName = packageArr[0];
            var packageId = packagePricing.rowHeaders[idx];
            var packageName = packageArr[1];
            var setUpFee = packageArr[2];
            var monthlyCost = packageArr[3];
            var description = packageArr[4];
            var application = [];
            if (applicationName in applications) {
                application = applications[applicationName];
            }

            //Add the info
            var packageInfo = {};
            packageInfo["applicationId"] = applicationName;
            packageInfo["applicationName"] = applicationName;
            packageInfo["packageId"] = packageId;
            packageInfo["packageName"] = packageName;
            packageInfo["setUpFee"] = setUpFee;
            packageInfo["monthlyCost"] = monthlyCost;
            packageInfo["description"] = description;
            //Push onto the application
            application.push(packageInfo);
            applications[applicationName] = application;
        });

        var applicationView = {};
        applicationView[""]
        // Append information for each package to the package selection list
        var packageSelectionForm = $("#package-selection-form");

        // Get all the packages for each application
        var i = 0;
        $.each(applications, function (key, packages) {

            var applicationView = {};

            //Used for accordion collapsing
            var appId = "APP_" + i;

            applicationView["appId"] = appId;
            applicationView["applicationName"] = key;
            applicationInfo = packageSelection.getApplicationPanelHtml(applicationView);

            packageSelectionForm.append(applicationInfo);

            //Get this application panel to put each package underneath
            var applicationPanel = $("#collapse_" + appId);

            //For each package we will append its information under that application
            $.each(packages, function (index, packageInfo) {

                var packagePanel = packageSelection.getPackageDescriptionHtml(packageInfo);
                applicationPanel.append(packagePanel);

            });

            i++;

        });

    },

    /* Collapsible panel for each application */
    getApplicationPanelHtml: function (applicationView) {

        var html = "<div class='form-group'>" +
            "<div class='panel-group' id='accordion_{{appId}}'>" +
            "<div class='panel panel-primary application-selection-panel'>" +
            "<div class='panel-heading'>" +
            "<h4 class='panel-title'>" +
            "<a data-toggle='collapse' data-parent='#accordion_{{appId}}' href='#collapse_{{appId}}'>" +
            "<i class='tr fa fa-plus fa-fw'></i> {{applicationName}}</a>" +
            "</h4>" +
            "</div>" +
            "<div id='collapse_{{appId}}' class='panel-collapse collapse'>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>";

        var output = Mustache.render(html, applicationView);

        return output;
    },

    /* Append package list for each application */
    getPackageDescriptionHtml: function (packageView) {
        var html = "<div class='well package-description'>" +
            "<input type='radio' name='{{applicationId}}' value='{{packageId}}' data-package-name='{{packageName}}'> {{packageName}}" +
            "<br>" +
            "<p>{{description}}</p>" +
            "<a href='http://opturo.com/" + odin.ODIN_LITE_DIR + "/analytics.php?package_id={{packageId}}' target='_blank'>See More Details</a>" +
            "<br>" +
            "<p>Monthly Cost (USD): <span> {{monthlyCost}} per month </span></p>" +
            "<p>One-time Set Up Fee (USD): <span>{{setUpFee}}</span></p>" +
            "</div>";

        var output = Mustache.render(html, packageView);

        return output;
    },

    /* Populate package selection page with list of user's current packages */
    getCurrentPackages: function () {

        var currentPackageList = $("#current-package-list");

        //Get the packages
        var packageList = odin.getUserSpecificSetting("packageList");
        if (!via.undef(packageList, true)) {
            packageSelection.userPackages = JSON.parse(packageList);
        }

        //Loop through the packages.
        if (!via.undef(packageSelection.userPackages) && packageSelection.userPackages.length > 0) {
            $.each(packageSelection.userPackages, function (index, packageData) {
                var packageListItem = "<li>" +
                    "<div class='alert alert-info alert-dismissible'>" +
                    "<a onclick='packageSelection.cancelCurrentPackageModal(\"{{packageId}}\", \"{{packageName}}\")' class='close'><i class='tr fa fa-trash fa-fw'></i></a>" +
                    "<strong>{{packageName}}</strong>" +
                    "</div>" +
                    "</li>";
                var output = Mustache.render(packageListItem, packageData);

                currentPackageList.find("ul").append(output);
            });
        }
    },

    /**
     *
     * Methods related to user selecting new packages
     *
     **/

    /* Reflect the packages they have currently selected that will be updated when they hit Next */
    updateSelectedPackages: function () {
        var selectedPackageList = $("#selected-package-list");

        // Clear the list each time they change their selection
        // Will re-read the form inputs each time to populate list
        if (selectedPackageList.find("ul").find("li")) {
            selectedPackageList.find("ul").empty();
            selectedPackageList.find("p").empty();
        }

        if (packageSelection.newPackages.length > 0) {
            $.each(packageSelection.newPackages, function (index, val) {
                // Only display the selected items that aren't none
                var selectedListItem = "<li>" +
                    "<div class='alert alert-success alert-dismissible'>" +
                    "<a onclick='packageSelection.clearFormInput(\"{{id}}\")' class='close' data-dismiss='alert' aria-label='close'>&times;</a>" +
                    "<strong>Adding: {{name}}</strong>" +
                    "</div>" +
                    "</li>";
                var output = Mustache.render(selectedListItem, val);
                selectedPackageList.find("ul").append(output);
            });
        }
    },

    /* When a package is removed from list of package updates, clear the radio button */
    clearFormInput: function (packageName) {
        var formInput = $("input[value=" + "\"" + packageName + "\"" + "]");
        formInput.removeAttr("checked");
    },


    /**
     *
     * Methods related to cancelling current user packages
     *
     **/


    /* Alerts the user prior to them deciding to cancel their packages. Warns about
     data deletion and user account deletion */
    cancelCurrentPackageModal: function (packageId, packageName) {
        var alertHtml = "<div class='modal fade' id='deleteAlert" + "_" + packageId + "' role='dialog'>" +
            "<div class='modal-dialog'>" +
            "<div class='modal-content'>" +
            "<div class='modal-header'>" +
            "<button type='button' class='close' data-dismiss='modal'>&times;</button>" +
            "<h4 class='modal-title'>Are You Sure?</h4>" +
            "</div>" +
            "<div class='modal-body'>" +
            "This will cancel your current package and remove all data associated with the package and reports. Are you sure you want to cancel?<br>" +
            "You will have a chance to undo this action before you hit Next." +
            "</div>" +
            "<div class='modal-footer'>" +
            "<button type='button' class='tr btn btn-primary' data-dismiss='modal' onclick='packageSelection.cancelPackage(" + "\"" + packageId + "\"" + "," + "\"" + packageName + "\"" + ");'>Yes, I would like to cancel.</button>" +
            "<button type='button' class='btn btn-default' data-dismiss='modal'>Close</button>" +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>";

        var packagePanel = $("#package-modals");
        packagePanel.empty();

        packagePanel.append(alertHtml);

        $('#deleteAlert_' + packageId).modal('show');
    },

    /* Method to create list of packages that are going to be cancelled by user */
    cancelPackage: function (packageId, packageName) {
        var deletePackageList = $("#delete-package-list");

        // Package that is going to be deleted
        var deleteListItem = "<li>" +
            "<div class='alert alert-danger alert-dismissible'>" +
            "<a onclick='packageSelection.removeCancelItem(" + "\"" + packageId + "\"" + ")' class='close' data-dismiss='alert' aria-label='close'>&times;</a>" +
            "<strong>" + "Cancelling: " + packageName + "</strong>" +
            "</div>" +
            "</li>";

        var deletePackageList = $("#delete-package-list");

        if ($.inArray(packageId, packageSelection.cancelPackages) == -1) {
            packageSelection.cancelPackages.push(packageId);
            deletePackageList.find("ul").append(deleteListItem);
        }
    },

    /* Method to remove an item from the list of cancelled items */
    removeCancelItem: function (packageId) {
        var cancelItems = $("#delete-package-list").find("li");
        packageSelection.cancelPackages.splice($.inArray(packageId, packageSelection.cancelPackages), 1);
    },

    /* Send selected package list to odin server to get pricing information */
    submitPackageUpdate: function () {
        var packageUpdates = {
            "updates": packageSelection.newPackages,
            "cancellations": packageSelection.cancelPackages
        };

        /* If no packages are selected for addition or deletion then do nothing. */
        if(via.undef(packageUpdates) || via.undef(packageUpdates.updates) || via.undef(packageUpdates.cancellations) ||
            (packageUpdates.updates.length===0 && packageUpdates.cancellations.length===0)){
            via.kendoAlert("Select a Package","Select at least one package to update.");
            return;
        }

        odinLite.loadPaymentPage(packageUpdates);
    },

    /**
     * editBillingInformation
     * allows you to edit your billing information
     */
    editPaymentInformation: function () {
        odinLite_billing.billingWindowPopup(3,function(){
            packageSelection.getPackageUpdateDetails({
                "updates": packageSelection.newPackages,
                "cancellations": packageSelection.cancelPackages
            });
        },true);
    },

    /**
     * submitPayment
     * submits the payment information to the credit card, etc.
     */
    submitPayment: function(){
        var total = $("#package-update-table tbody").data("total");

        via.kendoConfirm("Submit Payment Info","You credit card will be charged: " + kendo.toString(total, "c"),function(){
            var updateTable = $("#package-update-table tbody");

            /* Gather all the variables */
            var description = updateTable.data("billingInfodescription");
            description = JSON.parse(description);

            var countryCode = description.country_code;
            var addPackageList = $(updateTable).data('addPackageIds');
            var removePackageList = $(updateTable).data('removePackageIds');
            var discountCode = $(updateTable).data('discountCode');
            console.log('wooo',addPackageList,removePackageList,discountCode,countryCode);

            odinLite_billing.chargeBillingByPackage(addPackageList,removePackageList,discountCode,countryCode);
        });
    },

    /* Once payment page is loaded and get pricing information from server. list
     details of package updates or cancellations */
    getPackageUpdateDetails: function (packageUpdates) {
        //Disable things
        kendo.ui.progress($("#payment"), true);//Wait Message on
        $('#discount-code').attr("disabled","disabled");
        $('#discount-code-button').attr("disabled","disabled");
        $('#discount-code-button').attr("disabled","disabled");
        $('#payment-back-button').attr("disabled","disabled");
        $('#payment-makePayment-button').attr("disabled","disabled");

        /*Empty Previous data*/
        //Billing - Empty
        $("#billing-info-display").empty();
        //Update - Empty
        var updateTable = $("#package-update-table tbody");
        updateTable.empty();
        //Cancellations - Empty
        var cancelTable = $("#package-cancel-table tbody");
        cancelTable.empty();

        /*Get the package ids to get the price.*/
        var packageIds = [];
        $.each(packageUpdates.updates,function(i,obj){
            packageIds.push(obj.id);
        });

        /*Grab the discount code.*/
        var discountCode = $('#discount-code').val();

        /*Make call to server to get the billing and $ info*/
        odinLite_billing.signupPackagePricing(packageIds, discountCode, function(data){
            console.log('getPackageUpdateDetails,signupPackagePricing',data);

            /* Update billing */
            packageSelection.displayBillingInfo(data.billingInfo);

            /* Update Add Packages */
            var updates = [];
            for(var i=0;i<data.signupPricing[0].data.length;i++){
                var row = data.signupPricing[0].data[i];
                updates.push({
                    application: row[0],
                    name: row[1],
                    setupFee: kendo.toString(row[2], "c"),
                    monthlyCost: kendo.toString(row[3], "c"),
                    packageTotal: kendo.toString(row[4], "c"),
                });
            }
            $.each(updates, function (index, row) {
                var html = null;
                if(via.undef(row.packageTotal,true) && via.undef(row.setupFee,true) && via.undef(row.monthlyCost,true) && via.undef(row.name,true)){
                    html = "<tr><td colspan='5'>{{application}}</td></tr>";
                }else{
                    html = "<tr><td>{{application}}</td><td>{{name}}</td><td align='right'>{{setupFee}}</td><td align='right'>{{monthlyCost}}</td><td align='right'>{{packageTotal}}</td></tr>";
                }
                var output = Mustache.render(html, row);

                updateTable.append(output);
            });

            /* Gather variables to be used later */
            var total = data.signupPricing[1].data[0][0];
            $(updateTable).data('total',total);
            $(updateTable).data('billingInfodescription',data.billingInfo.description);
            $(updateTable).data('addPackageIds',JSON.stringify(packageIds));
            $(updateTable).data('removePackageIds',"[]");
            $(updateTable).data('discountCode',data.discountCode);

            /* Check discount code and update. */
            if(!via.undef(data.isDiscountCodeValid)){
                $('#discount-code-response').removeClass('label-danger');
                $('#discount-code-response').addClass('label-success');
                $('#discount-code').val(data.isDiscountCodeValid[0]);
                $('#discount-code-response').html(data.isDiscountCodeValid[1]);
            }else if(!via.undef(data.discountCode) && via.undef(data.isDiscountCodeValid)){
                $('#discount-code-response').removeClass('label-success');
                $('#discount-code-response').addClass('label-danger');
                $('#discount-code-response').html("Discount code is invalid.");
            }

            /* Populate Cancellations */
            //TODO this is not done - cancellations
            var cancellations = packageUpdates["cancellations"];
            if(via.undef(cancellations) || cancellations.length === 0){
                cancelTable.append('<tr><td colspan="5"><span class="label label-info">No Cancellations</span></td></tr>');
            }

            /*Re-enable buttons*/
            kendo.ui.progress($("#payment"), false);//Wait Message on
            $('#discount-code').attr("disabled",false);
            $('#discount-code-button').attr("disabled",false);
            $('#payment-back-button').attr("disabled",false);
            $('#payment-makePayment-button').attr("disabled",false);
        });
    },

    /* Display billing info on payment page */
    displayBillingInfo: function (billingInfoData) {
        var billingInfo = $("#billing-info-display");
        billingInfo.empty();

        var cardNumber = (billingInfoData.card.number.length>4)?billingInfoData.card.number.substring(0,4):billingInfoData.card.number;
        var data = {"cardType": billingInfoData.payment_method, "ccDigits": cardNumber, "expirationMonth": kendo.toString(parseInt(billingInfoData.card.expiration_month),"00"), "expirationYear": billingInfoData.card.expiration_year};

        var html = "<p><b >{{cardType}}</b> ending in <b >{{ccDigits}}</b><p>" +
            "Expires: <b class='label label-info'>{{expirationMonth}}/{{expirationYear}}</b>";

        var output = Mustache.render(html, data);

        billingInfo.append(output);
    },

    /* Apply discount code and sees if the code is valid or not */
    applyDiscountCode: function () {
        var discountCodeResponse = $("#discount-code-response");
        discountCodeResponse.empty();

        packageSelection.getPackageUpdateDetails({
            "updates": packageSelection.newPackages,
            "cancellations": packageSelection.cancelPackages
        });
    },


};
