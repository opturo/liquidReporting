var userTour = {
/* Tour of the Application Home Page */
  appPageTour: new Tour({
      storage : false,
      backdrop: false
  }),
  /* Tour of the Home Page */
  homeTour: new Tour({
      storage : false,
      backdrop: false
  }),
  /* Tour of Account Settings */
  accountSettingsTour: new Tour({
      storage : false,
      backdrop: false
  }),
  /* Tour of the Template Page */
  templateTour: new Tour({
      storage : false,
      backdrop: true
  }),
  /* Tour of the Browsing for files and loading to site */
  loadTour: new Tour({
      storage : false,
      backdrop: false
  }),
  /* Tour of Import Wizard */
  formattingTour: new Tour({
      storage : false,
      backdrop: false
  }),
  /* Tour of Import Wizard Column Mapping */
  modelMappingTour: new Tour({
      storage : false,
      backdrop: false
  }),
  /* Tour of managing the data */
  manageDataTour: new Tour({
      storage : false,
      backdrop: true
  }),
  
 initAppPageTour: function(){
    userTour.appPageTour.addSteps([
      {
        element: ".tour-step.app-page-tour-step-1",
        placement: "left",
        title: "List of Applications",
        content: "Once you've signed up for packages in the upper right you will see the list of applications available below.<br></br>You can select <b>All</b> to list all of them or <b>Grouped</b> to see the applications grouped by functionality.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-4",
        placement: "left",
        title: "Selecting Packages",
        content: "Here is where you can subscribe to <b>FREE</b> or <b>PAID</b> report packages you're interested in.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-5",
        placement: "left",
        title: "More Help",
        content: "This help button will take you to the Help Guide. Use this in conjunction with the <b>Application Overview</b> available when you select an Application.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-6",
        placement: "left",
        title: "Messages",
        content: "This will contain messages that are specific to your account and system-related alerts.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-7",
        placement: "left",
        title: "User Settings",
        content: "Click here to view/edit your user settings, billing information and password. It also provides a section to <b>Submit a Support Ticket</b>.",
        animation: true,
        onNext: function(tour){
                }
      }
    ]);

    userTour.appPageTour.init();
    userTour.appPageTour.start(true);
  },
  
  initTour: function(){
    userTour.homeTour.addSteps([
      {
        element: ".imageDisplayButton",
        placement: "bottom",
        title: "Application Overview",
        content: "Click here to get a detailed overview of the selected Application.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-1",
        placement: "bottom",
        title: "Uploading Data",
        content: "The SAYS Platform provides tools designed to easily upload data from any third-party platform including custom Excel/Text files. <br></br>For custom data upload the system provides Data Model specific downloadable Excel templates.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-2",
        placement: "bottom",
        title: "Managing Data",
        content: "Data uploaded to your profile can viewed, edited or deleted. It also allows for download of your data in Excel and Text formats.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-3",
        placement: "bottom",
        title: "Generating Reports",
        content: "Use the Application UI to select/edit/save settings and generate custom reports.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-4",
        placement: "left",
        title: "Selecting Packages",
        content: "Here is where you can subscribe to <b>FREE</b> or <b>PAID</b> report packages you're interested in.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-5",
        placement: "left",
        title: "More Help",
        content: "This help button will take you to the Help Guide. Use this in conjunction with the <b>Application Overview</b> available when you select an Application.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-6",
        placement: "left",
        title: "Messages",
        content: "This will contain messages that are specific to your account and system-related alerts.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-7",
        placement: "left",
        title: "User Settings",
        content: "Click here to view/edit your user settings, billing information and password. It also provides a section to <b>Submit a Support Ticket</b>.",
        animation: true,
        onNext: function(tour){
                //  document.getElementById("accountButton").click();
                //  userTour.initAccountSettingsTour();
                }
      },
      {
        element: ".tour-step.home-tour-step-8",
        placement: "bottom",
        title: "Uploading Data",
        content: "Click \"Upload Data\" and follow along with the green tour buttons to continue with the tour.",
        animation: true
      }
    ]);

    userTour.homeTour.init();
    userTour.homeTour.start(true);
  },

  /* No longer used
  initAccountSettingsTour: function(){

    //Helper function to cycle through the nav pills on account settings page
    function nextSettingScreen(linkId){
      var current = $(".active");

      //Remove active screen
      current.eq(0).removeClass("active").addClass("");
      current.eq(1).removeClass("active").addClass("");

      $("#li_"+linkId).addClass("active");
      $("#"+linkId).addClass("active");

    };

    userTour.accountSettingsTour.addSteps([
      {
        element: ".tour-step.tour-account-settings-step",
        placement: "bottom",
        title: "User Settings",
        content: "This shows your basic account settings like First Name, Last Name, and user name.",
        animation: true,
        onNext: function(tour){ nextSettingScreen("accountSettings_reportPackages");}
      },
      {
        element: ".tour-step.tour-account-settings-step",
        placement: "bottom",
        title: "Reporting Packages",
        content: "Reporting Packages",
        animation: true,
        onNext: function(tour){ nextSettingScreen("accountSettings_billing");}
      },
      {
        element: ".tour-step.tour-account-settings-step",
        placement: "bottom",
        title: "Billing",
        content: "Billing",
        animation: true,
        onNext: function(tour){ nextSettingScreen("accountSettings_settings");}
      },
      {
        element: ".tour-step.tour-account-settings-step",
        placement: "bottom",
        title: "Settings",
        content: "Settings",
        animation: true,
        onNext: function(tour){ nextSettingScreen("accountSettings_password");}
      },
      {
        element: ".tour-step.tour-account-settings-step",
        placement: "bottom",
        title: "Password",
        content: "Password",
        animation: true,
        onNext: function(tour){ nextSettingScreen("accountSettings_support");}
      },
      {
        element: ".tour-step.tour-account-settings-step",
        placement: "bottom",
        title: "Support",
        content: "Support",
        animation: true,
        onNext: function(tour){odinLite.loadHome();}
      },
      {
        element: ".tour-step.tour-step-five",
        placement: "bottom",
        title: "Uploading Data",
        content: "Now we will show you how to upload data.",
        animation: true,
        onNext: function(tour){
          odinLite.loadModelCacheApplication();
          userTour.initTemplateTour();
        }
      },
      {}
    ]);

    userTour.accountSettingsTour.init();
    userTour.accountSettingsTour.start(true);
  },
  */

  initStandardUploadTour: function(){

    userTour.templateTour.addSteps([
      {
        element: ".tour-step.template-tour-step-1",
        placement: "right",
        title: "Selecting a Data Model",
        content: "For each application there are different data inputs that are needed.<br></br>For example, the Return/Risk Analysis application would need time-series of \"Investment Returns\" to be uploaded.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-2",
        placement: "right",
        title: "Required vs. Optional Models",
        content: "The Data Models under Required are needed for any Application core analysis or report generation. Optional Data Models are required or not required based on the user's setting selection under Application Interface.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-3",
        placement: "right",
        title: "Structure of a Data Model",
        content: "A Data Model has a Row and Column Structure similar to a Relational Database Table. Certain Data Model Column(s) are designated as primary keys to keep records unique. Some Data Models allow adding one or more user-defined Custom Columns.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-4",
        placement: "bottom",
        title: "Data Model Description",
        content: "Review the description text carefully to understand the data requirements for each Data Model.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-5",
        placement: "bottom",
        title: "View Sample Data",
        content: "Click this button to view sample data for a data model. This should help provide further insight to the data requirements for each Data Model.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-6",
        placement: "bottom",
        title: "View Data Column Structure",
        content: "Click this button to view the list of required/optional, null/non-null, custom/non-custom and other attributes for each data columns associated with this data model.<br></br>Explanations of data types and descriptions of the columns are provided.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-7",
        placement: "bottom",
        title: "Platform Selection",
        content: "SAYS has a flexible upload interface that allows upload of data files from any third-party and/or in-house platform.<br></br>For certain Data Models, SAYS is pre-configured (mapping and validation) to accept certain types of file extracts from certain widely used third-party platforms/systems. If required, we work with clients to integrate third-party platforms that are not currently supported.",
        animation: true,
        onNext: function(tour){
          var nextButton = $(".modelDefinition_choosePlatformButton");
          nextButton[0].click();
        }
      },
      {
        element: ".tour-step.template-tour-step-8",
        placement: "left",
        title: "Edit the Data Model",
        content: "Prior to initial data upload, users can Edit the Data Model.<br></br>Certain column attributes such as Text Length, Use Column, Column Name, Apply FX Return, Upload Value In Percentage, Is Null Value Allowed and other column attributes can be configured.<br></br>Once data has been loaded for the Data Model, the system will not allow updates to the Data Model structure. To Edit structure, all data persisted under the Data Model should be deleted in the <b>Manage Data</b> section of the Application.",
        animation: true,
        onNext: function(tour){
          var nextButton = $(".template-tour-step-8");
          nextButton[0].click();
        }
      },
      {
        element: ".tour-step.template-tour-step-9",
        placement: "left",
        title: "Sample Data Column",
        content: "Relevant Attribute information related to each column of the selected Data Model is available for review and update in certain cases.<br></br>Click the blue question mark for details on each column.",
        animation: true,
        onNext: function(tour){
          // Hit cancel button to get to the upload button
          odinLite_modelCache.displaySelectedModelTemplate()
        }
      },
      {
        element: ".tour-step.template-tour-step-10",
        placement: "left",
        title: "Uploading Data",
        content: "Once you have reviewed, customized and saved the Data Model structure, the system will take you to the Upload Screen.<br></br>If Data Model structure has already been saved, you can skip to this step.",
        animation: true
      }
    ]);

    var modelTree = $("#modelCacheSelection_treeview");

    //Application Name, e.g. Composite Reporting
    var reportTree = modelTree.find(".k-top").eq(0);
    reportTree.addClass("tour-step template-tour-step-1");

    //Required template tree
    var requiredTemplates = modelTree.find(".k-top").eq(1);
    requiredTemplates.addClass("tour-step template-tour-step-2");

    var modelGroup = modelTree.find(".k-group").eq(1);
    var modelList = modelGroup.find("li").eq(0);

    var requiredList = modelList.find("ul").eq(0);
    var requiredFirstItem = requiredList.find("li").eq(0);

    //Select the template so the modelCache field gets populated
    var firstItem = requiredFirstItem.find(".k-in").eq(0);
    firstItem.click();

    firstItem.addClass("tour-step template-tour-step-3");

    userTour.templateTour.init();
    userTour.templateTour.start(true);

  },

  initCustomColumnUploadTour: function(modelExample){

    userTour.templateTour.addSteps([
      {
        element: ".tour-step.template-tour-step-1",
        placement: "right",
        title: "Selecting a Data Model",
        content: "For each application there are different data inputs that are needed.<br></br>For example, the Return/Risk Analysis application would need time-series of \"Investment Returns\" to be uploaded.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-2",
        placement: "right",
        title: "Required vs. Optional Models",
        content: "The Data Models under Required are needed for any Application core analysis or report generation. Optional Data Models are required or not required based on the user's setting selection under Application Interface.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-3",
        placement: "right",
        title: "Structure of a Data Model",
        content: "A Data Model has a Row and Column Structure similar to a Relational Database Table. Certain Data Model Column(s) are designated as primary keys to keep records unique. Some Data Models allow adding one or more user-defined Custom Columns.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-4",
        placement: "bottom",
        title: "Data Model Description",
        content: "Review the description text carefully to understand the data requirements for each Data Model.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-5",
        placement: "bottom",
        title: "View Sample Data",
        content: "Click this button to view sample data for a data model. This should help provide further insight to the data requirements for each Data Model.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-6",
        placement: "bottom",
        title: "View Data Column Structure",
        content: "Click this button to view the list of required/optional, null/non-null, custom/non-custom and other attributes for each data columns associated with this data model.<br></br>Explanations of data types and descriptions of the columns are provided.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-7",
        placement: "bottom",
        title: "Platform Selection",
        content: "SAYS has a flexible upload interface that allows upload of data files from any third-party and/or in-house platform.<br></br>For certain Data Models, SAYS is pre-configured (mapping and validation) to accept certain types of file extracts from certain widely used third-party platforms/systems. If required, we work with clients to integrate third-party platforms that are not currently supported.",
        animation: true,
        onNext: function(tour){
          var nextButton = $(".modelDefinition_choosePlatformButton");
          nextButton[0].click();
        }
      },
      {
        element: ".tour-step.template-tour-step-8",
        placement: "left",
        title: "Edit the Data Model",
        content: "Prior to initial data upload, users can Edit the Data Model.<br></br>Certain column attributes such as Text Length, Use Column, Column Name, Apply FX Return, Upload Value In Percentage, Is Null Value Allowed and other column attributes can be configured.<br></br>Once data has been loaded for the Data Model, the system will not allow updates to the Data Model structure. To Edit structure, all data persisted under the Data Model should be deleted in the <b>Manage Data</b> section of the Application.",
        animation: true,
        onNext: function(tour){
          var nextButton = $(".template-tour-step-8");
          nextButton[0].click();
        }
      },
      {
        element: ".tour-step.customColumnButton",
        placement: "bottom",
        title: "Adding a Custom Column",
        content: "Certain Data Models allow for one or more Custom Columns to be defined. Click <b>Add Custom Column</b> to define the type of custom column to be added. It will then allow the attributes of the custom column to be configured. Users can also delete an existing Custom Column assumming no data is persisted in the Data Model.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-9",
        placement: "left",
        title: "Sample Data Column",
        content: "Relevant Attribute information related to each column of the selected Data Model is available for review and update in certain cases.<br></br>Click the blue question mark for details on each column.",
        animation: true,
        onNext: function(tour){
          // Hit cancel button to get to the upload button
          odinLite_modelCache.displaySelectedModelTemplate()
        }
      },
      {
        element: ".tour-step.template-tour-step-10",
        placement: "left",
        title: "Uploading Data",
        content: "Once you have reviewed, customized and saved the Data Model structure, the system will take you to the Upload Screen.<br></br>If Data Model structure has already been saved, you can skip to this step.",
        animation: true
      }
    ]);

    var modelTree = $("#modelCacheSelection_treeview");

    //Application Name, e.g. Composite Reporting
    var reportTree = modelTree.find(".k-top").eq(0);
    reportTree.addClass("tour-step template-tour-step-1");

    //Required template tree
    var requiredTemplates = modelTree.find(".k-top").eq(1);
    requiredTemplates.addClass("tour-step template-tour-step-2");

    //Example of a data template
    var sampleTemplate = modelTree.find(".k-top").eq(2);


    var modelGroup = modelTree.find(".k-group").eq(1);
    var modelList = modelGroup.find("li").eq(0);

    var requiredList = modelList.find("ul").eq(0);
    var requiredFirstItem = requiredList.find("li").eq(0);

    //Select the template so the modelCache field gets populated - specific for model with custom column
    //TODO: get model text specific for the data model if it has custom columns
    var dataModelText = modelExample;

    var dataModelExample = $('span:contains('+ dataModelText + ')');
    dataModelExample.click();

    dataModelExample.addClass("tour-step template-tour-step-3");

    userTour.templateTour.init();
    userTour.templateTour.start(true);

  },

  initSupportedPlatformUploadTour: function(modelExample){

    userTour.templateTour.addSteps([
      {
        element: ".tour-step.template-tour-step-1",
        placement: "right",
        title: "Selecting a Data Model",
        content: "For each application there are different data inputs that are needed.<br></br>For example, the Return/Risk Analysis application would need time-series of \"Investment Returns\" to be uploaded.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-2",
        placement: "right",
        title: "Required vs. Optional Models",
        content: "The Data Models under Required are needed for any Application core analysis or report generation. Optional Data Models are required or not required based on the user's setting selection under Application Interface.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-3",
        placement: "right",
        title: "Structure of a Data Model",
        content: "A Data Model has a Row and Column Structure similar to a Relational Database Table. Certain Data Model Column(s) are designated as primary keys to keep records unique. Some Data Models allow adding one or more user-defined Custom Columns.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-4",
        placement: "bottom",
        title: "Data Model Description",
        content: "Review the description text carefully to understand the data requirements for each Data Model.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-5",
        placement: "bottom",
        title: "View Sample Data",
        content: "Click this button to view sample data for a data model. This should help provide further insight to the data requirements for each Data Model.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-6",
        placement: "bottom",
        title: "View Data Column Structure",
        content: "Click this button to view the list of required/optional, null/non-null, custom/non-custom and other attributes for each data columns associated with this data model.<br></br>Explanations of data types and descriptions of the columns are provided.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-7",
        placement: "bottom",
        title: "Platform Selection",
        content: "SAYS has a flexible upload interface that allows upload of data files from any third-party and/or in-house platform.<br></br>For certain Data Models, SAYS is pre-configured (mapping and validation) to accept certain types of file extracts from certain widely used third-party platforms/systems. If required, we work with clients to integrate third-party platforms that are not currently supported.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-7a",
        placement: "bottom",
        title: "Selecting Your Platform",
        content: "Depending on the Data Model, SAYS has a list of <b>supported third-party platforms</b> that the user can select from for data upload.<br></br>If your platform is not supported, select <b>Custom</b> and proceed. We also work with clients to integrate third-party platforms that are not currently supported. ",
        animation: true,
      },
      {
        element: ".tour-step.template-tour-step-7b",
        placement: "bottom",
        title: "Platform Upload Steps",
        content: "Depending on the platform selection, SAYS is pre-configured to load certain types of Data Extract files which are provided as Options or Multi-Step upload process.<br></br>Click the blue help button to determine the third-party platform extract file and format matches the one that is supported by the system. We also work with clients to integrate third-party platform Data Extracts that are not currently supported.",
        animation: true,
        onNext: function(tour){
          var nextButton = $(".modelDefinition_choosePlatformButton");
          nextButton[0].click();
        }
      },
      {
        element: ".tour-step.template-tour-step-8",
        placement: "left",
        title: "Edit the Data Model",
        content: "Prior to initial data upload, users can Edit the Data Model.<br></br>Certain column attributes such as Text Length, Use Column, Column Name, Apply FX Return, Upload Value In Percentage, Is Null Value Allowed and other column attributes can be configured.<br></br>Once data has been loaded for the Data Model, the system will not allow updates to the Data Model structure. To Edit structure, all data persisted under the Data Model should be deleted in the <b>Manage Data</b> section of the Application.",
        animation: true,
        onNext: function(tour){
          var nextButton = $(".template-tour-step-8");
          nextButton[0].click();
        }
      },
      {
        element: ".tour-step.customColumnButton",
        placement: "bottom",
        title: "Adding a Custom Column",
        content: "Certain Data Models allow for one or more Custom Columns to be defined. Click <b>Add Custom Column</b> to define the type of custom column to be added. It will then allow the attributes of the custom column to be configured. Users can also delete an existing Custom Column assumming no data is persisted in the Data Model.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-9",
        placement: "left",
        title: "Sample Data Column",
        content: "Relevant Attribute information related to each column of the selected Data Model is available for review and update in certain cases.<br></br>Click the blue question mark for details on each column.",
        animation: true,
        onNext: function(tour){
          // Hit cancel button to get to the upload button
          odinLite_modelCache.displaySelectedModelTemplate()
        }
      },
      {
        element: ".tour-step.template-tour-step-10",
        placement: "left",
        title: "Uploading Data",
        content: "Once you have reviewed, customized and saved the Data Model structure, the system will take you to the Upload Screen.<br></br>If Data Model structure has already been saved, you can skip to this step.",
        animation: true
      }
    ]);

    var modelTree = $("#modelCacheSelection_treeview");

    //Application Name, e.g. Composite Reporting
    var reportTree = modelTree.find(".k-top").eq(0);
    reportTree.addClass("tour-step template-tour-step-1");

    //Required template tree
    var requiredTemplates = modelTree.find(".k-top").eq(1);
    requiredTemplates.addClass("tour-step template-tour-step-2");

    //Example of a data template
    var sampleTemplate = modelTree.find(".k-top").eq(2);


    var modelGroup = modelTree.find(".k-group").eq(1);
    var modelList = modelGroup.find("li").eq(0);

    var requiredList = modelList.find("ul").eq(0);
    var requiredFirstItem = requiredList.find("li").eq(0);

    //Select the template so the modelCache field gets populated - specific for model with custom column
    //TODO: get model text specific for the data model if it has custom columns
    var dataModelText = modelExample;

    var dataModelExample = $('span:contains('+ dataModelText + ')');
 
    dataModelExample.click();

    dataModelExample.addClass("tour-step template-tour-step-3");

    userTour.templateTour.init();
    userTour.templateTour.start(true);

  },

  initUploadTour: function(){
    $.get(odin.SERVLET_PATH + "/ODIN_LITE/GET_PACKAGE_TOUR?packageId=" + odinLite.currentApplicationPackage,
            function (data) {
                if(via.undef(data)){ return; }
                var jsonResponse = JSON.parse(data);
                
                var tourList = jsonResponse.tourText.split(";");
                
                if (tourList.length > 0){
                  var tourType = tourList[0];
                  var modelExample = tourList[1];
  
                  if (tourType === 'SupportedPlatformsUploadTour'){
                    userTour.initSupportedPlatformUploadTour(modelExample);
                  } else if (tourType === 'CustomColumnUploadTour'){
                    userTour.initCustomColumnUploadTour(modelExample);
                  } else {
                    userTour.initStandardUploadTour();
                  }
                }
            }
    );


  },

  initManageDataTour: function(){
    userTour.manageDataTour.addSteps([
      {
        element: ".tour-step.tour-step-manage-data-1",
        placement: "right",
        title: "View/Edit/Delete Uploaded Data",
        content: "Select the appropiate Data Model and Review uploaded data for accuracy and consistancy.",
        animation: true
      },
      {
        element: ".tour-step.tour-step-manage-data-2",
        placement: "left",
        title: "Data Element Selection",
        content: "Depending on the Data Model, time series data is organized by date or identifier and non-time series data/static data is persisted as a StaticDataSet",
        animation: true
      },
      {
        element: ".tour-step.tour-step-manage-data-3",
        placement: "right",
        title: "Execute Custom SQL Queries On Data",
        content: "Click this icon to execute simple SQL queries against the uploaded data. The selected data model items create a temporary database that can be queried.",
        animation: true
      },
      {
        element: ".tour-step.tour-step-manage-data-4",
        placement: "right",
        title: "Review and Export Data",
        content: "Click this icon to view the file structure of your persisted data. System allows any data files to be extracted as CSV and other formats. Multiple extract files are exported as a ZIP file.",
        animation: true
      }
    ]);

    var modelTree = $("#manageData_modelTreeview");

    //Application Name, e.g. Composite Reporting
    var reportTree = modelTree.find(".k-top").eq(0);
    reportTree.addClass("tour-step tour-step-manage-data-1");

    //Required template tree
    //var requiredTemplates = modelTree.find(".k-top").eq(1);
  //  requiredTemplates.addClass("tour-step tour-step-seven");

    //Example of a data template
    var sampleTemplate = modelTree.find(".k-top").eq(2);


    var modelGroup = modelTree.find(".k-group").eq(1);
    var modelList = modelGroup.find("li").eq(0);

    var requiredList = modelList.find("ul").eq(0);
    var requiredItem = requiredList.find("li").eq(0);

    //Select the template so the modelCache field gets populated
    var selectedItem = requiredItem.find(".k-in").eq(0);
    selectedItem.click();

    var modelTable = $("#manageData_tableSelection");
    modelTable.addClass("tour-step tour-step-manage-data-2");

    userTour.manageDataTour.init();
    userTour.manageDataTour.start(true);
  }
}
