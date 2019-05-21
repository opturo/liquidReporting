<!DOCTYPE html>
<html lang="en">
   <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Software At Your Service</title>
      <link rel="shortcut icon" href="../../favicon.ico">
      <!-- Bootstrap core CSS -->
      <link title="bootstrap" href="../bootstrap-3.3.5-dist/css/bootstrap.min.css?buildDate=20190520" rel="stylesheet"/>
      <link rel="stylesheet" href="../font-awesome-4.5.0/css/font-awesome.min.css?buildDate=20190520"/>
      <!-- Opturo CSS -->
      <link rel="stylesheet" href="css/odinLite.css?buildDate=20190520"/>
      <!-- Kendo UI CSS -->
      <link rel="stylesheet" href="../js/kendoui/styles/kendo.common-bootstrap.min.css?buildDate=20190520" />
      <link rel="stylesheet" href="../js/kendoui/styles/kendo.bootstrap.min.css?buildDate=20190520">
      <link rel="stylesheet" href="../js/kendoui/styles/kendo.bootstrap.mobile.min.css?buildDate=20190520">
      <!-- Code Mirror CSS -->
      <link rel="stylesheet" href="../js/codemirror-5.43.0/lib/codemirror.css?buildDate=20190520">
      <link rel="stylesheet" href="../js/codemirror-5.43.0/addon/hint/show-hint.css?buildDate=20190520" />
	  <!-- Bootstrap Tour -->
	  <link rel="stylesheet" href="css/bootstrap-tour.min.css?buildDate=20190520" />

      <!-- Magnific Popup -->
      <link rel="stylesheet" href="../js/magnific-popup/magnific-popup.css?buildDate=20190520" />

      <!-- Additional Styling for liquid reporting -->
	  <link rel="stylesheet" href="css/liquidReporting.css?buildDate=20190520" />

   </head>
   <body class="desktopBackground">

      <!-- Top Nav Bar -->
      <nav id="mainNavbar" class="navbar navbar-default">
         <div class="container-fluid">
            <div class="navbar-header navbar-left">
               <a title="Home" style="display:none;" id="homeButton" class="tr btn navbar-btn btn-default" href="#"><i
                  class="fa fa-home"></i></a>
            </div>
            <a style="margin-left: 5px;" class="appTitle navbar-brand" href="#"></a>
            <!-- Breadcrumb Nav -->
            <p class="navbar-text breadcrumbNav"></p>
            <div class="navbar-header navbar-right">
                <a title="Packages" id="home_yourPackagesButton" style="display:none;" class="tr btn navbar-btn btn-default tour-step home-tour-step-4 hideDMUser" href="#"><i
               class="fa fa-list-alt"></i></a>
               <a title="Help" id="home_helpButton" style="display:none;" class="tr btn navbar-btn btn-default tour-step home-tour-step-5 hideDMUser" href="http://opturo.com/says-help/" target="_blank"><i
              class="fa fa-question-circle"></i></a>
               <button id="home_systemNotificationButton" title="System Notifications" style="display:none;" class="btn navbar-btn btn-default tour-step home-tour-step-6 hideDMUser">
               <span class="glyphicon glyphicon-envelope" aria-hidden="true"></span>
               <span class="badge" id="home_systemNotificationBadge"></span>
               </button>

               <a title="My Account" style="display:none;" id="accountButton" class="tr btn navbar-btn btn-default tour-step home-tour-step-7" href="#"><i
                  class="fa fa-user"></i></a>
               <button id="odinLogoutButton" title="Logout" style="display:none;" type="submit" class="tr btn btn-default
                  navbar-btn">
               <span class="glyphicon glyphicon-off" aria-hidden="true"></span>
               </button>
            </div>
         </div>
      </nav>
      <!-- End - Top Nav Bar -->

      <!-- Home Panel -->
      <div id="homePanel" class="container-fluid" style="display:none;">
            <jsp:include page="./html/home.html" />
      </div>
      <!-- End - Home Panel -->

      <!-- App Home Panel -->
      <div id="appHomePanel" class="container-fluid" style="display:none;">
         <jsp:include page="./html/applicationHome.html" />
      </div>
      <!-- End - App Home Panel -->

      <!-- Account Settings -->
      <div id="accountSettings" class="container-fluid" style="display:none;">
            <jsp:include page="./html/accountSettings.html" />
      </div>
      <!-- End - Account Settings -->

	  <!-- Package Selection Panel -->
      <div id="packages" class="container-fluid" style="display:none;">
          <jsp:include page="./html/packages.html" />
      </div>
      <!-- End - Package Selection -->

      <!-- Payment Panel -->
      <div id="payment" class="container-fluid" style="display:none;">
          <jsp:include page="./html/payment.html" />
      </div>
      <!-- End - Payment Panel -->
	  
	  <!-- Model Cache Panel -->
      <div id="modelCachePanel" class="container-fluid" style="display:none;">
            <jsp:include page="./html/modelCache.html" />
      </div>
      <!-- End - Model Cache Panel -->
	  
	  <!-- Upload Files Panel -->
      <div id="uploadFilesPanel" class="container-fluid" style="display:none;">
			<!-- Upload Files Widget -->
            <jsp:include page="./html/uploadFiles.html" />
			<!-- Upload Files Progress Bar -->
			<jsp:include page="./html/uploadFilesProgress.html" />
      </div>
      <!-- End - Upload Files Panel -->
	  
	  <!-- File Format Panel -->
      <div id="fileFormatPanel" class="container-fluid" style="display:none;">
			<!-- File Format HTML -->
            <jsp:include page="./html/fileFormat.html" />
      </div>
      <!-- End - File Format Panel -->
	  
	  <!-- Model Mapping Panel -->
      <div id="modelMappingPanel" class="container-fluid" style="display:none;">
			<!-- Model Mapping HTML -->
            <jsp:include page="./html/modelMapping.html" />
      </div>
      <!-- End - Model Mapping Panel -->
	  
	  <!-- Model Mapping Error Reporting Panel -->
      <div id="modelMappingErrorsPanel" class="container-fluid" style="display:none;">
			<!-- Model Mapping HTML -->
            <jsp:include page="./html/modelMappingErrors.html" />
      </div>
      <!-- End - Model Mapping Error Reporting Panel -->

      <!-- View Database Panel -->
      <div id="viewPanel" class="container-fluid" style="display:none;">
			<!-- Manage Data HTML -->
            <jsp:include page="./html/manageData.html" />
      </div>
      <!-- End - View Database Panel -->

      <!-- Powered Panel -->
      <div class="poweredPanel container-fluid" style="display:none;">
         <img style="margin-top:6px;" src="../images/powered_margin.png" alt="">
      </div>
      <!-- End - Powered Panel -->

      <!-- Kickoff script -->
      <script src="../js/aes.js?buildDate=20190520"></script>
      <script src="../js/jquery-2.1.3.min.js?buildDate=20190520"></script>
      <script src="../js/jquery.format-1.3.min.js?buildDate=20190520"></script>
      <script src="../bootstrap-3.3.5-dist/js/bootstrap.min.js?buildDate=20190520"></script>
      <script src="../js/via.js?buildDate=20190520"></script>
      <script src="../js/odin.js?buildDate=20190520"></script>
      <script src="../js/odinKendoTable.js?buildDate=20190520"></script>
      <script src="js/odinLite.js?buildDate=20190520"></script>
      <script src="js/modelCache.js?buildDate=20190520"></script>
      <script src="js/uploadFiles.js?buildDate=20190520"></script>
      <script src="js/fileFormat.js?buildDate=20190520"></script>
      <script src="js/modelMapping.js?buildDate=20190520"></script>
      <script src="js/billing.js?buildDate=20190520"></script>
      <script src="js/support.js?buildDate=20190520"></script>
      <script src="js/manageData.js?buildDate=20190520"></script>
      <script src="js/packageSelection.js?buildDate=20190520"></script>
      <script src="js/unionFile.js?buildDate=20190520"></script>

      <!-- Classes -->
      <script src="js/classes/UploadInfo.js?buildDate=20190520"></script>

      <!-- SAYS Tour -->
	  <script src="../js/bootstrap-tour.min.js?buildDate=20190520"></script>
      <script src="../js/mustache.min.js?buildDate=20190520"></script>
	  <script src="js/userTour.js?buildDate=20190520"></script>
	  
      <!-- Kendo UI -->
      <script src="../js/kendoui/js/kendo.all.min.js?buildDate=20190520"></script>

      <!-- Magnific Popup -->
      <script src="../js/magnific-popup/jquery.magnific-popup.min.js?buildDate=20190520"></script>

      <!-- Code Mirror -->
      <script src="../js/codemirror-5.43.0/lib/codemirror.js?buildDate=20190520"></script>
      <script src="../js/codemirror-5.43.0/mode/sql/sql.js?buildDate=20190520"></script>
      <script src="../js/codemirror-5.43.0/addon/selection/active-line.js?buildDate=20190520"></script>
      <script src="../js/codemirror-5.43.0/addon/hint/show-hint.js?buildDate=20190520"></script>
      <script src="../js/codemirror-5.43.0/addon/hint/sql-hint.js?buildDate=20190520"></script>
      
	  <!-- Init ODIN Lite -->
      <script>
         $(document).ready(function(){
            odinLite.init();
         });
      </script>
   </body>
</html>