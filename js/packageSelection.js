var ODIN_SERVER="http://odinqa.opturo.com";



var packageSelection = {

  PACKAGES_URL: odin.SERVLET_PATH + "/ODIN_LITE/PRICING_PACKAGE_USAGE",
  DATA_USAGE_URL: odin.SERVLET_PATH + "/ODIN_LITE/PRICING_DATA_USAGE",
  DISCOUNT_CODE_URL: odin.SERVLET_PATH + "/ODIN_LITE/VALIDATE_DISCOUNT_CODE",

  userPackages: [{"packageId": "TEST_1", "packageName": "Test 1"},{"packageId": "TEST_2", "packageName": "Test 2"},{"packageId": "TEST_3", "packageName": "Test 3"}],
  newPackages: [],
  cancelPackages: [],

  /* Loads user current packages, and clears all the lists when the page is loaded */
  init: function()
  {
    packageSelection.clearLists();

    packageSelection.getDataUsageCosts();
    packageSelection.getPackageList();
    packageSelection.getCurrentPackages();

    packageSelection.checkList();
  },

  /* Monitors when the form changes and updates the packages that are being added by the users */
  checkList: function()
  {
    $("#package-selection-form").on('change input',function()
    {
        // Re check the radio buttons each time the form changes
        packageSelection.newPackages.length = 0;

        var formInputs = $("#package-selection-form :radio:checked");

        $.each(formInputs, function(key, input)
        {
          if ($.inArray(input.value, packageSelection.newPackages) == -1)
          {
            packageSelection.newPackages.push(input.value);
          }
        })
        packageSelection.updateSelectedPackages();
    });
  },

  /* When the page is loaded reset the selected and canceled package lists */
  clearLists: function(){
    var currentPackageList = $("#current-package-list");
    currentPackageList.find("ul").empty();

    var packageSelectionForm = $("#package-selection-form");
    packageSelectionForm.empty();

    var dataUsageTable = $("#data-usage-table tbody");
    dataUsageTable.empty();

    packageSelection.newPackages.length = 0;
    packageSelection.cancelPackages.length = 0;
  },

  /* Gets the current costs of data usage in SAYS */
  getDataUsageCosts: function()
  {
    $.get(packageSelection.DATA_USAGE_URL,
        function(data){
          packageSelection.displayDataUsageCosts(jQuery.parseJSON(data));
        }
      );
  },

  /* Displays the current costs of data usage in SAYS */
  displayDataUsageCosts: function(data)
  {
    var dataPricing = data["dataPricing"]["data"];

    var dataCosts = [];
    $.each(dataPricing, function(index,prices)
    {
      dataCosts.push({"interval": prices[0], "cost": prices[1]});
    });

    packageSelection.getDataUsageHTML(dataCosts);
  },

  /* Template HTML for the Data Usage table */
  getDataUsageHTML: function(dataCosts)
  {
    var dataUsageTable = $("#data-usage-table tbody");

    $.each(dataCosts, function(index, row){

      var html = "<tr><td>{{interval}}</td><td>{{cost}}</td></tr>"
      var output = Mustache.render(html, row);

      dataUsageTable.append(output);
    });

  },

  /* Displays the list of currently available packages in SAYS */
  getPackageList: function()
  {
      $.get(packageSelection.PACKAGES_URL,
          function(data){
            packageSelection.displayPackages(jQuery.parseJSON(data));
          }
        );
  },

  /* Format json from web service call to display package pricing */
  displayPackages: function(data)
  {
    var packagePricing = data["packagePricing"];
    var pricingData = packagePricing["data"];

    var applications = {};
    $.each(pricingData, function(key,val)
    {
      if (val[0] in applications)
      {
        var application = applications[val[0]];

        //Create array that will contain packages within application
        var packageInfo = {};

        //TODO: replace with actual package ID
        packageInfo["applicationId"] = val[0];
        packageInfo["packageId"] = val[1];
        packageInfo["applicationName"] = val[0];
        packageInfo["packageName"] = val[1];
        packageInfo["setUpFee"] = val[2];
        packageInfo["monthlyCost"] = val[3];
        packageInfo["description"] = val[4];

        application.push(packageInfo);

        applications[val[0]] = application;

      } else {
        //Create array that will contain packages within application
        var packageInfo = {};
        var application = [];

        //TODO: replace with actual package ID
        packageInfo["applicationId"] = val[0];
        packageInfo["packageId"] = val[1];
        packageInfo["applicationName"] = val[0];
        packageInfo["packageName"] = val[1];
        packageInfo["setUpFee"] = val[2];
        packageInfo["monthlyCost"] = val[3];
        packageInfo["description"] = val[4];

        application.push(packageInfo);

        applications[val[0]] = application;
      }

    });

    var applicationView = {};
    applicationView[""]
    // Append information for each package to the package selection list
    var packageSelectionForm = $("#package-selection-form");

    // Get all the packages for each application
    var i = 0;
    $.each(applications, function(key, packages)
    {

      var applicationView = {};

      //Used for accordion collapsing
      var appId = "APP_"+i;

      applicationView["appId"] = appId;
      applicationView["applicationName"] = key;
      applicationInfo = packageSelection.getApplicationPanelHtml(applicationView);

      packageSelectionForm.append(applicationInfo);

      //Get this application panel to put each package underneath
      var applicationPanel = $("#collapse_"+appId);

      //For each package we will append its information under that application
      $.each(packages, function(index, packageInfo){

        var packagePanel = packageSelection.getPackageDescriptionHtml(packageInfo);
        applicationPanel.append(packagePanel);

      });

      i++;

    });

  },

  /* Collapsible panel for each application */
  getApplicationPanelHtml: function(applicationView){

    var html = "<div class='form-group'>"+
                  "<div class='panel-group' id='accordion_{{appId}}'>" +
                      "<div class='panel panel-primary application-selection-panel'>"+
                      "<div class='panel-heading'>"+
                        "<h4 class='panel-title'>"+
                          "<a data-toggle='collapse' data-parent='#accordion_{{appId}}' href='#collapse_{{appId}}'>"+
                          "<i class='tr fa fa-plus fa-fw'></i> {{applicationName}}</a>"+
                        "</h4>"+
                      "</div>"+
                      "<div id='collapse_{{appId}}' class='panel-collapse collapse'>"+
                      "</div>"+
                    "</div>"+
                    "</div>"+
                "</div>";

    var output = Mustache.render(html, applicationView);

    return output;
  },

  /* Append package list for each application */
  getPackageDescriptionHtml: function(packageView)
  {
    var html = "<div class='well package-description'>"+
                  "<input type='radio' name='{{applicationId}}' value='{{packageId}}'> {{packageName}}"+
                  "<br></br>"+
                  "<p>{{description}}</p>"+
                  "<a href='http://opturo.com/liquidreporting/analytics.php?package_id={{packageId}}' target='_blank'>See More Details</a>"+
                  "<br></br>"+
                  "<p>Monthly Cost (USD): <span> {{monthlyCost}} per month </span></p>"+
                  "<p>One-time Set Up Fee (USD): <span>{{setUpFee}}</span></p>"+
                "</div>";

      var output = Mustache.render(html, packageView);

      return output;
  },

  /* Populate package selection page with list of user's current packages */
  getCurrentPackages: function()
  {

      var currentPackageList = $("#current-package-list");

      if (packageSelection.userPackages.length > 0)
      {
        $.each(packageSelection.userPackages, function(index, packageData)
        {
          var packageListItem = "<li>"+
                                  "<div class='alert alert-info alert-dismissible'>"+
                                    "<a onclick='packageSelection.cancelCurrentPackageModal(\"{{packageId}}\", \"{{packageName}}\")' class='close'><i class='tr fa fa-trash fa-fw'></i></a>"+
                                    "<strong>{{packageName}}</strong>"+
                                  "</div>"+
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
  updateSelectedPackages: function()
  {
    var selectedPackageList = $("#selected-package-list");

    // Clear the list each time they change their selection
    // Will re-read the form inputs each time to populate list
    if (selectedPackageList.find("ul").find("li"))
    {
        selectedPackageList.find("ul").empty();
        selectedPackageList.find("p").empty();
    }

    if (packageSelection.newPackages.length > 0)
    {
      $.each(packageSelection.newPackages, function(index, val)
      {
        var selectedItemData = {"selectedItemData": val};
        // Only display the selected items that aren't none
        var selectedListItem = "<li>"+
                                "<div class='alert alert-success alert-dismissible'>"+
                                  "<a onclick='packageSelection.clearFormInput(\"{{selectedItemData}}\")' class='close' data-dismiss='alert' aria-label='close'>&times;</a>"+
                                  "<strong>Adding: {{selectedItemData}}</strong>"+
                                "</div>"+
                              "</li>";
        var output = Mustache.render(selectedListItem, selectedItemData);
        selectedPackageList.find("ul").append(output);
      });
    }
  },

  /* When a package is removed from list of package updates, clear the radio button */
  clearFormInput: function(packageName)
  {
    var formInput = $("input[value=" + "\"" + packageName +"\"" + "]");
    formInput.removeAttr("checked");
  },



  /**
  *
  * Methods related to cancelling current user packages
  *
  **/


  /* Alerts the user prior to them deciding to cancel their packages. Warns about
  data deletion and user account deletion */
  cancelCurrentPackageModal: function(packageId, packageName)
  {
    var alertHtml = "<div class='modal fade' id='deleteAlert" + "_" + packageId + "' role='dialog'>"+
                      "<div class='modal-dialog'>"+
                        "<div class='modal-content'>"+
                           "<div class='modal-header'>"+
                            "<button type='button' class='close' data-dismiss='modal'>&times;</button>"+
                             "<h4 class='modal-title'>Are You Sure?</h4>"+
                           "</div>"+
                           "<div class='modal-body'>"+
                            "This will cancel your current package and remove all data associated with the package and reports. Are you sure you want to cancel?<br></br>"+
                            "You will have a chance to undo this action before you hit Next."+
                           "</div>"+
                           "<div class='modal-footer'>"+
                             "<button type='button' class='tr btn btn-primary' data-dismiss='modal' onclick='packageSelection.cancelPackage(" + "\"" +  packageId + "\"" + "," + "\"" +  packageName + "\"" + ");'>Yes, I would like to cancel.</button>"+
                             "<button type='button' class='btn btn-default' data-dismiss='modal'>Close</button>"+
                           "</div>"+
                         "</div>"+
                      "</div>"+
                     "</div>";

      var packagePanel = $("#package-modals");
      packagePanel.empty();

      packagePanel.append(alertHtml);

      $('#deleteAlert_' + packageId).modal('show');
  },

  /* Method to create list of packages that are going to be cancelled by user */
  cancelPackage: function(packageId, packageName)
  {
      var deletePackageList = $("#delete-package-list");

      // Package that is going to be deleted
      var deleteListItem = "<li>"+
                              "<div class='alert alert-danger alert-dismissible'>"+
                                "<a onclick='packageSelection.removeCancelItem(" + "\"" +  packageId + "\"" + ")' class='close' data-dismiss='alert' aria-label='close'>&times;</a>"+
                                "<strong>" + "Cancelling: " + packageName + "</strong>"+
                              "</div>"+
                            "</li>";

      var deletePackageList = $("#delete-package-list");

      if ($.inArray(packageId, packageSelection.cancelPackages) == -1)
      {
        packageSelection.cancelPackages.push(packageId);
        deletePackageList.find("ul").append(deleteListItem);
      }
  },

  /* Method to remove an item from the list of cancelled items */
  removeCancelItem: function(packageId)
  {
    var cancelItems = $("#delete-package-list").find("li");
    packageSelection.cancelPackages.splice($.inArray(packageId, packageSelection.cancelPackages),1);
  },

  /* Send selected package list to odin server to get pricing information */
  submitPackageUpdate: function()
  {
    var packageUpdates = {"updates": packageSelection.newPackages,
                          "cancellations": packageSelection.cancelPackages};

    odinLite.loadPaymentPage(packageUpdates);
  },

  /* Once payment page is loaded and get pricing information from server. list
  details of package updates or cancellations */
  getPackageUpdateDetails: function(packageUpdates)
  {

    var updates = [{"name": "Testing 1", "description": "Upgrading", "cost": "100"}];
    var cancellations = packageUpdates["cancellations"];

    var updateTable = $("#package-update-table tbody");
    updateTable.empty();

    var cancelTable = $("#package-cancel-table tbody");
    cancelTable.empty();

    $.each(updates, function(index, row){
      var html = "<tr><td>{{name}}</td><td>{{description}}</td><td>{{cost}}</td></tr>"
      var output = Mustache.render(html, row);

      updateTable.append(output);
    });

    packageSelection.displayBillingInfo();

    packageSelection.displayDataUsageCosts();

  },

  /*Display billing info on payment page */
  displayBillingInfo: function()
  {
    var billingInfo = $("#billing-info-display");
    billingInfo.empty();

    var data = {"cardType": "Mastercard", "ccDigits": "1234", "expirationDate": "05/2021"};

    var html = "<p><b>{{cardType}}</b> ending with <b>{{ccDigits}}</b><p>"+
               "Expires: {{expirationDate}}";

    var output = Mustache.render(html, data);

    billingInfo.append(output);
  },

  /* Apply discount code and sees if the code is valid or not */
  applyDiscountCode: function()
  {
    var discountCode = $("#discount-code").val();
    var discountCodeBox = $("#discount-code-box");
    var discountCodeResponse = $("#discount-code-response");
    discountCodeResponse.empty();

    $.get(packageSelection.DISCOUNT_CODE_URL + "?packageList=EX_POST_ADVANCED_USER_GROUP" +
          "&userEmail=cfallon@opturo.com" +
          "&initialSignUpdate=20180920" +
          "&discountCode=" + discountCode,
          function(data){
            var response = jQuery.parseJSON(data)

            if(response["success"])
            {
              var validateDiscountCode = {"discountCodeText" : "Whatever the discount code does will appear here."};

              var success = "<div class='alert alert-success alert-dismissible'>"+
                            "<a class='close' data-dismiss='alert' aria-label='close'>&times;</a>"+
                            "<strong>{{discountCodeText}}</strong>"+
                          "</div>";
              var output = Mustache.render(success, validateDiscountCode);

              discountCodeResponse.append(output);
            }else{
              var error = "<div class='alert alert-danger alert-dismissible'>"+
                            "<a class='close' data-dismiss='alert' aria-label='close'>&times;</a>"+
                            "<strong>You entered an invalid discount code. Please try again.</strong>"+
                          "</div>";
              discountCodeResponse.append(error);
            }
          }
    );
  },


};
