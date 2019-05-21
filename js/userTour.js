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
        content: "If you have just signed up, you will only see the demo report. Here is where you can sign up for the report packages you're interested in.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-5",
        placement: "left",
        title: "More Help",
        content: "This help button will take you to a more detailed walkthrough of each report. Use this in conjunction with the demo tour to understand how to run reports.",
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
        content: "Click here to see your user settings, billing information, change your password, or submit a support ticket.",
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
        element: ".tour-step.home-tour-step-1",
        placement: "bottom",
        title: "Uploading Data",
        content: "SAYS (Software At Your Service) is a tool designed to easily upload data in Excel files and text files. <br></br>Data is loaded in specific templates that helps to format the data.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-2",
        placement: "bottom",
        title: "Managing Data",
        content: "Once data has been loaded and saved in your account, you can edit and delete existing data. The type of data could be static or time series data.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-3",
        placement: "bottom",
        title: "Running Reports",
        content: "Using the data stored in the system, users can run reports and download them. Custom settings let you add your company logo and modify the reports.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-4",
        placement: "left",
        title: "Selecting Packages",
        content: "If you have just signed up, you will only see the demo report. Here is where you can sign up for the report packages you're interested in.",
        animation: true
      },
      {
        element: ".tour-step.home-tour-step-5",
        placement: "left",
        title: "More Help",
        content: "This help button will take you to a more detailed walkthrough of each report. Use this in conjunction with the demo tour to understand how to run reports.",
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
        content: "Click here to see your user settings, billing information, change your password, or submit a support ticket.",
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
        content: "Under each report there will be different data inputs needed to run it.<br></br>For example, for the demo risk/return analysis report \"Investment Returns\" would need to be loaded.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-2",
        placement: "right",
        title: "Required vs. Optional Models",
        content: "Certain data models are required to run the reports. Make sure to upload data for these models. Other data models are optional and not needed to run the report.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-3",
        placement: "right",
        title: "Defining Data Columns that will be used",
        content: "The data is defined with rows and data columns. You will be able to export the data model to see how it looks at the end.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-4",
        placement: "bottom",
        title: "Model Description",
        content: "This field gives a brief description of the data that you will upload.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-5",
        placement: "bottom",
        title: "Viewing Sample Data",
        content: "Click this button to view sample data for this model to see an example of what the data looks like in the system.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-6",
        placement: "bottom",
        title: "Viewing Data Column List",
        content: "Click this button to view the list of required and optional data columns associated with this data model.<br></br>Explanations of data types and descriptions of the columns are provided.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-7",
        placement: "bottom",
        title: "Using Plugin to Easily Import Data",
        content: "Some data models can be seamlessly integrated with existing systems. Here you can easily upload in their original format.",
        animation: true,
        onNext: function(tour){
          var nextButton = $(".modelDefinition_choosePlatformButton");
          nextButton[0].click();
        }
      },
      {
        element: ".tour-step.template-tour-step-8",
        placement: "left",
        title: "Editing the Data Model",
        content: "Edit the data model let's you add custom columns, change column names, and define the data types that will go in the columns.",
        animation: true,
        onNext: function(tour){
          var nextButton = $(".template-tour-step-8");
          nextButton[0].click();
        }
      },
      {
        element: ".tour-step.template-tour-step-9",
        placement: "left",
        title: "Example Data Column",
        content: "Each box displays info related to the data columns of the model. It shows what data type, whether null values are allowed, and whether there is a limit on text length.<br></br>Click the blue question mark for more info on each column.",
        animation: true,
        onNext: function(tour){
          // Hit cancel button to get to the upload button
          odinLite_modelCache.displaySelectedModelTemplate()
        }
      },
      {
        element: ".tour-step.template-tour-step-10",
        placement: "left",
        title: "Uploading Your Data",
        content: "Once you have formatted your data model you will upload the respective data. Don't worry you will be able to see how the data looks before you save it. You can also go back any time to edit the data.",
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
        content: "Under each report there will be different data inputs needed to run it.<br></br>For example, for the demo risk/return analysis report \"Investment Returns\" would need to be loaded.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-2",
        placement: "right",
        title: "Required vs. Optional Models",
        content: "Certain data models are required to run the reports. Make sure to upload data for these models. Other data models are optional and not needed to run the report.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-3",
        placement: "right",
        title: "Defining Data Columns that will be used",
        content: "The data is defined with rows and data columns. You will be able to export the data model to see how it looks at the end.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-4",
        placement: "bottom",
        title: "Model Description",
        content: "This field gives a brief description of the data that you will upload.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-5",
        placement: "bottom",
        title: "Viewing Sample Data",
        content: "Click this button to view sample data for this model to see an example of what the data looks like in the system.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-6",
        placement: "bottom",
        title: "Viewing Data Column List",
        content: "Click this button to view the list of required and optional data columns associated with this data model.<br></br>Explanations of data types and descriptions of the columns are provided.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-7",
        placement: "bottom",
        title: "Using Plugin to Easily Import Data",
        content: "Some data models can be seamlessly integrated with existing systems. Here you can easily upload in their original format.",
        animation: true,
        onNext: function(tour){
          var nextButton = $(".modelDefinition_choosePlatformButton");
          nextButton[0].click();
        }
      },
      {
        element: ".tour-step.template-tour-step-8",
        placement: "left",
        title: "Editing the Data Model",
        content: "Edit the data model let's you add custom columns, change column names, and define the data types that will go in the columns.",
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
        content: "If you want to add a new column to the data model, click <b>Add Custom Column</b> to define a new column. You can choose the data type, set whether nulls allowed, and if there is a maximum text length for text data types.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-9",
        placement: "left",
        title: "Example Data Column",
        content: "Each box displays info related to the data columns of the model. It shows what data type, whether null values are allowed, and whether there is a limit on text length.<br></br>Click the blue question mark for more info on each column.",
        animation: true,
        onNext: function(tour){
          // Hit cancel button to get to the upload button
          odinLite_modelCache.displaySelectedModelTemplate()
        }
      },
      {
        element: ".tour-step.template-tour-step-10",
        placement: "left",
        title: "Uploading Your Data",
        content: "Once you have formatted your data model you will upload the respective data. Don't worry you will be able to see how the data looks before you save it. You can also go back any time to edit the data.",
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
        content: "Under each report there will be different data inputs needed to run it.<br></br>For example, for the demo risk/return analysis report \"Investment Returns\" would need to be loaded.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-2",
        placement: "right",
        title: "Required vs. Optional Models",
        content: "Certain data models are required to run the reports. Make sure to upload data for these models. Other data models are optional and not needed to run the report.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-3",
        placement: "right",
        title: "Defining Data Columns that will be used",
        content: "The data is defined with rows and data columns. You will be able to export the data model to see how it looks at the end.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-4",
        placement: "bottom",
        title: "Model Description",
        content: "This field gives a brief description of the data that you will upload.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-5",
        placement: "bottom",
        title: "Viewing Sample Data",
        content: "Click this button to view sample data for this model to see an example of what the data looks like in the system.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-6",
        placement: "bottom",
        title: "Viewing Data Column List",
        content: "Click this button to view the list of required and optional data columns associated with this data model.<br></br>Explanations of data types and descriptions of the columns are provided.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-7",
        placement: "bottom",
        title: "Using Plugin to Easily Import Data",
        content: "Some data models can be seamlessly integrated with existing systems. Here you can easily upload in their original format.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-7a",
        placement: "bottom",
        title: "Selecting Your Platform",
        content: "If your data is exported from a supported system, select it from the dropdown. This way you can easily upload the data in the raw format.",
        animation: true,
      },
      {
        element: ".tour-step.template-tour-step-7b",
        placement: "bottom",
        title: "Platform Upload Steps",
        content: "Once you've selected your platform, there will be a couple steps in this dropdown to load the data. <br></br>Click the blue help button to make sure the file is supported in the system.",
        animation: true,
        onNext: function(tour){
          var nextButton = $(".modelDefinition_choosePlatformButton");
          nextButton[0].click();
        }
      },
      {
        element: ".tour-step.template-tour-step-8",
        placement: "left",
        title: "Editing the Data Model",
        content: "Edit the data model let's you add custom columns, change column names, and define the data types that will go in the columns.",
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
        content: "If you want to add a new column to the data model, click <b>Add Custom Column</b> to define a new column. You can choose the data type, set whether nulls allowed, and if there is a maximum text length for text data types.",
        animation: true
      },
      {
        element: ".tour-step.template-tour-step-9",
        placement: "left",
        title: "Example Data Column",
        content: "Each box displays info related to the data columns of the model. It shows what data type, whether null values are allowed, and whether there is a limit on text length.<br></br>Click the blue question mark for more info on each column.",
        animation: true,
        onNext: function(tour){
          // Hit cancel button to get to the upload button
          odinLite_modelCache.displaySelectedModelTemplate()
        }
      },
      {
        element: ".tour-step.template-tour-step-10",
        placement: "left",
        title: "Uploading Your Data",
        content: "Once you have formatted your data model you will upload the respective data. Don't worry you will be able to see how the data looks before you save it. You can also go back any time to edit the data.",
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

  initLoadTour: function(){
    userTour.loadTour.addSteps([
      {
        element: ".tour-step.tour-step-loading-1",
        placement: "left",
        title: "Uploading Data to SAYS Platform",
        content: "This is the data you will be loading into the system and a brief description.",
        animation: true
      },
      {
        element: ".tour-step.tour-step-loading-2",
        placement: "left",
        title: "Browsing for your file",
        content: "Find the Excel template on your local machine that contains your data.",
        animation: true
      },
      {
        element: ".tour-step.tour-step-loading-3",
        placement: "left",
        title: "File is Added to Upload Stage",
        content: "You should now see the file name in the upload box.",
        animation: true
      },
      {
        element: ".tour-step.tour-step-loading-4",
        placement: "left",
        title: "Uploading a Template File",
        content: "SAYS gives you the option to load data in the raw format or the templated format. Select 'Uploading a Template File' if you used the template files.",
        animation: true
      },
      {
        element: ".tour-step.tour-step-formatting-1",
        placement: "bottom",
        title: "Import Wizard",
        content: "The next few steps use the Import Wizard, which helps you verify and modify data before it is saved.",
        animation: true
      },
      {}
    ]);

    userTour.loadTour.init();
    userTour.loadTour.start(true);
  },


  initFormattingTour: function(){
    userTour.formattingTour.addSteps([
      {
        element: ".tour-step.tour-step-formatting-1",
        placement: "bottom",
        title: "Import Wizard",
        content: "The Import Wizard helps users verify and check their data before saving. This first screen displays the column headers and rows of the previously loaded data in the Data Preview",
        animation: true
      }
    ]);

    userTour.formattingTour.init();
    userTour.formattingTour.start(true);
  },

  initModelMappingTour: function(){
    userTour.modelMappingTour.addSteps([
      {
        element: ".tour-step.tour-step-model-mapping-1",
        placement: "bottom",
        title: "Import Wizard - Column Mapping",
        content: "This part of the Import Wizard lets the user map data columns to the data template. If a template is used the mapping is already straightforward.",
        animation: true
      },
      {
        element: ".tour-step.tour-step-model-mapping-2",
        placement: "bottom",
        title: "File Date Formatting",
        content: "Verify that the system has read the dates in properly. Select the proper date format if the date columns didn't parse the dates properly.",
        animation: true
      },
      {
        element: ".tour-step.tour-step-model-mapping-3",
        placement: "bottom",
        title: "Saving Mapped Data",
        content: "Once you've checked over the data, click \"Saved Mapped Data\" to save the data in the system.",
        animation: true
      }
    ]);

    userTour.formattingTour.init();
    userTour.formattingTour.start(true);
  },

  initManageDataTour: function(){
    userTour.manageDataTour.addSteps([
      {
        element: ".tour-step.tour-step-manage-data-1",
        placement: "right",
        title: "Modifying the Data You've Loaded",
        content: "Once you've loaded the data you can use this section to update and delete your data.",
        animation: true
      },
      {
        element: ".tour-step.tour-step-manage-data-2",
        placement: "left",
        title: "Viewing Data",
        content: "Data that has been loaded in to the system, both static and time series data, will be displayed here. Time-series data will be listed by date.",
        animation: true
      },
      {
        element: ".tour-step.tour-step-manage-data-3",
        placement: "right",
        title: "Run SQL Queries On Data",
        content: "Click this icon to run simple SQL queries against the data that you've loaded. The data models will be stored as temporary databases that you can then query.",
        animation: true
      },
      {
        element: ".tour-step.tour-step-manage-data-4",
        placement: "right",
        title: "Zip & Export Data to CSV Files",
        content: "Click this icon to see the file structure of your data models. This allows you to easily zip and export the data you have loaded into the system.",
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
