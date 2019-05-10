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
        packageSelection.newPackages = [];
        packageSelection.cancelPackages = [];

        var updateTable = $("#package-update-table tbody");
        $(updateTable).data('addPackageIds',null);
        $(updateTable).data('discountCode',null);

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
            selectedPackageList.find(".label").show();

            var deletePackageList = $("#delete-package-list");
            if (deletePackageList.find("ul").find("li")) {
                deletePackageList.find("ul").empty();
                deletePackageList.find("p").empty();
            }
            deletePackageList.find(".label").show();

            packageSelection.newPackages.length = 0;
            packageSelection.cancelPackages.length = 0;
            packageSelection.systemCancelPackages = null;
        }
        packageSelection.isBackButton = false;

        //PackageFilter
        var filterField = $('#package_filterText');
        filterField.off();
        filterField.val("");
        filterField.keyup(function(e){
            var filterVal = $(this).val();
            var packages = $("#packages .package-description");
            for(var i=0;i<packages.length;i++){
                var div = $(packages[i]);
                var desc = div.closest("p").context.innerText;
                if(!via.undef(filterVal) && !via.undef(desc) && desc.toLowerCase().indexOf(filterVal.toLowerCase())!==-1){
                    div.show();
                    div.data("hidden","false");
                }else{
                    div.hide();
                    div.data("hidden","true");
                }
            }
            //Check the application panel
            var isAllHidden = true;
            var applications = $("#package-list .application-selection-panel");
            for(var i=0;i<applications.length;i++){
                var appPanel = applications[i];
                var packages = $(appPanel).find(".package-description");
                var isHidden = true;
                for(var j=0;j<packages.length;j++){
                    var packageDiv = packages[j];
                    if($(packageDiv).data("hidden")!=="true"){
                        isHidden = false;
                        break;
                    }
                }
                if(isHidden === true){
                    $(appPanel).hide();
                }else{
                    $(appPanel).show();
                    isAllHidden = false;
                }
            }
            if(isAllHidden === true){
                $('.allPackagesFiltered').fadeIn();
            }else{
                $('.allPackagesFiltered').hide();
            }
        });
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
                packageSelection.packagePricing = jQuery.parseJSON(data).packagePricing;
                packageSelection.displayPackages(packageSelection);
                packageSelection.getCurrentPackages();
            }
        );
    },

    /* Format json from web service call to display package pricing */
    displayPackages: function (data) {
        var packagePricing = data["packagePricing"];
        var pricingData = packagePricing["data"];

        var isDisabled = {};
        var applications = {};
        $.each(pricingData, function (idx, packageArr) {
            var applicationName = packageArr[0];
            var packageId = packagePricing.rowHeaders[idx];
            var packageName = packageArr[1];
            var setUpFee = packageArr[2];
            var monthlyCost = packageArr[3];
            var description = packageArr[4];
            var webLink = packageArr[5];
            var isNonFree = packageArr[6];
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
            packageInfo["webLink"] = webLink;

            if(odin.USER_INFO.userSettings.isBillingVerified!=="true" && isNonFree === "1"){
                packageInfo["disable"] = true;
                var infoMessage = $('.packages_noCreditCardOnFile');
                infoMessage.show();
                isDisabled[applicationName] = true;
            }
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
            applicationInfo = packageSelection.getApplicationPanelHtml(applicationView,isDisabled);

            packageSelectionForm.append(applicationInfo);

            //Get this application panel to put each package underneath
            var applicationPanel = $("#collapse_" + appId);

            //For each package we will append its information under that application
            $.each(packages, function (index, packageInfo) {
                var packagePanel = packageSelection.getPackageDescriptionHtml(packageInfo);
                applicationPanel.append(packagePanel);
            });

            //Remove the last bottom margin for each application.
            applicationPanel.find(".package-description").last().css("margin-bottom","0px");

            i++;

        });

    },

    /* Collapsible panel for each application */
    getApplicationPanelHtml: function (applicationView,isDisabled) {
        var name = applicationView.applicationName;
        var disable = isDisabled[name];

         var html = "<div class='form-group'>" +
            "<div class='panel-group' id='accordion_{{appId}}'>";

        if(disable === true) {
            html += "<div class='panel panel-warning application-selection-panel'>";
        }else{
            html += "<div class='panel panel-primary application-selection-panel'>";
        }

        html += "<div class='panel-heading'>" +
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
        var disabled = "";
        if($.inArray(packageView.packageId,odinLite.subscribedPackageList) !== -1){
            disabled = "disabled ";
        }else if(packageView["disable"] === true){
            disabled = "disabled ";
        }

        var html = "<div class='well package-description' style='user-select:none;' >" +
            "<input "+disabled+"type='radio' id='applicationRadio_{{applicationId}}' name='{{applicationId}}' value='{{packageId}}' data-package-name='{{packageName}}'> ";

        if(packageView["disable"] === true || $.inArray(packageView.packageId,odinLite.subscribedPackageList) !== -1) {
            html += "<label style='color:gray;' for='applicationRadio_{{applicationId}}'>{{packageName}}</label>";
        }else{
            html += "<label for='applicationRadio_{{applicationId}}'>{{packageName}}</label>";
        }


        html += "<br>" +
            "<p>{{description}}</p>" +
            "<a href='{{webLink}}' target='_blank'>See More Details</a>" +
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
        var packages = odinLite.subscribedPackageList;

        //Loop through the packages.
        if (!via.undef(packages) && packages.length > 0) {
            $.each(packages, function (index, packageId) {
                var packageData = {
                    packageId: packageId,
                    packageName: packageId
                };
                //Get the name from the id.
                if(!via.undef(packageSelection.packagePricing.rowHeaders)){
                    var idx = $.inArray(packageId,packageSelection.packagePricing.rowHeaders);
                    var row = packageSelection.packagePricing.data[idx];
                    if(idx !== -1 && !via.undef(row)){
                        packageData.packageName = row[1];
                    }
                }

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

        if (!via.undef(packageSelection.newPackages) && packageSelection.newPackages.length > 0) {
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
            selectedPackageList.find(".label").hide();
        }
    },

    /* When a package is removed from list of package updates, clear the radio button, remove it from array, and possibly show label */
    clearFormInput: function (packageName) {

        var formInput = $("input[value=" + "\"" + packageName + "\"" + "]");
        formInput.removeAttr("checked");

        var idx = -1;
        $.each(packageSelection.newPackages,function(i,package){
            if(package.id === packageName){
                idx = i;
                return;
            }
        });
        if(idx!==-1) {
            packageSelection.newPackages.splice(idx, 1);
        }

        if (via.undef(packageSelection.newPackages) || packageSelection.newPackages.length == 0) {
            $("#selected-package-list").find(".label").show();
        }
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
            deletePackageList.find(".label").hide();
        }
    },

    /* Method to remove an item from the list of cancelled items */
    removeCancelItem: function (packageId) {
        var cancelItems = $("#delete-package-list").find("li");
        packageSelection.cancelPackages.splice($.inArray(packageId, packageSelection.cancelPackages), 1);
        if(via.undef(packageSelection.cancelPackages) || packageSelection.cancelPackages.length === 0){
            $("#delete-package-list").find(".label").show();
        }
    },

    /**
     * submitPackageUpdate
     * Send selected package list to odin server to get pricing information
     **/
    submitPackageUpdate: function () {
        getCancelsFromApplication();

        var packageUpdates = {
            "updates": packageSelection.newPackages,
            "cancellations": packageSelection.cancelPackages
        };

        // If no packages are selected for addition or deletion then do nothing. //
        if(via.undef(packageUpdates) || via.undef(packageUpdates.updates) || via.undef(packageUpdates.cancellations) ||
            (packageUpdates.updates.length===0 && packageUpdates.cancellations.length===0)){
            via.kendoAlert("Select a Package","Select at least one package to update.");
            return;
        }

        // Load the payment page //
        odinLite.loadPaymentPage(packageUpdates);

        /*This function will update the cancel packages
        * based on the packages that are being ordered.
        * You can only have one package from each application. */
        function getCancelsFromApplication(){
            //Check if packages are being added.
            if(via.undef(packageSelection.newPackages) || packageSelection.newPackages.length === 0){ return; }

            //Loop through the current subscribed packages.
            var subscribedAppMap = {};
            for(var i in odinLite.subscribedPackageList){
                var packageId = odinLite.subscribedPackageList[i]
                var app = packageSelection.getApplicationFromPackageId(packageId);
                subscribedAppMap[app] = packageId;
            }

            //Loop through the packages being added.
            packageSelection.systemCancelPackages = null;
            for(var j in packageSelection.newPackages){
                var packageId = packageSelection.newPackages[j].id;
                var app = packageSelection.getApplicationFromPackageId(packageId);
                if(subscribedAppMap.hasOwnProperty(app)){
                    var packageId = subscribedAppMap[app];
                    if($.inArray(packageId,packageSelection.cancelPackages) === -1){
                        if(via.undef(packageSelection.systemCancelPackages)){ packageSelection.systemCancelPackages = []; }
                        if($.inArray(packageId,packageSelection.systemCancelPackages) === -1) {
                            packageSelection.systemCancelPackages.push(packageId);
                        }
                    }
                }
            }
        }
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
        var submitText = "Your credit card will be charged <b>" + kendo.toString(total, "c") + "</b> for the first monthly payment of the subscription packages(s) you selected.<br/>" +
            "You may cancel at anytime.<br/><br/><p style='text-align:center;'>Click OK to continue.</p>";
        if(via.undef(total,true) || total === 0){
            submitText = "Your credit card will <b>NOT</b> be charged for this package update.<br/><br/><p style='text-align:center;'>Click OK to continue.</p>";
        }
        via.kendoConfirm("Submit Payment Info",submitText,function(){
            var updateTable = $("#package-update-table tbody");

            /* Gather all the variables */
            var description = null;
            var countryCode = null;
            if(!via.undef(updateTable.data("billingInfodescription"))) {
                description = updateTable.data("billingInfodescription");
                description = JSON.parse(description);
                countryCode = description.country_code;
            }

            var addPackageList = $(updateTable).data('addPackageIds');
            var discountCode = $(updateTable).data('discountCode');
            //Get the cancellations//
            var cancellations = packageSelection.cancelPackages;
            if(!via.undef(packageSelection.systemCancelPackages)){
                if(via.undef(cancellations)){
                    cancellations = packageSelection.systemCancelPackages;
                }else{
                    cancellations =  $.merge(cancellations,packageSelection.systemCancelPackages);
                }
                cancellations = $.unique( cancellations );
            }
            var removePackageList = JSON.stringify(cancellations);

            odin.progressBar("Performing Transaction",100,"Please Wait...");
            odinLite_billing.chargeBillingByPackage(addPackageList,removePackageList,discountCode,countryCode,
                //Function to call after successful billing.
                function(data){
                    //Hide progress
                    odin.progressBar(null,100,null,true);

                    //Reset total
                    $("#package-update-table tbody").data("total",null);

                    //Popup
                    if(!via.undef(addPackageList)) {
                        via.kendoAlert("Transaction Successful", "You have been successfully subscribed to the package(s).",
                        function(){
                            location.reload();
                        });
                        var tooltip = $("#home_yourPackagesButton").data('kendoTooltip');
                        if(!via.undef(tooltip)) {
                            tooltip.destroy();
                        }
                    }else{
                        via.kendoAlert("Successfully Unsubscribed", "You have been successfully unsubscribed from the package(s).",
                            function(){
                                location.reload();
                            });
                    }

                    //Update packages and load home
                    odinLite.subscribedPackageList = data.packageList;
                    odinLite.resetHomeApplications();
                    odinLite.loadHome();

                }
            );
        });
    },

    /* Once payment page is loaded and get pricing information from server. list
     details of package updates or cancellations */
    getPackageUpdateDetails: function (packageUpdates) {
        //Show the progress bar
        odin.progressBar("Fetching Data",100,"Please Wait...");

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
        if(!via.undef(packageUpdates.updates,true)) {
            $.each(packageUpdates.updates, function (i, obj) {
                packageIds.push(obj.id);
            });
            $(updateTable).data('addPackageIds',JSON.stringify(packageIds));
        }

        /*Grab the discount code.*/
        var discountCode = $('#discount-code').val();

        /*Make call to server to get the billing and $ info*/
        odinLite_billing.signupPackagePricing(packageIds, discountCode, function(data){
            /* Update billing and store the information */
            packageSelection.displayBillingInfo(data.billingInfo);

            //Store some variables for use duting payment submit.
            if(!via.undef(data.billingInfo)) {
                $(updateTable).data('billingInfodescription', data.billingInfo.description);
            }
            $(updateTable).data('discountCode',data.discountCode);

            /* Update Add Packages */
            if(!via.undef(data.signupPricing)) {
                var updates = [];
                for (var i = 0; i < data.signupPricing[0].data.length; i++) {
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
                    if (via.undef(row.packageTotal, true) && via.undef(row.setupFee, true) && via.undef(row.monthlyCost, true) && via.undef(row.name, true)) {
                        html = "<tr><td colspan='5'>{{application}}</td></tr>";
                    } else if (!via.undef(row.application, true) && row.application.toLowerCase() === 'total') {
                        html = "<tr><td><b>{{application}}</b></td><td>{{name}}</td><td align='right'>{{setupFee}}</td><td align='right'>{{monthlyCost}}</td><td align='right' style='color:red;font-weight:bold;'>{{packageTotal}}</td></tr>";
                    } else {
                        html = "<tr><td>{{application}}</td><td>{{name}}</td><td align='right'>{{setupFee}}</td><td align='right'>{{monthlyCost}}</td><td align='right'>{{packageTotal}}</td></tr>";
                    }
                    var output = Mustache.render(html, row);

                    updateTable.append(output);
                });

                /* Gather variables to be used later */
                if(!via.undef(data.signupPricing) && !via.undef(data.signupPricing[1]) && !via.undef(data.signupPricing[1].data)){
                    var total = data.signupPricing[1].data[0][0];
                    $(updateTable).data('total', total);
                }

                /* Check discount code and update. */
                if(!via.undef(data.isDiscountCodeValid)){
                    $('#discount-code-response').removeClass('label-danger');
                    $('#discount-code-response').addClass('label-success');
                    $('#discount-code').val(data.isDiscountCodeValid[0]);
                    $('#discount-code-response').html(data.isDiscountCodeValid[1]);
                }else if(!via.undef(data.discountCode,true) && via.undef(data.isDiscountCodeValid)){
                    $('#discount-code-response').removeClass('label-success');
                    $('#discount-code-response').addClass('label-danger');
                    $('#discount-code-response').html("Discount code is invalid.");
                }
            }else{
                updateTable.append('<tr><td colspan="5"><span class="label label-warning">No Updates. There will be no charge for this change.</span></td></tr>');
            }

            /* Populate Cancellations */
            var cancellations = packageSelection.cancelPackages;
            if(!via.undef(packageSelection.systemCancelPackages)){
                if(via.undef(cancellations)){
                    cancellations = packageSelection.systemCancelPackages;
                }else{
                    cancellations =  $.merge(cancellations,packageSelection.systemCancelPackages);
                }
            }
            if(via.undef(cancellations) || cancellations.length === 0){
                cancelTable.append('<tr><td colspan="5"><span class="label label-info">No Cancellations</span></td></tr>');
            }else{
                $.each(cancellations, function (index, packageId) {
                    var packageData = {
                        applicationName: packageId,
                        packageId: packageId,
                        packageName: packageId
                    };
                    //Get the name from the id.
                    if(!via.undef(packageSelection.packagePricing.rowHeaders)){
                        var idx = $.inArray(packageId,packageSelection.packagePricing.rowHeaders);
                        var row = packageSelection.packagePricing.data[idx];
                        if(idx !== -1 && !via.undef(row)){
                            packageData.applicationName = row[0];
                            packageData.packageName = row[1];
                        }
                    }

                    var html = "<tr><td>{{applicationName}}</td><td>{{packageName}}</td></tr>";
                    var output = Mustache.render(html, packageData);
                    cancelTable.append(output);

                });
            }

            /*Re-enable buttons*/
            odin.progressBar(null,100,null,true);
            kendo.ui.progress($("#payment"), false);//Wait Message on
            $('#discount-code').attr("disabled",false);
            $('#discount-code-button').attr("disabled",false);
            $('#payment-back-button').attr("disabled",false);
            $('#payment-makePayment-button').attr("disabled",false);


            //Update text on submit button;
            if(packageUpdates.updates.length === 0 && packageUpdates.cancellations.length > 0) {//Just cancels
                $('#payment-makePayment-button').html("Cancel Packages");
                $('#payment-makePayment-button').css("width","140px");
            }else if(packageUpdates.updates.length > 0 && $(updateTable).data('total')===0){
                $('#payment-makePayment-button').html("Subscribe to Free Package(s)");
                $('#payment-makePayment-button').css("width","210px");
            }else{
                $('#payment-makePayment-button').html("Submit Payment");
                $('#payment-makePayment-button').css("width","140px");
            }
        },
        function(){
            odin.progressBar(null,100,null,true);
            kendo.ui.progress($("#payment"), false);//Wait Message on
            location.reload();
        });
    },

    /* Display billing info on payment page */
    displayBillingInfo: function (billingInfoData) {
        var billingInfo = $("#billing-info-display");
        billingInfo.empty();

        if(!via.undef(billingInfoData)) {
            var cardNumber = (billingInfoData.card.number.length > 4) ? billingInfoData.card.number.substring(billingInfoData.card.number.length - 4, billingInfoData.card.number.length) : billingInfoData.card.number;
            var data = {
                "cardType": billingInfoData.payment_method,
                "ccDigits": cardNumber,
                "expirationMonth": kendo.toString(parseInt(billingInfoData.card.expiration_month), "00"),
                "expirationYear": billingInfoData.card.expiration_year
            };

            var html = "<p><b >{{cardType}}</b> ending in <b >{{ccDigits}}</b><p>" +
                "Expires: <b class='label label-info'>{{expirationMonth}}/{{expirationYear}}</b>";

            var output = Mustache.render(html, data);
            billingInfo.append(output);
        }else if(odinLite.isFreeOnlyUser === true){
            billingInfo.append("Billing is not setup. You can only subscribe to Free and Demo Reports.");
        }

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

    //Helper function to get the app id for a package//
    getApplicationFromPackageId: function(packageId){
        if(!via.undef(packageSelection.packagePricing.rowHeaders)){
            var idx = $.inArray(packageId,packageSelection.packagePricing.rowHeaders);
            var row = packageSelection.packagePricing.data[idx];
            if(idx !== -1 && !via.undef(row)){
                return row[0];
            }
        }
        return null;
    }
};
